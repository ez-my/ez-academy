import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadActivity} from '../src/server/reportSource';

test('a missing collection-group index never triggers an unbounded scan',async()=>{
  const calls:{group:string;bounded:boolean}[]=[];
  const db={
    collectionGroup(group:string){return {
      where(){calls.push({group,bounded:true});return this;},
      limit(){return this;},
      async get(){throw new Error('FAILED_PRECONDITION: missing index');},
    };},
    collection(){return {where(){return this;},limit(){return this;},async get(){return {size:0,docs:[]};}};},
  };
  await assert.rejects(()=>loadActivity(db as any,0,1,'2026-11-01'),/Indexed (sessions|completed)/);
  assert.ok(calls.length>0);
  assert.ok(calls.every(call=>call.bounded));
});
