import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {AffiliateMemoryDb} from './helpers/affiliateMemoryDb';
import {createReward,deactivateReward,redeemReward} from '../src/server/rewards';
import {registerRewardRoutes} from '../src/server/rewardRoutes';
import {consumePracticeWithReward} from '../src/server/practicePolicy';
import {dashboardAccess} from '../src/server/dashboardAccess';

function setup(){const db=new AffiliateMemoryDb();db.docs.set('users/u1',{uid:'u1',plan:'free',credits:0});db.docs.set('users/u2',{uid:'u2',plan:'free',credits:0});return db;}
const base={code:'PLUS30',type:'plan',planId:'plus',durationDays:30,maxRedemptions:2,active:true,reason:'Workshop reward'};
test('plan code upgrades user, records history, and cannot be redeemed twice',async()=>{
 const db=setup();await createReward(db as any,base,'admin');const result=await redeemReward(db as any,'u1','plus30');assert.match(result.message,/EZ Plus/);
 assert.equal(db.docs.get('users/u1').plan,'plus');assert.equal(db.docs.get('package_entitlements/u1').purchases[0].planId,'plus');
 assert.equal(dashboardAccess(db.docs.get('users/u1'),db.docs.get('package_entitlements/u1'),{},Date.now()).planLabel,'EZ Plus');
 assert.ok(db.docs.has('reward_user_history/u1/items/PLUS30'));
 await assert.rejects(redeemReward(db as any,'u1','PLUS30'),/already redeemed/);
 assert.equal(db.docs.get('reward_codes/PLUS30').used,1);
});
test('invalid, expired, inactive and quota-full codes never grant rewards',async()=>{
 const db=setup();await assert.rejects(redeemReward(db as any,'u1','BADCODE'),/invalid/);
 db.docs.set('reward_codes/EXPIRED',{...base,code:'EXPIRED',expiresAt:1,used:0});await assert.rejects(redeemReward(db as any,'u1','EXPIRED'),/expired/);
 db.docs.set('reward_codes/INACTIVE',{...base,code:'INACTIVE',active:false,used:0});await assert.rejects(redeemReward(db as any,'u1','INACTIVE'),/inactive/);
 db.docs.set('reward_codes/FULLCODE',{...base,code:'FULLCODE',maxRedemptions:1,used:1});await assert.rejects(redeemReward(db as any,'u1','FULLCODE'),/limit/);
 assert.equal(db.docs.get('users/u1').plan,'free');
});
test('concurrent redemptions honor quota and one use per user',async()=>{
 const db=setup();await createReward(db as any,{...base,maxRedemptions:1},'admin');
 const results=await Promise.allSettled([redeemReward(db as any,'u1','PLUS30'),redeemReward(db as any,'u2','PLUS30')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(db.docs.get('reward_codes/PLUS30').used,1);
});
test('AI credits and extra practices update balances; practice reward is consumed only at limit',async()=>{
 const db=setup();await createReward(db as any,{...base,code:'CREDITS',type:'ai_credits',amount:20},'admin');await redeemReward(db as any,'u1','CREDITS');assert.equal(db.docs.get('users/u1').credits,20);assert.equal(db.docs.get('package_entitlements/u1').topupUnits,20);
 await createReward(db as any,{...base,code:'PRACTICE',type:'practices',amount:3},'admin');await redeemReward(db as any,'u1','PRACTICE');const ledger=db.docs.get('package_entitlements/u1');assert.equal(ledger.rewardPracticeCredits,3);
 assert.equal(consumePracticeWithReward({plan:'free'},ledger,{used:0},'2026-10-25','read').rewardCreditUsed,false);
 assert.equal(consumePracticeWithReward({plan:'free'},ledger,{used:2},'2026-10-25','read').rewardCreditUsed,true);
});
test('admin can deactivate, and non-admin cannot create through API',async()=>{
 const db=setup();await createReward(db as any,base,'admin');await deactivateReward(db as any,'PLUS30','admin');await assert.rejects(redeemReward(db as any,'u1','PLUS30'),/inactive/);
 const app=express();app.use(express.json());registerRewardRoutes(app,db as any,async(req:any)=>req.headers.authorization==='Bearer user'?{uid:'u1',email:'user@example.com'} as any:null);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 try{const port=(server.address() as any).port;const response=await fetch(`http://127.0.0.1:${port}/api/admin/rewards`,{method:'POST',headers:{Authorization:'Bearer user','Content-Type':'application/json'},body:JSON.stringify(base)});assert.equal(response.status,403);}finally{server.close();}
});
