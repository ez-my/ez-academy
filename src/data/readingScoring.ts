import {READING_PARTS,TRIAL_READING_TESTS,type ReadingResult} from './trialReadingTests';
import {TRIAL_READING_KEYS} from './trialReadingKeys';
import type {ListeningPartResult} from '../types/listening';
import type {PracticeSession} from '../types';
const normalise=(s:string)=>s.normalize('NFKC').trim().replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').toLowerCase();
export function canCheckReadingPart(testId:string,part:number){
 const key=TRIAL_READING_KEYS[testId],range=READING_PARTS.find(p=>p.id===part);
 return !!(key&&range&&!key.unverifiedParts?.includes(part)&&Array.from({length:range.last-range.first+1},(_,i)=>range.first+i).every(n=>key.answers[n]?.length));
}
export function gradeReadingPart(testId:string,part:number,answers:Record<string,string>):ListeningPartResult{
 const range=READING_PARTS.find(p=>p.id===part),key=TRIAL_READING_KEYS[testId];
 if(!range)throw Error('Choose a test part.');
 if(!canCheckReadingPart(testId,part))throw Error('This part needs a checked answer key. Your answers are kept.');
 const snapshot:Record<string,string>={};
 const questions=Array.from({length:range.last-range.first+1},(_,i)=>{
  const number=range.first+i,answer=(answers[number]||'').trim(),accepted=key.answers[number];
  if(!answer)throw Error('Answer every question in this part first.');
  snapshot[number]=answer;
  return {number,answer,accepted,correct:accepted.some(v=>normalise(v)===normalise(answer)&&(!key.lowercaseOnly||number<37||answer===answer.toLowerCase()))};
 });
 return {part,answers:snapshot,questions,total:questions.length,correct:questions.filter(q=>q.correct).length};
}
export function sameReadingAnswers(p:ListeningPartResult,answers:Record<string,string>){return Object.entries(p.answers).every(([n,v])=>(answers[n]||'').trim()===v);}
export function buildReadingSession(uid:string,attemptId:string,testId:string,part:number,answers:Record<string,string>,previous?:PracticeSession):PracticeSession&{readingResult:ReadingResult}{
 const test=TRIAL_READING_TESTS.find(t=>t.id===testId);if(!test)throw Error('This test was not found.');
 if(previous&&(previous.userId!==uid||previous.testSetId!==testId))throw Error('Start a new attempt for this test.');
 const current=gradeReadingPart(testId,part,answers),parts:ReadingResult['parts']={};
 for(const old of Object.values(previous?.readingResult?.parts||{}))if(old?.answers&&sameReadingAnswers(old,answers)){
  try{parts[old.part]=gradeReadingPart(testId,old.part,old.answers);}catch{/* Skip incomplete old data. */}
 }
 parts[part]=current;
 const correct=Object.values(parts).reduce((n,p)=>n+p.correct,0),total=Object.values(parts).reduce((n,p)=>n+p.total,0);
 const result={parts,correct,total,percent:Math.round(correct/total*100)};
 const feedback=`# ${test.label}\n\nScore: **${correct}/${total} (${result.percent}%)**${total<40?' — checked parts only':''}\n\n`+
  Object.values(parts).sort((a,b)=>a.part-b.part).map(p=>`## Part ${p.part}: ${p.correct}/${p.total}\n\n`+p.questions.map(q=>`${q.number}. ${q.correct?'Correct':'Incorrect'} — Your answer: ${q.answer}. Correct answer: ${q.accepted.join(' / ')}.`).join('\n\n')).join('\n\n');
 return {id:`read_trial_${attemptId}`,userId:uid,type:'ReadEZ',timestamp:Date.now(),duration:0,testSetId:testId,score:result.percent,
  answers:Object.assign({},...Object.values(parts).map(p=>p.answers)),readingResult:result,feedback,
  transcript:`${test.label} · ${correct}/${total}${total<40?' · checked parts':''}`,metrics:{fluency:0,grammar:0,vocabulary:0,comprehension:result.percent,pronunciation:0,structure:0}};
}
