import {preserveOriginalTrialText} from '../lib/trialPaperText';
import {isAuthorizedTrialAsset} from '../lib/trialPaperRights';
import {TrialPaperRightsNotice} from './TrialPaperRightsNotice';
import {useTrialProgress,trialStatusClass} from '../lib/practice';
import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ExternalLink, Headphones, Search, Trash2} from 'lucide-react';
import {TRIAL_LISTENING_TESTS, LISTENING_PARTS, driveFileUrl, drivePreviewUrl, draftKey, parseTrialDraft, listeningTestLabel, type TrialListeningTest} from '../data/trialListeningTests';

import {cleanPaperText, organiseChoiceQuestions, organiseMatching, organisePassage} from '../data/listeningLayout';
import {ListeningAnswerCheck} from './ListeningAnswerCheck';
import {ListeningAudioPlayer} from './ListeningAudioPlayer';
import {TRIAL_LISTENING_KEYS} from '../data/trialListeningKeys';
import {READABLE_TRIAL_PARTS} from '../data/trialListeningParts';

const actionClass = 'min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

function Passage({text,answers,onAnswer}:{text:string;answers:Record<string,string>;onAnswer:(number:string,value:string)=>void}) {
  const organised=organisePassage(text);
  const blocks=organised.body.split(/\n\s*\n/).filter(Boolean);
  return <div className="space-y-4"><div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-7">{organised.instructions}</div>{organised.title && <h5 className="text-lg font-bold">{organised.title}</h5>}{blocks.map((block,i)=><p key={i} className="leading-9">{block.split(/(\((?:2[1-9]|30)\)\s*_{2,})/g).map((piece,j)=>{
    const number=piece.match(/^\((2[1-9]|30)\)\s*_{2,}$/)?.[1];
    return number ? <span key={j} className="mx-1 inline-flex items-center gap-1"><span className="text-sm font-bold text-primary">({number})</span><input aria-label={`Blank ${number}`} value={answers[number]||''} maxLength={100} autoComplete="off" onChange={e=>onAnswer(number,e.target.value)} className="my-1 min-h-11 w-36 rounded-lg border border-primary/40 bg-black/30 px-2 text-base text-white"/></span> : <React.Fragment key={j}>{piece.replace(/\s+/g,' ')}</React.Fragment>;
  })}</p>)}</div>;
}

function TrialWorkspace({test, uid, onBack, completed,blocked}: {test: TrialListeningTest; uid: string; onBack: () => void; completed:number[];blocked:boolean}) {
  const key = draftKey(uid, test.id);
  const [answers, setAnswers] = useState<Record<string,string>>(() => {
    try { return parseTrialDraft(localStorage.getItem(key)); } catch { return {}; }
  });
  const [part, setPart] = useState(1);
  const [mobileTab, setMobileTab] = useState<'questions'|'answers'>('questions');
  const [original, setOriginal] = useState(false);
  const readable = READABLE_TRIAL_PARTS[test.questionFileId]?.[part]?.replace(/^\d+(?=PART|Part)/, '');
  const originalReadableText = readable ? preserveOriginalTrialText(readable) : null;
  const [paper, setPaper] = useState<'questions'|'answers'>('questions');
  const [checkReset, setCheckReset] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [paperLoading, setPaperLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(answers)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }, [key, answers]);
  useEffect(() => {
    const online = () => setIsOnline(true), offline = () => setIsOnline(false);
    window.addEventListener('online',online); window.addEventListener('offline',offline);
    return () => {window.removeEventListener('online',online); window.removeEventListener('offline',offline);};
  }, []);
  useEffect(() => {setPaperLoading(true);setLoadFailed(false);}, [paper, reload]);

  const answered = Object.values(answers).filter(value => value.trim()).length;
  const range = LISTENING_PARTS.find(item => item.id === part)!;
  const questions = Array.from({length:range.last-range.first+1},(_,i)=>range.first+i);
  const organised = readable && part<3 ? organiseChoiceQuestions(readable,range.first,range.last) : null;
  const matching = readable && part===3 ? organiseMatching(readable) : null;
  const paperId = paper === 'answers' ? test.answerFileId! : test.questionFileId;

  if(completed.includes(part))return <div className="space-y-4"><button className={actionClass} onClick={onBack}>All tests</button><h2 className="text-xl font-semibold">{listeningTestLabel(test)} · Part {part} completed</h2><p className="text-sm text-white/65">This part is locked. Your score is saved in History.</p><div className="flex flex-wrap gap-2">{LISTENING_PARTS.map(p=><button key={p.id} className={actionClass+' '+trialStatusClass(completed.includes(p.id)?1:0,1)} disabled={completed.includes(p.id)} onClick={()=>setPart(p.id)}>Part {p.id}{completed.includes(p.id)?' ✓':''}</button>)}</div></div>;
 if(blocked)return <div className="space-y-3"><button className={actionClass} onClick={onBack}>All tests</button><p>Your 2 free practices are used today. Come back tomorrow or upgrade.</p><a className="text-primary" href="/app/pricing">View plans</a></div>;
  return <div className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <button type="button" className={actionClass} onClick={onBack}><ArrowLeft size={18}/> All tests</button>
      <span className="text-sm text-white/60">{test.year} trial · Practice mode</span>
    </header>
    <div>
      <h2 className="text-xl font-bold text-white sm:text-2xl">{listeningTestLabel(test)}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/65">Listen and answer one part at a time.</p>
    </div>
    {!isOnline && <p role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">Connect to the internet to load the paper and recording. Your saved answers stay on this device.</p>}

    <div className="sticky top-0 z-20 space-y-2 bg-obsidian pb-2 lg:top-4">
        <section aria-label="Listening audio" className=" overflow-hidden rounded-2xl border border-white/15 bg-[#111318] p-3 shadow-lg lg:top-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Headphones size={18} className="text-primary"/> Listening audio</h3>
            <a href={driveFileUrl(test.audioFileId)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs text-primary underline">Open audio <ExternalLink size={14}/></a>
          </div>
          <ListeningAudioPlayer testId={test.id} label={listeningTestLabel(test)} reload={reload}/>

        </section>

    <div className="flex gap-2 lg:hidden" role="group" aria-label="Listening view">
      {(['questions','answers'] as const).map(tab=><button key={tab} type="button" aria-pressed={mobileTab===tab} className={`${actionClass} flex-1 ${mobileTab===tab?'bg-primary text-black':''}`} onClick={()=>setMobileTab(tab)}>{tab==='questions'?'Questions':'Your answers'}</button>)}
    </div>
    </div>
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Test parts">
      {LISTENING_PARTS.map(item=><button key={item.id} type="button" disabled={completed.includes(item.id)} aria-pressed={part===item.id} onClick={()=>{setPart(item.id);setPaper('questions');}} className={`${actionClass} px-2 ${completed.includes(item.id)?trialStatusClass(1,1):part===item.id?'bg-primary text-black':''}`}>Part {item.id}{completed.includes(item.id)?' ✓':''}</button>)}
    </div>
    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className={`${mobileTab==='questions'?'block':'hidden'} min-w-0 space-y-4 lg:block`}>
        <section aria-label="Question paper" className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-[#111318]">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <h3 className="text-sm font-bold">{paper==='answers'?'Answer key':'Question paper'}</h3>
            <a className="inline-flex min-h-11 items-center gap-1 text-xs text-primary underline" href={driveFileUrl(paperId)} target="_blank" rel="noopener noreferrer">Open full screen <ExternalLink size={14}/></a>
          </div>
          {(original || !readable || paper==='answers') && paperLoading && <p role="status" className="px-3 pb-3 text-xs text-white/60">Loading the paper…</p>}
          {paper==='questions' && readable && !original ? <div className="space-y-5 px-4 pb-6 text-base leading-7 text-white sm:px-5 sm:text-lg">
            {originalReadableText ? <div className="whitespace-pre-wrap break-words">{originalReadableText}</div> : organised ? <>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><h4 className="mb-2 text-sm font-bold text-primary">Part {part} · Questions {range.first}–{range.last}</h4><p>{organised.instructions.replace(/^Part [12](?: \(SET 1\))?/i,'').replace(/^Questions \d+ to \d+ /,'')}</p></div>
              {organised.questions.map(q=><article key={q.number} className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                <h4 className="font-semibold"><span className="mr-2 text-primary">{q.number}.</span>{q.stem}</h4>
                <div className="space-y-2" role="group" aria-label={`Question ${q.number} full choices`}>
                  {q.choices.map(choice=><button key={choice.letter} type="button" aria-pressed={answers[q.number]===choice.letter} onClick={()=>setAnswers(prev=>({...prev,[q.number]:prev[q.number]===choice.letter?'':choice.letter}))} className={`flex min-h-12 w-full items-start gap-3 rounded-xl border p-3 text-left ${answers[q.number]===choice.letter?'border-primary bg-primary/15':'border-white/10 bg-black/20 hover:bg-white/10'}`}><span className="font-bold text-primary">{choice.letter}</span><span>{choice.text}</span></button>)}
                </div>
              </article>)}
            </> : matching ? <>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><h4 className="mb-2 font-bold text-primary">Part 3 · Match speakers 1–5</h4><p>{matching.instructions.replace(/^Part 3/i,'')}</p></div>
              <div className="space-y-2">{matching.options.map(option=><div key={option.letter} className="flex gap-3 rounded-xl border border-white/15 bg-white/5 p-4"><span className="font-bold text-primary">{option.letter}</span><p>{option.text}</p></div>)}</div>
              <p className="text-sm text-white/65">Use “Your answers” to choose a letter for questions 16–20.</p>
            </> : <div className="rounded-xl bg-white/5 p-4"><h4 className="mb-4 font-bold text-primary">Part {part} · Questions {range.first}–{range.last}</h4>{part===4 ? <>{TRIAL_LISTENING_KEYS[test.id]?.lowercaseRequired && <p className="mb-3 text-sm text-amber-200">Use small letters for all answers in this part.</p>}<Passage text={readable} answers={answers} onAnswer={(number,value)=>setAnswers(prev=>({...prev,[number]:value}))}/></> : <div className="whitespace-pre-wrap leading-8">{cleanPaperText(readable)}</div>}</div>}
          </div> : <iframe key={`${paperId}:${reload}`} src={drivePreviewUrl(paperId)} title={`${test.name} ${paper==='answers'?'answer key':'question paper'}`} className="h-[65svh] min-h-[420px] w-full border-0 bg-white sm:h-[75vh] lg:h-[760px]" onLoad={()=>setPaperLoading(false)} onError={()=>{setPaperLoading(false);setLoadFailed(true);}}/>}
          {readable && paper==='questions' && <button type="button" className={`${actionClass} m-3`} onClick={()=>setOriginal(!original)}>{original?'Easy reading view':'Show original paper'}</button>}
          <p className="px-3 py-3 text-xs leading-relaxed text-white/55">Use the part buttons to move through the test. You can open the original paper to check pictures and page layout.</p>
        </section>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={actionClass} onClick={()=>{setReload(n=>n+1);}}>Reload paper and audio</button>
          {test.answerFileId && <button type="button" className={actionClass} onClick={()=>setPaper(paper==='answers'?'questions':'answers')}>{paper==='answers'?'Back to questions':'Show answer key'}</button>}
        </div>
        {loadFailed && <p role="alert" className="text-sm text-amber-200">The file could not load. Try reloading, or open the original file using the links above.</p>}
        {!test.answerFileId && <p className="text-sm text-white/60">A matching answer key was not found for this set. Your answers will not receive an automatic score.</p>}
      </div>

      <aside aria-label="Your answer sheet" className={`${mobileTab==='answers'?'block':'hidden'} min-w-0 rounded-2xl border border-white/15 bg-[#111318] p-4 lg:block`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold">Your answers</h3>
          <span className="text-sm text-primary" aria-live="polite">{answered}/30</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/60">{saveFailed?'Answers cannot be saved on this device. Keep this page open.':'Answers are saved on this device for this test.'}</p>
        <div className="my-4 grid grid-cols-2 gap-2" role="group" aria-label="Answer sheet parts">
          {LISTENING_PARTS.map(item=><button type="button" key={item.id} disabled={completed.includes(item.id)} onClick={()=>setPart(item.id)} aria-pressed={part===item.id} className={`min-h-12 rounded-xl border px-2 py-2 text-sm font-semibold ${part===item.id?'border-primary bg-primary text-black':'border-white/15 bg-white/5 text-white'}`}>Part {item.id}<span className="block text-xs font-normal">{item.first}–{item.last}</span></button>)}
        </div>
        <p className="mb-3 text-xs text-white/60">Part {part}: use the questions in the paper. {part<3?'Choose A, B or C.':part===3?'Choose a letter from the paper’s list.':'Type your answer using the paper’s word limit.'}</p>
        <div className="space-y-3">
          {questions.map(number=><div key={number} className="rounded-xl bg-white/5 p-3">
            <label htmlFor={part===4?`trial-answer-${number}`:undefined} className="mb-2 block text-sm font-semibold">Question {number}</label>
            {part<4 ? <div role="group" aria-label={`Question ${number} choices`} className={`grid gap-2 ${part===3?'grid-cols-4':'grid-cols-3'}`}>
              {(part===3?(matching?.options.map(option=>option.letter)||['A','B','C','D','E','F','G','H']):['A','B','C']).map(letter=><button type="button" key={letter} aria-label={`Question ${number}: ${letter}`} aria-pressed={answers[number]===letter} onClick={()=>setAnswers(prev=>({...prev,[number]:prev[number]===letter?'':letter}))} className={`min-h-11 rounded-lg border font-bold ${answers[number]===letter?'border-primary bg-primary text-black':'border-white/15 bg-black/20 hover:bg-white/10'}`}>{letter}</button>)}
            </div> : <input id={`trial-answer-${number}`} value={answers[number]||''} onChange={e=>setAnswers(prev=>({...prev,[number]:e.target.value}))} maxLength={100} autoComplete="off" className="min-h-12 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-base text-white focus:border-primary focus:outline-none"/>}
          </div>)}
        </div>
        
        {!confirmClear ? <button type="button" onClick={()=>setConfirmClear(true)} className={`${actionClass} mt-4 w-full`}><Trash2 size={16}/> Clear answers</button> : <div className="mt-4 rounded-xl border border-amber-400/30 p-3 text-sm">
          <p>Clear all 30 answers for this test?</p>
          <div className="mt-3 flex gap-2"><button type="button" className={actionClass} onClick={()=>{setAnswers({});setCheckReset(value=>value+1);setConfirmClear(false);}}>Yes, clear</button><button type="button" className={actionClass} onClick={()=>setConfirmClear(false)}>Keep answers</button></div>
        </div>}
      </aside>
    </div>
    <ListeningAnswerCheck test={test} uid={uid} part={part} answers={answers} reset={checkReset}/>
  </div>;
}

export function TrialListeningLibrary({uid}: {uid:string}) {
  const [search,setSearch]=useState('');
  const [year,setYear]=useState<'all'|'2026'|'2025'|'2024'>('all');
  const [selected,setSelected]=useState<TrialListeningTest|null>(null);
  const tests=useMemo(()=>TRIAL_LISTENING_TESTS.filter(test=>isAuthorizedTrialAsset(test,'listening')&&(year==='all'||String(test.year)===year) && listeningTestLabel(test).toLowerCase().includes(search.trim().toLowerCase())),[search,year]);
  const progress=useTrialProgress(uid,'listen');
  if(progress.loading)return <p role="status">Loading progress…</p>;
  if(progress.error)return <p role="alert">{progress.error} Reload to try again.</p>;
  if(selected&&!isAuthorizedTrialAsset(selected,'listening'))return <TrialPaperRightsNotice skill="Listening"/>;
  if(selected) return <TrialWorkspace key={`${uid}:${selected.id}`} uid={uid} test={selected} completed={progress.parts(selected.id)} blocked={progress.blocked} onBack={()=>setSelected(null)}/>;
  return <div className="min-w-0 space-y-6">
    <header>
      <p className="text-sm font-semibold text-primary">SPM trial listening · 2024–2026</p>
      <h1 className="mt-2 text-xl font-bold sm:text-2xl">Choose a listening test</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">Choose a test. Listen, answer, then check each part.</p>
    </header>
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4"><Search size={18} className="shrink-0 text-white/50"/><input aria-label="Find a listening test" placeholder="Find a state or test set" type="search" value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none"/></label>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Choose test year">{(['all','2026','2025','2024'] as const).map(value=><button key={value} type="button" aria-pressed={year===value} onClick={()=>setYear(value)} className={`${actionClass} ${year===value?'bg-primary text-black':''}`}>{value==='all'?'All years':value}</button>)}</div>
    {progress.blocked&&<p role="status" className="text-sm text-amber-200">Your 2 free practices are used today. Come back tomorrow or upgrade.</p>}
    <p className="text-xs text-white/60">New · Amber: partly done · Green: completed and locked</p>
    <p className="text-sm text-white/60" aria-live="polite">{tests.length} {tests.length===1?'test':'tests'} available</p>
    <div className="flex min-w-0 flex-wrap gap-2">
      {tests.map(test=><button type="button" key={test.id} disabled={progress.blocked||progress.parts(test.id).length>=4} onClick={()=>{setSelected(test);window.scrollTo({top:0});}} className={(trialStatusClass(progress.parts(test.id).length,4)||'border-white/20 bg-white/5')+" inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-4 py-2 text-left text-sm font-semibold transition hover:border-primary/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"}>
        <Headphones size={16} className="shrink-0 text-primary"/><span>{listeningTestLabel(test)}</span>{progress.parts(test.id).length>0&&<span className="text-xs">{progress.parts(test.id).length>=4?'✓ Done':`${progress.parts(test.id).length}/4`}</span>}
      </button>)}
    </div>
    {!tests.length && <p role="status" className="rounded-xl bg-white/5 p-6 text-sm">No test matches your search. Try a state name such as Kedah or Johor.</p>}
    <p className="text-xs leading-relaxed text-white/55">Original papers and recordings are provided through Google Drive. An internet connection is needed. Empty folders and duplicate copies are not listed.</p>
  </div>;
}
