import React, {useEffect, useRef, useState} from 'react';
import {auth} from '../lib/firebase';
import {LISTENING_PARTS, type TrialListeningTest} from '../data/trialListeningTests';
import type {ListeningResult, ListeningPartResult} from '../types/listening';

function matches(result:ListeningPartResult, answers:Record<string,string>) {
  return Object.entries(result.answers).every(([n,a])=>(answers[n]||'').trim()===a);
}
function readStored(key:string): {attemptId:string; result?:ListeningResult} {
  try {
    const stored=JSON.parse(localStorage.getItem(key)||'null');
    if (/^[a-f0-9-]{36}$/i.test(stored?.attemptId) && stored?.result?.parts &&
      Object.values(stored.result.parts).every((p:any)=>p && typeof p.part==='number' && p.answers && Array.isArray(p.questions))) return stored;
  } catch { /* Start a fresh attempt if local storage is unavailable or damaged. */ }
  return {attemptId:crypto.randomUUID()};
}

export function ListeningAnswerCheck({test,uid,part,answers,reset=0}:{test:TrialListeningTest;uid:string;part:number;answers:Record<string,string>;reset?:number}) {
  const storageKey=`ez-listening-results:${uid}:${test.id}`;
  const [stored,setStored]=useState(()=>readStored(storageKey));
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [cacheFailed,setCacheFailed]=useState(false);
  const request=useRef<AbortController|null>(null);
  const resetRef=useRef(reset);
  useEffect(()=>()=>request.current?.abort(),[]);
  useEffect(()=>{
    if(resetRef.current===reset)return;
    resetRef.current=reset;request.current?.abort();request.current=null;setBusy(false);setError('');
    setStored({attemptId:crypto.randomUUID()});
  },[reset]);
  useEffect(()=>{
    try {localStorage.setItem(storageKey,JSON.stringify(stored));setCacheFailed(false);}
    catch {setCacheFailed(true);}
  },[stored,storageKey]);
  const range=LISTENING_PARTS.find(p=>p.id===part)!;
  const numbers=Array.from({length:range.last-range.first+1},(_,i)=>range.first+i);
  const remaining=numbers.filter(n=>!answers[n]?.trim()).length;
  const checked=Object.values(stored.result?.parts||{}).filter(p=>matches(p,answers));
  const current=checked.find(p=>p.part===part);
  const correct=checked.reduce((n,p)=>n+p.correct,0),total=checked.reduce((n,p)=>n+p.total,0);
  const check=async()=>{
    if(request.current||remaining||!test.answerFileId)return;
    const controller=new AbortController();request.current=controller;setBusy(true);setError('');
    const timeout=setTimeout(()=>controller.abort(),30000);
    try {
      if(!auth.currentUser||auth.currentUser.uid!==uid)throw Error('Please sign in again to check your answers.');
      const token=await auth.currentUser.getIdToken();
      const response=await fetch('/api/listening/check',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({testId:test.id,part,answers,attemptId:stored.attemptId}),signal:controller.signal});
      let data;
      if(response.headers.get('content-type')?.includes('application/json')) {
        data=await response.json();
        if(!response.ok||!data.saved||!data.result?.parts)throw Error(data.error||'Could not save your score. Please try again.');
      } else {throw Error('Could not reach the score service. Please try again.');}
      window.dispatchEvent(new Event('ez-practice-update'));
      if(!controller.signal.aborted)setStored({attemptId:stored.attemptId,result:data.result});
    } catch(e) {
      if(request.current===controller)setError(controller.signal.aborted?'Connection took too long. Your answers are kept. Try again.':
        e instanceof TypeError?'Connect to check and save your score. Your answers are kept.':(e as Error).message);
    } finally {clearTimeout(timeout);if(request.current===controller){request.current=null;setBusy(false);}}
  };
  return <section aria-label="Check listening answers" className="min-w-0 space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-base font-bold">Part {part} score</h3>
      <button type="button" disabled={busy||remaining>0||!test.answerFileId} onClick={check}
        className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">
        {busy?'Checking…':'Check your answers'}
      </button>
    </div>
    {!test.answerFileId?<p className="text-xs text-white/65">The matching answer key is not available yet. Your answers are kept.</p>:
      remaining>0?<p className="text-xs text-white/65">Answer {remaining} more {remaining===1?'question':'questions'} in Part {part} to check.</p>:
      !current && <p className="text-xs text-white/65">{stored.result?.parts[part]?'Answers changed. Check again.':'Check this part to see and save your score.'}</p>}
    {error&&<p role="alert" className="text-sm text-amber-200">{error}</p>}
    {current&&<div aria-live="polite" className="space-y-3">
      <p className="text-lg font-bold text-primary">{current.correct}/{current.total} <span className="text-xs font-normal text-white/65">· Saved in History</span></p>
      <details className="rounded-xl bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-semibold">See correct answers</summary>
        <ol className="mt-3 space-y-2 text-sm">{current.questions.map(q=><li key={q.number} className="break-words">
          <span className={q.correct?'text-primary':'text-amber-200'}>{q.number}. {q.correct?'Correct':'Incorrect'}</span>
          <span className="block text-white/70">Your answer: {q.answer}</span>
          {!q.correct&&<span className="block">Correct answer: {q.accepted.join(' / ')}</span>}
        </li>)}</ol>
      </details>
    </div>}
    {total>0&&<div className="border-t border-white/10 pt-3 text-sm">
      <p className="font-semibold">{total===30?'Test score':'Checked parts'}: {correct}/{total} · {Math.round(correct/total*100)}%</p>
      <p className="mt-1 text-xs text-white/60">{total===30?'All 4 parts checked.':'Check all 4 parts for your score out of 30.'}</p>
    </div>}
    {cacheFailed&&<p className="text-xs text-amber-200">This device cannot keep your result. Saved scores are still in History.</p>}
  </section>;
}
