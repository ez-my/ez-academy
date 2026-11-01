import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {boundedGroup} from '../src/server/boundedGroup';
import {tallySources} from '../src/pages/admin/growthTally';

// A stand in for Firestore that records how each collection group query was built.
function fakeDb(behaviour:'fail'|'ok'){
  const queries:{group:string;wheres:number;limited:boolean}[]=[];
  const docs=[{ref:{path:'users/a/sessions/1'}},{ref:{path:'users/a/sessions/2'}}];
  const db={collectionGroup(group:string){
    const q={group,wheres:0,limited:false};queries.push(q);
    const builder:any={where(){q.wheres++;return builder;},limit(){q.limited=true;return builder;},
      async get(){if(behaviour==='fail')throw new Error('FAILED_PRECONDITION: index missing');return {size:docs.length,docs};}};
    return builder;}};
  return {db:db as any,queries};
}

test('a failed collection group query returns nothing and never reads the whole group',async()=>{
  const {db,queries}=fakeDb('fail'),warnings:string[]=[];
  const rows=await boundedGroup(db,'sessions','timestamp',0,1000,warnings);
  assert.deepEqual(rows,[]);
  assert.deepEqual(warnings,['Could not load sessions. This report is incomplete.']);
  assert.equal(queries.length,2); // only the two dated queries, no third unbounded one
  assert.ok(queries.every(q=>q.wheres===2&&q.limited),'every query is bounded by a date range and a limit');
});

test('a working query merges the two date formats without double counting',async()=>{
  const {db}=fakeDb('ok'),warnings:string[]=[];
  const rows=await boundedGroup(db,'completed','completedAt',0,1000,warnings);
  assert.equal(rows.length,2);assert.deepEqual(warnings,[]);
});

test('source bars add up to the learner total and unknown answers count as not answered',()=>{
  const {sources,answered}=tallySources(10,{tiktok:4,friend:3},id=>id.toUpperCase());
  assert.equal(answered,7);
  assert.equal(sources.reduce((n,s)=>n+s.count,0),10);
  assert.deepEqual(sources.map(s=>s.id),['tiktok','friend','unanswered']);
  assert.equal(Math.round(sources[0].share),40);
  assert.equal(tallySources(0,{}, x=>x).sources[0].share,0); // no learners: no divide by zero
  assert.equal(tallySources(2,{a:5},x=>x).sources.find(s=>s.id==='unanswered')?.count,0); // never negative
});

test('firestore index definitions cover both report queries and are wired into firebase.json',()=>{
  const indexes=JSON.parse(readFileSync('firestore.indexes.json','utf8'));
  for(const [group,field] of [['sessions','timestamp'],['completed','completedAt']]){
    const o=indexes.fieldOverrides.find((x:any)=>x.collectionGroup===group&&x.fieldPath===field);
    assert.ok(o,`${group}.${field} override`);
    assert.ok(o.indexes.some((i:any)=>i.queryScope==='COLLECTION_GROUP'&&i.order==='ASCENDING'),`${group} collection group index`);
    // an override replaces the defaults, so the normal per collection indexes must be kept
    assert.ok(o.indexes.some((i:any)=>i.queryScope==='COLLECTION'&&i.order==='ASCENDING'));
    assert.ok(o.indexes.some((i:any)=>i.queryScope==='COLLECTION'&&i.order==='DESCENDING'));
  }
  assert.equal(JSON.parse(readFileSync('firebase.json','utf8')).firestore.indexes,'firestore.indexes.json');
});

test('admin panels never read a whole users or sessions collection from the browser',()=>{
  const dir='src/pages/admin/';
  for(const file of readdirSync(dir).filter(f=>/\.tsx?$/.test(f))){
    const code=readFileSync(dir+file,'utf8');
    assert.ok(!/getDocs\(\s*collection\(\s*db\s*,\s*'users'\s*\)\s*\)/.test(code),`${file} reads every user`);
    assert.ok(!/getDocs\(\s*collectionGroup\(/.test(code),`${file} reads a whole collection group`);
  }
});
