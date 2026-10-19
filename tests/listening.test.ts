import test from 'node:test';
import assert from 'node:assert/strict';
import {TRIAL_LISTENING_TESTS, LISTENING_PARTS, draftKey, parseTrialDraft, drivePreviewUrl} from '../src/data/trialListeningTests';
import {READABLE_TRIAL_PARTS} from '../src/data/trialListeningParts';
test('each listed trial has distinct question and audio sources',()=>{
 assert.equal(TRIAL_LISTENING_TESTS.length,40);
 for(const field of ['id','questionFileId','audioFileId'] as const) assert.equal(new Set(TRIAL_LISTENING_TESTS.map(t=>t[field])).size,40);
 for(const t of TRIAL_LISTENING_TESTS) {assert.match(drivePreviewUrl(t.questionFileId),/^https:\/\/drive.google.com\/file\/d\//);assert.ok(t.audioFileId);}
 assert.equal(TRIAL_LISTENING_TESTS.find(t=>t.id==='johor-set-1')?.answerFileId,'1vfFjZgwthbbufvWBaKMYbphyUcNFUbFo');
 assert.equal(TRIAL_LISTENING_TESTS.find(t=>t.id==='johor-set-3')?.answerFileId,undefined);
});
test('four parts cover all 30 questions exactly once',()=>assert.deepEqual(LISTENING_PARTS.flatMap(p=>Array.from({length:p.last-p.first+1},(_,i)=>p.first+i)),Array.from({length:30},(_,i)=>i+1)));
test('saved drafts stay separate by learner and test, independent of course',()=>{assert.notEqual(draftKey('a','kedah'),draftKey('b','kedah'));assert.notEqual(draftKey('a','kedah'),draftKey('a','perlis'));assert.notEqual(draftKey('a:b','c'),draftKey('a','b:c'));});
test('damaged and oversized drafts cannot enter answer state',()=>{assert.deepEqual(parseTrialDraft('{broken'),{});assert.deepEqual(parseTrialDraft('[]'),{});assert.deepEqual(parseTrialDraft(JSON.stringify({'1':'B','30':'word','31':'C','2':null,'3':'x'.repeat(101),'__proto__':'x'})),{'1':'B','30':'word'});});
test('readable papers contain each original part and remain matched to the catalog',()=>{assert.equal(Object.keys(READABLE_TRIAL_PARTS).length,40);for(const [id,parts] of Object.entries(READABLE_TRIAL_PARTS)){assert.ok(TRIAL_LISTENING_TESTS.some(t=>t.questionFileId===id));assert.deepEqual(Object.keys(parts),['1','2','3','4']);for(const text of Object.values(parts)) assert.ok(text.length>100);}});
test('external source IDs reject URL injection',()=>assert.throws(()=>drivePreviewUrl('https://bad.example')));

import {organiseChoiceQuestions,organiseMatching,organisePassage} from '../src/data/listeningLayout';
test('every readable paper has complete organised questions and matching choices',()=>{
 for(const parts of Object.values(READABLE_TRIAL_PARTS)) {
  for(const [part,first,last] of [[1,1,7],[2,8,15]]) {
   const parsed=organiseChoiceQuestions(parts[part],first,last);assert.ok(parsed);assert.equal(parsed.questions.length,last-first+1);
   for(const q of parsed.questions){assert.ok(q.stem);assert.deepEqual(q.choices.map(c=>c.letter),['A','B','C']);assert.ok(q.choices.every(c=>c.text));}
  }
  const matching=organiseMatching(parts[3]);assert.ok(matching);assert.equal(matching.options.length,7);assert.equal(new Set(matching.options.map(c=>c.letter)).size,7);
 }
});

import {listeningTestLabel} from '../src/data/trialListeningTests';
test('all years are complete, uniquely named, and preserve original matching letters',()=>{
 assert.equal(TRIAL_LISTENING_TESTS.filter(t=>t.year===2024).length,16);
 assert.equal(TRIAL_LISTENING_TESTS.filter(t=>t.year===2025).length,10);
 assert.equal(TRIAL_LISTENING_TESTS.filter(t=>t.year===2026).length,14);
 assert.equal(new Set(TRIAL_LISTENING_TESTS.map(listeningTestLabel)).size,40);
 for(const t of TRIAL_LISTENING_TESTS)assert.ok(listeningTestLabel(t).endsWith(String(t.year)));
 assert.deepEqual(organiseMatching(READABLE_TRIAL_PARTS['1HxkiDjmBwS7Fkx_m9RcgLrIB142QlGL3'][3])?.options.map(c=>c.letter),['A','B','C','D','F','G','H']);
});

test('ALL catalog tests have complete organised listening content, including scanned papers',()=>{
 for(const test of TRIAL_LISTENING_TESTS) {
  const parts=READABLE_TRIAL_PARTS[test.questionFileId];assert.ok(parts,`${test.name} ${test.year} has no organised paper`);
  assert.deepEqual(Object.keys(parts),['1','2','3','4']);
  const numbers=organisePassage(parts[4]).numbers;
  assert.deepEqual([...new Set(numbers)].sort((a,b)=>a-b),Array.from({length:10},(_,i)=>i+21),`${test.name} ${test.year} missing numbered blanks`);
 }
});

import {TRIAL_LISTENING_KEYS} from '../src/data/trialListeningKeys';
import {gradeListeningPart} from '../src/data/listeningScoring';
test('2024 schemes grade every matched paper and do not invent a Negeri Sembilan key',()=>{
 for(const t of TRIAL_LISTENING_TESTS.filter(t=>t.year===2024)){
  const key=TRIAL_LISTENING_KEYS[t.id];
  if(t.id==='negeri-sembilan-2024'){assert.equal(key,undefined);assert.throws(()=>gradeListeningPart(t.id,1,{}));continue;}
  assert.equal(key.sourceFileId,t.answerFileId);assert.equal(Object.keys(key.answers).length,30);
  const answers=Object.fromEntries(Object.entries(key.answers).map(([n,v])=>[n,v[0]]));
  for(const part of LISTENING_PARTS)assert.equal(gradeListeningPart(t.id,part.id,answers).correct,part.last-part.first+1);
 }
 assert.deepEqual(TRIAL_LISTENING_KEYS['perak-2024'].answers[24],['simplicity']);
 const answers=Object.fromEntries(Object.entries(TRIAL_LISTENING_KEYS['perlis-2024'].answers).map(([n,v])=>[n,v[0].toUpperCase()]));
 assert.equal(gradeListeningPart('perlis-2024',4,answers).correct,0);
});
