import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import axios from 'axios';
import {AffiliateMemoryDb} from './helpers/affiliateMemoryDb';
import {registerPaymentRoutes} from '../src/server/paymentRoutes';
import {registerAffiliateRoutes} from '../src/server/affiliateRoutes';
import {PACKAGES} from '../src/packages';

async function harness(t:any){
 // Test-process-only values; no .env file, production configuration or provider is touched.
 const values={TOYYIBPAY_USER_SECRET_KEY:'test-secret',TOYYIBPAY_CATEGORY_CODE:'test-category',TOYYIBPAY_HOSTNAME:'dev.toyyibpay.com',APP_BASE_URL:'https://local-test.invalid'};
 const previous=Object.fromEntries(Object.keys(values).map(k=>[k,process.env[k]]));Object.assign(process.env,values);
 t.after(()=>{for(const [k,v]of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;});
 const db=new AffiliateMemoryDb();for(const uid of ['buyer','affiliate','other'])db.docs.set('users/'+uid,{uid,plan:'free',credits:0});
 const provider=new Map<string,any>();let invoices=0;
 t.mock.method(axios,'post',async(url:string,body:string)=>{assert.equal(url,'https://dev.toyyibpay.com/index.php/api/createBill');const fields=new URLSearchParams(body);const id=fields.get('billExternalReferenceNo')!,bill='bill-'+id;provider.set(bill,{found:true,isSuccess:false,statusId:'2',paymentAmount:Number(fields.get('billAmount'))/100,paymentInvoiceNo:'invoice-'+(++invoices),externalRefNo:id});return {data:[{BillCode:bill}]};});
 const authenticate=async(req:any)=>{const uid=req.headers.authorization?.replace('Bearer ','');return ['buyer','affiliate','other','admin','unverified-admin'].includes(uid)?{uid,email:uid.includes('admin')?'ezacademy.my@gmail.com':uid+'@example.com',name:uid,email_verified:uid!=='unverified-admin'} as any:null;};
 const app=express();app.use(express.json({limit:'2mb'}));registerPaymentRoutes(app,db as any,{authenticate,queryBill:async(bill:string)=>provider.get(bill)||{found:false,isSuccess:false}});registerAffiliateRoutes(app,db as any,authenticate);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));t.after(()=>server.close());
 const request=async(path:string,body?:any,user='buyer')=>{const response=await fetch('http://127.0.0.1:'+(server.address() as any).port+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+user,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const text=await response.text();let data:any;try{data=JSON.parse(text);}catch{data=text;}return {status:response.status,data};};
 const account=await request('affiliate/account',{},'affiliate');assert.equal(account.status,200);const code=account.data.code;
 const checkout=async(planId='plus',extra:any={})=>{const result=await request('checkout',{planId,referralCode:code,...extra});assert.equal(result.status,200,JSON.stringify(result.data));return result.data.orderId;};
 const callback=async(id:string,status='1',extra:any={})=>{const order=db.docs.get('transactions/'+id),body:any={order_id:id,billcode:order.billCode,status,refno:'callback-ref'};body.hash=crypto.createHash('md5').update('test-secret'+status+id+'callback-refok').digest('hex');return request('tx/callback',{...body,...extra});};
 const confirm=(id:string,extra:any={})=>{const order=db.docs.get('transactions/'+id);Object.assign(provider.get(order.billCode),{isSuccess:true,statusId:'1',...extra});};
 const wallet=()=>request('affiliate/account',{},'affiliate');
 return {db,provider,request,code,checkout,callback,confirm,wallet};
}
test('HTTP journey: five paid upgrades automatically earn RM10, then claim and admin payout tracking',async t=>{
 const h=await harness(t);
 for(let i=0;i<5;i++){
  const id=await h.checkout();const order=h.db.docs.get('transactions/'+id);assert.equal(order.referralCode,h.code);assert.equal(order.affiliateUid,'affiliate');assert.equal(order.amountInCents,1000);
  assert.equal((await h.wallet()).data.availableCents,i*200);
  h.confirm(id);const responses=await Promise.all([h.callback(id),h.request('payment/reconcile',{orderId:id}),h.callback(id)]);assert.ok(responses.every(r=>r.status===200));
  assert.equal(h.db.docs.get('transactions/'+id).status,'SUCCESS');assert.equal((await h.wallet()).data.availableCents,(i+1)*200);
 }
 assert.equal(h.db.docs.get('users/buyer').plan,'plus');assert.equal(h.db.docs.get('package_entitlements/buyer').purchases.length,5);
 const body={requestId:'claim-request-123456',amountCents:1000,method:'DuitNow',recipientName:'Test affiliate',duitNowId:'0120000000'};
 const claims=await Promise.all([h.request('affiliate/claims',body,'affiliate'),h.request('affiliate/claims',body,'affiliate')]);assert.ok(claims.every(r=>r.status===200));assert.equal(claims[0].data.id,claims[1].data.id);
 let wallet=(await h.wallet()).data;assert.equal(wallet.availableCents,0);assert.equal(wallet.reservedCents,1000);assert.equal(wallet.claims.length,1);assert.equal(wallet.claims[0].duitNowId,undefined);
 const list=await h.request('admin/affiliate/claims',undefined,'admin');assert.equal(list.status,200);assert.equal(list.data.claims[0].code,h.code);assert.equal(list.data.claims[0].duitNowId,body.duitNowId);
 const path='admin/affiliate/claims/'+claims[0].data.id;
 for(const who of ['buyer','affiliate','unverified-admin'])assert.equal((await h.request(path,{status:'Processing'},who)).status,403);
 assert.equal((await h.request(path,{status:'Paid'},'admin')).status,400);
 assert.equal((await h.request(path,{status:'Processing'},'admin')).status,200);
 for(let i=0;i<2;i++)assert.equal((await h.request(path,{status:'Paid'},'admin')).status,200);
 wallet=(await h.wallet()).data;assert.equal(wallet.paidCents,1000);assert.equal(wallet.reservedCents,0);assert.equal(wallet.claims[0].status,'Paid');
});
test('All paid packages credit exact agreed commission on verified upgrade; topups earn zero',async t=>{const h=await harness(t);let total=0;for(const [plan,cents]of Object.entries({lite:100,plus:200,max:300,speak:100,write:100,read:100,listen:100,boost:0,boost_plus:0})){const id=await h.checkout(plan);h.confirm(id);assert.equal((await h.callback(id)).status,200);total+=cents;assert.equal((await h.wallet()).data.availableCents,total);assert.equal(h.db.docs.get('transactions/'+id).amountInCents,PACKAGES[plan as keyof typeof PACKAGES].amountInCents);}});
test('Pending, failed, forged and mismatched payments earn nothing; delayed verified success recovers once',async t=>{const h=await harness(t);const id=await h.checkout();assert.equal((await h.callback(id)).status,503);assert.equal((await h.callback(id,'1',{hash:'0'.repeat(32)})).status,403);assert.equal((await h.callback(id,'3')).status,200);assert.equal((await h.wallet()).data.availableCents,0);assert.equal(h.db.docs.get('users/buyer').plan,'free');h.confirm(id,{paymentAmount:9});assert.equal((await h.callback(id)).status,500);assert.equal((await h.wallet()).data.availableCents,0);h.confirm(id,{paymentAmount:10});assert.equal((await h.callback(id)).status,200);assert.equal((await h.callback(id,'3')).status,200);assert.equal((await h.wallet()).data.availableCents,200);assert.equal(h.db.docs.get('transactions/'+id).status,'SUCCESS');});
test('Manual bank approval upgrades and credits together; rejection never credits',async t=>{const h=await harness(t);for(const action of ['REJECT','APPROVE']){const created=await h.request('payment/manual/initiate',{planId:'speak',referralCode:h.code});assert.equal(created.status,200);const id=created.data.txId;assert.equal((await h.wallet()).data.availableCents,0);assert.equal((await h.request('admin/payments/review',{txId:id,action},'buyer')).status,403);assert.equal((await h.request('admin/payments/review',{txId:id,action},'admin')).status,200);if(action==='APPROVE'){assert.equal((await h.request('admin/payments/review',{txId:id,action},'admin')).status,200);assert.equal((await h.wallet()).data.availableCents,100);}}});
test('Checkout rejects self/unknown referral, fixes client amounts, and ignores forged beneficiary fields',async t=>{const h=await harness(t);assert.equal((await h.request('checkout',{planId:'plus',referralCode:h.code},'affiliate')).status,400);assert.equal((await h.request('checkout',{planId:'plus',referralCode:'EZ000000000000'})).status,400);const id=await h.checkout('plus',{amountInCents:1,affiliateUid:'other',affiliateVersion:999});h.confirm(id);assert.equal((await h.callback(id)).status,200);assert.equal((await h.wallet()).data.availableCents,200);assert.equal(h.db.docs.get('transactions/'+id).affiliateUid,'affiliate');const plain=await h.checkout('plus',{referralCode:''});h.confirm(plain);await h.callback(plain);assert.equal((await h.wallet()).data.availableCents,200);});
test('Same bank invoice cannot fund a second purchase or commission',async t=>{const h=await harness(t);const first=await h.checkout();h.confirm(first);await h.callback(first);const invoice=h.provider.get(h.db.docs.get('transactions/'+first).billCode).paymentInvoiceNo;const second=await h.checkout();h.confirm(second,{paymentInvoiceNo:invoice});assert.equal((await h.callback(second)).status,500);assert.equal((await h.wallet()).data.availableCents,200);assert.equal(h.db.docs.get('package_entitlements/buyer').purchases.length,1);});
test('Touch n Go QR claim works, cannot overspend, and stays private to owner/admin',async t=>{const h=await harness(t);for(let i=0;i<4;i++){const id=await h.checkout('max');h.confirm(id);await h.callback(id);}const body={requestId:'qr-claim-request-12345',amountCents:1000,method:'Touch n Go eWallet QR',recipientName:'Test affiliate',qr:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='};assert.equal((await h.request('affiliate/claims',{...body,amountCents:1300},'affiliate')).status,400);assert.equal((await h.request('affiliate/claims',body,'affiliate')).status,200);assert.equal((await h.request('affiliate/claims',{...body,requestId:'qr-second-request-12345'},'affiliate')).status,400);const wallet=(await h.wallet()).data;assert.equal(wallet.availableCents,200);assert.equal(wallet.claims[0].qr,undefined);assert.equal((await h.request('affiliate/account',{},'other')).data.claims.length,0);assert.equal((await h.request('admin/affiliate/claims',undefined,'other')).status,403);const list=await h.request('admin/affiliate/claims',undefined,'admin');assert.equal(list.data.claims[0].qr,body.qr);});
test('A profile-only plan edit creates no commission',async t=>{const h=await harness(t);h.db.docs.get('users/buyer').plan='max';assert.equal((await h.wallet()).data.availableCents,0);assert.equal([...h.db.docs.keys()].filter(k=>k.startsWith('affiliate_commissions/')).length,0);});
