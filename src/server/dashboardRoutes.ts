import type {Express} from 'express';
import type {Firestore} from 'firebase-admin/firestore';
import {authenticateFirebaseUser} from './payments';
import {malaysiaPracticeDay} from './practicePolicy';
import {dashboardAccess} from './dashboardAccess';
import {ALL_VOCABULARY,vocabularyForDay} from '../data/dailyVocabulary';
// A bare catch here hid the reason every dashboard 503 happened. Log the stage, error
// code and a trimmed message only, as the daily report already does: no uid, token or
// learner text, so an operator can read the real Firestore cause out of the logs.
const fail=(res:any,stage:string,error:any,message:string)=>{
 console.error(`[dashboard] ${stage} code=${error?.code||'-'} message=${String(error?.message||error).slice(0,300)}`);
 return res.status(503).json({error:message});
};
export function registerDashboardRoutes(app:Express,db:Firestore,{verify=authenticateFirebaseUser,now=Date.now}:{verify?:(req:any)=>Promise<{uid:string}|null>;now?:()=>number}={}){
 app.get('/api/dashboard/today',async(req,res)=>{res.set('Cache-Control','private, no-store');try{const u=await verify(req);if(!u)return res.sendStatus(401);const day=malaysiaPracticeDay(now());const [p,l,d,v,words]=await Promise.all([db.doc(`users/${u.uid}`).get(),db.doc(`package_entitlements/${u.uid}`).get(),db.doc(`practice_days/${u.uid}_${day}`).get(),db.doc(`dashboard_vocabulary/${u.uid}/words/${vocabularyForDay(day).id}`).get(),db.collection(`dashboard_vocabulary/${u.uid}/words`).where('saved','==',true).count().get()]);res.json({day,savedWordCount:words.data().count,...dashboardAccess(p.data()||{},l.data()||{},d.data()||{}),word:vocabularyForDay(day),vocabulary:v.data()||{}});}catch(error){fail(res,'today',error,'Could not load today’s balance. Try again.');}});
 app.get('/api/dashboard/vocabulary',async(req,res)=>{res.set('Cache-Control','private, no-store');try{const u=await verify(req);if(!u)return res.sendStatus(401);const snapshot=await db.collection(`dashboard_vocabulary/${u.uid}/words`).where('saved','==',true).limit(200).get();res.json({words:snapshot.docs.filter(d=>d.data().saved).map(d=>({...ALL_VOCABULARY.find(w=>w.id===d.id),...d.data()})).filter(w=>w.word)});}catch(error){fail(res,'vocabulary-list',error,'Could not load saved words. Try again.');}});
 app.post('/api/dashboard/vocabulary',async(req,res)=>{try{const u=await verify(req);if(!u)return res.sendStatus(401);const {wordId,saved,sentence}=req.body||{};if(!ALL_VOCABULARY.some(w=>w.id===wordId)||typeof saved!=='boolean'||typeof sentence!=='string'||sentence.length>500)return res.status(400).json({error:'Check your sentence and try again.'});await db.doc(`dashboard_vocabulary/${u.uid}/words/${wordId}`).set({saved,sentence,updatedAt:Date.now()});res.json({saved:true});}catch(error){fail(res,'vocabulary-save',error,'Could not save this word. Your sentence is still here.');}});
}
