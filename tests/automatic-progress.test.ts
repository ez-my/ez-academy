import { test } from 'node:test';
import assert from 'node:assert/strict';
import { persistSessionOnce } from '../src/lib/sessionPersistence';
import { PracticeAttempt } from '../src/lib/practiceAttempt';
import { progressStorage } from './helpers/progressStorage';
import { englishJourney } from '../src/lib/englishJourney';
import { renderProgressPage, findButton, renderedText } from './helpers/progressUiHarness';

test('history explicitly labels completed free work as not scored', () => {
  const {tree}=renderProgressPage('History',{sessions:[{id:'free',type:'WriteEZ',timestamp:1,duration:0,score:null,transcript:'My fixture answer.'}]},{});
  assert.match(renderedText(tree),/Not scored/);
});

test('unscored completions cannot be fed to personal diagnostics as fabricated zero scores', () => {
  const {tree}=renderProgressPage('StudyTools',{rawSessions:Array.from({length:3},(_,i)=>({id:String(i),type:'WriteEZ',timestamp:1,score:null}))},{profile:{uid:'fixture',plan:'free',displayName:'Fixture learner'}},{
    '../lib/AccessibilityContext':{useAccessibility:()=>({screenReaderOptimized:false})},
    '../lib/dashboardSummary':{summarizePractice:()=>({recent:[],skills:[],overall:null})},
  });
  assert.equal(findButton(tree,'Get personal tips (AI credits)'),undefined);
});

test('dashboard counts completed unscored free tasks without manufacturing a score', () => {
  const now=Date.parse('2026-10-26T08:00:00+08:00');
  const journey=englishJourney([{id:'free',type:'WriteEZ',timestamp:now-1,score:null} as any,{id:'zero',type:'SpeakEZ',timestamp:now-2,score:0} as any],now);
  assert.equal(journey.count,2);
  assert.equal(journey.skills.find(s=>s.key==='write')?.count,1);
  assert.equal(journey.skills.find(s=>s.key==='write')?.score,null);
  assert.equal(journey.skills.find(s=>s.key==='speak')?.score,0);
});

test('MUET parent surfaces sync failure instead of resolving and making child report saved', async () => {
  const {tree}=renderProgressPage('MUETPage',{}, {profile:{uid:'fixture',plan:'ez_plus'}},{
    '../lib/firebase':{saveSession:async()=>{throw Error('fixture offline');}},
  });
  const find=(node:any):any=>Array.isArray(node)?node.map(find).find(Boolean):node&&typeof node==='object'?(node.props?.onSaveReport||find(node.props?.children)):undefined;
  const save=find(tree); assert.ok(save);
  await assert.rejects(save({id:'muet-fixture',date:1,durationSeconds:30,bandScoreNumber:2,fluencyAndCoherence:{score:2},languageAndGrammar:{score:2},taskFulfilment:{score:2},rawTranscript:'My fixture learner answer.'}),/offline|sync/);
});

test('MUET assessed reports automatically sync once on report arrival for both parts', async () => {
  for (const part of [1,2]) {
    const saved:any[]=[];
    const report={id:'fixture-report',rawTranscript:'My fixture answer'};
    const {effects}=renderProgressPage(`../components/muet/MUETPart${part}Practice`,{phase:'report',report,topic:{id:'fixture',title:'Fixture',part1:{tasks:{A:'Fixture'}},part2:{points:[]}}},{onSaveReport:async(r:any)=>{saved.push(r);}},{
      '../../lib/muetBank':{useMUETBank:()=>({loading:false,error:null})},
      '../../data/muetTopicsBank':{MUET_TOPICS:[]},
    });
    effects.forEach(effect=>effect());
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(saved.length,1,`Part ${part} does not require Save to My Progress`);
    assert.equal(saved[0].id,report.id);
  }
});

test('MUET mock final reports also auto-sync without a save click', async () => {
  const saved:any[]=[];
  const {effects}=renderProgressPage('../components/muet/MUETMockTest',{phase:'report',finalReport:{id:'fixture-mock'},topic:{id:'fixture',title:'Fixture',part1:{tasks:{A:'Fixture'}},part2:{points:[]}}},{onSaveReport:async(r:any)=>{saved.push(r);}},{
    '../../lib/muetBank':{useMUETBank:()=>({loading:false,error:null})},'../../data/muetTopicsBank':{MUET_TOPICS:[]},
  });
  effects.forEach(effect=>effect()); await new Promise(resolve=>setImmediate(resolve)); assert.equal(saved.length,1);
});

test('legacy ReadEZ failed save does not show a success celebration', async () => {
  const state:any={showTrialBank:false,state:'PLAYING',testSet:{id:'fixture-read',parts:[{partNumber:1,questions:[]}]},startTime:1};
  const {tree}=renderProgressPage('ReadEZ',state,{profile:{uid:'fixture',plan:'free'}},{
    '../lib/firebase':{saveSession:async()=>{throw Error('fixture offline');},getFriendlyFirebaseError:()=> 'Not synced'},
  });
  await findButton(tree,'Submit Test').props.onClick();
  assert.notEqual(state.showSuccess,true);
  assert.match(state.saveStatus,/not synced/i);
});

test('opening free general tips or submitting untouched sample context never completes writing', async () => {
  const saved:any[]=[];
  const attempt=new PracticeAttempt('fixture','WriteEZ',{getItem:()=>null,setItem:()=>{}},async(_u,s)=>{saved.push(s);},()=>'fixture');
  const progress={attempt,complete:(fields:any)=>attempt.complete(fields),update:()=>{}};
  const text='    [Sample Introduction - Fixture]\n    This is where your introduction would normally go, hooking the reader and introducing the main topic.\n\n    [Sample Body Paragraphs]\n    This section represents the main arguments or points you have elaborated on using PEEL. They provide the necessary context and justification for your final thoughts.\n\n';
  const {tree}=renderProgressPage('WriteEZ',{text,spmTask:{practiceMode:'Conclusion'}},{plan:'free',profile:{uid:'fixture',plan:'free'}},{'../hooks/usePracticeProgress':{usePracticeProgress:()=>progress,usePracticeDraft:()=>{}}});
  await findButton(tree,'View General Feedback').props.onClick();assert.equal(saved.length,0);
  await findButton(tree,'Finish practice').props.onClick();assert.equal(saved.length,0);
});

test('WriteEZ Finish practice saves free learner answer with no score and no AI call', async () => {
  const saved:any[]=[];
  const attempt=new PracticeAttempt('fixture','WriteEZ',{getItem:()=>null,setItem:()=>{}},async(_uid,s)=>{saved.push(s);},()=>'fixture');
  const progress={attempt,complete:(fields:any)=>attempt.complete(fields),update:()=>{},retry:()=>attempt.retry()};
  const {tree}=renderProgressPage('WriteEZ',{text:'My synthetic learner answer explains why I enjoy reading.',spmTask:{practiceMode:'Full',theme:'fixture'}},{plan:'free',profile:{uid:'fixture',plan:'free'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>progress,usePracticeDraft:()=>{}},
    '../lib/gemini':{analyzeSPMEmail:()=>{throw Error('NO AI allowed');}},
  });
  const finish=findButton(tree,'Finish practice'); assert.ok(finish,'explicit completion is available separately from general tips');
  await finish.props.onClick();
  assert.equal(saved.length,1); assert.equal(saved[0].score,null);
  assert.match(saved[0].transcript,/learner answer/);
});

test('paid WriteEZ feedback automatically attaches without Sync Log and retry never re-calls AI', async () => {
  const saved:any[]=[]; let aiCalls=0;
  const attempt=new PracticeAttempt('fixture','WriteEZ',{getItem:()=>null,setItem:()=>{}},async(_uid,s)=>{saved.push(s);},()=>'fixture');
  const progress={attempt,complete:(fields:any)=>attempt.complete(fields),update:()=>{},retry:()=>attempt.retry()};
  const {tree}=renderProgressPage('WriteEZ',{text:'My synthetic learner answer explains why I enjoy reading.',spmTask:{practiceMode:'Full',theme:'fixture'}},{plan:'ez_plus',userGoal:'SPM',profile:{uid:'fixture',plan:'ez_plus'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>progress,usePracticeDraft:()=>{}},
    '../lib/gemini':{analyzeSPMEmail:async()=>{aiCalls++; return {score:81,feedback:'Synthetic feedback'};}},
  });
  await findButton(tree,'Analyze Component').props.onClick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(saved.length,2); assert.equal(saved[1].score,81);
  assert.equal(saved[0].id,saved[1].id);
  await progress.retry(); assert.equal(aiCalls,1);
});

test('double submission during automatic saving cannot trigger two paid writing assessments', async () => {
  let aiCalls=0;
  const attempt=new PracticeAttempt('fixture','WriteEZ',{getItem:()=>null,setItem:()=>{}},async()=>{},()=>'fixture');
  const {tree}=renderProgressPage('WriteEZ',{text:'My meaningful synthetic answer.',spmTask:{practiceMode:'Full'}},{plan:'ez_plus',userGoal:'SPM',profile:{uid:'fixture',plan:'ez_plus'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt,complete:(f:any)=>attempt.complete(f),update:()=>{}}),usePracticeDraft:()=>{}},
    '../lib/gemini':{analyzeSPMEmail:async()=>{aiCalls++;return {score:70,feedback:'Synthetic'};}},
  });
  const submit=findButton(tree,'Analyze Component');submit.props.onClick();submit.props.onClick();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(aiCalls,1);
});

test('paid speaking feedback auto-syncs even if device recording storage is broken, with one assessment', async () => {
  const saved:any[]=[];let calls=0;
  const answer='I enjoyed learning about this synthetic museum because the guide explained its history.';
  const attempt=new PracticeAttempt('fixture','SpeakEZ',{getItem:()=>null,setItem:()=>{throw Error('device full');}},async(_u,s)=>{saved.push(s);},()=>'fixture');
  const progress={attempt,complete:(f:any)=>attempt.complete(f),update:()=>{},retry:()=>attempt.retry()};
  const {tree}=renderProgressPage('SpeakEZ',{view:'review',selectedPart:2,activeSavedPracticeId:'device-draft',savedPractices:[{id:'device-draft'}],task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:answer},{profile:{uid:'fixture',plan:'ez_plus'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>progress,usePracticeDraft:()=>{}},
    '../hooks/useAudioRecorder':{useAudioRecorder:()=>({audioBlob:new Blob(['fixture']),duration:12,transcript:answer})},
    '../lib/gemini':{analyzeSPMSpeaking:async()=>{calls++;return {score:72,feedback:'Synthetic feedback',transcript:answer};}},
    '../lib/storage':{audioStorage:{saveAudio:async()=>{throw Error('must not block remote result');},deleteAudio:async()=>{throw Error('device cleanup failed');}}},
  });
  const submit=findButton(tree,'Get feedback on my answer');submit.props.onClick();submit.props.onClick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls,1);assert.equal(saved.length,2);assert.equal(saved[1].score,72);assert.equal(saved[0].id,saved[1].id);
  assert.equal(attempt.status,'saved');assert.equal(attempt.localDurable,false);
});

test('SpeakEZ explicit finish saves meaningful free speech without AI and rejects empty capture', async () => {
  const saved:any[]=[];
  const attempt=new PracticeAttempt('fixture','SpeakEZ',{getItem:()=>null,setItem:()=>{}},async(_uid,s)=>{saved.push(s);},()=>'fixture');
  const progress={attempt,complete:(fields:any)=>attempt.complete(fields),update:()=>{},retry:()=>attempt.retry()};
  const render=(answer:string)=>renderProgressPage('SpeakEZ',{view:'review',selectedPart:2,task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:answer},{profile:{uid:'fixture',plan:'free'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>progress,usePracticeDraft:()=>{}},
    '../hooks/useAudioRecorder':{useAudioRecorder:()=>({audioBlob:new Blob(['fixture']),duration:12,transcript:answer})},
  });
  const finish=findButton(render('I enjoyed learning about this synthetic trip.').tree,'Finish practice'); assert.ok(finish);
  await finish.props.onClick(); assert.equal(saved.length,1); assert.equal(saved[0].score,null);
  const empty=findButton(render('').tree,'Finish practice'); await empty.props.onClick(); assert.equal(saved.length,1);
});

test('editing an acknowledged answer is a local draft until intentional resubmission creates a new attempt', async () => {
  const saved:any[]=[];
  const a=new PracticeAttempt('a','WriteEZ',{getItem:()=>null,setItem:()=>{}},async(_u,s)=>{saved.push(s);},()=>'a');
  a.writeDraft({text:'My first meaningful response.'}); await a.complete({transcript:'My first meaningful response.',score:80});
  const first=a.id;
  a.writeDraft({text:'My revised meaningful response.'});
  assert.equal(a.status,'draft'); assert.equal(saved.length,1);
  await a.complete({transcript:'My revised meaningful response.'});
  assert.notEqual(a.id,first); assert.equal(saved[1].score,null);
});

test('completion timestamp is intentional completion time, not the day a draft was opened', async () => {
  const old=Date.parse('2026-01-01T00:00:00Z'); const values=new Map<string,string>();
  values.set('ez-progress-v1:a:WriteEZ',JSON.stringify({id:'draft-from-january',userId:'a',timestamp:old,draft:{text:'My meaningful answer.'},status:'draft'}));
  let saved:any;
  const a=new PracticeAttempt('a','WriteEZ',{getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);}},async(_u,s)=>{saved=s;},()=>'a');
  const before=Date.now();await a.complete({transcript:'My meaningful answer.'});
  assert.ok(saved.timestamp>=before);
});

test('a late failure cannot overwrite a newer acknowledged save status', async () => {
  let rejectFirst:(e:Error)=>void=()=>{};let calls=0;
  const a=new PracticeAttempt('a','WriteEZ',{getItem:()=>null,setItem:()=>{}},async()=>{if(++calls===1)await new Promise((_resolve,reject)=>{rejectFirst=reject;});},()=>'a');
  const first=a.complete({transcript:'My meaningful fixture answer.'});
  await a.complete({transcript:'My meaningful fixture answer.',score:70});
  rejectFirst(Error('late offline')); await first;
  assert.equal(a.status,'saved');
});

test('intentional free writing completes unscored, survives refresh and attaches feedback to the same attempt', async () => {
  const values = new Map<string,string>();
  const storage = progressStorage(values);
  const saved = new Map<string,any>();
  let calls = 0;
  const save = async (_uid: string, session: any) => { calls++; saved.set(session.id,session); };
  const first = new PracticeAttempt('a','WriteEZ',storage,save,()=>'a');
  first.writeDraft({ text: 'My own answer is here.', task: { id: 'fixture' } });
  assert.equal(calls,0,'a draft is not completed');
  assert.equal(await first.complete({ transcript: 'My own answer is here.' }),true);
  assert.equal(saved.get(first.id).score,null);
  const restored = new PracticeAttempt('a','WriteEZ',storage,save,()=>'a');
  assert.equal(restored.id,first.id);
  await restored.complete({ transcript: 'My own answer is here.', score: 0, feedback: 'Synthetic scored feedback' });
  assert.equal(saved.size,1);
  assert.equal(saved.get(first.id).score,0);
  const other = new PracticeAttempt('b','WriteEZ',storage,save,()=>'b');
  assert.equal(other.draft,null);
  assert.notEqual(other.id,first.id);
});

test('failed speaking sync remains unsynced, account-safe, retryable without audio, and never reports success', async () => {
  const values = new Map<string,string>();
  const storage = progressStorage(values);
  let owner = 'a'; let fail = true; let calls = 0; const saved: any[] = [];
  const save = async (_uid: string, session: any) => { calls++; if(fail) throw Error('offline'); saved.push(session); };
  const a = new PracticeAttempt('a','SpeakEZ',storage,save,()=>owner);
  assert.equal(await a.complete({ transcript: '' }),false);
  assert.equal(calls,0);
  assert.equal(await a.complete({ transcript: 'I enjoyed this synthetic trip.', audioBlob: new Blob(['fixture']) } as any),false);
  assert.equal(a.status,'not-synced');
  assert.equal(calls,1,'no automatic unbounded retry');
  assert.equal(a.newAttempt(),false,'unsynced work cannot be overwritten by a new task');
  owner = 'b'; fail = false;
  assert.equal(await a.retry(),false);
  assert.equal(calls,1);
  owner = 'a';
  const refreshed = new PracticeAttempt('a','SpeakEZ',storage,save,()=>owner);
  assert.equal(await refreshed.retry(),true);
  assert.equal(refreshed.status,'saved');
  assert.equal(saved[0].id,a.id);
  assert.equal(saved[0].audioBlob,undefined);
  assert.equal(saved[0].score,null);
});

// Memory-only transaction fixture. Never contacts Firebase or a model.
test('a completed free attempt and later scored feedback share one record and one reward', async () => {
  const records = new Map<string, any>();
  records.set('user', { points: 0 });
  const transaction = async (work: any) => work({
    get: async (key: string) => ({ exists: () => records.has(key), data: () => records.get(key) }),
    set: (key: string, value: any) => records.set(key, value),
    update: (key: string, value: any) => records.set(key, { ...records.get(key), ...value }),
  });
  const save = (score: number | null) => persistSessionOnce(transaction, 'attempt', 'user', { id: 'same-attempt', score, timestamp: 123 }, () => ({ points: records.get('user').points + 5 }));
  await save(null);
  assert.equal(records.get('attempt').score, null);
  await save(81);
  await save(81);
  assert.equal(records.size, 2);
  assert.equal(records.get('attempt').score, 81);
  assert.equal(records.get('attempt').timestamp, 123);
  assert.equal(records.get('user').points, 5);
});
