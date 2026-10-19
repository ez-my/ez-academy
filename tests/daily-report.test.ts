import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayKey,dayStart,reportTasks,buildDailyReport} from '../src/server/dailyReport';
const at=dayStart('2026-10-16')+3600000;
test('Malaysia day handles midnight and rejects impossible dates',()=>{assert.equal(dayKey(Date.parse('2026-10-15T16:00:00Z')),'2026-10-16');assert.throws(()=>dayStart('2026-02-30'));});
test('part-level events replace latest-date history without double counting and retain zero scores',()=>{
 const sessions=[{id:'r',userId:'u',type:'ReadEZ',testSetId:'test',timestamp:at,readingResult:{parts:{1:{part:1,correct:0,total:8},2:{part:2,correct:8,total:10}}}}];
 const rows=reportTasks(sessions,[{id:'u:ReadEZ:test:1',userId:'u',skill:'Reading',at:at-86400000,score:0}]);
 assert.equal(rows.length,2);assert.equal(rows.find(r=>r.id.endsWith(':1'))?.at,at-86400000);assert.equal(rows.find(r=>r.id.endsWith(':1'))?.score,0);
});
test('daily report deduplicates active users, excludes admin by default, compares yesterday and separates skill scores',()=>{
 const users=[{id:'u',displayName:'Aina',createdAt:at},{id:'admin',email:'ezacademy.my@gmail.com',createdAt:at}];
 const tasks=[{id:'1',uid:'u',skill:'Reading',at,score:0},{id:'2',uid:'u',skill:'Speaking',at,score:null},{id:'3',uid:'admin',skill:'Reading',at,score:100},{id:'4',uid:'u',skill:'Writing',at:at-86400000,score:80}];
 const visits=[{userId:'u',day:'2026-10-16',at},{userId:'u',day:'2026-10-16',at},{userId:'v',day:'2026-10-16',at}];
 const r=buildDailyReport('2026-10-16',users,tasks,visits);
 assert.equal(r.today.active,2);assert.equal(r.today.tasks,2);assert.equal(r.today.newUsers,1);assert.equal(r.previous.tasks,1);assert.equal(r.skills[0].average,0);assert.equal(r.skills[2].average,null);assert.equal(r.days.length,7);assert.equal(r.weekTasks,3);assert.equal(r.learners.find(u=>u.id==='v')?.tasks,0);
 assert.equal(buildDailyReport('2026-10-16',users,tasks,visits,true).today.tasks,3);
});
test('MUET report and completion ledger describe one task and preserve available score',()=>{
 const rows=reportTasks([{id:'muet',userId:'u',type:'SpeakEZ',timestamp:at,score:80,muetReport:{topicId:'t',testType:'Part1'}}],[{id:'u:muet:t:Part1',userId:'u',skill:'Speaking',at,score:null}]);
 assert.equal(rows.length,1);assert.equal(rows[0].score,80);
});
