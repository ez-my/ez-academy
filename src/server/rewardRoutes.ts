import type {Express} from 'express';
import type {Firestore} from 'firebase-admin/firestore';
import {authenticateFirebaseUser,isAuthorizedAdmin} from './payments';
import {createReward,deactivateReward,redeemReward} from './rewards';
import {normalizeRewardCode} from './rewards';

export function registerRewardRoutes(app:Express,db:Firestore,authenticate=authenticateFirebaseUser){
 const route=(admin:boolean,handler:(req:any,user:any)=>Promise<any>)=>async(req:any,res:any)=>{
  res.set('Cache-Control','private, no-store');
  const user=await authenticate(req);
  if(!user)return res.status(401).json({error:'Sign in required.'});
  if(admin&&!isAuthorizedAdmin(user))return res.status(403).json({error:'Admin access required.'});
  try{return res.json(await handler(req,user));}catch(error:any){return res.status(error.status||400).json({error:error.message||'Reward request failed.'});}
 };
 app.get('/api/rewards/history',route(false,async(_req,user)=>{
  const [history,ledger]=await Promise.all([db.collection(`reward_user_history/${user.uid}/items`).orderBy('redeemedAt','desc').limit(50).get(),db.doc(`package_entitlements/${user.uid}`).get()]);
  return {history:history.docs.map(d=>d.data()),practiceCredits:Number(ledger.data()?.rewardPracticeCredits||0)};
 }));
 app.post('/api/rewards/redeem',route(false,async(req,user)=>{
  const result=await redeemReward(db,user.uid,req.body?.code);
  return result;
 }));
 app.get('/api/admin/rewards',route(true,async()=>{
  const codes=await db.collection('reward_codes').orderBy('createdAt','desc').limit(200).get();
  return {codes:codes.docs.map(d=>d.data())};
 }));
 app.get('/api/admin/rewards/:code/redemptions',route(true,async(req)=>{
  const code=normalizeRewardCode(req.params.code);
  const history=await db.collection(`reward_redemptions/${code}/users`).orderBy('redeemedAt','desc').limit(100).get();
  const redemptions=await Promise.all(history.docs.map(async d=>{const receipt=d.data(),user=await db.doc(`users/${receipt.uid}`).get();return {...receipt,name:user.data()?.displayName||'',email:user.data()?.email||''};}));
  return {redemptions};
 }));
 app.post('/api/admin/rewards',route(true,async(req,user)=>createReward(db,req.body,user.uid)));
 app.post('/api/admin/rewards/:code/deactivate',route(true,async(req,user)=>deactivateReward(db,req.params.code,user.uid)));
}
