import {PACKAGES as CURRENT_PACKAGES,PACKAGE_VERSION} from '../src/packages';
import {PACKAGES} from '../src/legacyPackagesV3';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import axios from 'axios';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import {applySuccessfulEntitlement, validPaymentHash, queryToyyibPayBill, validateReceipt} from '../src/server/payments';
import {registerPaymentRoutes} from '../src/server/paymentRoutes';

class FakeDb {
  docs=new Map<string,any>(); serial=Promise.resolve();
  ref(path:string):any {const db=this; return {id:path.split('/').at(-1),path,collection:(name:string)=>db.collection(path+'/'+name),
    get:async()=>db.snap(path),set:async(data:any)=>db.docs.set(path,data),update:async(data:any)=>db.update(path,data)};}
  snap(path:string):any{return {id:path.split('/').at(-1),exists:this.docs.has(path),data:()=>this.docs.get(path),ref:this.ref(path)};}
  collection(name:string):any {return {doc:(id='newOrder')=>this.ref(name+'/'+id),where:(key:string,_:string,val:any)=>({limit:()=>({get:async()=>({empty:![...this.docs].some(([p,d])=>p.startsWith(name+'/')&&d[key]===val),docs:[...this.docs].filter(([p,d])=>p.startsWith(name+'/')&&d[key]===val).map(([p])=>this.snap(p))})})}),get:async()=>({docs:[]})};}
  update(path:string,data:any){const old=this.docs.get(path)||{}; for(const [k,v] of Object.entries(data)) {old[k]=(v as any)?.constructor?.name==='NumericIncrementTransform' ? (old[k]||0)+(v as any).operand : v;} this.docs.set(path,old);}
  async runTransaction(fn:any){let resolve!:()=>void;const before=this.serial;this.serial=new Promise<void>(r=>resolve=r);await before;
    let wrote=false;const writes:any[]=[];
    try {const result=await fn({get:async(ref:any)=>{assert.equal(wrote,false,'Firestore reads must happen before writes');return this.snap(ref.path);},
      update:(r:any,d:any)=>{wrote=true;writes.push(()=>this.update(r.path,d));},set:(r:any,d:any)=>{wrote=true;writes.push(()=>this.docs.set(r.path,d));}});
      writes.forEach(w=>w());return result;}finally{resolve();}}
}
function setup(plan='pro',method='toyyibpay_fpx'){const db=new FakeDb();db.docs.set('users/student',{uid:'student',plan:'free',credits:3});
 db.docs.set('transactions/order',{id:'order',userId:'student',planId:plan,amountInCents:plan==='pro'?2000:1000,currency:'MYR',billCode:'bill',paymentMethod:method,status:method==='manual_bank_transfer'?'PENDING_REVIEW':'PENDING'});return db;}
const proof={billCode:'bill',transactionId:'invoice',externalRefNo:'order',paidAmount:20,source:'reconciliation' as const};
test('Verified purchase upgrades selected plan and reads user before writing',async()=>{const db=setup();await applySuccessfulEntitlement(db as any,'order',proof);assert.equal(db.docs.get('users/student').plan,'pro');assert.equal(db.docs.get('transactions/order').status,'SUCCESS');});
test('Concurrent duplicate payments only add credits once',async()=>{const db=setup('credits');await Promise.all([1,2,3].map(()=>applySuccessfulEntitlement(db as any,'order',{...proof,paidAmount:10})));assert.equal(db.docs.get('users/student').credits,53);});
test('Wrong amount, missing amount, wrong bill and reference never upgrade',async()=>{for(const bad of [{paidAmount:19.99},{paidAmount:undefined},{billCode:'another'},{externalRefNo:'other'},{transactionId:undefined}]){const db=setup();await assert.rejects(applySuccessfulEntitlement(db as any,'order',{...proof,...bad}));assert.equal(db.docs.get('users/student').plan,'free');assert.equal(db.docs.get('transactions/order').status,'PENDING');}});
test('Missing user never marks payment successful',async()=>{const db=setup();db.docs.delete('users/student');await assert.rejects(applySuccessfulEntitlement(db as any,'order',proof));assert.equal(db.docs.get('transactions/order').status,'PENDING');});
test('Manual payment requires approval and pending review',async()=>{const db=setup('pro','manual_bank_transfer');await assert.rejects(applySuccessfulEntitlement(db as any,'order',proof));await applySuccessfulEntitlement(db as any,'order',{source:'manual_approval',adminId:'admin'});assert.equal(db.docs.get('users/student').plan,'pro');await assert.rejects(applySuccessfulEntitlement(setup('pro') as any,'order',{source:'manual_approval',adminId:'admin'}));});
test('A late lower-plan payment does not shorten or downgrade active Pro+',async()=>{const db=setup();const expiry=new Date(Date.now()+60*86400000);db.docs.set('users/student',{plan:'pro_plus',planExpiresAt:Timestamp.fromDate(expiry)});await applySuccessfulEntitlement(db as any,'order',proof);const user=db.docs.get('users/student');assert.equal(user.plan,'pro_plus');assert.ok(user.planExpiresAt.toDate()>expiry);});
test('Correct callback hash passes; forged or absent hash fails',()=>{const body:any={status:'1',order_id:'order',refno:'invoice'};body.hash=crypto.createHash('md5').update('secret1orderinvoiceok').digest('hex');assert.ok(validPaymentHash('secret',body));assert.equal(validPaymentHash('secret',{...body,order_id:'other'}),false);assert.equal(validPaymentHash('secret',{}),false);});
test('ToyyibPay lower-case response fields are read correctly',async t=>{t.mock.method(axios,'post',async()=>({data:[{billpaymentStatus:'1',billpaymentAmount:'20.00',billpaymentInvoiceNo:'invoice',billpaymentChannel:'FPX',billExternalReferenceNo:'order'}]}));const result=await queryToyyibPayBill('bill','secret');assert.equal(result.paymentAmount,20);assert.equal(result.paymentInvoiceNo,'invoice');assert.equal(result.externalRefNo,'order');});
test('Receipt validation rejects external links, scripts, PDFs and wrong image types',()=>{assert.equal(validateReceipt('https://other/receipt.png'),null);assert.equal(validateReceipt('data:image/svg+xml;base64,PHN2Zz4='),null);assert.equal(validateReceipt('data:image/png;base64,aGVsbG8='),null);});
async function request(path:string,body:any,token='student',queryResult:any={found:true,isSuccess:true,paymentAmount:20,paymentInvoiceNo:'invoice',externalRefNo:'order'}){
 const db=setup();const app=express();app.use(express.json());process.env.TOYYIBPAY_USER_SECRET_KEY='secret';
 registerPaymentRoutes(app,db as any,{authenticate:async(req:any)=>req.headers.authorization===`Bearer student`?{uid:'student',email:'student@example.com'} as any:req.headers.authorization===`Bearer other`?{uid:'other'} as any:null,queryBill:async()=>queryResult});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));const port=(server.address() as any).port;
 try {const response=await fetch(`http://127.0.0.1:${port}${path}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});return {status:response.status,text:await response.text(),db};}finally{server.close();}}
test('Reconciliation requires auth and order ownership',async()=>{assert.equal((await request('/api/payment/reconcile',{orderId:'order'},'none')).status,401);assert.equal((await request('/api/payment/reconcile',{orderId:'order'},'other')).status,403);});
test('Delayed callback can be recovered by owned server reconciliation',async()=>{const r=await request('/api/payment/reconcile',{orderId:'order'});assert.equal(r.status,200);assert.equal(r.db.docs.get('users/student').plan,'pro');});
test('Supplying another bill cannot pay an unrelated order',async()=>{const r=await request('/api/payment/reconcile',{orderId:'order',billCode:'other'});assert.equal(r.status,400);assert.equal(r.db.docs.get('users/student').plan,'free');});
test('Pending/failed provider result never grants a plan',async()=>{for(const statusId of ['2','3']){const r=await request('/api/payment/reconcile',{orderId:'order'},'student',{found:true,isSuccess:false,statusId});assert.equal(r.db.docs.get('users/student').plan,'free');}});
test('Forged callback never changes user',async()=>{const r=await request('/api/tx/callback',{order_id:'order',status:'1',billcode:'bill'});assert.equal(r.status,403);assert.equal(r.db.docs.get('users/student').plan,'free');});
test('Only authorized owner-admin can approve/reject transfers',async()=>{const r=await request('/api/admin/payments/review',{txId:'order',action:'APPROVE'});assert.equal(r.status,403);});


test('QR request enters owner review without granting credits or upgrading', async () => {
 const r=await request('/api/payment/manual/initiate',{planId:'boost_plus',amount:0});
 assert.equal(r.status,200);
 const order=r.db.docs.get('transactions/newOrder');
 assert.equal(order.status,'PENDING_REVIEW');
 assert.equal(order.receiptDelivery,'whatsapp');
 assert.equal(order.amountInCents,1000);
 assert.equal(order.bankDetails.bankQrImageUrl,'/payments/maybank-qr.png');
 assert.equal(order.bankDetails.whatsappNumber,'601110043567');
 assert.equal(r.db.docs.get('users/student').plan,'free');
});

test('ToyyibPay checkout fixes price on server and saves bill for later verification',async t=>{
 process.env.TOYYIBPAY_CATEGORY_CODE='category';process.env.APP_BASE_URL='https://preview.example';
 t.mock.method(axios,'post',async(url:string,body:string)=>{
  assert.equal(url,'https://toyyibpay.com/index.php/api/createBill');
  const fields=new URLSearchParams(body);
  assert.equal(fields.get('billAmount'),'1000');
  assert.equal(fields.get('billCallbackUrl'),'https://preview.example/api/tx/callback');
  return {data:[{BillCode:'newBill'}]};
 });
 const r=await request('/api/checkout',{planId:'plus',amount:1,userPhone:'0123456789'});
 assert.equal(r.status,200);
 assert.equal(JSON.parse(r.text).redirectUrl,'https://toyyibpay.com/newBill');
 assert.equal(r.db.docs.get('transactions/newOrder').status,'PENDING');
 assert.equal(r.db.docs.get('users/student').plan,'free');
});

test('Gateway HTTP 200 rejection marks order failed without an upgrade',async t=>{
 process.env.TOYYIBPAY_CATEGORY_CODE='category';process.env.APP_BASE_URL='https://preview.example';
 t.mock.method(axios,'post',async()=>({data:{status:'error',msg:'Rejected'}}));
 const r=await request('/api/checkout',{planId:'plus',userPhone:'0123456789'});
 assert.equal(r.status,400);assert.equal(r.db.docs.get('transactions/newOrder').status,'FAILED');
 assert.equal(r.db.docs.get('users/student').plan,'free');
});

test('Malformed checkout phone is rejected before a transaction is created',async()=>{
 const r=await request('/api/checkout',{planId:'plus',userPhone:{unexpected:true}});
 assert.equal(r.status,400);assert.equal(r.db.docs.has('transactions/newOrder'),false);
});

test('Every new package sends its trusted price, version and distinguishable name to ToyyibPay',async t=>{
 process.env.TOYYIBPAY_CATEGORY_CODE='category';process.env.APP_BASE_URL='https://ez-academy.my';
 for(const plan of Object.values(CURRENT_PACKAGES)){
  const mock=t.mock.method(axios,'post',async(_url:string,body:string)=>{
   const fields=new URLSearchParams(body);
   assert.equal(fields.get('billAmount'),String(plan.amountInCents));
   assert.equal(fields.get('billDescription'),plan.description.replace(/[^a-zA-Z0-9_ ]/g,' ').replace(/ +/g,' ').trim().substring(0,100));
   assert.equal(fields.get('billReturnUrl'),'https://ez-academy.my/payment-status');
   if(plan.id==='boost_plus')assert.equal(fields.get('billName'),'EZ Academy EZ Boost Plus');
   return {data:[{BillCode:'newBill'}]};
  });
  const result=await request('/api/checkout',{planId:plan.id,userPhone:'0123456789',amount:1});
  assert.equal(result.status,200);
  const order=result.db.docs.get('transactions/newOrder');
  assert.equal(order.amountInCents,plan.amountInCents);
  assert.equal(order.packageVersion,PACKAGE_VERSION);
  assert.equal(order.planId,plan.id);
  mock.mock.restore();
 }
});

async function adminReview(db:FakeDb,body:any,provider:any,token='owner'){
 const app=express();app.use(express.json());process.env.TOYYIBPAY_USER_SECRET_KEY='test-secret';
 registerPaymentRoutes(app,db as any,{authenticate:async(req:any)=>({uid:'student',email_verified:true,email:req.headers.authorization==='Bearer owner'?'ezacademy.my@gmail.com':'student@example.com'} as any),queryBill:async()=>provider});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 try{const response=await fetch(`http://127.0.0.1:${(server.address() as any).port}/api/admin/payments/review`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});return{status:response.status,data:await response.json() as any};}finally{server.close();}
}
const verifiedLegacy={isSuccess:true,paymentAmount:20,paymentInvoiceNo:'verified-invoice',externalRefNo:'order',paymentChannel:'FPX'};
test('Owner checking an unpaid online bill cannot grant a package',async()=>{
 const db=setup();const r=await adminReview(db,{txId:'order',action:'APPROVE'},{isSuccess:false});assert.equal(r.data.success,false);assert.equal(db.docs.get('users/student').plan,'free');assert.equal(db.docs.get('transactions/order').status,'PENDING');
});
test('Owner online verification upgrades only after matching provider proof and is idempotent',async()=>{
 const db=setup();for(let i=0;i<2;i++){const r=await adminReview(db,{txId:'order',action:'APPROVE'},verifiedLegacy);assert.equal(r.data.success,true);}assert.equal(db.docs.get('users/student').plan,'pro');
});
test('Historical orders missing cents/currency/method recover only at their exact old price',async()=>{
 const db=setup();const order=db.docs.get('transactions/order');delete order.amountInCents;delete order.currency;delete order.paymentMethod;order.amount=20;
 const r=await adminReview(db,{txId:'order',action:'APPROVE'},verifiedLegacy);assert.equal(r.data.success,true);assert.equal(db.docs.get('transactions/order').amountInCents,2000);assert.equal(db.docs.get('transactions/order').currency,'MYR');
});
test('Invalid old price, mismatched proof and wrong currency still cannot grant an entitlement',async()=>{
 for(const change of [{amount:1,amountInCents:undefined,currency:undefined},{currency:'USD'},{amountInCents:2100}]){const db=setup();Object.assign(db.docs.get('transactions/order'),change);const r=await adminReview(db,{txId:'order',action:'APPROVE'},verifiedLegacy);assert.equal(r.data.success,false);assert.equal(db.docs.get('users/student').plan,'free');}
 const db=setup();const r=await adminReview(db,{txId:'order',action:'APPROVE'},{...verifiedLegacy,externalRefNo:'other'});assert.equal(r.data.success,false);
});
test('Archive and restore preserve payment status, amount and user entitlements',async()=>{
 const db=setup();assert.equal((await adminReview(db,{txId:'order',action:'ARCHIVE'},null)).data.success,true);assert.equal(db.docs.get('transactions/order').archived,true);assert.equal(db.docs.get('transactions/order').status,'PENDING');assert.equal(db.docs.get('users/student').plan,'free');
 assert.equal((await adminReview(db,{txId:'order',action:'RESTORE'},null)).data.success,true);assert.equal(db.docs.get('transactions/order').archived,false);assert.equal(db.docs.get('transactions/order').amountInCents,2000);
 assert.equal((await adminReview(db,{txId:'order',action:'ARCHIVE'},null,'student')).status,403);
});
test('Owner manual receipt approval still works without provider checks',async()=>{
 const db=setup('basic','manual_bank_transfer');const r=await adminReview(db,{txId:'order',action:'APPROVE'},null);assert.equal(r.data.success,true);assert.equal(db.docs.get('users/student').plan,'basic');
});
test('Owner verification applies current SpeakEZ package with server price and quota',async()=>{
 const db=setup();Object.assign(db.docs.get('transactions/order'),{planId:'speak',packageVersion:2,amount:19,amountInCents:1900});
 const r=await adminReview(db,{txId:'order',action:'APPROVE'},{...verifiedLegacy,paymentAmount:19});assert.equal(r.data.success,true);assert.equal(db.docs.get('transactions/order').status,'SUCCESS');assert.equal(db.docs.get('package_entitlements/student').focus.speak.included,60);
});

import {skillAccess} from '../src/data/subscriptionAccess';
import {assertSkillPractice} from '../src/server/practicePolicy';
import {aiAllowance,reservePackageCall,packageWindow} from '../src/server/packageBudget';
const DAY=86400000;
test('v3 every subscription grants exact credits, daily limit, expiry and skill scope only after verification',async()=>{
 for(const p of Object.values(PACKAGES).filter(p=>p.type!=='credits')){
  const db=new FakeDb(),now=Date.now();db.docs.set('users/student',{plan:'free',credits:7});db.docs.set('transactions/v3',{userId:'student',packageVersion:3,planId:p.id,amountInCents:p.amountInCents,currency:'MYR',paymentMethod:'toyyibpay_fpx',billCode:'bill3',status:'PENDING'});
  await assert.rejects(applySuccessfulEntitlement(db as any,'v3',{billCode:'bill3',transactionId:'bad',paidAmount:p.price-.01,externalRefNo:'v3',source:'callback'}));assert.equal(db.docs.has('package_entitlements/student'),false);
  const proof={billCode:'bill3',transactionId:`invoice-${p.id}`,paidAmount:p.price,externalRefNo:'v3',source:'callback' as const};await applySuccessfulEntitlement(db as any,'v3',proof);await applySuccessfulEntitlement(db as any,'v3',proof);
  const ledger=db.docs.get('package_entitlements/student'),user=db.docs.get('users/student');assert.equal(ledger.purchases.length,1);const record=ledger.purchases[0];assert.equal(record.included,p.aiUnits);assert.equal(record.expiresAt-record.startsAt,30*DAY);assert.equal(user.credits,7);
  for(const skill of ['speak','write','read','listen']){const access=skillAccess(user,ledger,skill,now+1000);if(p.type==='subscription'||p.id===skill){assert.equal(access.limit,p.dailyLimit);assert.equal(access.fullTests,p.fullTests);assert.equal(access.paid,true);assertSkillPractice(user,ledger,{bySkill:{[skill]:p.dailyLimit-1}},skill,false,now+1000);assert.throws(()=>assertSkillPractice(user,ledger,{bySkill:{[skill]:p.dailyLimit}},skill,false,now+1000),(e:any)=>e.status===429);}else{assert.equal(access.paid,false);assert.equal(access.limit,2);assert.throws(()=>assertSkillPractice(user,ledger,{used:2},skill,false,now+1000),(e:any)=>e.status===429);assert.throws(()=>assertSkillPractice(user,ledger,{},skill,true,now+1000),(e:any)=>e.status===403);}}
  if(p.type==='skill')assert.equal(user.plan,'free');
  assert.equal(skillAccess(user,ledger,'speak',record.expiresAt+1).paid,false);
 }
});
test('v3 both Boosts add exact non-expiring AI and practice credits once without enabling paid access',async()=>{
 for(const p of [PACKAGES.boost,PACKAGES.boost_plus]){const db=new FakeDb();db.docs.set('users/student',{plan:'free',credits:3});db.docs.set('package_entitlements/student',{topupUnits:7});db.docs.set('transactions/top',{userId:'student',packageVersion:3,planId:p.id,amountInCents:p.amountInCents,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});
  const approve={source:'manual_approval' as const,adminId:'owner'};await applySuccessfulEntitlement(db as any,'top',approve);await applySuccessfulEntitlement(db as any,'top',approve);
  const user=db.docs.get('users/student'),ledger=db.docs.get('package_entitlements/student');assert.equal(user.plan,'free');assert.equal(user.credits,3+p.creditsGrant);assert.equal(ledger.topupUnits,7+p.aiUnits);assert.equal(ledger.purchases,undefined);
  for(const s of ['speak','write','read','listen']){assert.equal(skillAccess(user,ledger,s).paid,false);assert.equal(skillAccess(user,ledger,s,Date.now()+400*DAY).fullTests,false);}
 }
});
test('v3 renewal queues a new 30-day credit period and preserves legacy credits and payment history',async()=>{
 const db=new FakeDb(),now=Date.now(),expiry=now+7*DAY;db.docs.set('users/student',{plan:'pro',credits:19,planExpiresAt:Timestamp.fromMillis(expiry)});db.docs.set('package_entitlements/student',{version:2,planId:'pro',anchorMillis:now-10*DAY,expiresAt:expiry,topupUnits:23,focus:{read:{anchorMillis:now,expiresAt:expiry,included:20}}});
 for(const id of ['renew1','renew2']){db.docs.set('transactions/'+id,{userId:'student',packageVersion:3,planId:'plus',amountInCents:1000,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});await applySuccessfulEntitlement(db as any,id,{source:'manual_approval',adminId:'owner'});}
 const ledger=db.docs.get('package_entitlements/student'),user=db.docs.get('users/student');assert.equal(ledger.version,2);assert.equal(ledger.topupUnits,23);assert.equal(ledger.focus.read.included,20);assert.equal(user.credits,19);assert.equal(user.plan,'pro');assert.equal(ledger.purchases[0].startsAt,expiry);assert.equal(ledger.purchases[1].startsAt,expiry+30*DAY);
 assert.equal(skillAccess(user,ledger,'write',now).limit,8);assert.equal(skillAccess(user,ledger,'write',expiry+1).plan,'plus');assert.equal(packageWindow(user,ledger,expiry+1).included,50);assert.notEqual(packageWindow(user,ledger,expiry+1).period,packageWindow(user,ledger,expiry+30*DAY+1).period);assert.equal(skillAccess(user,ledger,'write',expiry+60*DAY+1).paid,false);assert.equal(packageWindow(user,ledger,expiry+60*DAY+1).topup,23);
});

test('ToyyibPay v3 end-to-end mocked createBill, signed callback, reconciliation and duplicate callback',async t=>{
 const db=new FakeDb();db.docs.set('users/student',{plan:'free',credits:0});
 process.env.TOYYIBPAY_USER_SECRET_KEY='v3-test-secret';process.env.TOYYIBPAY_CATEGORY_CODE='category';process.env.APP_BASE_URL='https://ez-academy.my';
 t.mock.method(axios,'post',async(_url:string,body:string)=>{const fields=new URLSearchParams(body);assert.equal(fields.get('billAmount'),'1000');assert.equal(fields.get('billPriceSetting'),'1');return {data:[{BillCode:'v3-bill'}]}});
 const app=express();app.use(express.json());app.use(express.urlencoded({extended:false}));registerPaymentRoutes(app,db as any,{authenticate:async()=>({uid:'student',email:'test@example.com'} as any),queryBill:async()=>({found:true,isSuccess:true,paymentAmount:10,paymentInvoiceNo:'v3-invoice',externalRefNo:'newOrder'})});
 const server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));const url=`http://127.0.0.1:${(server.address() as any).port}`;const post=(path:string,body:any)=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer student'},body:JSON.stringify(body)});
 try{const checkout=await post('/api/checkout',{planId:'plus',amount:0});assert.equal(checkout.status,200);assert.equal((await checkout.json()).redirectUrl,'https://toyyibpay.com/v3-bill');assert.equal(db.docs.get('users/student').plan,'free');
 const callback={status:'1',order_id:'newOrder',refno:'v3-invoice',billcode:'v3-bill',hash:crypto.createHash('md5').update('v3-test-secret1newOrderv3-invoiceok').digest('hex')};assert.equal((await post('/api/tx/callback',callback)).status,200);assert.equal(db.docs.get('users/student').plan,'plus');assert.equal((await post('/api/tx/callback',callback)).status,200);assert.equal(db.docs.get('package_entitlements/student').purchases.length,1);const check=await post('/api/payment/reconcile',{orderId:'newOrder'});assert.equal((await check.json()).success,true);
 }finally{server.close();}
});

test('owner-only manual approval activates every v3 product once; rejection grants nothing',async()=>{
 for(const p of Object.values(PACKAGES)){
  const db=new FakeDb();db.docs.set('users/student',{plan:'free',credits:2});db.docs.set('transactions/order',{userId:'student',planId:p.id,packageVersion:3,amountInCents:p.amountInCents,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});
  const denied=await adminReview(db,{txId:'order',action:'APPROVE',adminNote:'Receipt checked'},null,'student');assert.equal(denied.status,403);
  const approved=await adminReview(db,{txId:'order',action:'APPROVE',adminNote:'Test-only bank verification'},null);assert.equal(approved.status,200);assert.equal(db.docs.get('transactions/order').status,'SUCCESS');await adminReview(db,{txId:'order',action:'APPROVE'},null);
  const ledger=db.docs.get('package_entitlements/student');if(p.type==='credits'){assert.equal(db.docs.get('users/student').credits,2+p.creditsGrant);assert.equal(ledger.topupUnits,p.aiUnits);assert.equal(db.docs.get('users/student').plan,'free');}else{assert.equal(ledger.purchases.length,1);assert.equal(ledger.purchases[0].included,p.aiUnits);assert.equal(db.docs.get('users/student').plan,p.type==='skill'?'free':p.id);}
 }
 const db=new FakeDb();db.docs.set('users/student',{plan:'free',credits:2});db.docs.set('transactions/order',{userId:'student',planId:'max',packageVersion:3,amountInCents:1500,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});assert.equal((await adminReview(db,{txId:'order',action:'REJECT',adminNote:'No funds received'},null)).status,200);assert.equal(db.docs.get('users/student').plan,'free');assert.equal(db.docs.has('package_entitlements/student'),false);
});

import {consumePracticeDay,practiceQuota} from '../src/server/practicePolicy';
import {dashboardAccess} from '../src/server/dashboardAccess';
test('v4 keeps prices and AI unchanged, grants exact 7/14-day periods and adds a separate Free pool',async()=>{
 for(const p of Object.values(CURRENT_PACKAGES).filter(p=>p.type!=='credits')){
  const old=PACKAGES[p.id];assert.equal(p.price,old.price);assert.equal(p.aiUnits,old.aiUnits);
  const db=new FakeDb();db.docs.set('users/student',{plan:'free',credits:9});db.docs.set('transactions/new',{userId:'student',packageVersion:4,planId:p.id,amountInCents:p.amountInCents,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});
  await applySuccessfulEntitlement(db as any,'new',{source:'manual_approval',adminId:'owner'});
  await applySuccessfulEntitlement(db as any,'new',{source:'manual_approval',adminId:'owner'});
  const ledger=db.docs.get('package_entitlements/student'),user=db.docs.get('users/student'),purchase=ledger.purchases[0],now=purchase.startsAt+1;
  assert.equal(ledger.purchases.length,1);assert.equal(purchase.version,4);assert.equal(purchase.expiresAt-purchase.startsAt,p.durationDays*DAY);
  assert.equal(p.durationDays,['plus','max'].includes(p.id)?14:7);
  assert.equal(purchase.dailyLimit,p.dailyLimit);assert.equal(purchase.extraFree,true);assert.equal(purchase.dailyScope,p.type==='subscription'?'bundle':'skill');
  const skill=p.type==='skill'?p.id:'speak';let usage:any={};
  for(let i=0;i<p.dailyLimit+2;i++)usage=consumePracticeDay(user,ledger,usage,'2026-10-18',p.type==='subscription'?['speak','write','read','listen'][i%4]:skill,false,now);
  assert.equal(usage.used,2);assert.equal(usage.paidPools.new,p.dailyLimit);
  assert.throws(()=>consumePracticeDay(user,ledger,usage,'2026-10-18',skill,false,now),(e:any)=>e.status===429);
  assert.equal(dashboardAccess(user,ledger,usage,now).skills[skill].remaining,0);
  assert.equal(skillAccess(user,ledger,skill,purchase.expiresAt).paid,false);
  assert.equal(packageWindow(user,ledger,now).included,p.type==='subscription'?p.aiUnits:0);
  const full=consumePracticeDay(user,ledger,{},'2026-10-18',skill,p.fullTests,now);
  if(p.fullTests){assert.equal(full.used,0,'mock never spends Free practices');assert.equal(full.paidPools.new,1);}
  if(p.type==='skill'){
   const other=skill==='read'?'write':'read';assert.equal(skillAccess(user,ledger,other,now).paid,false);
   assert.throws(()=>consumePracticeDay(user,ledger,usage,'2026-10-18',other,false,now),(e:any)=>e.status===429);
  }
 }
});
test('v4 renewal queues correct durations, preserves old v3 orders, and expiry does not leave a paid plan',async()=>{
 const db=new FakeDb();db.docs.set('users/student',{plan:'free'});
 for(const [id,version] of [['old',3],['new',4],['next',4]] as const){db.docs.set('transactions/'+id,{userId:'student',packageVersion:version,planId:'lite',amountInCents:500,currency:'MYR',paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});await applySuccessfulEntitlement(db as any,id,{source:'manual_approval',adminId:'owner'});}
 const l=db.docs.get('package_entitlements/student'),u=db.docs.get('users/student'),[old,newer,next]=l.purchases;
 assert.equal(old.expiresAt-old.startsAt,30*DAY);assert.equal(old.dailyLimit,5);assert.equal(newer.startsAt,old.expiresAt);assert.equal(newer.expiresAt-newer.startsAt,7*DAY);assert.equal(next.startsAt,newer.expiresAt);
 assert.equal(skillAccess(u,l,'write',newer.startsAt+1).limit,3);assert.equal(skillAccess(u,l,'write',next.expiresAt+1).paid,false);
});
