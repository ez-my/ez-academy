import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertPracticeAllowed,hasPaidPractice,malaysiaPracticeDay} from '../src/server/practicePolicy';

test('Free allowance is shared and full mocks are refused',()=>{
 assert.doesNotThrow(()=>assertPracticeAllowed(false,0));
 assert.doesNotThrow(()=>assertPracticeAllowed(false,1));
 assert.throws(()=>assertPracticeAllowed(false,2),{status:429});
 assert.throws(()=>assertPracticeAllowed(false,0,true),{status:403});
 assert.doesNotThrow(()=>assertPracticeAllowed(true,2,true));
});
test('Malaysia midnight rolls over the practice day',()=>{
 assert.equal(malaysiaPracticeDay(Date.parse('2026-10-13T15:59:59Z')),'2026-10-13');
 assert.equal(malaysiaPracticeDay(Date.parse('2026-10-13T16:00:00Z')),'2026-10-14');
});
test('Focus entitlement covers only its skill and expired plans lose paid access',()=>{
 const now=10000;
 assert.equal(hasPaidPractice({plan:'free'},{focus:{read:{expiresAt:11000}}},'read',now),true);
 assert.equal(hasPaidPractice({plan:'free'},{focus:{read:{expiresAt:11000}}},'listen',now),false);
 assert.equal(hasPaidPractice({plan:'pro',planExpiresAt:9000},{},'read',now),false);
 assert.equal(hasPaidPractice({plan:'free'},{version:2,planId:'pro',expiresAt:11000},'listen',now),true);
});
