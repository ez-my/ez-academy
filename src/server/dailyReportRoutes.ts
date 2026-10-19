import type {Express} from 'express';
import {Timestamp,type Firestore} from 'firebase-admin/firestore';
import {authenticateFirebaseUser,isAuthorizedAdmin} from './payments';
import {buildDailyReport,reportTasks,dayKey,dayStart,MY_DAY,millis} from './dailyReport';
export function registerDailyReportRoutes(app:Express,db:Firestore){
 app.post('/api/usage/visit',async(req,res)=>{try{const user=await authenticateFirebaseUser(req);if(!user)return res.sendStatus(401);const day=dayKey(Date.now());await db.doc(`usage_visits/${user.uid}_${day}`).set({userId:user.uid,day,at:Date.now()});res.json({saved:true});}catch{res.status(503).json({error:'Could not record visit.'});}});
 app.get('/api/admin/daily-report',async(req,res)=>{res.set('Cache-Control','private, no-store');try{
 const user=await authenticateFirebaseUser(req);if(!user)return res.sendStatus(401);if(!isAuthorizedAdmin(user))return res.sendStatus(403);
 const day=String(req.query.day||dayKey(Date.now()));let at:number;try{at=dayStart(day);}catch{return res.status(400).json({error:'Choose a valid date.'});}if(day>dayKey(Date.now())||at<Date.now()-91*MY_DAY)return res.status(400).json({error:'Choose a date within the last 90 days.'});
 const start=at-13*MY_DAY,end=at+MY_DAY,warnings:string[]=[];
 async function bounded(group:string,field:string){try{const [a,b]=await Promise.all([db.collectionGroup(group).where(field,'>=',Timestamp.fromMillis(start)).where(field,'<',Timestamp.fromMillis(end)).limit(10001).get(),db.collectionGroup(group).where(field,'>=',start).where(field,'<',end).limit(10001).get()]);const map=new Map([...a.docs,...b.docs].map(d=>[d.ref.path,d]));if(a.size>10000||b.size>10000)warnings.push('High activity: this report may be incomplete.');return [...map.values()];}catch{const fallback=await db.collectionGroup(group).limit(10001).get();if(fallback.size>10000)warnings.push('Some older records could not be loaded. This report may be incomplete.');return fallback.docs.filter(d=>{const n=millis(d.data()[field]);return n>=start&&n<end;});}}
 const [u,s,e,v,m]=await Promise.all([db.collection('users').limit(5001).get(),bounded('sessions','timestamp'),db.collection('usage_tasks').where('at','>=',start).where('at','<',end).limit(10001).get(),db.collection('usage_visits').where('day','>=',dayKey(start)).where('day','<=',day).limit(10001).get(),bounded('completed','completedAt')]);
 if(u.size>5000||e.size>10000||v.size>10000)warnings.push('Large result: some records may be missing.');
 const users=u.docs.map(d=>({id:d.id,...d.data()})),sessions=s.filter(d=>d.ref.path.startsWith('users/')).map(d=>({id:d.id,...d.data()}));
 const events=e.docs.map(d=>d.data());for(const d of m){if(!d.ref.path.startsWith('muet_progress/'))continue;const r=d.data(),uid=d.ref.path.split('/')[1];events.push({id:`${uid}:muet:${r.topicId}:${r.mode}`,userId:uid,skill:'Speaking',at:r.completedAt,score:null});}
 const report=buildDailyReport(day,users,reportTasks(sessions,events),v.docs.map(d=>d.data()),req.query.includeAdmin==='true');
 res.json({...report,warnings,notes:'Active users = signed-in visits or saved work. Tasks = checked reading/listening parts or completed speaking/writing practices. Older records may only show their latest saved date. Unsaved work and guest samples are not included.'});
 }catch{res.status(503).json({error:'Could not load the daily report. Please try again.'});}});
}
