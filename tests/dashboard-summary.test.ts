import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizePractice} from '../src/lib/dashboardSummary';
import type {PracticeSession} from '../src/types';
const now=Date.UTC(2026,9,13);
const session=(type:string,score:number,days:number,id=type)=>({id,type,score,timestamp:now-days*86400000} as PracticeSession);
test('Date ranges include older saved scores and exclude future or invalid scores',()=>{
 const records=[session('ReadEZ',80,60),session('SpeakEZ',0,2),session('SpeakEZ',100,5),session('WriteEZ',101,1),session('ListenEZ',80,-1)];
 assert.equal(summarizePractice(records,30,now).recent.length,2);
 const summary=summarizePractice(records,90,now);
 assert.equal(summary.recent.length,3);
 assert.deepEqual(summary.skills.find(s=>s.label==='Speaking'),{label:'Speaking',count:2,value:50});
 assert.equal(summary.overall,65);
 assert.equal(summary.skills.find(s=>s.label==='Listening')?.count,0);
 assert.equal(summarizePractice(records,7,now).overall,50);
});
test('No practice has no overall score; zero is a real saved score',()=>{
 assert.equal(summarizePractice([],30,now).overall,null);
 assert.equal(summarizePractice([session('ReadEZ',0,1)],30,now).overall,0);
});
