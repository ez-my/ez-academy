import {test} from 'node:test';import assert from 'node:assert/strict';import express from 'express';
import {registerDashboardRoutes} from '../src/server/dashboardRoutes';
test('vocabulary saves and reloads per user; midnight changes only the daily word',async()=>{
 const store=new Map<string,any>([['users/u',{plan:'free'}],['dashboard_vocabulary/u/words/opportunity',{saved:true,sentence:'A useful opportunity.'}],['dashboard_vocabulary/other/words/profound',{saved:true,sentence:'Private to another user.'}]]);
 const snapshot=(path:string)=>({id:path.split('/').pop(),exists:store.has(path),data:()=>store.get(path)});
 const q=(path:string,filter?:[string,any],limit=200):any=>{const docs=()=>[...store.keys()].filter(k=>k.startsWith(path+'/')&&!k.slice(path.length+1).includes('/')).map(snapshot).filter(d=>!filter||d.data()?.[filter[0]]===filter[1]).slice(0,limit);return{where:(f:string,_o:string,v:any)=>q(path,[f,v],limit),limit:(n:number)=>q(path,filter,n),get:async()=>({docs:docs()}),count:()=>({get:async()=>({data:()=>({count:docs().length})})})}};
 const db:any={doc:(path:string)=>({get:async()=>snapshot(path),set:async(data:any)=>{store.set(path,data)}}),collection:(path:string)=>q(path)};
 let now=Date.parse('2026-10-17T23:59:00+08:00');const app=express();app.use(express.json());registerDashboardRoutes(app,db,{verify:async req=>req.headers.authorization?{uid:'u'}:null,now:()=>now});
 const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as any).port}/api/dashboard/`;
 const get=(path:string)=>fetch(base+path,{headers:{Authorization:'Bearer test'}}).then(r=>r.json()) as Promise<any>;
 const save=(body:any)=>fetch(base+'vocabulary',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(base+'today')).status,401);
  const first=await get('today');assert.equal(first.day,'2026-10-17');assert.equal(first.word.id,'profound');assert.equal(first.savedWordCount,1);
  assert.equal((await save({wordId:'profound',saved:true,sentence:'A profound change helped our town.'})).status,200);
  const reloaded=await get('today');assert.equal(reloaded.vocabulary.saved,true);assert.equal(reloaded.savedWordCount,2);assert.equal(reloaded.vocabulary.sentence,'A profound change helped our town.');
  const list=await get('vocabulary');assert.equal(list.words.length,2);assert.ok(list.words.some((w:any)=>w.id==='opportunity'));assert.ok(!list.words.some((w:any)=>w.sentence==='Private to another user.'));
  now+=120000;const next=await get('today');assert.equal(next.day,'2026-10-18');assert.notEqual(next.word.id,first.word.id);assert.equal(next.savedWordCount,2);assert.deepEqual(next.vocabulary,{});
  assert.equal((await save({wordId:'profound',saved:false,sentence:'A profound change helped our town.'})).status,200);assert.equal((await get('vocabulary')).words.length,1);
  assert.equal((await save({wordId:'not-a-bank-word',saved:true,sentence:'test'})).status,400);
 }finally{server.close()}
});
