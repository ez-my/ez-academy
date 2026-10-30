import crypto from 'node:crypto';
import { FieldValue, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { commissionForOrder, validateClaim, validateTransition } from '../affiliate';

export async function ensureAffiliate(db: Firestore, uid: string) {
  const ref = db.collection('affiliate_accounts').doc(uid);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = 'EZ' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const result = await db.runTransaction(async t => {
      const account = await t.get(ref);
      if (account.exists) return account.data();
      const codeRef = db.collection('affiliate_codes').doc(code);
      const taken = await t.get(codeRef);
      if (taken.exists) return null;
      const data = {uid, code, availableCents:0, reservedCents:0, paidCents:0, earnedCents:0, createdAt:FieldValue.serverTimestamp()};
      t.set(codeRef,{uid}); t.set(ref,data); return data;
    });
    if (result) return result;
  }
  throw Error('Could not allocate referral code. Please retry.');
}
export class ReferralError extends Error {}
export async function resolveReferral(db: Firestore, buyerUid: string, raw: unknown) {
  if (raw === undefined || raw === '') return {};
  if (typeof raw !== 'string' || !/^EZ[A-F0-9]{12}$/.test(raw)) throw new ReferralError('Invalid referral code.');
  const code = await db.collection('affiliate_codes').doc(raw).get();
  const uid = code.data()?.uid;
  if (!uid) throw new ReferralError('Referral code not found.');
  if (uid === buyerUid) throw new ReferralError('You cannot use your own referral code.');
  return {affiliateUid:uid, referralCode:raw, affiliateVersion:1};
}
// Called inside the existing verified-payment transaction, before its first write.
export async function prepareCommission(db: Firestore, t: Transaction, orderId: string, order: any) {
  const cents = commissionForOrder(order);
  if (!cents || !order.affiliateUid || order.affiliateUid === order.userId) return () => {};
  const ledgerRef = db.collection('affiliate_commissions').doc(orderId);
  const accountRef = db.collection('affiliate_accounts').doc(order.affiliateUid);
  const [ledger, account] = await Promise.all([t.get(ledgerRef),t.get(accountRef)]);
  if (ledger.exists) return () => {};
  if (!account.exists || account.data()?.code !== order.referralCode) throw Error('Referral account is unavailable.');
  return () => {
    t.set(ledgerRef,{orderId,uid:order.affiliateUid,buyerUid:order.userId,planId:order.planId,amountCents:cents,createdAt:FieldValue.serverTimestamp()});
    t.update(accountRef,{availableCents:FieldValue.increment(cents),earnedCents:FieldValue.increment(cents)});
  };
}
export async function submitClaim(db: Firestore, uid: string, body: any, identity: {name?:string;email?:string}) {
  if (typeof body.requestId !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(body.requestId)) throw Error('Invalid claim request.');
  if (!['DuitNow','Touch n Go eWallet QR'].includes(body.method)) throw Error('Choose a payout method.');
  if (typeof body.recipientName !== 'string' || !body.recipientName.trim() || body.recipientName.length > 120) throw Error('Enter the account holder name.');
  if (body.method === 'DuitNow' && (typeof body.duitNowId !== 'string' || !body.duitNowId.trim() || body.duitNowId.length > 100)) throw Error('Enter your DuitNow ID.');
  const id = crypto.createHash('sha256').update(uid + ':' + body.requestId).digest('hex');
  const claimRef = db.collection('affiliate_claims').doc(id);
  const accountRef = db.collection('affiliate_accounts').doc(uid);
  return db.runTransaction(async t => {
    const [claim, account] = await Promise.all([t.get(claimRef),t.get(accountRef)]);
    if (claim.exists) return {id,status:claim.data()!.status};
    if (!account.exists) throw Error('Load your affiliate wallet first.');
    validateClaim(body.amountCents,account.data()!.availableCents);
    t.set(claimRef,{uid,userName:identity.name || identity.email || uid,email:identity.email || '',code:account.data()!.code,
      amountCents:body.amountCents,method:body.method,recipientName:body.recipientName.trim(),
      ...(body.method === 'DuitNow' ? {duitNowId:body.duitNowId.trim()} : {qr:body.qr}),
      status:'Submitted',submittedAt:Date.now()});
    t.update(accountRef,{availableCents:FieldValue.increment(-body.amountCents),reservedCents:FieldValue.increment(body.amountCents)});
    return {id,status:'Submitted'};
  });
}
export async function updateClaim(db: Firestore, id: string, status: string, adminUid: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw Error('Invalid claim.');
  return db.runTransaction(async t => {
    const ref=db.collection('affiliate_claims').doc(id), snap=await t.get(ref);
    if (!snap.exists) throw Error('Claim not found.');
    const claim=snap.data()!;
    validateTransition(claim.status,status);
    if (claim.status === status) return;
    const accountRef=db.collection('affiliate_accounts').doc(claim.uid);
    const account=await t.get(accountRef);
    if (!account.exists || account.data()!.reservedCents < claim.amountCents) throw Error('Claim reservation is unavailable.');
    t.update(ref,{status,updatedAt:Date.now(),updatedBy:adminUid,...(status === 'Paid' ? {paidAt:Date.now()} : {})});
    if (status === 'Paid') t.update(accountRef,{reservedCents:FieldValue.increment(-claim.amountCents),paidCents:FieldValue.increment(claim.amountCents)});
  });
}
