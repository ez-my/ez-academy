import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {PACKAGES,PACKAGE_VERSION} from '../src/packages';
import {commissionForOrder,validateClaim} from '../src/affiliate';
import {ensureAffiliate,resolveReferral,submitClaim,updateClaim} from '../src/server/affiliates';
import {applySuccessfulEntitlement} from '../src/server/payments';
import {registerAffiliateRoutes} from '../src/server/affiliateRoutes';
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

function setup(plan='plus') {
 const db=new FakeDb();const pack=PACKAGES[plan as keyof typeof PACKAGES];
 db.docs.set('users/student',{uid:'student',plan:'free',credits:0});
 db.docs.set('affiliate_accounts/owner',{uid:'owner',code:'EZ123456ABCDEF',availableCents:0,earnedCents:0,reservedCents:0,paidCents:0});
 db.docs.set('affiliate_codes/EZ123456ABCDEF',{uid:'owner'});
 db.docs.set('transactions/order',{id:'order',userId:'student',planId:plan,packageVersion:PACKAGE_VERSION,amountInCents:pack.amountInCents,currency:'MYR',billCode:'bill',paymentMethod:'toyyibpay_fpx',status:'PENDING',affiliateUid:'owner',referralCode:'EZ123456ABCDEF',affiliateVersion:1});return db;
}
const proof={billCode:'bill',transactionId:'invoice',externalRefNo:'order',paidAmount:10,source:'callback' as const};
const claim={requestId:'request-1234567890',amountCents:1000,method:'DuitNow',recipientName:'Owner',duitNowId:'0123456789'};
test('Current catalogue commissions match agreed rates; topups and historical orders excluded',()=>{
 for(const [id,cents] of Object.entries({lite:100,plus:200,max:300,speak:100,write:100,read:100,listen:100,boost:0,boost_plus:0})) {const db=setup(id);assert.equal(commissionForOrder(db.docs.get('transactions/order')),cents);}
 const order=setup().docs.get('transactions/order');assert.equal(commissionForOrder({...order,affiliateVersion:undefined}),0);assert.equal(commissionForOrder({...order,packageVersion:3}),0);assert.equal(commissionForOrder({...order,amountInCents:1}),0);
});
test('Parallel callback and reconciliation create one commission and one entitlement',async()=>{const db=setup();await Promise.all([1,2,3].map(()=>applySuccessfulEntitlement(db as any,'order',proof)));assert.equal(db.docs.get('affiliate_accounts/owner').availableCents,200);assert.equal(db.docs.get('affiliate_accounts/owner').earnedCents,200);assert.equal(db.docs.get('affiliate_commissions/order').amountCents,200);assert.equal(db.docs.get('package_entitlements/student').purchases.length,1);});
test('Unverified or failed payment cannot earn commission',async()=>{const db=setup();await assert.rejects(applySuccessfulEntitlement(db as any,'order',{...proof,paidAmount:9}));assert.equal(db.docs.get('affiliate_accounts/owner').availableCents,0);assert.ok(!db.docs.has('affiliate_commissions/order'));});
test('Approved manual payment uses the same commission transaction',async()=>{const db=setup('speak');Object.assign(db.docs.get('transactions/order'),{paymentMethod:'manual_bank_transfer',status:'PENDING_REVIEW'});await applySuccessfulEntitlement(db as any,'order',{source:'manual_approval',adminId:'admin'});assert.equal(db.docs.get('affiliate_accounts/owner').availableCents,100);});
test('Self referral and unknown codes are rejected',async()=>{const db=setup();await assert.rejects(resolveReferral(db as any,'owner','EZ123456ABCDEF'));await assert.rejects(resolveReferral(db as any,'student','EZ000000000000'));assert.equal((await resolveReferral(db as any,'student','EZ123456ABCDEF') as any).affiliateUid,'owner');});
test('Concurrent allocation returns a single stable unique code',async()=>{const db=setup();const accounts=await Promise.all([1,2,3].map(()=>ensureAffiliate(db as any,'new-user')));assert.equal(new Set(accounts.map(a=>a!.code)).size,1);assert.equal(db.docs.get('affiliate_codes/'+accounts[0]!.code).uid,'new-user');});
test('Claims enforce minimum, integer cents and available balance',()=>{for(const amount of [999,-1000,Infinity,NaN,1000.1,'1000',2001])assert.throws(()=>validateClaim(amount,2000));validateClaim(1000,1000);});
test('Overlapping claims cannot spend the same balance',async()=>{const db=setup();db.docs.get('affiliate_accounts/owner').availableCents=1500;const results=await Promise.allSettled([submitClaim(db as any,'owner',claim,{}),submitClaim(db as any,'owner',{...claim,requestId:'request-0987654321'}, {})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(db.docs.get('affiliate_accounts/owner').availableCents,500);assert.equal(db.docs.get('affiliate_accounts/owner').reservedCents,1000);});
test('Retrying a claim is idempotent, and Paid cannot be reversed or double-deducted',async()=>{const db=setup();db.docs.get('affiliate_accounts/owner').availableCents=2000;const [first,second]=await Promise.all([submitClaim(db as any,'owner',claim,{}),submitClaim(db as any,'owner',claim,{})]);assert.equal(first.id,second.id);assert.equal(db.docs.get('affiliate_accounts/owner').availableCents,1000);await assert.rejects(updateClaim(db as any,first.id,'Paid','admin'));await updateClaim(db as any,first.id,'Processing','admin');await Promise.all([updateClaim(db as any,first.id,'Paid','admin'),updateClaim(db as any,first.id,'Paid','admin')]);assert.equal(db.docs.get('affiliate_accounts/owner').reservedCents,0);assert.equal(db.docs.get('affiliate_accounts/owner').paidCents,1000);await assert.rejects(updateClaim(db as any,first.id,'Processing','admin'));});
test('Affiliate endpoints enforce authentication, verified admin role and QR validation',async()=>{const db=setup();const app=express();app.use(express.json());registerAffiliateRoutes(app,db as any,async(req:any)=>req.headers.authorization==='Bearer owner'?{uid:'owner',email:'owner@example.com'} as any:null);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));const url='http://127.0.0.1:'+(server.address() as any).port;try{assert.equal((await fetch(url+'/api/affiliate/account',{method:'POST'})).status,401);assert.equal((await fetch(url+'/api/admin/affiliate/claims',{headers:{Authorization:'Bearer owner'}})).status,403);assert.equal((await fetch(url+'/api/affiliate/claims',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({...claim,method:'Touch n Go eWallet QR',qr:'bad'})})).status,400);}finally{server.close();}});
