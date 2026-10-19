import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {TRIAL_LISTENING_KEYS} from '../src/data/trialListeningKeys';
import {TRIAL_LISTENING_TESTS} from '../src/data/trialListeningTests';
import {gradeListeningPart,buildListeningSession,createListeningCheckHandler} from '../src/server/listeningResults';
const attemptId='11111111-1111-4111-8111-111111111111';
const correct=Object.fromEntries(Object.entries(TRIAL_LISTENING_KEYS['kuala-lumpur'].answers).map(([n,accepted])=>[n,accepted[0]]));

test('38 matched schemes contain all 30 answers; Johor Set 1 uses its actual key and Set 3 cannot use it',()=>{
  assert.equal(Object.keys(TRIAL_LISTENING_KEYS).length,38);
  for(const test of TRIAL_LISTENING_TESTS) {
    const key=TRIAL_LISTENING_KEYS[test.id];
    if(!key){assert.ok(['johor-set-3','negeri-sembilan-2024'].includes(test.id));assert.equal(test.answerFileId,undefined);continue;}
    assert.equal(test.answerFileId,key.sourceFileId,test.id);
    assert.deepEqual(Object.keys(key.answers).map(Number).sort((a,b)=>a-b),Array.from({length:30},(_,i)=>i+1));
    for(let n=1;n<=20;n++)assert.match(key.answers[n][0],n<=15?/^[ABC]$/:/^[A-H]$/);
  }
  assert.throws(()=>gradeListeningPart('johor-set-3',1,correct),/not available/);
  assert.equal(TRIAL_LISTENING_KEYS['kedah-2025'].answers[5][0],'C','official erratum');
  assert.equal(TRIAL_LISTENING_KEYS.perlis.answers[30][0],'potential','not transcript timing text');
});
test('all four parts use their own question ranges and complete answers are required',()=>{
  for(const [part,total,first,last] of [[1,7,1,7],[2,8,8,15],[3,5,16,20],[4,10,21,30]]){
    const r=gradeListeningPart('kuala-lumpur',part,correct);assert.equal(r.correct,total);assert.equal(r.total,total);
    assert.equal(r.questions[0].number,first);assert.equal(r.questions.at(-1)?.number,last);
  }
  assert.throws(()=>gradeListeningPart('kuala-lumpur',1,{}),/every question/);
  assert.throws(()=>gradeListeningPart('kuala-lumpur',5,correct),/Choose/);
});
test('spelling and plurals are exact; case/outer spaces and documented alternatives are supported',()=>{
  const answers={...correct,21:'  THERAPY  ',22:'rewrd',23:'resets'};
  assert.equal(gradeListeningPart('kuala-lumpur',4,answers).correct,8);
  const sel=Object.fromEntries(Object.entries(TRIAL_LISTENING_KEYS['selangor-2025'].answers).map(([n,a])=>[n,a[0]]));
  sel[22]='accommodation';assert.equal(gradeListeningPart('selangor-2025',4,sel).correct,10);
  const per=Object.fromEntries(Object.entries(TRIAL_LISTENING_KEYS['perlis-2025'].answers).map(([n,a])=>[n,a[0]]));
  per[21]='flaws';assert.equal(gradeListeningPart('perlis-2025',4,per).correct,9);
  per[21]='FLAWS';assert.equal(gradeListeningPart('perlis-2025',4,per).correct,10);
});
test('saved totals are weighted by actual checked questions and repeat checks reuse one attempt',()=>{
  let session=buildListeningSession('student',attemptId,'kuala-lumpur',1,correct);
  assert.equal(session.listeningResult.total,7);assert.equal(session.score,100);
  const answers={...correct,8:'B'};
  session=buildListeningSession('student',attemptId,'kuala-lumpur',2,answers,session);
  assert.equal(session.listeningResult.correct,14);assert.equal(session.listeningResult.total,15);assert.equal(session.score,93);
  assert.match(session.feedback,/checked parts only/);
  const again=buildListeningSession('student',attemptId,'kuala-lumpur',2,answers,session);
  assert.equal(again.id,session.id);assert.equal(again.listeningResult.total,15);
  for(const part of [3,4])session=buildListeningSession('student',attemptId,'kuala-lumpur',part,answers,session);
  assert.equal(session.listeningResult.total,30);assert.equal(session.listeningResult.correct,29);
});
test('changed answers invalidate a previously checked part; old injected marks are never trusted',()=>{
  const old=buildListeningSession('student',attemptId,'kuala-lumpur',1,correct);
  old.listeningResult.parts[1].correct=999;
  const unchanged=buildListeningSession('student',attemptId,'kuala-lumpur',2,correct,old);
  assert.equal(unchanged.listeningResult.correct,15);
  const next=buildListeningSession('student',attemptId,'kuala-lumpur',2,{...correct,1:'C'},old);
  assert.deepEqual(Object.keys(next.listeningResult.parts),['2']);assert.equal(next.listeningResult.total,8);
  assert.throws(()=>buildListeningSession('other',attemptId,'kuala-lumpur',2,correct,old),/new attempt/);
});
async function withServer(fail:boolean,action:(base:string,docs:Map<string,any>)=>Promise<void>){
  const docs=new Map<string,any>();const app=express();app.use(express.json());
  app.post('/check',createListeningCheckHandler({verifyToken:async token=>{if(token!=='good')throw Error();return{uid:'student'};},
    upsert:async(uid,id,build)=>{if(fail)throw Error();const key=`${uid}/${id}`;const value=build(docs.get(key));docs.set(key,value);return value;}}));
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
  try {await action(`http://127.0.0.1:${(server.address() as any).port}`,docs);}
  finally {server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
}
const post=(base:string,body:any,token='good')=>fetch(base+'/check',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
const body={testId:'kuala-lumpur',part:1,answers:correct,attemptId};
test('authenticated checks save real marks only to token owner, duplicate requests produce one record',async()=>withServer(false,async(base,docs)=>{
  for(let i=0;i<2;i++){
    const r=await post(base,{...body,uid:'another-user',score:1000});assert.equal(r.status,200);
    const data=await r.json();assert.equal(data.saved,true);assert.equal(data.result.correct,7);
  }
  assert.equal(docs.size,1);assert.ok(docs.has(`student/listen_trial_${attemptId}`));
  const r=await post(base,body,'forged');assert.equal(r.status,401);assert.equal(docs.size,1);
}));
test('invalid/unanswered requests and missing key never save a score',async()=>withServer(false,async(base,docs)=>{
  for(const bad of [{...body,answers:{}},{...body,answers:{1:['A']}},{...body,attemptId:'../another-user'},
    {...body,testId:'johor-set-3'},{...body,part:5}]) assert.equal((await post(base,bad)).status,400);
  assert.equal(docs.size,0);
}));
test('failed durable save cannot claim a saved result',async()=>withServer(true,async(base,docs)=>{
  const r=await post(base,body);assert.equal(r.status,503);const data=await r.json();assert.equal(data.saved,undefined);assert.match(data.error,/Could not save/);assert.equal(docs.size,0);
}));
