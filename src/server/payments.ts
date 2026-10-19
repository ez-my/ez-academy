import { PACKAGES, PACKAGE_VERSION } from '../packages';
import {PACKAGES as V3_PACKAGES} from '../legacyPackagesV3';
import {PACKAGES as V2_PACKAGES} from '../legacyPackagesV2';
import {DAILY_PRACTICE_LIMITS} from '../data/practiceLimits';
import {currentPurchase,millis} from '../data/subscriptionAccess';
import type { Request, Response } from "express";
import axios from "axios";
import querystring from "querystring";
import crypto from "crypto";
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';

export interface ServerPlanConfig {
  id: string;
  aiUnits?: number;
  dailyLimit?: number;
  dailyScope?: string;
  extraFree?: boolean;
  fullTests?: boolean;
  name: string;
  price: number; // in MYR
  amountInCents: number;
  type: 'subscription' | 'credits' | 'skill';
  durationDays?: number;
  creditsGrant?: number;
  description: string;
}

export const LEGACY_PLANS: Record<string, ServerPlanConfig> = {
  'basic': {
    id: 'basic',
    name: 'EZ Basic',
    price: 10,
    amountInCents: 1000,
    type: 'subscription',
    durationDays: 30,
    description: 'Daily access to core practice tools and feedback'
  },
  'pro': {
    id: 'pro',
    name: 'EZ Pro',
    price: 20,
    amountInCents: 2000,
    type: 'subscription',
    durationDays: 30,
    description: '5 sessions daily with detailed AI feedback'
  },
  'pro_plus': {
    id: 'pro_plus',
    name: 'EZ Pro+',
    price: 39,
    amountInCents: 3900,
    type: 'subscription',
    durationDays: 30,
    description: 'Unlimited practice with priority feedback'
  },
  'credits': {
    id: 'credits',
    name: 'EZ Credits',
    price: 10,
    amountInCents: 1000,
    type: 'credits',
    creditsGrant: 50,
    description: '50 practice credits for speaking and writing'
  }
};

export const SERVER_PLANS: Record<string, ServerPlanConfig> = PACKAGES;
export function orderPlan(order: any) {
  const catalog = order.packageVersion === PACKAGE_VERSION ? SERVER_PLANS : order.packageVersion === 3 ? V3_PACKAGES : order.packageVersion === 2 ? V2_PACKAGES : !order.packageVersion ? LEGACY_PLANS : {};
  return Object.hasOwn(catalog, order.planId) ? catalog[order.planId] : undefined;
}


export function normalizedPaymentOrder(saved: any) {
  const order = {...saved};
  const plan = orderPlan(order);
  // Original MYR catalogue orders omitted these fields. Accept only their exact historical price.
  if (!order.packageVersion && plan && Number(order.amount) === plan.price) {
    if (order.amountInCents === undefined) order.amountInCents = plan.amountInCents;
    if (order.currency === undefined) order.currency = 'MYR';
    if (order.paymentMethod === undefined && order.billCode) order.paymentMethod = 'toyyibpay_fpx';
  }
  return order;
}

export interface BankTransferConfig {
  isConfigured: boolean;
  isQrAvailable: boolean;
  isAccountTransferAvailable: boolean;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  bankQrImageUrl?: string;
  whatsappNumber: string;
  instructions?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Extract and verify Firebase Bearer token
 */
export async function authenticateFirebaseUser(req: Request): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) return null;

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    console.warn("[Auth] Failed to verify ID token:", err);
    return null;
  }
}

/**
 * Check if the decoded token belongs to the authorized admin
 */
export function isAuthorizedAdmin(decodedToken: DecodedIdToken | null): boolean {
  if (!decodedToken) return false;
  const adminEmail = 'ezacademy.my@gmail.com';
  return (
    decodedToken.email?.toLowerCase() === adminEmail &&
    decodedToken.email_verified === true
  );
}

/**
 * Atomically apply verified entitlement to transaction and user profile.
 * Thread-safe, idempotent, prevents downgrades and duplicate credit grants.
 */
export async function applySuccessfulEntitlement(
  firestore: Firestore, txId: string,
  verification: { billCode?: string; transactionId?: string; paymentMethod?: string; paidAmount?: number;
    source: 'callback' | 'reconciliation' | 'manual_approval'; adminId?: string; adminNote?: string; externalRefNo?: string }
): Promise<{ success: boolean; alreadyProcessed: boolean; plan: string; creditsAdded: number; message: string }> {
  const txRef = firestore.collection('transactions').doc(txId);
  return firestore.runTransaction(async t => {
    const txDoc = await t.get(txRef);
    if (!txDoc.exists) throw new Error('Payment order not found.');
    const order = normalizedPaymentOrder(txDoc.data()!);
    const plan = orderPlan(order);
    if (!plan || !order.userId || order.amountInCents !== plan.amountInCents || order.currency !== 'MYR')
      throw new Error('The saved order is not valid.');
    const manual = verification.source === 'manual_approval';
    if (manual) {
      if (!verification.adminId || order.paymentMethod !== 'manual_bank_transfer') throw new Error('Bank payment approval is required.');
      if (!['PENDING_REVIEW', 'SUCCESS'].includes(order.status)) throw new Error('This payment is not waiting for review.');
    } else {
      if (order.paymentMethod === 'manual_bank_transfer' || !order.billCode || order.billCode !== verification.billCode ||
          verification.externalRefNo !== txId || !verification.transactionId ||
          !Number.isFinite(verification.paidAmount) || Math.round(verification.paidAmount! * 100) !== order.amountInCents)
        throw new Error('The bank payment does not match this order.');
    }
    // Firestore requires every read to happen before the first write.
    const userRef = firestore.collection('users').doc(order.userId);
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) throw new Error('The student account was not found. No payment was applied.');
    const user = userDoc.data()!;
    const packageRef = firestore.collection('package_entitlements').doc(order.userId);
    const packageDoc = await t.get(packageRef);
    const packageData = packageDoc.data() || {};
    const stamp = FieldValue.serverTimestamp();
    if (order.status === 'SUCCESS') return {success: true, alreadyProcessed: true, plan: plan.type === 'skill' ? plan.id : user.plan || order.planId,
      creditsAdded: 0, message: 'This payment was already applied.'};
    if (order.status === 'REJECTED') throw new Error('This payment was rejected.');
    const invoiceRef = !manual ? firestore.collection('payment_invoices').doc(
      crypto.createHash('sha256').update(verification.transactionId!).digest('hex')) : null;
    const invoice = invoiceRef ? await t.get(invoiceRef) : null;
    if (invoice?.exists && invoice.data()?.orderId !== txId) throw new Error('This bank payment has already been used.');
    const now = new Date();
    if(order.packageVersion===PACKAGE_VERSION||order.packageVersion===3||(packageData.purchases||[]).length){
      const pack:ServerPlanConfig=plan;
      const ledger={...packageData};let startsAt=now.getTime(),expiresAt=0,creditsAdded=0;
      if(pack.type==='credits'){
        creditsAdded=pack.creditsGrant!;
        ledger.topupUnits=Number(ledger.topupUnits||0)+Number(pack.aiUnits||0);
        t.update(userRef,{credits:FieldValue.increment(creditsAdded),updatedAt:stamp,lastPaymentAt:stamp,lastTransactionId:txId});
      }else{
        const skill=pack.type==='skill'?pack.id:undefined;
        const existing=currentPurchase(packageData,startsAt,skill);
        const oldExpiry=skill?millis(packageData.focus?.[skill]?.expiresAt):packageData.version===2?millis(packageData.expiresAt):user.plan&&user.plan!=='free'?millis(user.planExpiresAt):0;
        startsAt=Math.max(startsAt,existing?.expiresAt||0,oldExpiry,...(packageData.purchases||[]).filter((p:any)=>skill?p.skill===skill:p.type==='subscription').map((p:any)=>Number(p.expiresAt)||0));
        expiresAt=startsAt+(pack.durationDays||30)*86400000;
        ledger.purchases=[...(packageData.purchases||[]),{id:txId,version:order.packageVersion===PACKAGE_VERSION?PACKAGE_VERSION:3,planId:pack.id,type:pack.type,...(skill?{skill}:{}),startsAt,expiresAt,included:pack.aiUnits||0,dailyLimit:pack.dailyLimit||0,...(pack.extraFree?{extraFree:true,dailyScope:pack.dailyScope}:{}),...(![3,PACKAGE_VERSION].includes(order.packageVersion)?{dailyLimits:pack.type==='skill'?DAILY_PRACTICE_LIMITS.pro:(DAILY_PRACTICE_LIMITS as any)[pack.id],legacyUnlimited:!order.packageVersion}:{}),fullTests:pack.fullTests!==false}];
        t.update(userRef,{updatedAt:stamp,lastPaymentAt:stamp,lastTransactionId:txId,...(pack.type==='subscription'&&startsAt<=now.getTime()?{plan:pack.id,planExpiresAt:Timestamp.fromMillis(expiresAt),planUpdatedAt:stamp}:{})});
      }
      t.set(packageRef,ledger);
      if(invoiceRef)t.set(invoiceRef,{orderId:txId,verifiedAt:stamp});
      const message=pack.type==='credits'?'Your credits have been added. Your plan limits are unchanged.':startsAt>now.getTime()?`Your ${pack.name} purchase is confirmed. It starts after your current subscription ends.`:`Your ${pack.name} plan is ready.`;
      t.update(txRef,{status:'SUCCESS',activationMessage:message,updatedAt:stamp,reconciledAt:stamp,reconciliationSource:verification.source,activePlanAfterPayment:pack.type==='subscription'&&startsAt<=now.getTime()?pack.id:user.plan||'free',entitlementStartsAt:startsAt,...(expiresAt?{entitlementExpiresAt:expiresAt}:{}),...(verification.transactionId?{transactionId:verification.transactionId}:{}),...(verification.adminId?{approvedBy:verification.adminId,approvedAt:stamp,adminNote:verification.adminNote||''}:{})});
      return {success:true,alreadyProcessed:false,plan:pack.id,creditsAdded,message};
    }
    let creditsAdded = 0;
    let activePlan = user.plan || 'free';
    const userUpdate: Record<string, any> = {updatedAt: stamp, lastPaymentAt: stamp, lastTransactionId: txId};
    if (plan.type === 'credits') {
      creditsAdded = plan.creditsGrant!;
      userUpdate.credits = FieldValue.increment(creditsAdded);
    } else if (plan.type === 'subscription') {
      const rank: Record<string, number> = {free: 0, basic: 1, pro: 2, pro_plus: 3};
      const expiry = user.planExpiresAt?.toDate?.();
      const currentActive = expiry ? expiry > now : activePlan !== 'free';
      if (currentActive && (rank[activePlan] || 0) > rank[plan.id]) {
        // Credit the amount paid toward the active higher plan, without granting full-price time cheaply.
        userUpdate.planExpiresAt = Timestamp.fromDate(new Date(
          Math.max(now.getTime(), expiry?.getTime() || now.getTime()) + plan.durationDays! * 86400000 * plan.amountInCents / (packageData.version === 2 ? V2_PACKAGES : LEGACY_PLANS)[activePlan].amountInCents));
      } else {
        activePlan = plan.id;
        userUpdate.plan = activePlan;
        const starts = currentActive && user.plan === plan.id && expiry ? expiry.getTime() : now.getTime();
        userUpdate.planExpiresAt = Timestamp.fromDate(new Date(starts + plan.durationDays! * 86400000));
      }
      userUpdate.planUpdatedAt = stamp;
    }
    if (order.packageVersion === 2) {
      if (plan.type === 'credits') {
        t.set(packageRef, {...packageData, topupUnits: Number(packageData.topupUnits || 0) + 50});
      } else if (plan.type === 'skill') {
        const existing = packageData.focus?.[plan.id];
        const active = Number(existing?.expiresAt || 0) > now.getTime();
        t.set(packageRef, {...packageData, focus: {...(packageData.focus || {}), [plan.id]: {
          anchorMillis: active ? existing.anchorMillis : now.getTime(),
          expiresAt: Math.max(now.getTime(), Number(existing?.expiresAt || 0)) + 30 * 86400000,
          included: V2_PACKAGES[plan.id as 'speak'].aiUnits}}});
      } else if (activePlan !== plan.id && packageData.version === 2) {
        t.set(packageRef,{...packageData,expiresAt:userUpdate.planExpiresAt.toMillis()});
      } else if (activePlan === plan.id) {
        const samePeriod = packageData.version === 2 && packageData.planId === plan.id && Number(packageData.expiresAt) > now.getTime();
        const oldExpiry=user.planExpiresAt?.toMillis?.() || 0;
        const inherit=packageData.version !== 2 && user.plan===plan.id && oldExpiry>now.getTime();
        t.set(packageRef, {...packageData, version: 2, planId: plan.id,
          ...(inherit ? {legacyPeriods:[...(packageData.legacyPeriods || []),{startsAt:now.getTime(),expiresAt:oldExpiry}]} : {}),
          anchorMillis: samePeriod ? packageData.anchorMillis : inherit ? oldExpiry : now.getTime(),
          expiresAt: userUpdate.planExpiresAt.toMillis(), topupUnits: Number(packageData.topupUnits || 0)});
      }
    }
    if (!order.packageVersion && plan.type==='subscription' && packageData.version===2 && userUpdate.planExpiresAt) {
      const startsAt=Math.max(now.getTime(),user.planExpiresAt?.toMillis?.()||0);
      const expiresAt=userUpdate.planExpiresAt.toMillis();
      if(expiresAt>startsAt) t.set(packageRef,{...packageData,expiresAt:Math.max(Number(packageData.expiresAt)||0,expiresAt),legacyPeriods:[...(packageData.legacyPeriods||[]),{startsAt,expiresAt}]});
    }
    if (invoiceRef) t.set(invoiceRef, {orderId: txId, verifiedAt: stamp});
    t.update(userRef, userUpdate);
    t.update(txRef, {amountInCents: order.amountInCents, currency: order.currency, paymentMethod: order.paymentMethod, status: 'SUCCESS', updatedAt: stamp, reconciledAt: stamp,
      reconciliationSource: verification.source, ...(verification.transactionId ? {transactionId: verification.transactionId} : {}),
      ...(verification.adminId ? {approvedBy: verification.adminId, adminNote: verification.adminNote || '', approvedAt: stamp} : {}),
      activePlanAfterPayment: activePlan});
    return {success: true, alreadyProcessed: false, plan: plan.type === 'skill' ? plan.id : activePlan, creditsAdded,
      message: plan.type === 'credits' ? 'Your credits have been added.' : plan.type === 'skill' ? `Your ${plan.name} pack is ready.` : `Your ${SERVER_PLANS[activePlan]?.name || activePlan} plan is ready.`};
  });
}

export function validPaymentHash(secret: string | undefined, body: any): boolean {
  if (!secret || typeof body.hash !== 'string' || !/^[a-f0-9]{32}$/i.test(body.hash)) return false;
  const expected = crypto.createHash('md5').update(secret + String(body.status) + String(body.order_id) + String(body.refno) + 'ok').digest();
  return crypto.timingSafeEqual(expected, Buffer.from(body.hash, 'hex'));
}

export function validateReceipt(data: unknown): {mime: string; bytes: Buffer} | null {
  if (typeof data !== 'string' || data.length > 4 * 1024 * 1024) return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data);
  if (!match) return null;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0 || bytes.length > 3 * 1024 * 1024) return null;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!(match[1] === 'image/png' && png || match[1] === 'image/jpeg' && jpeg || match[1] === 'image/webp' && webp)) return null;
  return {mime: match[1], bytes};
}

/**
 * Fetch and verify transaction details directly from ToyyibPay API
 */
export async function queryToyyibPayBill(
  billCode: string,
  secretKey: string,
  hostname: string = "toyyibpay.com"
): Promise<{
  found: boolean;
  isSuccess: boolean;
  statusId?: string;
  paymentAmount?: number;
  paymentInvoiceNo?: string;
  paymentChannel?: string;
  externalRefNo?: string;
  raw?: any;
  error?: boolean;
}> {
  try {
    const url = `https://${hostname}/index.php/api/getBillTransactions`;
    const response = await axios.post(
      url,
      querystring.stringify({
        billCode: billCode.trim()
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );

    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      // Find latest or successful transaction
      const successTx = data.find((t: any) => String(t.billpaymentStatus) === '1') || data[0];
      const status = String(successTx.billpaymentStatus || '');
      const isSuccess = status === '1';
      const amountStr = successTx.billpaymentAmount ?? successTx.billPaymentAmount;
      const paymentAmount = amountStr ? parseFloat(amountStr) : undefined;

      return {
        found: true,
        isSuccess,
        statusId: status,
        paymentAmount,
        paymentInvoiceNo: successTx.billpaymentInvoiceNo || successTx.billPaymentInvoiceNo,
        paymentChannel: successTx.billpaymentChannel || successTx.billPaymentChannel || 'FPX',
        externalRefNo: successTx.billExternalReferenceNo,
        raw: successTx
      };
    }

    return { found: false, isSuccess: false };
  } catch (err: any) {
    console.error("[ToyyibPay] Error querying getBillTransactions:", err.message);
    return { found: false, isSuccess: false, error: true };
  }
}

/**
 * Get configured bank transfer details from system_config collection.
 * Default values configured for Maybank / Mohamad Shahrilniza / WhatsApp 011-10043567.
 * Plain account transfer stays unavailable until account number exists.
 * Bank QR stays unavailable until actual bank-issued QR asset is configured.
 */
export async function getBankTransferConfig(
  firestore: Firestore
): Promise<BankTransferConfig> {
  const suppliedQr = '/payments/maybank-qr.png';
  const defaultBank = 'Maybank';
  const defaultHolder = 'Mohamad Shahrilniza';
  const defaultWhatsApp = '601110043567';

  try {
    const docSnap = await firestore.collection('system_config').doc('bank_transfer').get();
    if (!docSnap.exists) {
      return {
        isConfigured: true,
        isQrAvailable: true,
        isAccountTransferAvailable: false,
        bankName: defaultBank,
        accountHolder: defaultHolder,
        accountNumber: '',
        bankQrImageUrl: suppliedQr,
        whatsappNumber: defaultWhatsApp,
        instructions: 'Transfer the exact amount using your bank app. After paying, send your receipt. Your plan starts after we check your payment.'
      };
    }
    const data = docSnap.data() || {};
    const bankName = data.bankName?.trim() || defaultBank;
    const accountHolder = data.accountHolder?.trim() || defaultHolder;
    const accountNumber = data.accountNumber?.trim() || '';
    const bankQrImageUrl = suppliedQr;
    const whatsappNumber = defaultWhatsApp;

    const isQrAvailable = Boolean(bankQrImageUrl && bankQrImageUrl.length > 5);
    const isAccountTransferAvailable = Boolean(accountNumber && accountNumber.length > 5);
    const isConfigured = Boolean((data.isConfigured !== false || !data.bankQrImageUrl) && (isQrAvailable || isAccountTransferAvailable));

    return {
      isConfigured,
      isQrAvailable,
      isAccountTransferAvailable,
      bankName,
      accountHolder,
      accountNumber,
      bankQrImageUrl,
      whatsappNumber,
      instructions: data.instructions || 'Transfer the exact amount using your bank app. After paying, send your receipt. Your plan starts after we check your payment.',
      updatedAt: data.updatedAt ? new Date(data.updatedAt.toDate?.() || data.updatedAt).toISOString() : undefined,
      updatedBy: data.updatedBy
    };
  } catch (err) {
    console.error("[BankTransfer] Error fetching config:", err);
    return {
      isConfigured: false,
      isQrAvailable: false,
      isAccountTransferAvailable: false,
      bankName: defaultBank,
      accountHolder: defaultHolder,
      accountNumber: '',
      bankQrImageUrl: suppliedQr,
      whatsappNumber: defaultWhatsApp
    };
  }
}

/**
 * Save bank transfer configuration (Admin only)
 */
export async function saveBankTransferConfig(
  firestore: Firestore,
  config: Partial<BankTransferConfig>,
  adminEmail: string
): Promise<BankTransferConfig> {
  const bankName = config.bankName?.trim() || 'Maybank';
  const accountHolder = config.accountHolder?.trim() || 'Mohamad Shahrilniza';
  const accountNumber = config.accountNumber?.trim() || '';
  const bankQrImageUrl = config.bankQrImageUrl?.trim() || '';
  const whatsappNumber = config.whatsappNumber?.trim() || '601110043567';
  if (bankQrImageUrl && !(bankQrImageUrl.startsWith('/') && !bankQrImageUrl.startsWith('//')) && !bankQrImageUrl.startsWith('https://') && !validateReceipt(bankQrImageUrl)) throw new Error('Use a bank QR image, local image path or secure image link.');
  if (bankQrImageUrl.length > 700000) throw new Error('Use a smaller QR image.');
  if (!/^[0-9]{8,15}$/.test(whatsappNumber)) throw new Error('Use a WhatsApp number with country code.');

  const isQrAvailable = Boolean(bankQrImageUrl && bankQrImageUrl.length > 5);
  const isAccountTransferAvailable = Boolean(accountNumber && accountNumber.length > 5);
  // Only mark configured if admin explicitly enabled it AND at least QR or account number exists
  const isConfigured = Boolean(config.isConfigured && (isQrAvailable || isAccountTransferAvailable));

  const payload = {
    isConfigured,
    isQrAvailable,
    isAccountTransferAvailable,
    bankName,
    accountHolder,
    accountNumber,
    bankQrImageUrl,
    whatsappNumber,
    instructions: config.instructions?.trim() || 'Transfer the exact amount using your bank app. After paying, send your receipt. Your plan starts after we check your payment.',
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: adminEmail
  };

  await firestore.collection('system_config').doc('bank_transfer').set(payload, { merge: true });

  return {
    ...payload,
    updatedAt: new Date().toISOString()
  };
}
