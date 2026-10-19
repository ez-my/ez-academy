import {useTrialProgress,trialStatusClass} from '../lib/practice';
import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,BookOpen,ExternalLink,Search,X,ZoomIn,ZoomOut} from 'lucide-react';
import {createPortal} from 'react-dom';
import {TRIAL_READING_TESTS,READING_PARTS,readingChoices,parseReadingDraft,type TrialReadingTest,type ReadingPaper,type ReadingPage} from '../data/trialReadingTests';
import {ReadingAnswerCheck} from './ReadingAnswerCheck';
import {ReadingPageText} from './ReadingPageText';
import {TRIAL_READING_KEYS} from '../data/trialReadingKeys';
const loaders=import.meta.glob<ReadingPaper>('../data/readingPapers/*.json',{import:'default'});
async function loadReadingPaper(id:string){const fn=loaders[`../data/readingPapers/${id}.json`];if(!fn)throw Error('Paper unavailable.');return fn();}
const button='min-h-11 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
function PageZoom({page,onClose}:{page:ReadingPage;onClose:()=>void}){
 const [zoom,setZoom]=useState(140),closeRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const focus=document.activeElement as HTMLElement;closeRef.current?.focus();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;focus?.focus();};},[]);
 return createPortal(<div role="dialog" aria-modal="true" aria-label={`Reading paper page ${page.number}`} onKeyDown={e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const items=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));const i=items.indexOf(document.activeElement as HTMLButtonElement);if(e.shiftKey&&i===0){e.preventDefault();items[items.length-1]?.focus();}else if(!e.shiftKey&&i===items.length-1){e.preventDefault();items[0]?.focus();}}}} className="fixed inset-0 z-[100] flex min-w-0 flex-col bg-obsidian">
  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/15 p-2 text-xs sm:p-3"><span>Page {page.number}</span><div className="flex items-center gap-2"><button type="button" aria-label="Zoom out" className={button} onClick={()=>setZoom(z=>Math.max(100,z-25))}><ZoomOut size={18}/></button><span>{zoom}%</span><button type="button" aria-label="Zoom in" className={button} onClick={()=>setZoom(z=>Math.min(300,z+25))}><ZoomIn size={18}/></button><button type="button" ref={closeRef} aria-label="Close page" className={button} onClick={onClose}><X size={18}/></button></div></div>
  <p className="px-3 py-2 text-xs text-white/60">Scroll to read. Close to answer.</p><div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-white"><img src={page.image} alt={`Original reading paper, page ${page.number}`} style={{width:`${zoom}%`,maxWidth:'none'}} className="block h-auto"/></div>
 </div>,document.body);
}
function ReadingWorkspace({test,uid,onBack,completed,blocked}:{test:TrialReadingTest;uid:string;onBack:()=>void;completed:number[];blocked:boolean}){
 const draftKey=`ez-reading-draft:${uid}:${test.id}`;
 const [answers,setAnswers]=useState<Record<string,string>>(()=>{try{return parseReadingDraft(localStorage.getItem(draftKey));}catch{return {};}});
 const [paper,setPaper]=useState<ReadingPaper|null>(null),[error,setError]=useState(''),[loadAttempt,setLoadAttempt]=useState(0);
 const [part,setPart]=useState(1),[tab,setTab]=useState<'questions'|'answers'>('questions'),[view,setView]=useState<'original'|'text'>('text'),[zoom,setZoom]=useState<ReadingPage|null>(null),[reset,setReset]=useState(0),[draftFailed,setDraftFailed]=useState(false);
 const top=useRef<HTMLDivElement>(null);
 useEffect(()=>{let current=true;setError('');loadReadingPaper(test.id).then(p=>{if(current)setPaper(p);}).catch(()=>{if(current)setError('Could not load this paper. Try again.');});return()=>{current=false;};},[test.id,loadAttempt]);
 useEffect(()=>{try{localStorage.setItem(draftKey,JSON.stringify(answers));setDraftFailed(false);}catch{setDraftFailed(true);}},[answers,draftKey]);
 const range=READING_PARTS.find(p=>p.id===part)!,numbers=Array.from({length:range.last-range.first+1},(_,i)=>range.first+i);
 const changePart=(n:number)=>{setPart(n);top.current?.scrollIntoView({block:'start'});};
 if(completed.includes(part))return <div className="space-y-4"><button className={button} onClick={onBack}>All tests</button><h2 className="text-xl font-semibold">{test.label} · Part {part} completed</h2><p className="text-sm text-white/65">This part is locked. Your score is saved in History.</p><div className="flex flex-wrap gap-2">{READING_PARTS.map(p=><button key={p.id} className={button+' '+trialStatusClass(completed.includes(p.id)?1:0,1)} disabled={completed.includes(p.id)} onClick={()=>setPart(p.id)}>Part {p.id}{completed.includes(p.id)?' ✓':''}</button>)}</div></div>;
 if(blocked)return <div className="space-y-3"><button className={button} onClick={onBack}>All tests</button><p>Your 2 free practices are used today. Come back tomorrow or upgrade.</p><a className="text-primary" href="/app/pricing">View plans</a></div>;
 return <div className="min-w-0 space-y-4" ref={top}>
  <header className="flex flex-wrap items-center justify-between gap-2"><button type="button" className={button+' inline-flex items-center gap-2'} onClick={onBack}><ArrowLeft size={16}/>All tests</button><a href={`https://drive.google.com/file/d/${test.questionFileId}/view`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs text-primary underline">Original paper <ExternalLink size={14}/></a></header>
  <div><h2 className="text-xl font-bold sm:text-2xl">{test.label}</h2><p className="mt-1 text-xs text-white/60">Reading · 40 questions · 5 parts</p></div>
  <nav aria-label="Reading test parts" className="grid grid-cols-3 gap-2 sm:grid-cols-5">{READING_PARTS.map(p=><button type="button" key={p.id} disabled={completed.includes(p.id)} aria-pressed={part===p.id} onClick={()=>changePart(p.id)} className={`${button} ${completed.includes(p.id)?trialStatusClass(1,1):part===p.id?'border-primary bg-primary text-black':''}`}>Part {p.id}{completed.includes(p.id)?' ✓':''}<span className="block text-[11px] font-normal">{p.first}–{p.last}</span></button>)}</nav>
  <div className="grid grid-cols-2 gap-2 lg:hidden" role="group" aria-label="Reading view">{(['questions','answers'] as const).map(t=><button type="button" key={t} aria-pressed={tab===t} onClick={()=>setTab(t)} className={`${button} ${tab===t?'bg-white/15':''}`}>{t==='questions'?'Questions':'Your answers'}</button>)}</div>
  <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
   <section aria-label="Reading questions" className={`${tab==='questions'?'block':'hidden'} min-w-0 space-y-3 lg:block`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">Part {part} · {range.label}</h3><div role="group" aria-label="Paper view" className="flex gap-1"><button type="button" className={button+(view==='original'?' bg-white/15':'')} aria-pressed={view==='original'} onClick={()=>setView('original')}>Pages</button><button type="button" className={button+(view==='text'?' bg-white/15':'')} aria-pressed={view==='text'} onClick={()=>setView('text')}>Read text</button></div></div>
    {error?<div role="alert" className="space-y-2 text-sm text-amber-200"><p>{error}</p><button type="button" className={button} onClick={()=>setLoadAttempt(n=>n+1)}>Try again</button></div>:!paper?<p role="status" className="text-sm text-white/60">Loading paper…</p>:
     paper[part]?.map(page=><article key={page.number} className="overflow-hidden rounded-xl border border-white/15 bg-[#111318]">
      <div className="flex items-center justify-between gap-2 px-3 py-2"><span className="text-xs text-white/60">Page {page.number}</span><button type="button" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary" onClick={()=>setZoom(page)}><ZoomIn size={16}/>Read large</button></div>
      {page.correction ? <div className="space-y-3 px-4 pb-4">
       <details className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs"><summary className="cursor-pointer font-semibold text-primary">Updated practice page</summary><p className="mt-2 leading-5 text-white/70">{page.correction}</p><p className="mt-1 text-white/50">Use this copy to answer. Read large shows the original for reference.</p></details>
       {page.figure&&<img src={page.figure} alt="Figure from the original question" loading="lazy" className="mx-auto h-auto max-h-64 max-w-full rounded-lg"/>}
       <ReadingPageText text={page.text}/>
      </div> : view==='original'?<button type="button" aria-label={`Enlarge page ${page.number}`} className="block w-full bg-white" onClick={()=>setZoom(page)}><img src={page.image} alt={`Part ${part}, original question page ${page.number}. Use Read large for details.`} loading="lazy" className="block h-auto w-full"/></button>:
       <div className="space-y-3 px-4 pb-4 text-sm leading-7 text-white/85"><p className="text-xs text-white/50">Pages shows the original. Read large lets you zoom.</p>{page.figure&&<button type="button" aria-label={`Enlarge picture on page ${page.number}`} className="mx-auto block w-full max-w-md overflow-hidden rounded-lg bg-white" onClick={()=>setZoom({...page,image:page.figure!})}><img src={page.figure} alt="Text or picture from the original question" loading="lazy" className="block h-auto w-full"/></button>}<ReadingPageText text={page.text}/></div>}
     </article>)}
    {paper&&!paper[part]?.length&&<p className="text-sm text-amber-200">Open the original paper to read this part.</p>}
   </section>
   <aside aria-label="Reading answer sheet" className={`${tab==='answers'?'block':'hidden'} min-w-0 space-y-4 lg:sticky lg:top-4 lg:block`}>
    <div className="space-y-3 rounded-2xl border border-white/15 bg-[#111318] p-3"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">Your answers</h3><span className="text-xs text-white/60">{Object.values(answers).filter(a=>a.trim()).length}/40</span></div><p className="text-xs text-white/60">Part {part}: {range.first}–{range.last}</p>{part===5&&<p className="text-xs text-white/60">37–40: one word{TRIAL_READING_KEYS[test.id]?.lowercaseOnly?' · lowercase only':''}.</p>}
     {numbers.map(n=>{const choices=readingChoices(n);return <div key={n} className="space-y-2 rounded-xl bg-white/5 p-3"><label htmlFor={`reading-answer-${n}`} className="block text-xs font-semibold">Question {n}</label>{choices.length?<div role="group" aria-label={`Question ${n} choices`} className={`grid gap-1 ${choices.length>4?'grid-cols-4':'grid-cols-3'} ${choices.length===4?'sm:grid-cols-4':''}`}>{choices.map(letter=><button type="button" key={letter} aria-label={`Question ${n}: ${letter}`} aria-pressed={answers[n]===letter} onClick={()=>setAnswers(a=>({...a,[n]:letter}))} className={`${button} px-2 ${answers[n]===letter?'border-primary bg-primary text-black':''}`}>{letter}</button>)}</div>:<input id={`reading-answer-${n}`} aria-label={`Question ${n} answer`} maxLength={100} autoComplete="off" autoCapitalize="none" spellCheck={false} value={answers[n]||''} onChange={e=>setAnswers(a=>({...a,[n]:e.target.value}))} className="min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-black/30 px-3 text-base"/>}</div>;})}
     {draftFailed&&<p role="alert" className="text-xs text-amber-200">This device cannot keep your draft. Keep this page open.</p>}
     <button type="button" className={button+' w-full text-xs'} onClick={()=>{if(window.confirm('Clear this test and start a new attempt?')){setAnswers({});setReset(n=>n+1);}}}>Clear answers</button>
    </div>
    <ReadingAnswerCheck test={test} uid={uid} part={part} answers={answers} reset={reset}/>
   </aside>
  </div>
  <button type="button" className={button+' w-full lg:hidden'} onClick={()=>{setTab('answers');top.current?.scrollIntoView({block:'start'});}}>Answer Part {part}</button>
  <div className="flex justify-between gap-2"><button type="button" disabled={part===1} className={button+' disabled:opacity-30'} onClick={()=>changePart(part-1)}>Previous</button><button type="button" disabled={part===5} className={button+' disabled:opacity-30'} onClick={()=>changePart(part+1)}>Next part</button></div>
  {zoom&&<PageZoom page={zoom} onClose={()=>setZoom(null)}/>}
 </div>;
}
export function TrialReadingLibrary({uid,onOtherPractice}:{uid:string;onOtherPractice:()=>void}){
 const [test,setTest]=useState<TrialReadingTest|null>(null),[query,setQuery]=useState(''),[year,setYear]=useState<number|null>(null);
 const progress=useTrialProgress(uid,'read');
 if(progress.loading)return <p role="status">Loading progress…</p>;
 if(progress.error)return <p role="alert">{progress.error} Reload to try again.</p>;
 if(test)return <ReadingWorkspace key={`${uid}:${test.id}`} test={test} uid={uid} completed={progress.parts(test.id)} blocked={progress.blocked} onBack={()=>setTest(null)}/>;
 const filtered=TRIAL_READING_TESTS.filter(t=>(!year||t.year===year)&&t.label.toLowerCase().includes(query.trim().toLowerCase()));
 return <div className="min-w-0 space-y-4"><header><h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl"><BookOpen size={22} className="text-primary"/>ReadEZ</h1><p className="mt-2 text-sm text-white/65">Choose a trial paper. Read, answer, then check each part.</p></header>
  <label className="relative block"><Search size={18} className="absolute left-3 top-3 text-white/40"/><input type="search" aria-label="Find a reading test" placeholder="Find a state or school" value={query} onChange={e=>setQuery(e.target.value)} className="min-h-11 w-full min-w-0 rounded-xl border border-white/15 bg-white/5 py-2 pl-10 pr-3 text-base"/></label>
  <div role="group" aria-label="Choose reading test year" className="flex flex-wrap gap-2">{[null,2026,2025,2024].map(y=><button type="button" key={y||'all'} aria-pressed={year===y} className={`${button} ${year===y?'border-primary bg-primary text-black':''}`} onClick={()=>setYear(y)}>{y||'All years'}</button>)}</div>
  {progress.blocked&&<p role="status" className="text-sm text-amber-200">Your 2 free practices are used today. Come back tomorrow or upgrade.</p>}<p className="text-xs text-white/60">New · Amber: partly done · Green: completed and locked</p><p className="text-xs text-white/50">{filtered.length} tests</p><div className="flex flex-wrap gap-2">{filtered.map(t=><button type="button" key={t.id} aria-label={`${t.label}${progress.parts(t.id).length?' '+progress.parts(t.id).length+'/5':''}`} disabled={progress.blocked||progress.parts(t.id).length>=5} className={button+' text-left '+trialStatusClass(progress.parts(t.id).length,5)} onClick={()=>setTest(t)}>{t.label}{progress.parts(t.id).length>0?<span className="ml-2 text-xs">{progress.parts(t.id).length>=5?'✓ Done':`${progress.parts(t.id).length}/5`}</span>:null}</button>)}</div>{!filtered.length&&<p className="text-sm text-white/60">No tests found. Try another name.</p>}
  <button type="button" className={button+' text-xs'} onClick={onOtherPractice}>Other reading practice</button>
 </div>;
}

