import express from 'express';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {evaluateAchievements,malaysiaDay} from '../src/achievements';
import {claimShareReward,registerAchievementRoutes} from '../src/server/achievementRoutes';
class Database {
 docs=new Map<string,any>();queue=Promise.resolve();
 doc(path:string):any{return {path,id:path.split('/').at(-1),collection:(name:string)=>this.collection(path+'/'+name),get:async()=>this.snap(path),create:async(value:any)=>{assert.equal(this.docs.has(path),false);this.docs.set(path,value);}};}
 collection(name:string):any{return {doc:(id:string)=>this.doc(name+'/'+id)};}
 snap(path:string):any{return {exists:this.docs.has(path),data:()=>this.docs.get(path)};}
 async runTransaction(fn:any){let done!:()=>void;const before=this.queue;this.queue=new Promise<void>(r=>done=r);await before;let wrote=false;const writes:(()=>void)[]=[];
  try{const result=await fn({get:async(r:any)=>{assert.equal(wrote,false);return this.snap(r.path)},set:(r:any,d:any,opt:any)=>{wrote=true;writes.push(()=>this.docs.set(r.path,opt?.merge?{...this.docs.get(r.path),...d}:d));},create:(r:any,d:any)=>{wrote=true;writes.push(()=>{assert.equal(this.docs.has(r.path),false);this.docs.set(r.path,d);});},update:(r:any,d:any)=>{wrote=true;writes.push(()=>this.docs.set(r.path,{...this.docs.get(r.path),...d}));}});writes.forEach(w=>w());return result;}finally{done();}}
}
function db(){const d=new Database();d.docs.set('users/student',{plan:'free',createdAt:1});return d;}

const now=Date.parse('2026-10-11T10:00:00Z');
function ticket(d:Database,uid='student',time=now){const id=randomUUID();d.docs.set('achievement_share_tickets/'+id,{uid,achievementId:'first_step',day:malaysiaDay(time),expiresAt:time+600000,claimed:false});return id;}
test('Real sessions unlock progress; future, invalid scores and client badge names cannot grant achievements',()=>{
 const s={type:'WriteEZ',timestamp:now-1000,score:95};let r=evaluateAchievements([s],now);assert.ok(r.find(a=>a.id==='first_step')?.unlocked);assert.ok(r.find(a=>a.id==='master_spm')?.unlocked);assert.equal(r.find(a=>a.id==='perfect_score')?.unlocked,false);assert.equal(r.find(a=>a.id==='module_master')?.progress,1);
 r=evaluateAchievements([{...s,timestamp:now+1},{...s,score:900},{...s,type:'fake'}],now);assert.ok(r.every(a=>!a.unlocked));
});
test('Streak and time-based badges use Malaysia days, including midnight boundary',()=>{
 assert.equal(malaysiaDay(Date.parse('2026-10-11T16:00:00Z')),'2026-10-12');
 const sessions=Array.from({length:7},(_,i)=>({type:'ReadEZ',timestamp:now-i*86400000,score:75}));const r=evaluateAchievements(sessions,now);assert.ok(r.find(a=>a.id==='consistency_king')?.unlocked);assert.equal(r.find(a=>a.id==='streak_30')?.progress,7);
});
test('Only one daily sharing reward across concurrent tabs and different achievements; existing credits preserved',async()=>{
 const d=db();d.docs.set('package_entitlements/student',{version:2,planId:'pro',topupUnits:50});const ids=Array.from({length:10},()=>ticket(d));const outcomes=await Promise.all(ids.map(id=>claimShareReward(d as any,'student',id,now)));assert.equal(outcomes.reduce((n,r)=>n+r.awarded,0),2);assert.equal(d.docs.get('package_entitlements/student').topupUnits,52);assert.equal(d.docs.get('package_entitlements/student').planId,'pro');assert.equal((await claimShareReward(d as any,'student',ids[0],now)).awarded,0);
});
test('Another day can earn a new reward; wrong UID and expired tickets cannot grant credits',async()=>{
 const d=db(),id=ticket(d);await assert.rejects(claimShareReward(d as any,'other',id,now));await assert.rejects(claimShareReward(d as any,'student',id,now+600001));await claimShareReward(d as any,'student',id,now);const next=now+86400000;await claimShareReward(d as any,'student',ticket(d,'student',next),next);assert.equal(d.docs.get('package_entitlements/student').topupUnits,4);
});

test('Saved Firestore timestamps count toward achievements',()=>{const result=evaluateAchievements([{type:'SpeakEZ',timestamp:{toMillis:()=>now-1000},score:100}],now);assert.ok(result.find(a=>a.id==='first_step')?.unlocked);assert.ok(result.find(a=>a.id==='perfect_score')?.unlocked);});

test('HTTP sharing requires login and unlocked session evidence; reward amounts cannot be supplied by browser',async()=>{
 const d=db();(d as any).collection=(path:string)=>({get:async()=>({docs:[...d.docs].filter(([p])=>p.startsWith(path+'/')).map(([,value])=>({data:()=>value}))})});
 const app=express();app.use(express.json());registerAchievementRoutes(app,d as any,async token=>{if(token!=='test-student')throw new Error('Bad auth');return {uid:'student'};});
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as any).port}`;
 const headers={Authorization:'Bearer test-student','Content-Type':'application/json'};
 try{
  assert.equal((await fetch(base+'/api/achievements')).status,401);
  let r=await fetch(base+'/api/achievements/share',{method:'POST',headers,body:JSON.stringify({achievementId:'first_step'})});assert.equal(r.status,403);
  d.docs.set('users/student/sessions/saved',{type:'WriteEZ',score:80,timestamp:Date.now()-1000});
  r=await fetch(base+'/api/achievements/share',{method:'POST',headers,body:JSON.stringify({achievementId:'first_step',units:999})});assert.equal(r.status,400);
  r=await fetch(base+'/api/achievements/share',{method:'POST',headers,body:JSON.stringify({achievementId:'first_step'})});assert.equal(r.status,200);const ticket=await r.json();assert.equal(d.docs.has('package_entitlements/student'),false);
  r=await fetch(base+'/api/achievements/share/claim',{method:'POST',headers,body:JSON.stringify({ticketId:ticket.ticketId})});assert.equal((await r.json()).awarded,2);
  r=await fetch(base+'/api/achievements/share/claim',{method:'POST',headers,body:JSON.stringify({ticketId:ticket.ticketId})});assert.equal((await r.json()).awarded,0);
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
