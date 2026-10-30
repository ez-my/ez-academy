import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { PracticeAttempt } from '../src/lib/practiceAttempt';
import { progressStorage } from './helpers/progressStorage';

// Deterministic React hook lifecycle/timer adapter; no browser, cloud or model.
function hooksFixture(records=new Map<string,string>(), save=async()=>{}) {
  let index=0, owner='a', cloudCalls=0, localWrites=0, clock=0;
  const slots:any[]=[], effects:(()=>void)[]=[], timers=new Map<number,()=>void>(), listeners=new Map<string,()=>void>();
  const storage=progressStorage(records,(key,value)=>{localWrites++;records.set(key,value);});
  const same=(a:any[],b:any[])=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const react={
    useState:(initial:any)=>{const i=index++;slots[i]??={value:initial};return [slots[i].value,(f:any)=>{slots[i].value=typeof f==='function'?f(slots[i].value):f;}];},
    useMemo:(f:any,deps:any[])=>{const i=index++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,value:f()};return slots[i].value;},
    useEffect:(f:any,deps:any[])=>{const i=index++;if(!slots[i]||!same(slots[i].deps,deps)){const prior=slots[i];slots[i]={deps};effects.push(()=>{prior?.cleanup?.();slots[i].cleanup=f();});}},
  };
  const exports:any={};
  const source=readFileSync(new URL('../src/hooks/usePracticeProgress.ts',import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js,{exports,require:(name:string)=>name==='react'?react:name.endsWith('/practiceAttempt')?{PracticeAttempt}:{auth:{get currentUser(){return {uid:owner};}},saveSession:async()=>{cloudCalls++;await save();}},localStorage:storage,
    setTimeout:(f:()=>void)=>{timers.set(++clock,f);return clock;},clearTimeout:(id:number)=>timers.delete(id),window:{addEventListener:(key:string,f:()=>void)=>listeners.set(key,f),removeEventListener:(key:string,f:()=>void)=>{if(listeners.get(key)===f)listeners.delete(key);}},
  });
  return {
    render:(uid:string,draft:any)=>{owner=uid;index=0;const progress=exports.usePracticeProgress(uid,'WriteEZ');exports.usePracticeDraft(progress,draft);effects.splice(0).forEach(f=>f());return progress;},
    tick:()=>{const pending=[...timers.values()];timers.clear();pending.forEach(f=>f());},
    hide:()=>listeners.get('pagehide')?.(),changed:()=>listeners.get('storage')?.(),unmount:()=>slots.forEach(s=>s?.cleanup?.()),storage,records,
    get writes(){return localWrites;},get cloud(){return cloudCalls;},
  };
}

test('actual draft hook debounces typing, flushes latest text at pagehide, and never completes a draft',()=>{
  const f=hooksFixture();
  f.render('a',{text:'one'});f.render('a',{text:'two'});f.render('a',{text:'latest'});
  assert.equal(f.writes,0,'typing does not write each key');assert.equal(f.cloud,0);
  f.tick();assert.equal(f.writes,1);assert.equal(f.cloud,0);
  f.render('a',{text:'before close'});f.hide();
  assert.equal(new PracticeAttempt('a','WriteEZ',f.storage,async()=>{},()=>'a').draft.text,'before close');
});

test('actual draft hook refuses old-account cleanup writes and restores accounts independently',()=>{
  const f=hooksFixture();
  f.render('a',{text:'Alice draft'});f.tick();const aliceWrites=f.writes;
  f.render('a',{text:'unflushed Alice edit'});f.render('b',{text:'Bob draft'});
  assert.equal(f.writes,aliceWrites,'cleanup must not write after auth switches');f.tick();
  assert.equal(new PracticeAttempt('a','WriteEZ',f.storage,async()=>{},()=>'a').draft.text,'Alice draft');
  assert.equal(new PracticeAttempt('b','WriteEZ',f.storage,async()=>{},()=>'b').draft.text,'Bob draft');
  const restored=f.render('a',{text:'Alice draft'});assert.equal(restored.attempt.draft.text,'Alice draft');assert.equal(f.cloud,0);
});

test('actual hook retries older pending records even when active draft is a new incomplete task',async()=>{
  const records=new Map<string,string>(),storage=progressStorage(records);
  const old=new PracticeAttempt('a','WriteEZ',storage,async()=>{throw Error('offline');},()=>'a');
  await old.complete({transcript:'My synthetic first completed answer.'});
  const draftKey=[...records.keys()].find(k=>k.includes(':draft:'))!;
  const draft=JSON.parse(records.get(draftKey)!);draft.id='new-task';draft.draft={text:'An unfinished new task'};draft.epoch++;records.set(draftKey,JSON.stringify(draft));
  const f=hooksFixture(records);f.render('a',{text:'An unfinished new task'});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(f.cloud,1,'mount retries the durable queue, not just active status');
});

test('actual pagehide and unmount flushes from old mount cannot replace a newer mount draft',()=>{
  const records=new Map<string,string>(),old=hooksFixture(records);old.render('a',{text:'old draft'});old.tick();
  const fresh=hooksFixture(records);fresh.render('a',{text:'latest B'});fresh.tick();
  old.render('a',{text:'stale cleanup'});old.hide();old.unmount();
  const restored=new PracticeAttempt('a','WriteEZ',fresh.storage,async()=>{},()=>'a');assert.equal(restored.draft.text,'latest B');
});

test('actual hook discovers pending completion written by another tab after mount',async()=>{
  const records=new Map<string,string>(),f=hooksFixture(records);f.render('a',{text:'Current incomplete draft'});f.tick();
  const other=new PracticeAttempt('a','WriteEZ',f.storage,async()=>{throw Error('offline');},()=>'a');await other.complete({transcript:'My synthetic answer from another tab.'});
  f.changed();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.cloud,1);
  f.changed();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.cloud,1,'acknowledged queue is not replayed');
});
