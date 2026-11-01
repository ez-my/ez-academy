import type {Express} from 'express';
import type {Firestore} from 'firebase-admin/firestore';
import {authenticateFirebaseUser,isAuthorizedAdmin} from './payments';
import {buildDailyReport,reportTasks,dayKey,dayStart,MY_DAY} from './dailyReport';
import {loadActivity} from './reportSource';
import {mirrorFromEnv} from './supabaseMirror';

const NOTES='Active users = signed-in visits or saved work. Tasks = checked reading/listening parts or completed speaking/writing practices. Older records may only show their latest saved date. Unsaved work and guest samples are not included.';

async function loadFromFirestore(db:Firestore,start:number,end:number,day:string){
  const [u,activity]=await Promise.all([db.collection('users').limit(5001).get(),loadActivity(db,start,end,day)]);
  const warnings=[...activity.warnings];
  if(u.size>5000)warnings.push('Large result: some records may be missing.');
  return {users:u.docs.map(d=>({id:d.id,...d.data()})),tasks:reportTasks(activity.sessions,activity.events),visits:activity.visits,warnings};
}

export function registerDailyReportRoutes(app:Express,db:Firestore){
  app.post('/api/usage/visit',async(req,res)=>{
    try{
      const user=await authenticateFirebaseUser(req);
      if(!user)return res.sendStatus(401);
      const at=Date.now(),day=dayKey(at),mirror=mirrorFromEnv();
      // Write to both places. The visit counts as saved if either one accepted it.
      const results=await Promise.allSettled([
        db.doc(`usage_visits/${user.uid}_${day}`).set({userId:user.uid,day,at}),
        mirror?mirror.recordVisit(user.uid,day,at):Promise.reject(new Error('mirror off')),
      ]);
      if(results[0].status==='rejected'&&results[1].status==='rejected')throw results[0].reason;
      res.json({saved:true});
    }catch{res.status(503).json({error:'Could not record visit.'});}
  });

  app.get('/api/admin/daily-report',async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    try{
      const user=await authenticateFirebaseUser(req);
      if(!user)return res.sendStatus(401);
      if(!isAuthorizedAdmin(user))return res.sendStatus(403);
      const day=String(req.query.day||dayKey(Date.now()));
      let at:number;
      try{at=dayStart(day);}catch{return res.status(400).json({error:'Choose a valid date.'});}
      if(day>dayKey(Date.now())||at<Date.now()-91*MY_DAY)return res.status(400).json({error:'Choose a date within the last 90 days.'});
      const start=at-13*MY_DAY,end=at+MY_DAY;

      let data:{users:any[];tasks:any[];visits:any[];warnings:string[]},source='firestore';
      const mirror=mirrorFromEnv();
      if(mirror){
        const warnings:string[]=[];
        try{await mirror.syncRecent(db,Date.now());}
        catch{warnings.push('The newest activity could not be refreshed, so the last few minutes may be missing.');}
        // Do not present an empty mirror as a valid zero-activity report.
        if(await mirror.getState('last_success')===null&&await mirror.getState('backfilled_from')===null)
          return res.status(503).json({error:'The report is waiting for its first data sync.'});
        const copy=await mirror.loadWindow(day,start,end);
        const copiedFrom=await mirror.getState('backfilled_from');
        if(copiedFrom===null||copiedFrom>start)warnings.push('Older history is still being copied, so earlier days may look lower than they were.');
        data={...copy,warnings};source='supabase';
      }else data=await loadFromFirestore(db,start,end,day);

      const report=buildDailyReport(day,data.users,data.tasks,data.visits,req.query.includeAdmin==='true');
      res.json({...report,warnings:data.warnings,source,notes:NOTES});
    }catch(err:any){
      // Never discard the cause again: log the stage, code and message only.
      console.error(`[daily-report] fatal day=${(req.query as any)?.day||''} code=${err?.code||'-'} message=${String(err?.message||err).slice(0,300)}`);
      res.status(503).json({error:'Could not load the daily report. Please try again.'});
    }
  });
}
