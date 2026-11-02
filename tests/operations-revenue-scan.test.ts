import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import express from 'express';
import {monthlyRevenue,clearRevenueCache,REVENUE_SCAN_LIMIT} from '../src/server/operationsRoutes';
import {registerDashboardRoutes} from '../src/server/dashboardRoutes';

const stamp=(ms:number)=>({toMillis:()=>ms});
// The monitor polls every 30 seconds, so this query is the one that decides whether a
// day of Firestore reads survives an open admin tab.
function txDb(rows:any[]){
 const calls:{limit:number|null}[]=[];
 const db:any={collection(name:string){
  assert.equal(name,'transactions');
  const q:any={limit:null as number|null};
  calls.push(q);
  const builder:any={where:()=>builder,limit:(n:number)=>{q.limit=n;return builder;},
   async get(){const docs=rows.slice(0,q.limit??rows.length).map(data=>({data:()=>data}));return {size:docs.length,docs};}};
  return builder;}};
 return {db,calls};
}

test('monthly revenue is bounded, cached across polls and flags truncation',async()=>{
 const now=Date.UTC(2026,10,20,6,0,0); // 2026-11-20, so the month starts 2026-11-01
 const rows=[
  {status:'SUCCESS',amountInCents:4900,reconciledAt:stamp(Date.UTC(2026,10,3))},  // this month
  {status:'SUCCESS',amountInCents:1000,paidAt:stamp(Date.UTC(2026,10,18))},       // this month
  {status:'SUCCESS',amountInCents:9900,reconciledAt:stamp(Date.UTC(2026,9,28))},  // last month
 ];
 clearRevenueCache();
 const {db,calls}=txDb(rows);
 const first=await monthlyRevenue(db,now);
 assert.equal(calls.length,1,'one query');
 assert.equal(calls[0].limit,REVENUE_SCAN_LIMIT,'the scan is bounded, never the whole collection');
 assert.equal(first.revenueRM,59,'only this month counts, at the unchanged predicate');
 assert.equal(first.incomplete,false);

 // A left-open tab polling every 30s must not re-read the collection each time.
 const second=await monthlyRevenue(db,now+29_000);
 assert.equal(calls.length,1,'still one query inside the TTL');
 assert.deepEqual(second,first);
 await monthlyRevenue(db,now+601_000);
 assert.equal(calls.length,2,'re-reads once the TTL passes');

 clearRevenueCache();
 const many=Array.from({length:REVENUE_SCAN_LIMIT},()=>({status:'SUCCESS',amountInCents:100,reconciledAt:stamp(Date.UTC(2026,10,3))}));
 const truncated=await monthlyRevenue(txDb(many).db,now);
 assert.equal(truncated.incomplete,true,'a truncated scan is reported, not shown as the real total');
 clearRevenueCache();
});

test('the operations status route never scans every transaction', ()=>{
 const code=readFileSync('src/server/operationsRoutes.ts','utf8');
 assert.ok(!/\.where\('status','==','SUCCESS'\)\.get\(\)/.test(code),'unbounded SUCCESS scan is back');
 assert.ok(/\.where\('status','==','SUCCESS'\)\.limit\(REVENUE_SCAN_LIMIT\)/.test(code),'the scan keeps its limit');
 const panel=readFileSync('src/pages/OperationsPanel.tsx','utf8');
 assert.ok(panel.includes('revenueIncomplete'),'the panel tells the owner when the total is partial');
});

test('a dashboard 503 records the Firestore cause instead of discarding it',async()=>{
 const logged:string[]=[];
 const original=console.error;
 console.error=(...args:any[])=>{logged.push(args.join(' '));};
 const failure=Object.assign(new Error('Missing or insufficient permissions.'),{code:7});
 const db:any={doc:()=>({get:async()=>{throw failure;}}),collection:()=>({where:()=>({count:()=>({get:async()=>{throw failure;}}),limit:()=>({get:async()=>{throw failure;}})})})};
 const app=express();app.use(express.json());
 registerDashboardRoutes(app,db,{verify:async()=>({uid:'u'}),now:()=>Date.parse('2026-11-02T12:00:00+08:00')});
 const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${(server.address() as any).port}/api/dashboard/`;
 try{
  for(const path of ['today','vocabulary']){
   const res=await fetch(base+path,{headers:{Authorization:'Bearer test'}});
   assert.equal(res.status,503,`${path} still answers 503`);
   assert.equal((await res.json() as any).error.includes('Could not'),true,'the learner message is unchanged');
  }
  assert.equal(logged.length,2,'both failures are logged');
  assert.ok(logged.every(line=>line.includes('[dashboard]')&&line.includes('code=7')),'the log carries the Firestore code');
  assert.ok(logged.every(line=>!line.includes('Bearer')&&!line.includes('uid')),'no token or account id is logged');
 }finally{console.error=original;server.close();}
});
