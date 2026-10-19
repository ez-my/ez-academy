import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dashboardAccess} from '../src/server/dashboardAccess';
import {nextPracticeDay} from '../src/data/practiceLimits';
import {englishJourney} from '../src/lib/englishJourney';
import {DAILY_WORDS,ALL_VOCABULARY,vocabularyForDay} from '../src/data/dailyVocabulary';

test('Free has one shared two-practice allowance, not two per skill',()=>{
 const d=dashboardAccess({plan:'free'},{},{used:1,bySkill:{speak:1}});
 assert.equal(d.sharedRemaining,1);for(const s of Object.values(d.skills)){assert.equal(s.remaining,1);assert.equal(s.shared,true);}
 assert.equal(d.skills.read.used,0);assert.equal(d.planLabel,'Free');
});
test('paid, Focus and expired accounts display actual package limits',()=>{
 const d=dashboardAccess({plan:'free'},{version:2,planId:'pro',expiresAt:200},{bySkill:{speak:2}},100);
 assert.equal(d.planLabel,'EZ Pro (existing)');assert.equal(d.skills.speak.remaining,10);
 const focus=dashboardAccess({plan:'free'},{focus:{read:{expiresAt:200}}},{used:2},100);
 assert.equal(focus.skills.read.limit,12);assert.equal(focus.skills.read.shared,false);assert.equal(focus.skills.speak.remaining,0);
 assert.equal(dashboardAccess({plan:'pro',planExpiresAt:50},{},{},100).planLabel,'Free');
});
test('paid starts update per-skill count without reducing the shared Free balance',()=>{
 const d=nextPracticeDay({used:1,bySkill:{read:1}},'2026-10-17','speak',true);
 assert.equal(d.used,1);assert.equal(d.bySkill.read,1);assert.equal(d.bySkill.speak,1);
 assert.equal(nextPracticeDay(d,'2026-10-17','write',false).used,2);
});
test('journey uses real score differences, preserves zero and blank days',()=>{
 const now=Date.parse('2026-10-17T12:00:00+08:00');
 const sessions=[{id:'a',type:'ReadEZ',timestamp:now-8*86400000,score:40},{id:'b',type:'ReadEZ',timestamp:now,score:60},{id:'c',type:'SpeakEZ',timestamp:now,score:0},{id:'f',type:'WriteEZ',timestamp:now+86400000,score:100}] as any;
 const j=englishJourney(sessions,now);assert.equal(j.skills[0].change,20);assert.equal(j.skills[2].score,0);assert.equal(j.skills[1].score,null);assert.equal(j.days[6].score,30);assert.equal(j.days[0].score,null);
 assert.equal(englishJourney([],now).days.every(d=>d.score===null),true);
});
test('daily vocabulary is stable within a Malaysia date and has no duplicate words',()=>{
 assert.equal(DAILY_WORDS.length,new Set(DAILY_WORDS.map(w=>w.id)).size);
 assert.deepEqual(vocabularyForDay('2026-10-17'),vocabularyForDay('2026-10-17'));
 assert.notEqual(vocabularyForDay('2026-10-17').id,vocabularyForDay('2026-10-18').id);
 for(const word of DAILY_WORDS)assert.ok(word.meaning&&word.malay&&word.example.toLowerCase().includes(word.word));
});
test('four-week chart keeps missing weeks blank and includes current week scores',()=>{
 const now=Date.parse('2026-10-17T12:00:00+08:00');
 const j=englishJourney([{type:'ReadEZ',timestamp:now-21*86400000,score:52},{type:'ReadEZ',timestamp:now,score:67}] as any,now);
 assert.deepEqual(j.weeks.map(w=>w.score),[52,null,null,67]);
});

test('C2 bank rotates on Malaysia calendar dates without losing legacy saved words',()=>{
 assert.equal(DAILY_WORDS.length,50);
 for(const w of DAILY_WORDS){assert.equal(w.level,'C2');assert.ok(w.sourceUrl.startsWith('https://dictionary.cambridge.org/'));assert.ok(w.partOfSpeech);}
 const ids=Array.from({length:50},(_,i)=>vocabularyForDay(new Date(Date.UTC(2026,9,17+i)).toISOString().slice(0,10)).id);
 assert.equal(new Set(ids).size,50);
 assert.ok(ALL_VOCABULARY.some(w=>w.id==='opportunity'));
 assert.equal(vocabularyForDay('2026-10-17').id,'profound');
 assert.notEqual(vocabularyForDay('2026-10-17').id,vocabularyForDay('2026-10-18').id);
});
