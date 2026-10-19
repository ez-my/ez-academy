import {practiceRequest} from '../lib/practice';
import React,{useEffect,useRef,useState} from 'react';
import {auth} from '../lib/firebase';
import {READING_PARTS,type TrialReadingTest,type ReadingResult} from '../data/trialReadingTests';
import {canCheckReadingPart,sameReadingAnswers} from '../data/readingScoring';
export function ReadingAnswerCheck({test,uid,part,answers,reset}:{test:TrialReadingTest;uid:string;part:number;answers:Record<string,string>;reset:number}){
 const storageKey=`ez-reading-results:${uid}:${test.id}`;
 const [attempt,setAttempt]=useState<{id:string;result?:ReadingResult}>(()=>{
  try{const d=JSON.parse(localStorage.getItem(storageKey)||'null');if(/^[a-f0-9-]{36}$/i.test(d?.id)&&d?.result?.parts)return d;}catch{}
  return {id:crypto.randomUUID()};
 });
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[cacheError,setCacheError]=useState(false);
 const resetRef=useRef(reset),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(resetRef.current!==reset){resetRef.current=reset;setAttempt({id:crypto.randomUUID()});setError('');}},[reset]);
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(attempt));setCacheError(false);}catch{setCacheError(true);}},[attempt,storageKey]);
 const range=READING_PARTS.find(p=>p.id===part)!;
 const remaining=Array.from({length:range.last-range.first+1},(_,i)=>range.first+i).filter(n=>!answers[n]?.trim()).length;
 const checked=Object.values(attempt.result?.parts||{}).filter(p=>sameReadingAnswers(p,answers)),current=checked.find(p=>p.part===part);
 const correct=checked.reduce((n,p)=>n+p.correct,0),total=checked.reduce((n,p)=>n+p.total,0),available=canCheckReadingPart(test.id,part);
 const check=async()=>{
  if(busy||remaining||!available)return;setBusy(true);setError('');
  const requestReset=reset,answerSnapshot={...answers};
  try{
   if(auth.currentUser?.uid!==uid)throw Error('Please sign in again to save your score.');
   const data=await practiceRequest('reading/check',{testId:test.id,part,answers:answerSnapshot});
   const session={readingResult:data.result};
   window.dispatchEvent(new Event('ez-practice-update'));
   if(alive.current&&resetRef.current===requestReset)setAttempt({id:attempt.id,result:session.readingResult});
  }catch(e){if(alive.current)setError((e as Error).message);}
  finally{if(alive.current)setBusy(false);}
 };
 return <section aria-label="Check reading answers" className="min-w-0 space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">Part {part} score</h3>
   <button type="button" disabled={busy||remaining>0||!available} onClick={check} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-40">{busy?'Saving…':'Check your answers'}</button>
  </div>
  {!available?<p className="text-xs leading-5 text-white/65">This part needs a checked answer key. Your answers are kept.</p>:remaining>0?<p className="text-xs text-white/65">Answer {remaining} more {remaining===1?'question':'questions'} to check.</p>:!current&&<p className="text-xs text-white/65">{attempt.result?.parts[part]?'Answers changed. Check again.':'Check this part to see and save your score.'}</p>}
  {error&&<p role="alert" className="text-sm text-amber-200">{error}</p>}
  {current&&<div aria-live="polite" className="space-y-3"><p className="font-bold text-primary">{current.correct}/{current.total} <span className="text-xs font-normal text-white/60">· Saved in History</span></p>
   <details className="rounded-xl bg-black/20 p-3"><summary className="cursor-pointer text-sm font-semibold">See correct answers</summary>
    <ol className="mt-3 space-y-3 text-sm">{current.questions.map(q=><li key={q.number} className="break-words"><span className={q.correct?'text-primary':'text-amber-200'}>{q.number}. {q.correct?'Correct':'Incorrect'}</span><span className="block text-white/65">Your answer: {q.answer}</span>{!q.correct&&<span className="block">Correct answer: {q.accepted.join(' / ')}</span>}</li>)}</ol>
   </details>
  </div>}
  {total>0&&<div className="border-t border-white/10 pt-3 text-sm"><p className="font-semibold">{total===40?'Test score':'Checked parts'}: {correct}/{total} · {Math.round(correct/total*100)}%</p><p className="mt-1 text-xs text-white/60">{total===40?'All 5 parts checked.':'Check all 5 parts for your score out of 40.'}</p></div>}
  {cacheError&&<p className="text-xs text-amber-200">This device cannot keep your result. Saved marks are in History.</p>}
 </section>;
}
