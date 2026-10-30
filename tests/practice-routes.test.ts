import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {registerPracticeRoutes} from '../src/server/practiceRoutes';
import {TRIAL_READING_KEYS} from '../src/data/trialReadingKeys';

test('shared budget, durable lock, idempotency and cross-skill use are enforced',async()=>{
 const store=new Map<string,any>([['users/u',{plan:'free'}]]);
 const snapshot=(path:string)=>({exists:store.has(path),data:()=>store.get(path)});
 let queue=Promise.resolve();
 const db:any={doc:(path:string)=>({path,get:async()=>snapshot(path)}),collection:(path:string)=>({get:async()=>({docs:[...store.entries()].filter(([k])=>k.startsWith(path+'/')).map(([,data])=>({data:()=>data}))})}),runTransaction:(fn:any)=>{const result=queue.then(()=>fn({get:async(ref:any)=>snapshot(ref.path),set:(ref:any,value:any)=>store.set(ref.path,value)}));queue=result.catch(()=>{});return result;}};
 // Exercise the production authorization default for this inventoried set.
 const app=express();app.use(express.json());registerPracticeRoutes(app,db,async()=>({uid:'u'}));const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));const port=(server.address() as any).port;
 const post=async(path:string,data:any)=>{const res=await fetch(`http://127.0.0.1:${port}/api/${path}`,{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(data)});return {status:res.status,body:await res.json() as any};};
 try{
  assert.equal((await post('practice/start',{skill:'speak',mock:true,requestId:'mock'})).status,403);
  const id='kuala-lumpur-2026';const answers=Object.fromEntries(Object.entries(TRIAL_READING_KEYS[id].answers).map(([n,a])=>[n,a[0]]));
  const checked=await post('reading/check',{testId:id,part:1,answers});assert.equal(checked.status,200);assert.equal(checked.body.result.parts[1].correct,8);
  assert.equal((await post('reading/check',{testId:id,part:1,answers})).status,409);
  const second=await post('practice/start',{skill:'write',mock:false,requestId:'writing'});assert.equal(second.status,200);assert.equal(second.body.used,2);
  assert.equal((await post('practice/start',{skill:'write',mock:false,requestId:'writing'})).status,200,'retry does not consume again');
  assert.equal((await post('practice/start',{skill:'speak',mock:false,requestId:'third'})).status,429);
  assert.equal((await post('reading/check',{testId:id,part:2,answers})).status,429);
  store.set('users/u',{plan:'pro'});
  const next=await post('reading/check',{testId:id,part:2,answers:{...answers,'1':'C'}});assert.equal(next.status,200);assert.equal(next.body.result.parts[1].correct,8,'old answers cannot be changed');
  assert.equal((await post('reading/check',{testId:id,part:1,answers})).status,409,'upgrade never unlocks completed parts');
  const state=await fetch(`http://127.0.0.1:${port}/api/practice/status`,{headers:{Authorization:'Bearer test'}}).then(r=>r.json()) as any;
  assert.deepEqual(state.progress[`read:${id}`],[1,2]);
  for(const part of [3,4,5])assert.equal((await post('reading/check',{testId:id,part,answers})).status,200);
  assert.equal(store.get(`users/u/sessions/read_trial_bank_${id}`).readingResult.total,40);
  assert.equal((await post('reading/check',{testId:id,part:5,answers})).status,409);
  store.delete(`users/u/sessions/read_trial_bank_${id}`);
  assert.equal((await post('reading/check',{testId:id,part:1,answers})).status,409,'private completion ledger survives history tampering');
 }finally{server.close();}
});

import {PACKAGES} from '../src/legacyPackagesV3';
test('v3 paid daily limits and Lite full-test lock are enforced atomically on the server',async()=>{
 for(const p of [PACKAGES.lite,PACKAGES.plus,PACKAGES.max,PACKAGES.write]){
 const now=Date.now(),skill=p.type==='skill'?'write':'speak';const store=new Map<string,any>([['users/u',{plan:'free'}],['package_entitlements/u',{purchases:[{version:3,id:'purchase',planId:p.id,type:p.type,...(p.type==='skill'?{skill:'write'}:{}),startsAt:now-1,expiresAt:now+86400000,dailyLimit:p.dailyLimit,fullTests:p.fullTests,included:p.aiUnits}]}]]);
 const snap=(path:string)=>({exists:store.has(path),data:()=>store.get(path)});let queue=Promise.resolve();const db:any={doc:(path:string)=>({path,get:async()=>snap(path)}),collection:()=>({get:async()=>({docs:[]})}),runTransaction:(fn:any)=>{const result=queue.then(()=>fn({get:async(r:any)=>snap(r.path),set:(r:any,v:any)=>store.set(r.path,v)}));queue=result.catch(()=>{});return result;}};
 const app=express();app.use(express.json());registerPracticeRoutes(app,db,async()=>({uid:'u'}));const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as any).port}`;const post=async(id:string,mock=false)=>fetch(base+'/api/practice/start',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify({skill,mock,requestId:id})});
 try{if(!p.fullTests)assert.equal((await post('mock',true)).status,403);const responses=await Promise.all(Array.from({length:p.dailyLimit+4},(_,i)=>post('r'+i)));assert.equal(responses.filter(r=>r.status===200).length,p.dailyLimit);assert.equal(responses.filter(r=>r.status===429).length,4);assert.equal((await post('r0')).status,200,'idempotent retry');}finally{server.close();}
 }
});

test('request IDs cannot be reused across skills or upgraded to a mock',async()=>{
 const store=new Map<string,any>([['users/u',{plan:'free'}]]);const snap=(p:string)=>({exists:store.has(p),data:()=>store.get(p)});const db:any={doc:(path:string)=>({path,get:async()=>snap(path)}),collection:()=>({get:async()=>({docs:[]})}),runTransaction:async(fn:any)=>fn({get:async(r:any)=>snap(r.path),set:(r:any,v:any)=>store.set(r.path,v)})};const app=express();app.use(express.json());registerPracticeRoutes(app,db,async()=>({uid:'u'}));const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));
 const post=(skill:string,mock=false)=>fetch(`http://127.0.0.1:${(server.address() as any).port}/api/practice/start`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer t'},body:JSON.stringify({skill,mock,requestId:'fixed'})});
 try{assert.equal((await post('read')).status,200);assert.equal((await post('read')).status,200);assert.equal((await post('write')).status,409);assert.equal((await post('read',true)).status,409);}finally{server.close()}
});

test('v4 shared bundle plus two Free practices is atomic across skills and idempotent',async()=>{
 const now=Date.now(),store=new Map<string,any>([['users/u',{plan:'free'}],['package_entitlements/u',{purchases:[{version:4,id:'lite-v4',planId:'lite',type:'subscription',startsAt:now-1000,expiresAt:now+7*86400000,dailyLimit:3,dailyScope:'bundle',extraFree:true,fullTests:false,included:20}]}]]);
 const snap=(path:string)=>({exists:store.has(path),data:()=>store.get(path)});let queue=Promise.resolve();
 const db:any={doc:(path:string)=>({path,get:async()=>snap(path)}),collection:()=>({get:async()=>({docs:[]})}),runTransaction:(fn:any)=>{const result=queue.then(()=>fn({get:async(r:any)=>snap(r.path),set:(r:any,v:any)=>store.set(r.path,v)}));queue=result.catch(()=>{});return result;}};
 const app=express();app.use(express.json());registerPracticeRoutes(app,db,async()=>({uid:'u'}));const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));
 const url=`http://127.0.0.1:${(server.address() as any).port}`,post=(i:number,mock=false)=>fetch(url+'/api/practice/start',{method:'POST',headers:{Authorization:'Bearer t','Content-Type':'application/json'},body:JSON.stringify({skill:['speak','write','read','listen'][i%4],mock,requestId:'v4-'+i})});
 try{
  assert.equal((await post(80,true)).status,403);
  const results=await Promise.all(Array.from({length:9},(_,i)=>post(i)));assert.equal(results.filter(r=>r.status===200).length,5);assert.equal(results.filter(r=>r.status===429).length,4);
  const winner=results.findIndex(r=>r.status===200);assert.equal((await post(winner)).status,200);
  const state=await fetch(url+'/api/practice/status',{headers:{Authorization:'Bearer t'}}).then(r=>r.json()) as any;assert.equal(state.used,2);for(const s of ['speak','write','read','listen'])assert.equal(state.skills[s].remaining,0);
  const day=[...store.entries()].find(([k])=>k.startsWith('practice_days/'))![1];assert.equal(day.paidPools['lite-v4'],3);
 }finally{server.close();}
});
