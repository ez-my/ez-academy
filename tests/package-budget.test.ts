import {createTaskProvider} from '../src/server/providerContext';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Timestamp} from 'firebase-admin/firestore';
import {aiAllowance,aiCallUnits,packageWindow,reservePackageCall} from '../src/server/packageBudget';
import {PACKAGES} from '../src/legacyPackagesV2';
import {orderPlan,applySuccessfulEntitlement} from '../src/server/payments';
class Database {
 docs=new Map<string,any>();queue=Promise.resolve();
 doc(path:string):any{return {path,id:path.split('/').at(-1),collection:(name:string)=>this.collection(path+'/'+name),get:async()=>this.snap(path)};}
 collection(name:string):any{return {doc:(id:string)=>this.doc(name+'/'+id)};}
 snap(path:string):any{return {exists:this.docs.has(path),data:()=>this.docs.get(path)};}
 async runTransaction(fn:any){let done!:()=>void;const before=this.queue;this.queue=new Promise<void>(r=>done=r);await before;let wrote=false;const writes:(()=>void)[]=[];
  try{const result=await fn({get:async(r:any)=>{assert.equal(wrote,false);return this.snap(r.path)},set:(r:any,d:any,opt:any)=>{wrote=true;writes.push(()=>this.docs.set(r.path,opt?.merge?{...this.docs.get(r.path),...d}:d));},create:(r:any,d:any)=>{wrote=true;writes.push(()=>{assert.equal(this.docs.has(r.path),false);this.docs.set(r.path,d);});},update:(r:any,d:any)=>{wrote=true;writes.push(()=>this.docs.set(r.path,{...this.docs.get(r.path),...d}));}});writes.forEach(w=>w());return result;}finally{done();}}
}
function db(){const d=new Database();d.docs.set('users/student',{plan:'free',createdAt:1});return d;}
test('Free users cannot spend OpenAI credits or create assessed results',async()=>{const d=db();await assert.rejects(reservePackageCall(d as any,'student',2,'speak'),(e:any)=>e.code==='free_template');assert.equal(d.docs.size,1);});
test('Monthly budget is atomic across browsers; failures refund only once',async()=>{const d=db();const now=Date.now();d.docs.set('package_entitlements/student',{version:2,planId:'basic',anchorMillis:now,expiresAt:now+86400000,topupUnits:0});const results=await Promise.allSettled(Array.from({length:26},()=>reservePackageCall(d as any,'student',4,'write')));assert.equal(results.filter(r=>r.status==='fulfilled').length,25);const first=results.find(r=>r.status==='fulfilled') as PromiseFulfilledResult<()=>Promise<void>>;await first.value();await first.value();const usage=[...d.docs].find(([path])=>path.includes('/periods/'));assert.equal(usage?.[1].used,96);});
test('Focused skill allowance cannot be consumed by a different skill',async()=>{const d=db();const now=Date.now();d.docs.set('package_entitlements/student',{focus:{write:{anchorMillis:now,expiresAt:now+86400000,included:60}}});await reservePackageCall(d as any,'student',2,'write');await assert.rejects(reservePackageCall(d as any,'student',2,'speak'),(e:any)=>e.code==='free_template');});
test('Focus and bundle allowances stack; top-ups are spent last',async()=>{const d=db(),now=Date.now();d.docs.set('package_entitlements/student',{version:2,planId:'basic',anchorMillis:now,expiresAt:now+86400000,topupUnits:2,focus:{write:{anchorMillis:now,expiresAt:now+86400000,included:3}}});await reservePackageCall(d as any,'student',104,'write');assert.equal(d.docs.get('package_entitlements/student').topupUnits,1);});
test('Expired bundles cannot retain a paid quota',()=>{const now=Date.now();assert.equal(packageWindow({plan:'pro',planExpiresAt:Timestamp.fromMillis(now-1)},{version:2,planId:'pro',anchorMillis:now-1e9,expiresAt:now-1},now).included,0);});
test('Existing legacy paid users keep their purchased access',()=>{assert.ok(packageWindow({plan:'pro_plus',planExpiresAt:Timestamp.fromMillis(Date.now()+86400000)},{}).legacy);assert.equal(orderPlan({planId:'pro',amountInCents:2000})?.amountInCents,2000);assert.equal(orderPlan({planId:'pro',packageVersion:2})?.amountInCents,4900);assert.equal(orderPlan({planId:'pro',packageVersion:99}),undefined);});
test('A new focus purchase grants only that skill without rewriting an existing user plan',async()=>{const d=db();d.docs.set('transactions/order',{userId:'student',planId:'write',packageVersion:2,amountInCents:1500,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});const r=await applySuccessfulEntitlement(d as any,'order',{source:'manual_approval',adminId:'owner'});assert.equal(r.plan,'write');assert.equal(d.docs.get('users/student').plan,'free');assert.equal(d.docs.get('package_entitlements/student').focus.write.included,60);await applySuccessfulEntitlement(d as any,'order',{source:'manual_approval',adminId:'owner'});assert.equal(d.docs.get('package_entitlements/student').focus.write.included,60);});
test('Conservative reserves bound AI input and price each type independently',()=>{assert.equal(aiCallUnits('text',200000),5);assert.equal(aiCallUnits('speech',4000),20);assert.equal(aiCallUnits('transcribe'),2);assert.throws(()=>aiCallUnits('text',200001));assert.throws(()=>aiCallUnits('speech',4001));for(const p of Object.values(PACKAGES)){assert.ok(p.price-1-p.aiUnits*.05>0);}});

test('A new renewal preserves the unexpired portion of a legacy purchase',async()=>{const d=db();const expiry=Date.now()+10*86400000;d.docs.set('users/student',{plan:'pro',planExpiresAt:Timestamp.fromMillis(expiry)});d.docs.set('transactions/order',{userId:'student',planId:'pro',packageVersion:2,amountInCents:4900,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});await applySuccessfulEntitlement(d as any,'order',{source:'manual_approval',adminId:'owner'});const ledger=d.docs.get('package_entitlements/student');assert.equal(ledger.anchorMillis,expiry);assert.ok(packageWindow(d.docs.get('users/student'),ledger).legacy);assert.equal(packageWindow(d.docs.get('users/student'),ledger,expiry+1).included,250);});
test('A delayed legacy payment retains its original access during the added period',async()=>{const d=db();const expiry=Date.now()+5*86400000;d.docs.set('users/student',{plan:'pro',planExpiresAt:Timestamp.fromMillis(expiry)});d.docs.set('package_entitlements/student',{version:2,planId:'pro',anchorMillis:Date.now(),expiresAt:expiry});d.docs.set('transactions/order',{userId:'student',planId:'pro',amountInCents:2000,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});await applySuccessfulEntitlement(d as any,'order',{source:'manual_approval',adminId:'owner'});assert.ok(packageWindow(d.docs.get('users/student'),d.docs.get('package_entitlements/student'),expiry+1).legacy);});

test('Lower-tier payments extend the active higher package in both profile and server ledger',async()=>{const d=db(),expiry=Date.now()+10*86400000;d.docs.set('users/student',{plan:'pro_plus',planExpiresAt:Timestamp.fromMillis(expiry)});d.docs.set('package_entitlements/student',{version:2,planId:'pro_plus',anchorMillis:Date.now(),expiresAt:expiry});d.docs.set('transactions/order',{userId:'student',planId:'basic',packageVersion:2,amountInCents:2900,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});await applySuccessfulEntitlement(d as any,'order',{source:'manual_approval',adminId:'owner'});assert.equal(d.docs.get('users/student').plan,'pro_plus');assert.equal(d.docs.get('package_entitlements/student').expiresAt,d.docs.get('users/student').planExpiresAt.toMillis());assert.ok(d.docs.get('package_entitlements/student').expiresAt>expiry);});

for (const plan of ['basic','pro','pro_plus'] as const) test(`${plan}: successful provider calls deduct credits and exhaustion prevents further calls`,async()=>{
 const d=db(),now=Date.now(),pack=PACKAGES[plan];let calls=0;
 d.docs.set('package_entitlements/student',{version:2,planId:plan,anchorMillis:now,expiresAt:now+86400000,topupUnits:0});
 const provider=createTaskProvider({OPENAI_API_KEY:'test-only'},()=>({chat:{completions:{create:async()=>{calls++;return {choices:[{finish_reason:'stop',message:{content:'{"feedback":"Practice daily."}'}}]};}}}}),units=>reservePackageCall(d as any,'student',units,'write'));
 const cost=aiCallUnits('text','Rubric'.length+'Answer'.length+250);
 assert.equal((await aiAllowance(d as any,'student')).remaining,pack.aiUnits);
 await provider.feedback('Rubric','Answer');assert.equal((await aiAllowance(d as any,'student')).remaining,pack.aiUnits-cost);
 while ((await aiAllowance(d as any,'student')).remaining>=cost) await provider.feedback('Rubric','Answer');
 const before=calls;await assert.rejects(provider.feedback('Rubric','Answer'),(e:any)=>e.code==='package_quota');assert.equal(calls,before);
});
test('Provider errors restore the visible allowance',async()=>{
 const d=db(),now=Date.now();d.docs.set('package_entitlements/student',{version:2,planId:'basic',anchorMillis:now,expiresAt:now+86400000});
 const provider=createTaskProvider({OPENAI_API_KEY:'test-only'},()=>({chat:{completions:{create:async()=>{throw new Error('Simulated outage');}}}}),units=>reservePackageCall(d as any,'student',units,'write'));
 await assert.rejects(provider.feedback('Rubric','Answer'));assert.equal((await aiAllowance(d as any,'student')).remaining,100);
});
test('Incomplete or invalid AI feedback refunds the reserved credits',async()=>{
 for(const result of [{finish_reason:'length',message:{content:'{}'}},{finish_reason:'stop',message:{content:'bad json'}},{finish_reason:'stop',message:{content:'[]'}}]){
  const d=db(),now=Date.now();d.docs.set('package_entitlements/student',{version:2,planId:'basic',anchorMillis:now,expiresAt:now+86400000});
  const provider=createTaskProvider({OPENAI_API_KEY:'test-only'},()=>({chat:{completions:{create:async()=>({choices:[result]})}}}),units=>reservePackageCall(d as any,'student',units,'write'));
  await assert.rejects(provider.feedback('Rubric','Answer'));assert.equal((await aiAllowance(d as any,'student')).remaining,100);
 }
});
test('Top-ups do not enable AI on a Free skill; active subscription can spend them',async()=>{
 const d=db();let calls=0;const provider=createTaskProvider({OPENAI_API_KEY:'test-only'},()=>({chat:{completions:{create:async()=>{calls++;return {choices:[{finish_reason:'stop',message:{content:'{}'}}]};}}}}),units=>reservePackageCall(d as any,'student',units,'write'));
 await assert.rejects(provider.feedback('Rubric','Answer'),(e:any)=>e.code==='free_template');assert.equal(calls,0);
 d.docs.set('package_entitlements/student',{topupUnits:50});await assert.rejects(provider.feedback('Rubric','Answer'),(e:any)=>e.code==='free_template');assert.equal(calls,0);const now=Date.now();d.docs.set('package_entitlements/student',{version:2,planId:'basic',anchorMillis:now,expiresAt:now+86400000,topupUnits:50});await provider.feedback('Rubric','Answer');assert.equal(calls,1);assert.equal((await aiAllowance(d as any,'student')).remaining,150-aiCallUnits('text',262));
});

test('Speech and transcription deduct independently and unusable audio refunds credits',async()=>{
 const d=db(),now=Date.now();d.docs.set('package_entitlements/student',{version:2,planId:'basic',anchorMillis:now,expiresAt:now+86400000});
 const wav=Buffer.alloc(46);wav.write('RIFF',0);wav.write('WAVE',8);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt16LE(16,34);
 let bad=false;
 const provider=createTaskProvider({OPENAI_API_KEY:'test-only'},()=>({audio:{speech:{create:async()=>new Response(new Uint8Array(bad?[]:[0,1]))},transcriptions:{create:async()=>({text:bad?'':'Practice daily.'})}}}),units=>reservePackageCall(d as any,'student',units,'speak'));
 await provider.generateContent({contents:'Welcome.',config:{responseModalities:['AUDIO']}});assert.equal((await aiAllowance(d as any,'student')).remaining,99);
 await provider.transcribe!(wav.toString('base64'),'audio/wav');assert.equal((await aiAllowance(d as any,'student')).remaining,97);
 bad=true;await assert.rejects(provider.generateContent({contents:'Welcome.',config:{responseModalities:['AUDIO']}}));await assert.rejects(provider.transcribe!(wav.toString('base64'),'audio/wav'));assert.equal((await aiAllowance(d as any,'student')).remaining,97);
});

import {PACKAGES as NEW_PACKAGES} from '../src/legacyPackagesV3';
test('v3 AI allocations, exhaustion and scope are enforced for every new paid package',async()=>{
 for(const pack of Object.values(NEW_PACKAGES).filter(p=>p.type!=='credits')){
  const d=db(),now=Date.now();const skill=pack.type==='skill'?pack.id:'write';
  d.docs.set('package_entitlements/student',{topupUnits:3,purchases:[{id:'new',version:3,planId:pack.id,type:pack.type,...(pack.type==='skill'?{skill:pack.id}:{}),startsAt:now-1,expiresAt:now+30*86400000,included:pack.aiUnits,dailyLimit:pack.dailyLimit,fullTests:pack.fullTests}]});
  const b=await aiAllowance(d as any,'student');assert.equal(pack.type==='skill'?b.focus[skill].remaining:b.included,pack.aiUnits);
  if(pack.type==='skill')await assert.rejects(reservePackageCall(d as any,'student',1,skill==='read'?'write':'read'),(e:any)=>e.code==='free_template');
  const r=await reservePackageCall(d as any,'student',pack.aiUnits+2,skill);await r.complete();assert.equal(d.docs.get('package_entitlements/student').topupUnits,1);await assert.rejects(reservePackageCall(d as any,'student',2,skill),(e:any)=>e.code==='package_quota');
  const before=JSON.stringify(d.docs.get('package_entitlements/student'));await assert.rejects(reservePackageCall(d as any,'student',2,skill));assert.equal(JSON.stringify(d.docs.get('package_entitlements/student')),before);
 }
});
