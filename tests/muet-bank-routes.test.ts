import {MUET_REVIEWED_TOPICS} from '../src/data/muetReviewedTopics';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {registerMUETBankRoutes} from '../src/server/muetBankRoutes';
import {MUET_EXTRA_TOPICS} from '../src/data/muetExtraTopics';

test('bank persists seeds, completion survives reload and exhaustion appends without resetting history',async()=>{
 const store=new Map<string,any>([['users/u',{plan:'pro'}]]);
 const snap=(path:string)=>({exists:store.has(path),data:()=>store.get(path)});
 const doc=(path:string)=>({path,get:async()=>snap(path)});
 let queue=Promise.resolve(),generated=0,invalidGeneration=false;
 const db:any={doc,collection:(path:string)=>({get:async()=>({docs:[...store.entries()].filter(([k])=>k.startsWith(path+'/')).map(([k,value])=>({id:k.split('/').pop(),data:()=>value}))})}),batch:()=>{const writes:any[]=[];return {set:(ref:any,v:any)=>writes.push([ref.path,v]),commit:async()=>{for(const [k,v] of writes)store.set(k,v);}};},runTransaction:(fn:any)=>{const r=queue.then(async()=>{const writes:any[]=[];const result=await fn({get:async(ref:any)=>snap(ref.path),set:(ref:any,v:any)=>writes.push([ref.path,v])});for(const [k,v] of writes)store.set(k,v);return result;});queue=r.catch(()=>{});return r;}};
 const app=express();app.use(express.json());registerMUETBankRoutes(app,db,{verify:async token=>{if(!token)throw Error();return {uid:'u'};},generate:async()=>{generated++;if(invalidGeneration)return {topics:[{title:'Invalid question'}]};return {topics:MUET_EXTRA_TOPICS.slice(0,6).map((t,i)=>({...structuredClone(t),title:`Fresh set ${i}`,part2:{...t.part2,centralQuestion:`Which approach would improve opportunity in new community ${i}?`},part1:{...t.part1,tasks:{A:`Talk about offering study support in district ${i}.`,B:`Talk about improving local health advice in district ${i}.`,C:`Talk about creating youth opportunities in district ${i}.`,D:`Talk about sharing community information in district ${i}.`},situation:`A new question context for independent young adults. You will speak to your classmates about ${t.title.toLowerCase()}.`}}))};}});
 const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as any).port}/api/muet/`;
 const get=async(mode:string)=>fetch(base+'bank?mode='+mode,{headers:{Authorization:'Bearer test'}}).then(async r=>({status:r.status,data:await r.json() as any}));
 const post=async(path:string,data:any)=>fetch(base+path,{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(data)}).then(async r=>({status:r.status,data:await r.json() as any}));
 try{
  assert.equal((await fetch(base+'bank')).status,401);
  const first=await get('Part1');assert.equal(first.status,200);assert.equal(first.data.topics.length,45);
  const id=first.data.topics[0].id;
  assert.equal((await post('complete',{topicId:id,mode:'Part1',transcript:'',durationSeconds:1})).status,400);
  assert.equal((await post('start',{topicId:id,mode:'Part1',requestId:'one'})).status,200);
  const body={topicId:id,mode:'Part1',transcript:'Students should plan their weekly schedule carefully.',durationSeconds:90};
  assert.equal((await post('complete',body)).status,200);assert.equal((await post('complete',body)).status,200,'completion retry is idempotent');
  assert.equal((await post('start',{topicId:id,mode:'Part1',requestId:'two'})).status,409);
  assert.equal((await get('Part1')).data.topics.length,44);assert.equal((await get('Part2')).data.topics.length,45);assert.equal((await get('Mock')).data.topics.length,44);
  for(const topic of [...MUET_REVIEWED_TOPICS,...MUET_EXTRA_TOPICS])await post('complete',{...body,topicId:topic.id});
  const replenished=await get('Part1');assert.equal(replenished.status,200);assert.equal(replenished.data.topics.length,6);assert.equal(replenished.data.total,51);assert.equal(generated,1);
  assert.equal((await get('Part1')).data.topics.length,6);assert.equal(generated,1,'refresh reuses saved new questions, no further AI call');
  assert.equal((await post('start',{topicId:id,mode:'Mock',requestId:'three'})).status,409);
  for(const topic of replenished.data.topics)await post('complete',{...body,topicId:topic.id});
  invalidGeneration=true;assert.equal((await get('Part1')).status,503,'invalid AI output is not published');
  assert.equal([...store.keys()].filter(k=>k.startsWith('muet_speaking_bank/')).length,51,'no partial bank writes');
 }finally{server.close();}
});
