import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PracticeAttempt } from '../src/lib/practiceAttempt';
import { renderProgressPage, findButton } from './helpers/progressUiHarness';
import { persistSessionOnce } from '../src/lib/sessionPersistence';
import { renderedText } from './helpers/progressUiHarness';
const A='My synthetic first answer explains the value of reading books.';

test('legacy unsynced work is copied before active v2 writes and survives removal of the legacy slot',async()=>{
  const storage=device();const session={id:'legacy-attempt',userId:'fixture',type:'WriteEZ',timestamp:123,transcript:'My synthetic legacy answer explains a useful idea.',score:78,feedback:'Legacy feedback',duration:0};
  const key='ez-progress-v1:fixture:WriteEZ';storage.setItem(key,JSON.stringify({id:session.id,userId:'fixture',timestamp:123,draft:{text:session.transcript},pending:session,status:'not-synced'}));
  const saved:any[]=[];const mount=()=>new PracticeAttempt('fixture','WriteEZ',storage,async(_u,s)=>{saved.push(s);},()=>'fixture');
  const a=mount();a.writeDraft({text:'My edited local draft is kept separately.'});storage.values.delete(key);
  const reload=mount();assert.equal(reload.hasPending,true,'migration must materialize pending snapshot independently');await reload.retry();
  assert.equal(saved[0].id,session.id);assert.equal(saved[0].score,78);assert.equal(reload.draft.text,'My edited local draft is kept separately.');
});
const B='My synthetic revised answer explains the value of playing music.';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('oversized legacy progress warns rather than silently treating lost work as a fresh durable draft',()=>{
  const storage=device();storage.setItem('ez-progress-v1:fixture:WriteEZ',' '.repeat(256001));
  const a=new PracticeAttempt('fixture','WriteEZ',storage,async()=>{},()=>'fixture');assert.equal(a.localDurable,false);
});

test('corrupt legacy data cannot mask a valid v2 draft or retry queue',async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:A});f.setOffline(true);await a.complete({transcript:A});
  f.storage.setItem('ez-progress-v1:fixture:WriteEZ','{broken legacy JSON');
  const restored=f.mount();assert.equal(restored.draft?.text,A);assert.equal(restored.hasPending,true);
  f.setOffline(false);await restored.retry();assert.equal(f.records.get(a.id).transcript,A);
});

test('malformed, cross-account and oversized v2 records cannot be replayed as completions',async()=>{
  const storage=device();let calls=0;const prefix='ez-progress-v2:fixture:WriteEZ:';
  storage.setItem(prefix+'result:bad','{bad JSON');
  storage.setItem(prefix+'result:other',JSON.stringify({kind:'result',version:'other',order:1,session:{id:'other',userId:'someone-else',type:'WriteEZ',timestamp:1,score:99,transcript:A}}));
  storage.setItem(prefix+'result:huge',' '.repeat(256001));
  const a=new PracticeAttempt('fixture','WriteEZ',storage,async()=>{calls++;},()=>'fixture');await a.retry();assert.equal(calls,0);assert.equal(a.localDurable,false);
});
export function device() {
  const values=new Map<string,string>();
  return {values,get length(){return values.size;},key:(i:number)=>[...values.keys()][i]??null,getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
}
function fixture(type:'WriteEZ'|'SpeakEZ'='WriteEZ') {
  const storage=device(),records=new Map<string,any>([['user',{points:0}]]);let offline=false;
  const save=async(_uid:string,s:any)=>{if(offline)throw Error('synthetic offline');await persistSessionOnce(async work=>work({get:async(k:string)=>({exists:()=>records.has(k),data:()=>records.get(k)}),set:(k:string,v:any)=>{records.set(k,v);},update:(k:string,v:any)=>{records.set(k,{...records.get(k),...v});}}),s.id,'user',s,()=>({points:records.get('user').points+5}));};
  const mount=()=>new PracticeAttempt('fixture',type,storage,save,()=>'fixture');
  return {storage,records,mount,setOffline:(v:boolean)=>{offline=v;}};
}
for(const type of ['WriteEZ','SpeakEZ'] as const) test(`actual ${type} remount: late paid A retains feedback without replacing current B draft or pending B`,async()=>{
  const f=fixture(type),a=f.mount();let resolveAI:(v:any)=>void=()=>{},calls=0;
  const deferred=()=>{calls++;return new Promise(resolve=>{resolveAI=resolve;});};
  const ui=renderProgressPage(type,type==='WriteEZ'?{text:A,spmTask:{practiceMode:'Full'}}:{view:'review',selectedPart:2,task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:A},{plan:'ez_plus',userGoal:'SPM',profile:{uid:'fixture',plan:'ez_plus'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt:a,complete:(v:any)=>a.complete(v),update:()=>{}})},
    '../hooks/useAudioRecorder':{useAudioRecorder:()=>({audioBlob:new Blob(['fixture']),duration:10,transcript:'',reset:()=>{}})},
    '../lib/gemini':{analyzeSPMEmail:deferred,analyzeSPMSpeaking:deferred},
  },{realDraft:true});
  ui.flushEffects();ui.flushDraftTimers();findButton(ui.tree,type==='WriteEZ'?'Analyze Component':'Get feedback on my answer').props.onClick();await tick();const aid=a.id;
  const b=f.mount();
  const current=renderProgressPage(type,type==='WriteEZ'?{text:B,spmTask:{practiceMode:'Full'}}:{view:'review',selectedPart:2,task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:B},{plan:'free',profile:{uid:'fixture',plan:'free'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt:b,complete:(v:any)=>b.complete(v),update:()=>{}})},
    '../hooks/useAudioRecorder':{useAudioRecorder:()=>({audioBlob:new Blob(['fixture']),duration:10,transcript:'',reset:()=>{}})},
  },{realDraft:true});
  current.flushEffects();current.flushDraftTimers();f.setOffline(true);
  await findButton(current.tree,'Finish practice').props.onClick();assert.equal(b.status,'not-synced');const bid=b.id;assert.notEqual(aid,bid);
  resolveAI({score:91,feedback:'Synthetic A feedback'});await tick();await tick();
  const reload=f.mount();assert.equal(reload.draft.text??reload.draft.transcript,B,'late old mount must not replace B');assert.equal(reload.id,bid);
  f.setOffline(false);await reload.retry();
  assert.equal(f.records.get(aid).score,91,'recover already paid A feedback');assert.equal(f.records.get(bid).transcript,B);assert.equal(f.records.get(bid).score,null);
  assert.equal(f.records.get('user').points,10);assert.equal(calls,1);
});

test('account changes during an already-started cloud save do not report success or write an acknowledgement',async()=>{
  const storage=device();let user='a',resolve:()=>void=()=>{};
  const a=new PracticeAttempt('a','WriteEZ',storage,()=>new Promise<void>(r=>{resolve=r;}),()=>user);
  const completion=a.complete({transcript:A});const before=[...storage.values];
  user='b';a.writeDraft({text:'Wrong account edit'});resolve();
  assert.equal(await completion,false,'an auth transition is not a successful save for the current page');
  assert.deepEqual([...storage.values],before,'no local writes after auth transition');
});

test('actual status UI exposes older pending queue even when active draft is incomplete',async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:A});await a.complete({transcript:A});
  const b=f.mount();b.writeDraft({text:B});f.setOffline(true);await a.complete({transcript:A,score:80,feedback:'Synthetic'});
  const ui=renderProgressPage('../components/ProgressSaveStatus',{}, {progress:{attempt:b,retry:()=>b.retry()} });
  assert.match(renderedText(ui.tree),/earlier.*not synced/i);
  assert.ok(findButton(ui.tree,'Retry sync (no AI call)'));
});

test('three consecutive task snapshots survive reverse-order old-tab feedback and remount retry',async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:A});await a.complete({transcript:A});const aid=a.id;
  const b=f.mount();b.writeDraft({text:B});await b.complete({transcript:B});const bid=b.id;
  const C='My third synthetic answer discusses a completely different hobby.';
  const c=f.mount();c.writeDraft({text:C});f.setOffline(true);await c.complete({transcript:C});const cid=c.id;
  await b.complete({transcript:B,score:82,feedback:'Feedback B'});await a.complete({transcript:A,score:91,feedback:'Feedback A'});
  a.writeDraft({text:'Stale A pagehide text'});b.writeDraft({text:'Stale B unmount text'});
  const restored=f.mount();assert.equal(restored.id,cid);assert.equal(restored.draft.text,C);
  f.setOffline(false);assert.equal(await restored.retry(),true);assert.equal(await f.mount().retry(),true);
  assert.equal(f.records.size,4);assert.equal(f.records.get(aid).score,91);assert.equal(f.records.get(bid).score,82);assert.equal(f.records.get(cid).score,null);assert.equal(f.records.get('user').points,15);
});

test('same attempt in two tabs: stale unscored save cannot demote pending paid feedback or the newer draft',async()=>{
  const f=fixture(),old=f.mount();old.writeDraft({text:A});await old.complete({transcript:A});const id=old.id;
  const fresh=f.mount();fresh.writeDraft({text:B});f.setOffline(true);
  await old.complete({transcript:A,score:90,feedback:'Retained paid feedback'});
  assert.equal(await fresh.complete({transcript:B}),false,'different pending answer must sync first');
  await old.complete({transcript:A,score:null});old.writeDraft({text:A});
  const restored=f.mount();assert.equal(restored.id,id);assert.equal(restored.draft.text,B);
  f.setOffline(false);await restored.retry();assert.equal(f.records.get(id).score,90);
  await restored.complete({transcript:B});assert.notEqual(restored.id,id);assert.equal(f.records.get('user').points,10);
});

test('draft ownership uses deterministic ties for truly simultaneous mounts and retains both branches',()=>{
  const f=fixture(),one=f.mount(),two=f.mount();one.writeDraft({text:A});two.writeDraft({text:B});
  const winner=f.mount().draft.text;one.writeDraft({text:A});two.writeDraft({text:B});
  assert.equal(f.mount().draft.text,winner,'flush ordering cannot steal ownership');
  const drafts=[...f.storage.values.values()].map(s=>JSON.parse(s)).filter(r=>r.kind==='draft');
  assert.equal(drafts.length,2);assert.deepEqual(new Set(drafts.map(r=>r.draft.text)),new Set([A,B]));
});

test('two tabs editing an unfinished shared draft fork answer identity before either cloud completion',async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:A});const b=f.mount();assert.equal(a.id,b.id);
  b.writeDraft({text:B});assert.notEqual(a.id,b.id,'different draft answers cannot share a future completion ID');
  f.setOffline(true);await a.complete({transcript:A});await b.complete({transcript:B});
  f.setOffline(false);await f.mount().retry();
  assert.equal(f.records.get(a.id).transcript,A);assert.equal(f.records.get(b.id).transcript,B);assert.equal(f.records.get('user').points,10);
});

test('Finish before debounce forks an edited answer from a remounted unfinished draft',async()=>{
  const f=fixture(),a=f.mount();a.writeDraft({text:A});const original=a.id,b=f.mount();f.setOffline(true);
  await b.complete({transcript:B});assert.notEqual(b.id,original,'completion snapshot must own the edited answer even before draft timer fires');
  f.setOffline(false);await f.mount().retry();assert.equal(f.records.get(b.id).transcript,B);
});

test('retry is bounded to twenty snapshots and retains the remaining queue across reload',async()=>{
  const storage=device();const ids=Array.from({length:21},(_,i)=>`synthetic-attempt-${i}`);
  for(const [i,id] of ids.entries())storage.setItem(`ez-progress-v2:fixture:WriteEZ:result:${id}`,JSON.stringify({kind:'result',version:id,order:i,session:{id,userId:'fixture',type:'WriteEZ',timestamp:123,transcript:A,score:null,feedback:'',duration:0}}));
  const saved:string[]=[];const mount=()=>new PracticeAttempt('fixture','WriteEZ',storage,async(_u,s)=>{saved.push(s.id);},()=>'fixture');
  assert.equal(await mount().retry(),false);assert.equal(saved.length,20);assert.equal(mount().hasPending,true);
  assert.equal(await mount().retry(),true);assert.equal(saved.length,21);assert.deepEqual(new Set(saved),new Set(ids));
});

test('device storage failure is honest in the real status UI and never claims durable draft storage',()=>{
  const storage={getItem:()=>null,setItem:()=>{throw Error('synthetic quota');}};
  const attempt=new PracticeAttempt('fixture','WriteEZ',storage,async()=>{throw Error('offline');},()=>'fixture');attempt.writeDraft({text:A});
  const ui=renderProgressPage('../components/ProgressSaveStatus',{}, {progress:{attempt,retry:()=>attempt.retry()}});
  assert.match(renderedText(ui.tree),/Device storage is unavailable/);assert.equal(attempt.localDurable,false);
});

test('account and skill namespaces cannot read or retry another queue',async()=>{
  const f=fixture(),a=f.mount();f.setOffline(true);a.writeDraft({text:A});await a.complete({transcript:A});
  let calls=0;for(const [uid,type] of [['another','WriteEZ'],['fixture','SpeakEZ']] as const){const other=new PracticeAttempt(uid,type,f.storage,async()=>{calls++;},()=>uid);assert.equal(other.draft,null);assert.equal(other.hasPending,false);await other.retry();}assert.equal(calls,0);
});
