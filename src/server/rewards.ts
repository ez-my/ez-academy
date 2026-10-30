import {FieldValue,Timestamp,type Firestore} from 'firebase-admin/firestore';
import {PACKAGES,PACKAGE_VERSION} from '../packages';
import {currentPurchase} from '../data/subscriptionAccess';

export type RewardType='plan'|'ai_credits'|'practices';
export function normalizeRewardCode(value:unknown){
 const code=typeof value==='string'?value.trim().toUpperCase():'';
 if(!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code))throw Object.assign(Error('Enter a valid reward code (4–32 letters, numbers, _ or -).'),{status:400});
 return code;
}
export function validateReward(input:any){
 const code=normalizeRewardCode(input?.code),type=input?.type as RewardType;
 if(!['plan','ai_credits','practices'].includes(type))throw Object.assign(Error('Choose a reward type.'),{status:400});
 const planId=type==='plan'?String(input.planId||''):'';
 if(type==='plan'&&!['lite','plus','max'].includes(planId))throw Object.assign(Error('Choose EZ Lite, Plus or Max.'),{status:400});
 const amount=type==='plan'?0:Number(input.amount);
 if(type!=='plan'&&(!Number.isInteger(amount)||amount<1||amount>1000))throw Object.assign(Error('Amount must be 1–1000.'),{status:400});
 const durationDays=type==='plan'?Number(input.durationDays):0;
 if(type==='plan'&&(!Number.isInteger(durationDays)||durationDays<1||durationDays>365))throw Object.assign(Error('Duration must be 1–365 days.'),{status:400});
 const maxRedemptions=Number(input.maxRedemptions);
 if(!Number.isInteger(maxRedemptions)||maxRedemptions<1||maxRedemptions>100000)throw Object.assign(Error('Maximum redemptions must be 1–100000.'),{status:400});
 const expiry=input.expiry?Date.parse(String(input.expiry)):null;
 if(input.expiry&&(!Number.isFinite(expiry)||expiry!<=Date.now()))throw Object.assign(Error('Choose a future expiry date.'),{status:400});
 const reason=String(input.reason||'').trim();
 if(reason.length>300)throw Object.assign(Error('Reason must be 300 characters or less.'),{status:400});
 return {code,type,planId,amount,durationDays,maxRedemptions,expiresAt:expiry,active:input.active!==false,reason};
}
export async function createReward(db:Firestore,input:any,adminUid:string){
 const reward=validateReward(input),ref=db.doc(`reward_codes/${reward.code}`);
 await ref.create({...reward,used:0,createdBy:adminUid,createdAt:Date.now()});
 return reward;
}
export async function deactivateReward(db:Firestore,codeValue:unknown,adminUid:string){
 const code=normalizeRewardCode(codeValue),ref=db.doc(`reward_codes/${code}`);
 await db.runTransaction(async t=>{const snap=await t.get(ref);if(!snap.exists)throw Object.assign(Error('Code not found.'),{status:404});t.update(ref,{active:false,deactivatedBy:adminUid,deactivatedAt:Date.now()});});
 return {success:true};
}
export async function redeemReward(db:Firestore,uid:string,codeValue:unknown,now=Date.now()){
 const code=normalizeRewardCode(codeValue),codeRef=db.doc(`reward_codes/${code}`),redemptionRef=db.doc(`reward_redemptions/${code}/users/${uid}`),historyRef=db.doc(`reward_user_history/${uid}/items/${code}`),userRef=db.doc(`users/${uid}`),ledgerRef=db.doc(`package_entitlements/${uid}`);
 return db.runTransaction(async t=>{
  const [codeDoc,redemption,userDoc,ledgerDoc]=await Promise.all([t.get(codeRef),t.get(redemptionRef),t.get(userRef),t.get(ledgerRef)]);
  const reward=codeDoc.data() as any;
  if(!codeDoc.exists)throw Object.assign(Error('This reward code is invalid.'),{status:404});
  if(redemption.exists)throw Object.assign(Error('You have already redeemed this code.'),{status:409});
  if(!reward.active)throw Object.assign(Error('This reward code is inactive.'),{status:409});
  if(reward.expiresAt&&reward.expiresAt<=now)throw Object.assign(Error('This reward code has expired.'),{status:410});
  if(Number(reward.used||0)>=reward.maxRedemptions)throw Object.assign(Error('This reward code has reached its limit.'),{status:409});
  if(!userDoc.exists)throw Object.assign(Error('Profile not found.'),{status:404});
  const ledger=ledgerDoc.data()||{},user=userDoc.data()||{};
  let message='';
  if(reward.type==='plan'){
   const pack=PACKAGES[reward.planId as 'lite'|'plus'|'max'];
   if(!pack)throw Error('Invalid reward plan configuration.');
   const current=currentPurchase(ledger,now);
   const rank:any={lite:1,plus:2,max:3};
   const startsAt=current&&rank[current.planId]>=rank[reward.planId]?current.expiresAt:now;
   const expiresAt=startsAt+reward.durationDays*86400000;
   const purchase={id:`reward-${code}-${uid}`,version:PACKAGE_VERSION,planId:reward.planId,type:'subscription',startsAt,expiresAt,included:pack.aiUnits,dailyLimit:pack.dailyLimit,dailyScope:pack.dailyScope,extraFree:pack.extraFree,fullTests:pack.fullTests,source:'reward'};
   t.set(ledgerRef,{...ledger,purchases:[...(ledger.purchases||[]),purchase]});
   if(startsAt===now)t.update(userRef,{plan:reward.planId,planExpiresAt:Timestamp.fromMillis(expiresAt),planUpdatedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
   message=startsAt===now?`${pack.name} is active for ${reward.durationDays} days.`:`${pack.name} will start when your current plan ends.`;
  }else if(reward.type==='ai_credits'){
   t.set(ledgerRef,{...ledger,topupUnits:Number(ledger.topupUnits||0)+reward.amount});
   t.update(userRef,{credits:FieldValue.increment(reward.amount),updatedAt:FieldValue.serverTimestamp()});
   message=`${reward.amount} AI credits added. An active plan or skill pack is needed to use them.`;
  }else{
   t.set(ledgerRef,{...ledger,rewardPracticeCredits:Number(ledger.rewardPracticeCredits||0)+reward.amount});
   message=`${reward.amount} extra practices added.`;
  }
  const receipt={code,uid,type:reward.type,planId:reward.planId||null,amount:reward.amount||null,durationDays:reward.durationDays||null,redeemedAt:now,message};
  t.create(redemptionRef,receipt);
  t.create(historyRef,receipt);
  t.update(codeRef,{used:FieldValue.increment(1)});
  return {success:true,message};
 });
}
