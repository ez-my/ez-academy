import { type Firestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { MONTHLY_AI_UNITS, PACKAGE_VERSION } from '../packages';
import {currentPurchase,skillAccess,millis} from '../data/subscriptionAccess';
const PERIOD = 30 * 86400000;
// Conservative reserve: USD/MYR 5, 25% cost buffer, one token per input
// character, up to 16k output tokens. One unit funds at most RM0.05.
export function aiCallUnits(kind: 'text'|'speech'|'transcribe', characters=0) {
  if (!Number.isFinite(characters) || characters < 0) throw new Error('Invalid AI input');
  if (kind === 'transcribe') return 2; // Only <=65-second 16kHz mono PCM WAV accepted.
  if (kind === 'speech') {
    if (characters > 4000) throw new Error('Speech passage too long');
    return Math.max(1, Math.ceil(characters * 0.00025 / 0.05));
  }
  if (characters > 200000) throw new Error('AI input too long');
  return Math.max(1, Math.ceil((characters * 0.15 / 1e6 + 16000 * 0.6 / 1e6) * 5 * 1.25 / 0.05));
}
export function packageWindow(profile: any, ledger: any, now=Date.now(), skill?:string) {
  const bought=currentPurchase(ledger,now,skill);
  if(bought)return {legacy:!!bought.legacyUnlimited,period:`purchase-${bought.id}`,included:Number(bought.included||0),topup:Math.max(0,Number(ledger.topupUnits||0))};
  const expiry=millis(profile.planExpiresAt);
  const inheritedPeriod=(ledger.legacyPeriods||[]).some((p:any)=>p.startsAt<=now&&p.expiresAt>now);
  const legacy=inheritedPeriod||profile.plan&&profile.plan!=='free'&&!['lite','plus','max'].includes(profile.plan)&&ledger.version!==2&&(!expiry||expiry>now);
  const active=ledger.version===2&&Number(ledger.expiresAt)>now;
  const focus=skill&&Number(ledger.focus?.[skill]?.expiresAt)>now?ledger.focus[skill]:null;
  const created=millis(profile.createdAt),anchor=active?Number(ledger.anchorMillis):focus?Number(focus.anchorMillis):created;
  const cycle=Math.floor((now-anchor)/PERIOD);
  return {legacy,period:`${active?anchor:focus?skill+'-'+anchor:'free-'+anchor}-${cycle}`,included:active?MONTHLY_AI_UNITS[ledger.planId]||0:focus?Number(focus.included):0,topup:Math.max(0,Number(ledger.topupUnits||0))};
}
function focusOnly(ledger:any,skill:string){return {...ledger,version:0,purchases:(ledger.purchases||[]).filter((p:any)=>p.skill===skill)}}

export async function aiAllowance(database: Firestore, uid: string) {
  const [profile,ledger] = await Promise.all([database.doc(`users/${uid}`).get(),database.doc(`package_entitlements/${uid}`).get()]);
  const window=packageWindow(profile.data() || {},ledger.data() || {});
  const usage=await database.doc(`package_ai_usage/${uid}/periods/${window.period}`).get();
  const data=ledger.data()||{},now=Date.now();
  const skills=Object.fromEntries(['speak','write','read','listen'].map(skill=>[skill,skillAccess(profile.data()||{},data,skill,now)]));
  const focusedBalances=await Promise.all(['speak','write','read','listen'].filter(skill=>currentPurchase(data,now,skill)||Number(data.focus?.[skill]?.expiresAt)>now).map(async skill=>{const w=packageWindow({plan:'free'},focusOnly(data,skill),now,skill);const u=await database.doc(`package_ai_usage/${uid}/periods/${w.period}`).get();return [skill,{included:w.included,remaining:Math.max(0,w.included-Number(u.data()?.used||0))}];}));
  return {...window,skills,focus:Object.fromEntries(focusedBalances),used:Number(usage.data()?.used||0),remaining:Math.max(0,window.included-Number(usage.data()?.used||0))+window.topup};
}
export type CreditReservation = (()=>Promise<void>) & {complete:()=>Promise<void>};
export async function reservePackageCall(database: Firestore, uid: string, units: number, skill?:string): Promise<CreditReservation> {
  if (!Number.isInteger(units) || units <= 0) throw new Error('Invalid AI units');
  const ledgerRef=database.doc(`package_entitlements/${uid}`),profileRef=database.doc(`users/${uid}`);
  const id=randomUUID();
  const reservation=await database.runTransaction(async t=>{
    const [profile,ledger]=await Promise.all([t.get(profileRef),t.get(ledgerRef)]);
    if (!profile.exists) throw new Error('Profile required');
    const data=ledger.data() || {},window=packageWindow(profile.data(),data,Date.now());
    if((skill&&!skillAccess(profile.data(),data,skill).paid)||(!skill&&!['speak','write','read','listen'].some(s=>skillAccess(profile.data(),data,s).paid)))throw Object.assign(new Error('This skill keeps Free access. Top-ups do not upgrade a skill.'),{code:'free_template',skill});
    if (window.legacy) return null;
    const windows=[window];
    if(skill && (currentPurchase(data,Date.now(),skill)||Number(data.focus?.[skill]?.expiresAt)>Date.now())) {
      const focused=packageWindow({...profile.data(),plan:'free'},focusOnly(data,skill),Date.now(),skill);
      if(focused.period!==window.period) windows.unshift(focused);
    }
    const refs=windows.map(w=>database.doc(`package_ai_usage/${uid}/periods/${w.period}`));
    const snapshots=await Promise.all(refs.map(ref=>t.get(ref)));
    let outstanding=units;
    const allocations=windows.map((w,i)=>{
      const used=Number(snapshots[i].data()?.used||0),amount=Math.min(outstanding,Math.max(0,w.included-used));
      outstanding-=amount;return {ref:refs[i],used,amount};
    });
    if (!windows.some(w=>w.included>0) && !window.topup) throw Object.assign(new Error('Free access uses question banks and general feedback templates. Choose a skill pack, bundle or top-up for personalised AI feedback.'),{code:'free_template',skill});
    if (outstanding > window.topup) throw Object.assign(new Error('Your shared AI credits have run out. Top up or renew your plan to continue. Saved question-bank activities remain available within your practice limits.'),{code:'package_quota'});
    const receiptRef=database.doc(`package_ai_reservations/${id}`);
    for(const allocation of allocations) if(allocation.amount) t.set(allocation.ref,{used:allocation.used+allocation.amount},{merge:true});
    if (outstanding) t.set(ledgerRef,{...data,topupUnits:window.topup-outstanding});
    t.create(receiptRef,{uid,allocations:allocations.map(a=>({path:a.ref.path,amount:a.amount})),topup:outstanding,state:'reserved',createdAt:new Date()});
    return {allocations,receiptRef,topup:outstanding};
  });
  const refund = async()=>{
    if (!reservation) return;
    await database.runTransaction(async t=>{
      const [receipt,ledger,...usage]=await Promise.all([t.get(reservation.receiptRef),t.get(ledgerRef),...reservation.allocations.map(a=>t.get(a.ref))]);
      if (receipt.data()?.state !== 'reserved') return;
      reservation.allocations.forEach((a,i)=>{if(a.amount)t.set(a.ref,{used:Math.max(0,Number(usage[i].data()?.used||0)-a.amount)},{merge:true});});
      if(reservation.topup) t.set(ledgerRef,{...(ledger.data()||{}),topupUnits:Number(ledger.data()?.topupUnits||0)+reservation.topup});
      t.update(reservation.receiptRef,{state:'refunded',settledAt:new Date()});
    });
  };
  return Object.assign(refund,{complete:async()=>{
    if(!reservation) return;
    await database.runTransaction(async t=>{const receipt=await t.get(reservation.receiptRef);if(receipt.data()?.state==='reserved')t.update(reservation.receiptRef,{state:'consumed',settledAt:new Date()});});
  }});
}
