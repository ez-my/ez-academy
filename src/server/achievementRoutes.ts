import {getAuth} from 'firebase-admin/auth';
import {randomUUID} from 'node:crypto';
import type {Express} from 'express';
import type {Firestore} from 'firebase-admin/firestore';
import {evaluateAchievements,malaysiaDay,SHARE_AI_REWARD} from '../achievements';
export async function claimShareReward(db:Firestore,uid:string,ticketId:string,now=Date.now()){
 if(!/^[a-f0-9-]{36}$/i.test(ticketId))throw new Error('Invalid sharing ticket');
 return db.runTransaction(async t=>{
  const ticket=db.doc(`achievement_share_tickets/${ticketId}`),day=db.doc(`achievement_share_rewards/${uid}/days/${malaysiaDay(now)}`),ledger=db.doc(`package_entitlements/${uid}`);
  const [s,d,l]=await Promise.all([t.get(ticket),t.get(day),t.get(ledger)]);const v=s.data();
  if(!v||v.uid!==uid||v.expiresAt<now||v.day!==malaysiaDay(now))throw new Error('Sharing ticket expired or invalid');
  if(d.exists||v.claimed)return {awarded:0,alreadyClaimed:true};
  t.create(day,{uid,achievementId:v.achievementId,ticketId,units:SHARE_AI_REWARD,createdAt:now});
  t.set(ledger,{...(l.data()||{}),topupUnits:Number(l.data()?.topupUnits||0)+SHARE_AI_REWARD});t.update(ticket,{claimed:true});
  return {awarded:SHARE_AI_REWARD,alreadyClaimed:false};
 });
}
export function registerAchievementRoutes(app:Express,db:Firestore,verify:(token:string)=>Promise<{uid:string}>=token=>getAuth().verifyIdToken(token,true)){
 app.use('/api/achievements',async(req,res,next)=>{res.set('Cache-Control','no-store');const token=req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!token)return res.status(401).json({error:'Sign in required'});try{res.locals.uid=(await verify(token)).uid;next();}catch{return res.status(401).json({error:'Sign in required'});}});
 const status=async(uid:string)=>{const sessions=await db.collection(`users/${uid}/sessions`).get();return evaluateAchievements(sessions.docs.map(s=>s.data()));};
 app.get('/api/achievements',async(_req,res)=>{try{const uid=res.locals.uid;const [achievements,reward]=await Promise.all([status(uid),db.doc(`achievement_share_rewards/${uid}/days/${malaysiaDay(Date.now())}`).get()]);res.json({achievements,rewardUnits:SHARE_AI_REWARD,claimedToday:reward.exists});}catch{res.status(503).json({error:'Achievements temporarily unavailable'});}});
 app.post('/api/achievements/share',async(req,res)=>{try{if(Object.keys(req.body||{}).some(k=>k!=='achievementId'))return res.status(400).json({error:'Invalid request'});const a=(await status(res.locals.uid)).find(a=>a.id===req.body.achievementId&&a.unlocked);if(!a)return res.status(403).json({error:'Complete this achievement before sharing'});const id=randomUUID(),now=Date.now();await db.doc(`achievement_share_tickets/${id}`).create({uid:res.locals.uid,achievementId:a.id,day:malaysiaDay(now),expiresAt:now+600000,claimed:false});res.json({ticketId:id});}catch{res.status(503).json({error:'Sharing temporarily unavailable'});}});
 app.post('/api/achievements/share/claim',async(req,res)=>{try{if(Object.keys(req.body||{}).some(k=>k!=='ticketId'))return res.status(400).json({error:'Invalid request'});res.json(await claimShareReward(db,res.locals.uid,req.body?.ticketId));}catch{res.status(400).json({error:'Sharing session expired. Start sharing again.'});}});
}
