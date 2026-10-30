import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PracticeAttempt } from '../src/lib/practiceAttempt';
import { persistSessionOnce } from '../src/lib/sessionPersistence';
import { progressStorage } from './helpers/progressStorage';
import { renderProgressPage, findButton } from './helpers/progressUiHarness';
const answer='My synthetic learner answer explains why reading is useful.';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(type:'WriteEZ'|'SpeakEZ'='WriteEZ') {
  const local=new Map<string,string>(),records=new Map<string,any>([['user',{points:0}]]);
  let offline=false,hold=false,release:()=>void=()=>{},calls=0,revision=0,conflicts=0;
  const save=async(_uid:string,s:any)=>{
    calls++;if(offline)throw Error('synthetic offline');
    let deferCommit=hold;hold=false;
    return persistSessionOnce(async work=>{
      for(;;){
        const observed=revision,snapshot=new Map(records),writes=new Map<string,any>();
        await work({get:async(k:string)=>({exists:()=>snapshot.has(k),data:()=>snapshot.get(k)}),set:(k:string,v:any)=>writes.set(k,v),update:(k:string,v:any)=>writes.set(k,{...snapshot.get(k),...v})});
        if(deferCommit){deferCommit=false;await new Promise<void>(r=>{release=r;});}
        // Model Firestore's transaction conflict retry, not a last-write-wins DB.
        if(revision!==observed){conflicts++;continue;}
        for(const [k,v] of writes)records.set(k,v);revision++;return;
      }
    },s.id,'user',s,u=>({points:u.points+5}));
  };
  const mount=()=>new PracticeAttempt('fixture',type,progressStorage(local),save,()=>'fixture');
  return {local,records,save,mount,calls:()=>calls,conflicts:()=>conflicts,setOffline:(v:boolean)=>{offline=v;},hold:()=>{hold=true;},release:()=>release()};
}
for(const type of ['WriteEZ','SpeakEZ'] as const)test(`${type}: actual paid handler newer result survives delayed old scored retry`,async()=>{
  const f=fixture(type),old=f.mount();old.writeDraft(type==='WriteEZ'?{text:answer}:{transcript:answer});
  await old.complete({transcript:answer});const id=old.id, timestamp=f.records.get(id).timestamp;
  f.setOffline(true);await old.complete({transcript:answer,score:80,feedback:'Old feedback'});
  f.setOffline(false);f.hold();const retry=old.retry();await tick();
  const fresh=f.mount();let ai=0;
  const ui=renderProgressPage(type,type==='WriteEZ'?{text:answer,spmTask:{practiceMode:'Full'}}:{view:'review',selectedPart:2,task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:answer},{plan:'ez_plus',userGoal:'SPM',profile:{uid:'fixture',plan:'ez_plus'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt:fresh,complete:(v:any)=>fresh.complete(v),update:()=>{}})},
    '../hooks/useAudioRecorder':{useAudioRecorder:()=>({audioBlob:new Blob(['fixture']),duration:10,transcript:'',reset:()=>{}})},
    '../lib/gemini':{analyzeSPMEmail:async()=>{ai++;return {score:90,feedback:'New feedback'};},analyzeSPMSpeaking:async()=>{ai++;return {score:90,feedback:'New feedback'};}},
  },{realDraft:true});
  ui.flushEffects();ui.flushDraftTimers();findButton(ui.tree,type==='WriteEZ'?'Analyze Component':'Get feedback on my answer').props.onClick();await tick();await tick();
  assert.equal(f.records.get(id).score,90);f.release();await retry;
  assert.equal(f.records.get(id).score,90,'stale scored transaction must not downgrade cloud');
  assert.equal(f.conflicts(),1,'deferred old commit reruns the real transaction callback after conflict');
  assert.equal(f.records.get(id).timestamp,timestamp);assert.equal(f.records.get('user').points,5);
  const reload=f.mount();assert.equal(reload.status,'saved');assert.equal(reload.hasPending,false);await reload.retry();
  assert.equal(f.records.get(id).score,90);assert.equal(ai,1);
  const latest=[...f.local.values()].map(v=>JSON.parse(v)).filter(r=>r.kind==='result').sort((a,b)=>b.order-a.order)[0];
  assert.equal(latest.session.score,90);assert.equal(f.records.get(id).resultVersion,latest.version);assert.equal(f.records.get(id).resultOrder,latest.order);
  const oldVersion=[...f.local.values()].map(v=>JSON.parse(v)).find(r=>r.kind==='result'&&r.session.score===80).version;
  assert.equal(f.local.has(`ez-progress-v2:fixture:${type}:ack:${oldVersion}`),false,'superseded incoming version was not persisted');
});
for(const bad of ['wrong-version','wrong-kind','wrong-result-key','wrong-draft-owner'])test(`device record identity binding: ${bad}`,async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:answer});f.setOffline(true);await a.complete({transcript:answer,score:80});
  const entries=[...f.local].map(([key,value])=>({key,record:JSON.parse(value)}));
  const r=entries.find(v=>v.record.kind==='result')!;const prefix='ez-progress-v2:fixture:WriteEZ:';
  if(bad==='wrong-version')f.local.set(prefix+'ack:'+r.record.version,JSON.stringify({kind:'ack',version:'different-version'}));
  if(bad==='wrong-kind')f.local.set(prefix+'ack:'+r.record.version,JSON.stringify({...r.record}));
  if(bad==='wrong-result-key'){f.local.set(prefix+'result:wrong-key',JSON.stringify(r.record));}
  if(bad==='wrong-draft-owner'){const d=entries.find(v=>v.record.kind==='draft')!;f.local.set(prefix+'draft:wrong-owner',JSON.stringify(d.record));}
  const reload=f.mount();assert.equal(reload.localDurable,false,'malformed key/record identity must warn');assert.equal(reload.hasPending,true);assert.equal(reload.status,'not-synced');
  const before=f.calls();f.setOffline(false);await reload.retry();assert.equal(f.calls(),before+1);assert.equal(reload.hasPending,false);assert.equal(f.records.get(a.id).score,80);
  assert.equal(f.mount().hasPending,false,'a real exact-version acknowledgement remains valid');
});

test('legacy scored cloud winner is retained and precisely acknowledged instead of pending unscored input',async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:answer});f.setOffline(true);await a.complete({transcript:answer});
  const pending=[...f.local.values()].map(v=>JSON.parse(v)).find(r=>r.kind==='result');
  f.records.set(a.id,{...pending.session,score:81,feedback:'Legacy feedback'});
  f.setOffline(false);assert.equal(await a.retry(),true);
  assert.equal(f.records.get(a.id).score,81);assert.equal(f.records.get(a.id).feedback,'Legacy feedback');
  assert.equal(f.local.has(`ez-progress-v2:fixture:WriteEZ:ack:${pending.version}`),false);
  assert.equal(f.mount().hasPending,false);assert.equal(f.mount().status,'saved');assert.equal(f.records.get('user').points,0);
});

for(const versions of [['z','a'],['a','z']])test(`equal-order scored versions use identical device/cloud tie-break in arrival order ${versions}`,async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:answer});f.setOffline(true);await a.complete({transcript:answer});
  const base=[...f.local.values()].map(v=>JSON.parse(v)).find(r=>r.kind==='result').session;
  f.local.clear();
  for(const version of versions){
    const session={...base,score:version==='z'?72:95,feedback:version};
    f.local.set(`ez-progress-v2:fixture:WriteEZ:result:${version}`,JSON.stringify({kind:'result',version,order:5,session}));

  }
  f.setOffline(false);
  // The cloud receives both versions in either order, independent of local reduction.
  for(const version of versions)await f.save('fixture',{...base,score:version==='z'?72:95,feedback:version,resultVersion:version,resultOrder:5});
  assert.equal(f.records.get(base.id).score,72,'UUID ordering, not numeric score, picks the winner');
  assert.equal(await f.mount().retry(),true);assert.equal(f.records.get(base.id).resultVersion,'z');
  assert.ok(f.local.has('ez-progress-v2:fixture:WriteEZ:ack:z'));assert.equal(f.records.get('user').points,5);
  await f.save('fixture',{...base,score:999,feedback:'mutated retry',resultVersion:'z',resultOrder:5});
  assert.equal(f.records.get(base.id).score,72,'same immutable version is idempotent');
});

test('newer scored result outranks legacy scored cloud and reverse-arriving older scored result',async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:answer});f.setOffline(true);await a.complete({transcript:answer,score:90});
  const r=[...f.local.values()].map(v=>JSON.parse(v)).find(r=>r.kind==='result');
  f.records.set(a.id,{...r.session,score:80,feedback:'Legacy'});f.setOffline(false);
  await a.retry();assert.equal(f.records.get(a.id).score,90);
  await f.save('fixture',{...r.session,score:70,resultVersion:'older',resultOrder:0});
  assert.equal(f.records.get(a.id).score,90);assert.equal(f.records.get('user').points,0);
});

test('transaction commit failure after callback never acknowledges the device version',async()=>{
  const local=new Map<string,string>();
  const save=async(_u:string,s:any)=>persistSessionOnce(async work=>{
    await work({get:async()=>({exists:()=>false}),set:()=>{},update:()=>{}});
    throw Error('synthetic commit rejection');
  },s.id,'user',s,()=>({points:5}));
  const a=new PracticeAttempt('fixture','WriteEZ',progressStorage(local),save,()=>'fixture');a.writeDraft({text:answer});
  assert.equal(await a.complete({transcript:answer,score:90}),false);assert.equal(a.hasPending,true);assert.equal(a.status,'not-synced');
  assert.equal([...local.keys()].some(k=>k.includes(':ack:')),false);
});

test('receipt for an older cloud version cannot acknowledge a newer incoming version',async()=>{
  const local=new Map<string,string>();
  const a=new PracticeAttempt('fixture','WriteEZ',progressStorage(local),async(_u,s)=>({...s,resultVersion:'older',resultOrder:0}),()=>'fixture');
  a.writeDraft({text:answer});assert.equal(await a.complete({transcript:answer,score:90}),false);
  assert.equal(a.hasPending,true);assert.equal([...local.keys()].some(k=>k.includes(':ack:')),false);
});

test('receipt with mismatched order cannot confirm an incoming version merely by matching UUID',async()=>{
  const local=new Map<string,string>();
  const a=new PracticeAttempt('fixture','WriteEZ',progressStorage(local),async(_u,s)=>({...s,resultOrder:0}),()=>'fixture');
  a.writeDraft({text:answer});assert.equal(await a.complete({transcript:answer,score:90}),false);
  assert.equal(a.hasPending,true);assert.equal([...local.keys()].some(k=>k.includes(':ack:')),false);
});
