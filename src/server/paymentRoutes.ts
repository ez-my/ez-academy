import { PACKAGE_VERSION } from '../packages';
import type { Express } from 'express';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import axios from 'axios';
import querystring from 'querystring';
import {SERVER_PLANS, authenticateFirebaseUser as defaultAuth, isAuthorizedAdmin, applySuccessfulEntitlement,
 queryToyyibPayBill as defaultQuery, getBankTransferConfig, saveBankTransferConfig, validPaymentHash, validateReceipt} from './payments';

export function registerPaymentRoutes(app: Express, adminDb: Firestore, overrides: {
 authenticate?: typeof defaultAuth; queryBill?: typeof defaultQuery;
} = {}) {
  const authenticateFirebaseUser = overrides.authenticate || defaultAuth;
  const queryToyyibPayBill = overrides.queryBill || defaultQuery;
  // --- Payment Configuration & Routes ---
  const TOYYIBPAY_SECRET_KEY = process.env.TOYYIBPAY_USER_SECRET_KEY;
  const TOYYIBPAY_CATEGORY_CODE = process.env.TOYYIBPAY_CATEGORY_CODE;
  const TOYYIBPAY_HOSTNAME = process.env.TOYYIBPAY_HOSTNAME || "toyyibpay.com";
  const TOYYIBPAY_DUITNOW_QR_ENABLED = process.env.TOYYIBPAY_DUITNOW_QR_ENABLED === "true";

  // 1. Get payment channels status & bank details
  app.get("/api/payment/channels", async (req, res) => {
    try {
      const bankConfig = await getBankTransferConfig(adminDb);
      res.json({
        success: true,
        fpx: Boolean(TOYYIBPAY_SECRET_KEY && TOYYIBPAY_CATEGORY_CODE),
        duitnow_qr: TOYYIBPAY_DUITNOW_QR_ENABLED,
        bank_transfer: bankConfig.isConfigured,
        isQrAvailable: bankConfig.isQrAvailable,
        isAccountTransferAvailable: bankConfig.isAccountTransferAvailable,
        bankDetails: {
          bankName: bankConfig.bankName,
          accountHolder: bankConfig.accountHolder,
          accountNumber: bankConfig.accountNumber,
          bankQrImageUrl: bankConfig.bankQrImageUrl,
          whatsappNumber: bankConfig.whatsappNumber,
          instructions: bankConfig.instructions
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. ToyyibPay FPX / Online Banking Checkout
  app.post("/api/checkout", async (req, res) => {
    try {
      const decodedUser = await authenticateFirebaseUser(req);
      if (!decodedUser) {
        return res.status(401).json({ success: false, message: "Please sign in to continue to checkout." });
      }

      if (!TOYYIBPAY_SECRET_KEY || !TOYYIBPAY_CATEGORY_CODE) {
        return res.status(500).json({ 
          success: false, 
          message: "Online banking is not configured on this server. Please choose Bank transfer or contact support." 
        });
      }

      const { planId, channel = 'fpx', userPhone } = req.body;
      if (userPhone !== undefined && (typeof userPhone !== 'string' || !/^\+?[0-9 -]{7,22}$/.test(userPhone))) {
        return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
      }
      if (!['toyyibpay.com', 'dev.toyyibpay.com'].includes(TOYYIBPAY_HOSTNAME)) {
        return res.status(503).json({ success: false, message: 'Online payment setup is incomplete. Please contact us.' });
      }
      if (!['fpx', 'duitnow_qr'].includes(channel)) return res.status(400).json({success:false, message:'Choose a payment method.'});
      const planConfig = typeof planId === 'string' && Object.hasOwn(SERVER_PLANS, planId) ? SERVER_PLANS[planId] : undefined;
      if (!planConfig) {
        return res.status(400).json({ success: false, message: `Invalid plan selected: ${planId}` });
      }

      if (channel === 'duitnow_qr' && !TOYYIBPAY_DUITNOW_QR_ENABLED) {
        return res.status(400).json({ 
          success: false, 
          message: "DuitNow QR is currently unavailable for this account. Please use Online banking (FPX)." 
        });
      }

      const userId = decodedUser.uid;
      const userEmail = decodedUser.email || req.body.userEmail || "student@ez-academy.my";
      const userName = decodedUser.name || req.body.userName || "EZ Academy Student";

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const appUrl = process.env.APP_BASE_URL || process.env.VITE_APP_URL;
      if (!appUrl || !/^https:\/\//.test(appUrl)) return res.status(503).json({success:false,message:'Online payment setup is incomplete. Please contact us.'});
      const callbackUrl = process.env.TOYYIBPAY_CALLBACK_URL || `${appUrl.replace(/\/$/, '')}/api/tx/callback`;

      // Create transaction in adminDb using fixed server amount
      const txRef = adminDb.collection('transactions').doc();
      const txId = txRef.id;

      await txRef.set({
        id: txId,
        userId,
        userEmail,
        userName,
        planId: planConfig.id,
        packageVersion: PACKAGE_VERSION,
        planName: planConfig.name,
        amount: planConfig.price,
        amountInCents: planConfig.amountInCents,
        currency: 'MYR',
        paymentMethod: channel === 'duitnow_qr' ? 'toyyibpay_qr' : 'toyyibpay_fpx',
        status: 'PENDING',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      const billData: Record<string, string> = {
        userSecretKey: TOYYIBPAY_SECRET_KEY,
        categoryCode: TOYYIBPAY_CATEGORY_CODE,
        billName: `EZ Academy ${planConfig.name}`.replace(/\+/g, ' Plus').replace(/[^a-zA-Z0-9_ ]/g, '').substring(0, 30),
        billDescription: planConfig.description.replace(/[^a-zA-Z0-9_ ]/g,' ').replace(/ +/g,' ').trim().substring(0,100),
        billPriceSetting: '1',
        billPayorInfo: '1',
        billAmount: planConfig.amountInCents.toString(),
        billReturnUrl: `${appUrl}/payment-status`,
        billCallbackUrl: callbackUrl,
        billExternalReferenceNo: txId,
        billTo: userName.substring(0, 50),
        billEmail: userEmail.substring(0, 100),
        billPhone: (userPhone || decodedUser.phone_number || '').replace(/[^0-9]/g, '').substring(0, 20),
        billPaymentChannel: '0', // FPX
      };

      if (channel === 'duitnow_qr' && TOYYIBPAY_DUITNOW_QR_ENABLED) {
        billData.enableDuitNowQR = '1';
        billData.chargeDuitNowQR = '0';
      }

      const response = await axios.post(
        `https://${TOYYIBPAY_HOSTNAME}/index.php/api/createBill`,
        querystring.stringify(billData),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000
        }
      );

      const result = response.data;
      if (Array.isArray(result) && result[0]?.BillCode) {
        const billCode = result[0].BillCode;
        if (typeof billCode !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(billCode)) throw new Error('Invalid gateway bill code');
        const redirectUrl = `https://${TOYYIBPAY_HOSTNAME}/${billCode}`;

        await txRef.update({
          billCode,
          updatedAt: FieldValue.serverTimestamp()
        });

        return res.json({
          success: true,
          redirectUrl,
          orderId: txId,
          billCode
        });
      } else {
        const msg = Array.isArray(result) ? (result[0]?.msg || result[0]?.status) : (typeof result === 'string' ? result : 'Payment gateway returned unexpected response');
        console.warn('[ToyyibPay] Bill creation was rejected.');
        await txRef.update({ status: 'FAILED', updatedAt: FieldValue.serverTimestamp() });
        return res.status(400).json({ success: false, message: `Payment gateway error: ${msg}` });
      }
    } catch (err: any) {
      // Axios errors contain the submitted API key and payer details.
      console.error('[Payment Checkout Error]', err?.code || err?.response?.status || 'Gateway unavailable');
      res.status(500).json({ success: false, message: "Failed to initiate payment. Please try again." });
    }
  });

  // 3. Reconcile / Verify Payment from return URL or student page
  app.post("/api/payment/reconcile", async (req, res) => {
    try {
      const caller = await authenticateFirebaseUser(req);
      if (!caller) return res.status(401).json({success:false,message:'Please sign in to check your payment.'});
      const { billCode, orderId } = req.body;
      if ((orderId && (typeof orderId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(orderId))) || (billCode && typeof billCode !== 'string')) return res.status(400).json({success:false,message:'Invalid order.'});
      if (!billCode && !orderId) {
        return res.status(400).json({ success: false, message: "Missing billCode or orderId" });
      }

      let txDoc: DocumentSnapshot | null = null;
      if (orderId) {
        txDoc = await adminDb.collection('transactions').doc(orderId).get();
      }
      if ((!txDoc || !txDoc.exists) && billCode) {
        const querySnap = await adminDb.collection('transactions').where('billCode', '==', billCode).limit(1).get();
        if (!querySnap.empty) {
          txDoc = querySnap.docs[0];
        }
      }

      if (!txDoc || !txDoc.exists) {
        return res.status(404).json({ success: false, message: "Payment order not found" });
      }

      const txData = txDoc.data() || {};
      const txId = txDoc.id;
      if (txData.userId !== caller.uid) return res.status(403).json({success:false,message:'This order belongs to another account.'});
      if (billCode && billCode !== txData.billCode) return res.status(400).json({success:false,message:'The bill does not match this order.'});
      if (txData.paymentMethod === 'manual_bank_transfer' && txData.status !== 'SUCCESS') return res.json({success:false,status:txData.status,message:txData.status === 'REJECTED' ? 'Your payment was not approved. Please contact us.' : 'Waiting for your payment to be checked.'});

      if (txData.status === 'SUCCESS') {
        const planConfig = SERVER_PLANS[txData.planId];
        return res.json({
          success: true,
          status: 'SUCCESS',
          plan: txData.planId,
          planName: planConfig?.name || txData.planId,
          message: txData.activationMessage || `Payment received. Your ${planConfig?.name || txData.planName || 'plan'} is ready!`
        });
      }

      const activeBillCode = txData.billCode;
      if (!activeBillCode || !TOYYIBPAY_SECRET_KEY) {
        return res.json({
          success: false,
          status: txData.status || 'PENDING',
          message: 'Payment is still being processed.'
        });
      }

      const queryResult = await queryToyyibPayBill(activeBillCode, TOYYIBPAY_SECRET_KEY, TOYYIBPAY_HOSTNAME);
      if (queryResult.isSuccess) {
        const result = await applySuccessfulEntitlement(adminDb, txId, {
          billCode: activeBillCode,
          transactionId: queryResult.paymentInvoiceNo,
          paymentMethod: queryResult.paymentChannel || 'FPX',
          paidAmount: queryResult.paymentAmount,
          externalRefNo: queryResult.externalRefNo,
          source: 'reconciliation'
        });

        const planConfig = SERVER_PLANS[result.plan];
        return res.json({
          success: true,
          status: 'SUCCESS',
          plan: result.plan,
          planName: planConfig?.name || result.plan,
          message: result.message
        });
      } else {
        return res.json({
          success: false,
          status: queryResult.statusId === '3' ? 'FAILED' : 'PENDING',
          message: queryResult.statusId === '3' ? 'Payment was cancelled or failed.' : 'Payment is still processing with your bank.'
        });
      }
    } catch (err: any) {
      console.error("[Reconcile Error]:", err);
      res.status(500).json({ success: false, message: "Error verifying payment with gateway." });
    }
  });

  // 4. ToyyibPay Webhook Callback
  app.post("/api/tx/callback", async (req, res) => {
    try {
      if (!validPaymentHash(TOYYIBPAY_SECRET_KEY, req.body)) return res.status(403).send('Invalid payment confirmation');
      const {order_id, billcode} = req.body;
      if (typeof order_id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(order_id)) return res.status(400).send('Invalid order');
      const ref = adminDb.collection('transactions').doc(order_id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).send('Order not found');
      const order = snap.data()!;
      if (!billcode || billcode !== order.billCode || order.paymentMethod === 'manual_bank_transfer') return res.status(400).send('Bill does not match');
      if (String(req.body.status) === '1') {
        const check = await queryToyyibPayBill(order.billCode, TOYYIBPAY_SECRET_KEY!, TOYYIBPAY_HOSTNAME);
        if (!check.isSuccess) return res.status(503).send('Payment is not confirmed yet');
        await applySuccessfulEntitlement(adminDb, order_id, {billCode: order.billCode,
          transactionId: check.paymentInvoiceNo, paidAmount: check.paymentAmount,
          externalRefNo: check.externalRefNo, source: 'callback'});
      } else if (String(req.body.status) === '3') {
        await adminDb.runTransaction(async t => {
          const current = await t.get(ref);
          if (current.data()?.status !== 'SUCCESS') t.update(ref, {status:'FAILED',updatedAt:FieldValue.serverTimestamp()});
        });
      }

      res.send("OK");
    } catch (err: any) {
      console.error("[Callback Error]:", err);
      res.status(500).send("Callback processing failed");
    }
  });

  // 5. Manual Bank Transfer - Initiate Order
  app.post("/api/payment/manual/initiate", async (req, res) => {
    try {
      const decodedUser = await authenticateFirebaseUser(req);
      if (!decodedUser) {
        return res.status(401).json({ success: false, message: "Please sign in to continue." });
      }

      const bankConfig = await getBankTransferConfig(adminDb);
      if (!bankConfig.isConfigured) {
        return res.status(400).json({ 
          success: false, 
          message: "Bank transfer / Bank QR is currently unavailable. Bank details or bank QR image have not been configured yet." 
        });
      }

      const { planId } = req.body;
      const planConfig = typeof planId === 'string' && Object.hasOwn(SERVER_PLANS, planId) ? SERVER_PLANS[planId] : undefined;
      if (!planConfig) {
        return res.status(400).json({ success: false, message: "Invalid plan selected." });
      }

      const orderRef = `EZ-BT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const txDocRef = adminDb.collection('transactions').doc();
      const txId = txDocRef.id;

      await txDocRef.set({
        id: txId,
        orderReference: orderRef,
        userId: decodedUser.uid,
        userEmail: decodedUser.email || "student@ez-academy.my",
        userName: decodedUser.name || "EZ Academy Student",
        planId: planConfig.id,
        packageVersion: PACKAGE_VERSION,
        planName: planConfig.name,
        amount: planConfig.price,
        amountInCents: planConfig.amountInCents,
        currency: 'MYR',
        paymentMethod: 'manual_bank_transfer',
        status: 'PENDING_REVIEW',
        receiptDelivery: 'whatsapp',
        userNotes: 'QR payment request. Verify the receipt on WhatsApp and bank funds before approving.',
        bankDetails: {
          bankName: bankConfig.bankName,
          accountHolder: bankConfig.accountHolder,
          accountNumber: bankConfig.accountNumber,
          bankQrImageUrl: bankConfig.bankQrImageUrl,
          whatsappNumber: bankConfig.whatsappNumber
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        txId,
        orderReference: orderRef,
        amount: planConfig.price,
        planName: planConfig.name,
        bankDetails: {
          bankName: bankConfig.bankName,
          accountHolder: bankConfig.accountHolder,
          accountNumber: bankConfig.accountNumber,
          bankQrImageUrl: bankConfig.bankQrImageUrl,
          whatsappNumber: bankConfig.whatsappNumber,
          instructions: bankConfig.instructions
        }
      });
    } catch (err: any) {
      console.error("[Manual Initiate Error]:", err);
      res.status(500).json({ success: false, message: "Failed to create bank transfer order." });
    }
  });

  // 6. Manual Bank Transfer - Submit Receipt Proof
  app.post("/api/payment/manual/submit-receipt", async (req, res) => {
    try {
      const decodedUser = await authenticateFirebaseUser(req);
      if (!decodedUser) {
        return res.status(401).json({ success: false, message: "Please sign in to submit your receipt." });
      }

      const { txId, receiptUrl, transactionReference, notes } = req.body;
      if (!txId) {
        return res.status(400).json({ success: false, message: "Missing order ID." });
      }
      if (!receiptUrl && !transactionReference) {
        return res.status(400).json({ success: false, message: "Please provide a receipt image or bank reference number." });
      }

      const txRef = adminDb.collection('transactions').doc(txId);
      const txDoc = await txRef.get();
      if (!txDoc.exists) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }

      const txData = txDoc.data() || {};
      if (txData.userId !== decodedUser.uid) {
        return res.status(403).json({ success: false, message: "Unauthorized access to this order." });
      }

      if (txData.status === 'SUCCESS') {
        return res.json({ success: true, status: 'SUCCESS', message: "This order has already been approved!" });
      }

      if (txData.paymentMethod !== 'manual_bank_transfer' || !['PENDING_RECEIPT','PENDING_REVIEW'].includes(txData.status))
        return res.status(409).json({success:false,message:'This order cannot accept a receipt.'});
      const receipt = receiptUrl ? validateReceipt(receiptUrl) : null;
      if (receiptUrl && !receipt) return res.status(400).json({success:false,message:'Use a PNG, JPG or WebP receipt smaller than 3 MB.'});
      if (transactionReference && (typeof transactionReference !== 'string' || transactionReference.length > 120) || notes && (typeof notes !== 'string' || notes.length > 1000))
        return res.status(400).json({success:false,message:'Your reference or notes are too long.'});
      const chunks = receipt ? Math.ceil(receipt.bytes.length / 500000) : 0;
      await adminDb.runTransaction(async t => {
        const latest = await t.get(txRef);
        if (!['PENDING_RECEIPT','PENDING_REVIEW'].includes(latest.data()?.status)) throw new Error('This order has already been reviewed.');
        for (let i=0;i<chunks;i++) t.set(adminDb.collection('payment_receipts').doc(txId).collection('chunks').doc(String(i)),
          {bytes:receipt!.bytes.subarray(i*500000,(i+1)*500000)});
        if (receipt) t.set(adminDb.collection('payment_receipts').doc(txId), {userId:decodedUser.uid,mime:receipt.mime,chunks});
        t.update(txRef, {status:'PENDING_REVIEW',receiptUrl:receipt ? `/api/payment/receipt/${txId}` : txData.receiptUrl || null,
          userBankReference:transactionReference?.trim() || null,userNotes:notes?.trim() || null,
          receiptSubmittedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
      });

      res.json({
        success: true,
        status: 'PENDING_REVIEW',
        message: "Receipt received! Our team will check your payment and activate your plan."
      });
    } catch (err: any) {
      console.error("[Submit Receipt Error]:", err);
      res.status(500).json({ success: false, message: "Failed to submit receipt." });
    }
  });

  app.get('/api/payment/receipt/:id', async (req, res) => {
    try {
      const caller = await authenticateFirebaseUser(req);
      if (!caller) return res.sendStatus(401);
      const receipt = await adminDb.collection('payment_receipts').doc(req.params.id).get();
      if (!receipt.exists) return res.sendStatus(404);
      const data = receipt.data()!;
      if (data.userId !== caller.uid && !isAuthorizedAdmin(caller)) return res.sendStatus(403);
      const parts = await Promise.all(Array.from({length:data.chunks}, (_,i) => receipt.ref.collection('chunks').doc(String(i)).get()));
      res.setHeader('Cache-Control','private, no-store'); res.setHeader('X-Content-Type-Options','nosniff');
      res.type(data.mime).send(Buffer.concat(parts.map(p => p.data()!.bytes)));
    } catch { res.sendStatus(500); }
  });

  // 7. Admin - Get Pending Review Payments & Count
  app.get("/api/admin/payments/pending", async (req, res) => {
    try {
      const decodedUser = await authenticateFirebaseUser(req);
      if (!isAuthorizedAdmin(decodedUser)) {
        return res.status(403).json({ success: false, message: "Admin access required." });
      }

      const snapshot = await adminDb
        .collection('transactions')
        .where('status', '==', 'PENDING_REVIEW')
        .get();

      const items = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          receiptSubmittedAt: d.receiptSubmittedAt?.toDate ? d.receiptSubmittedAt.toDate().toISOString() : d.receiptSubmittedAt
        };
      });

      items.sort((a: any, b: any) => new Date(b.receiptSubmittedAt || 0).getTime() - new Date(a.receiptSubmittedAt || 0).getTime());

      res.json({
        success: true,
        count: items.length,
        items
      });
    } catch (err: any) {
      console.error("[Admin Pending Error]:", err);
      res.status(500).json({ success: false, message: "Failed to fetch pending payments." });
    }
  });

  // 8. Admin - Review Payment (Approve / Reject)
  app.post("/api/admin/payments/review", async (req, res) => {
    try {
      const decodedUser = await authenticateFirebaseUser(req);
      if (!isAuthorizedAdmin(decodedUser)) {
        return res.status(403).json({ success: false, message: "Admin access required." });
      }

      const { txId, action, adminNote } = req.body;
      if (!txId || !['APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE'].includes(action)) {
        return res.status(400).json({ success: false, message: "Invalid request parameters." });
      }

      const txRef = adminDb.collection('transactions').doc(txId);
      const txDoc = await txRef.get();
      if (!txDoc.exists) {
        return res.status(404).json({ success: false, message: "Transaction not found." });
      }

      if (action === 'ARCHIVE' || action === 'RESTORE') {
        await txRef.update({archived: action === 'ARCHIVE', archivedBy: decodedUser.email,
          archivedAt: action === 'ARCHIVE' ? FieldValue.serverTimestamp() : null, updatedAt: FieldValue.serverTimestamp()});
        return res.json({success: true, message: action === 'ARCHIVE' ? 'Payment archived. You can restore it from archived records.' : 'Payment restored.'});
      }
      if (action === 'APPROVE' && txDoc.data()?.paymentMethod !== 'manual_bank_transfer') {
        const order = txDoc.data()!;
        if (!order.billCode || !TOYYIBPAY_SECRET_KEY) return res.status(400).json({success:false,message:'This online order needs its original ToyyibPay bill and server connection. It cannot be manually approved.'});
        const verified = await queryToyyibPayBill(order.billCode, TOYYIBPAY_SECRET_KEY, TOYYIBPAY_HOSTNAME);
        if (!verified.isSuccess) return res.json({success:false,status:order.status,message:'ToyyibPay has not confirmed a successful payment. No plan or credits were changed.'});
        const result = await applySuccessfulEntitlement(adminDb, txId, {
          source: 'reconciliation', billCode: order.billCode, transactionId: verified.paymentInvoiceNo,
          paidAmount: verified.paymentAmount, externalRefNo: verified.externalRefNo,
          paymentMethod: verified.paymentChannel || 'FPX', adminId: decodedUser.email,
          adminNote: 'Admin requested ToyyibPay verification'
        });
        return res.json({success:true,status:'SUCCESS',plan:result.plan,message:result.message});
      }
      if (action === 'APPROVE') {
        const result = await applySuccessfulEntitlement(adminDb, txId, {
          source: 'manual_approval',
          adminId: decodedUser.email || 'ezacademy.my@gmail.com',
          adminNote: adminNote || 'Payment verified in bank account'
        });

        return res.json({
          success: true,
          status: 'SUCCESS',
          plan: result.plan,
          message: `Payment approved! Plan ${result.plan} is now active for this student.`
        });
      } else {
        await adminDb.runTransaction(async t => {
          const current = await t.get(txRef);
          if (current.data()?.status !== 'PENDING_REVIEW' || current.data()?.paymentMethod !== 'manual_bank_transfer') throw new Error('This payment is not waiting for review.');
          t.update(txRef, {status:'REJECTED',rejectedBy:decodedUser.uid,adminNote:String(adminNote || 'Payment could not be confirmed').slice(0,1000),
            rejectedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
        });

        return res.json({
          success: true,
          status: 'REJECTED',
          message: "Payment rejected."
        });
      }
    } catch (err: any) {
      console.error("[Admin Review Error]:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to process review." });
    }
  });

  // 9. Admin - Get & Save Bank Transfer Settings
  app.get("/api/admin/bank-transfer-config", async (req, res) => {
    try {
      const decodedUser = await authenticateFirebaseUser(req);
      if (!isAuthorizedAdmin(decodedUser)) {
        return res.status(403).json({ success: false, message: "Admin access required." });
      }
      const config = await getBankTransferConfig(adminDb);
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/bank-transfer-config", async (req, res) => {
    try {
      const decodedUser = await authenticateFirebaseUser(req);
      if (!isAuthorizedAdmin(decodedUser)) {
        return res.status(403).json({ success: false, message: "Admin access required." });
      }
      const updatedConfig = await saveBankTransferConfig(adminDb, req.body, decodedUser.email || 'ezacademy.my@gmail.com');
      res.json({ success: true, config: updatedConfig, message: "Bank transfer details saved successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

}
