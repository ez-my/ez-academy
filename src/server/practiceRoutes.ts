import {dashboardAccess} from './dashboardAccess';
import {nextPracticeDay} from '../data/practiceLimits';
import type express from 'express';
import {getAuth} from 'firebase-admin/auth';
import {Timestamp,type Firestore} from 'firebase-admin/firestore';
import {buildReadingSession} from '../data/readingScoring';
import {buildListeningSession} from '../data/listeningScoring';
import {consumePracticeDay,PRACTICE_SKILLS,assertPracticeAllowed,assertSkillPractice,hasPaidPractice,malaysiaPracticeDay} from './practicePolicy';
export function registerPracticeRoutes(app:express.Express,db:Firestore,verifyOverride?: (token:string)=>Promise<{uid:string}>){
 const verify=async(req:any)=>{const token=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];if(!token)throw Object.assign(Error('Please sign in again.'),{status:401});try{return verifyOverride?await verifyOverride(token):await getAuth().verifyIdToken(token);}catch{throw Object.assign(Error('Please sign in again.'),{status:401});}};
 const fail=(res:any,e:any)=>res.status(e.status||503).json({error:e.status?e.message:'Could not save practice. Check your connection and try again.'});
 const history=async(uid:string)=>{
  const [snaps,locks]=await Promise.all([db.collection(`users/${uid}/sessions`).get(),db.collection(`practice_progress/${uid}/tests`).get()]); const progress:Record<string,number[]>={};
  for(const doc of locks.docs){const s=doc.data();progress[`${s.skill}:${s.testId}`]=s.parts||[];}
  for(const doc of snaps.docs){const s=doc.data();const skill=s.type==='ReadEZ'?'read':s.type==='ListenEZ'?'listen':null;if(!skill||!s.testSetId)continue;const parts=Object.values(s.readingResult?.parts||s.listeningResult?.parts||{}).map((p:any)=>p.part).filter(Number.isInteger);const key=`${skill}:${s.testSetId}`;progress[key]=[...new Set([...(progress[key]||[]),...parts])];}return progress;
 };
 app.get('/api/practice/status',async(req,res)=>{res.set('Cache-Control','private, no-store');try{const u=await verify(req),day=malaysiaPracticeDay();const [daily,progress,p,l]=await Promise.all([db.doc(`practice_days/${u.uid}_${day}`).get(),history(u.uid),db.doc(`users/${u.uid}`).get(),db.doc(`package_entitlements/${u.uid}`).get()]);res.json({day,used:daily.data()?.used||0,progress,...dashboardAccess(p.data()||{},l.data()||{},daily.data()||{}),paidSkills:Object.fromEntries(PRACTICE_SKILLS.map(skill=>[skill,hasPaidPractice(p.data()||{},l.data()||{},skill)]))});}catch(e){fail(res,e);}});
 app.post('/api/practice/start',async(req,res)=>{try{
  const u=await verify(req),{skill,requestId,mock}=req.body||{};
  if(!PRACTICE_SKILLS.includes(skill)||typeof requestId!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(requestId)||typeof mock!=='boolean')throw Object.assign(Error('Invalid practice.'),{status:400});
  const day=malaysiaPracticeDay(),daily=db.doc(`practice_days/${u.uid}_${day}`),receipt=db.doc(`practice_starts/${u.uid}_${requestId}`);
  const result=await db.runTransaction(async t=>{const [p,l,d,r]=await Promise.all([t.get(db.doc(`users/${u.uid}`)),t.get(db.doc(`package_entitlements/${u.uid}`)),t.get(daily),t.get(receipt)]);const used=Number(d.data()?.used||0);if(r.exists){if(r.data()?.skill!==skill||Boolean(r.data()?.mock)!==mock||r.data()?.day!==day)throw Object.assign(Error('Use a new practice request for this task.'),{status:409});return {day,used};}const paid=hasPaidPractice(p.data()||{},l.data()||{},skill);assertSkillPractice(p.data()||{},l.data()||{},d.data()||{},skill,mock);const updated=consumePracticeDay(p.data()||{},l.data()||{},d.data()||{},day,skill,mock);const next=updated.used;t.set(daily,updated);t.set(receipt,{skill,mock,day,createdAt:Date.now()});return {day,used:next};});res.json(result);
 }catch(e){fail(res,e);}});
 for(const [kind,skill,build] of [['reading','read',buildReadingSession],['listening','listen',buildListeningSession]] as const){
  app.post(`/api/${kind}/check`,async(req,res)=>{try{
   const u=await verify(req),{testId,part,answers}=req.body||{};
   if(typeof testId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(testId)||!Number.isInteger(part)||part<1||part>(skill==='read'?5:4)||!answers||typeof answers!=='object'||Array.isArray(answers)||Object.entries(answers).some(([n,v])=>!/^([1-9]|[1-3][0-9]|40)$/.test(n)||typeof v!=='string'||v.length>100))throw Object.assign(Error('Check your answers and try again.'),{status:400});
   const previousParts=(await history(u.uid))[`${skill}:${testId}`]||[];
   const day=malaysiaPracticeDay(),daily=db.doc(`practice_days/${u.uid}_${day}`),ref=db.doc(`users/${u.uid}/sessions/${skill}_trial_bank_${testId}`),lock=db.doc(`practice_progress/${u.uid}/tests/${skill}_${testId}`);
   const saved=await db.runTransaction(async t=>{const [p,l,d,s,locked]=await Promise.all([t.get(db.doc(`users/${u.uid}`)),t.get(db.doc(`package_entitlements/${u.uid}`)),t.get(daily),t.get(ref),t.get(lock)]);const old=s.data() as any,oldResult=old?.readingResult||old?.listeningResult;
    if(previousParts.includes(part)||locked.data()?.parts?.includes(part)||oldResult?.parts?.[part])throw Object.assign(Error('This part is completed and locked. Choose another part.'),{status:409});
    const paid=hasPaidPractice(p.data()||{},l.data()||{},skill);assertSkillPractice(p.data()||{},l.data()||{},d.data()||{},skill);
    let session:any;try{session=build(u.uid,`bank_${testId}`,testId,part,answers,old);}catch(e:any){throw Object.assign(e,{status:400});}
    // Keep previously checked parts even when callers omit their old answers.
    if(old){const merged={...answers,...old.answers};session=build(u.uid,`bank_${testId}`,testId,part,merged,old);}
    const partResult=(session.readingResult||session.listeningResult).parts[part];const eventId=`${u.uid}:${session.type}:${testId}:${part}`;t.set(db.doc(`usage_tasks/${eventId}`),{id:eventId,userId:u.uid,skill:skill==='read'?'Reading':'Listening',at:Date.now(),score:Math.round(partResult.correct/partResult.total*100)});t.set(ref,{...session,timestamp:Timestamp.fromMillis(session.timestamp)});t.set(lock,{skill,testId,parts:[...new Set([...previousParts,...(locked.data()?.parts||[]),part])]});t.set(daily,consumePracticeDay(p.data()||{},l.data()||{},d.data()||{},day,skill));return session;
   });res.json({saved:true,result:saved.readingResult||saved.listeningResult});
  }catch(e){fail(res,e);}});
 }
}
