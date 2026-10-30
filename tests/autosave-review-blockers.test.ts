import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PracticeAttempt } from '../src/lib/practiceAttempt';
import { progressStorage } from './helpers/progressStorage';
import { persistSessionOnce } from '../src/lib/sessionPersistence';
import { renderProgressPage, findButton } from './helpers/progressUiHarness';

const tick=()=>new Promise(resolve=>setImmediate(resolve));
const editedAnswer='My completely revised synthetic learner response discusses music.';
function assessmentFixture(type:'WriteEZ'|'SpeakEZ', text=answer) {
  const cloud=memoryCloud();const local=new Map<string,string>();let aiCalls=0;
  const attempt=new PracticeAttempt('fixture',type,progressStorage(local),cloud.save,()=>'fixture');
  const state:any=type==='WriteEZ'?{text,spmTask:{practiceMode:'Full'}}:{view:'review',selectedPart:2,task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:text};
  const ui=renderProgressPage(type,state,{plan:'ez_plus',userGoal:'SPM',profile:{uid:'fixture',plan:'ez_plus'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt,complete:(f:any)=>attempt.complete(f),update:()=>{}}),usePracticeDraft:()=>{}},
    '../hooks/useAudioRecorder':{useAudioRecorder:()=>({audioBlob:new Blob(['fixture']),duration:10,transcript:'',reset:()=>{}})},
    '../lib/gemini':{analyzeSPMEmail:async()=>{aiCalls++;return {score:91,feedback:'New feedback'};},analyzeSPMSpeaking:async()=>{aiCalls++;return {score:91,feedback:'New feedback'};}},
  });
  return {cloud,local,attempt,state,ui,calls:()=>aiCalls,analyze:()=>findButton(ui.render(),type==='WriteEZ'?'Analyze Component':'Get feedback on my answer').props.onClick()};
}
for(const type of ['WriteEZ','SpeakEZ'] as const) {
  test(`${type} actual paid handler rejects edited answer while different scored answer is unsynced`,async()=>{
    const f=assessmentFixture(type,editedAnswer);f.cloud.setOffline(true);
    await f.attempt.complete({transcript:answer,score:77,feedback:'Previous feedback'});
    f.cloud.setOffline(false);f.analyze();await tick();await tick();
    assert.equal(f.calls(),0,'do not call paid assessment for an incompatible pending answer');
    assert.match(f.state.error,/sync.*previous answer/i);
    assert.equal(f.cloud.records.size,1);assert.equal(f.state.feedback,null);
    const restored=new PracticeAttempt('fixture',type,progressStorage(f.local),f.cloud.save,()=>'fixture');
    await restored.retry();assert.equal(f.cloud.records.get(restored.id).score,77);
  });
}
for(const type of ['WriteEZ','SpeakEZ'] as const) {
  test(`${type} matching pending answer still receives assessment when cloud fails, retains feedback without false success`,async()=>{
    const f=assessmentFixture(type);f.cloud.setOffline(true);
    await f.attempt.complete({transcript:answer});const id=f.attempt.id;
    f.analyze();await tick();await tick();
    assert.equal(f.calls(),1);assert.equal(f.state.feedback.score,91);
    assert.equal(f.attempt.status,'not-synced');
    assert.equal(f.state.showSuccess,false,'generated feedback is not proof of cloud save');
    assert.match(f.state.error,/not synced/i);
    const restored=new PracticeAttempt('fixture',type,progressStorage(f.local),f.cloud.save,()=>'fixture');
    f.cloud.setOffline(false);await restored.retry();
    assert.equal(restored.id,id);assert.equal(f.cloud.records.get(id).transcript,answer);
    assert.equal(f.cloud.records.get(id).score,91);assert.equal(f.cloud.records.get(id).feedback,'New feedback');
    assert.equal(f.cloud.records.get('user').points,5);assert.equal(f.calls(),1);
  });
}
function findTextarea(node:any):any {
  if(Array.isArray(node))return node.map(findTextarea).find(Boolean);
  if(node&&typeof node==='object')return node.type==='textarea' && node.props.onChange ? node : findTextarea(node.props?.children);
}
for(const mode of ['component','full','assembled','speaking'] as const) {
  test(`actual ${mode} assessment response preserves newer debounced draft and marks it incomplete`,async()=>{
    const type=mode==='speaking'?'SpeakEZ':'WriteEZ';
    const cloud=memoryCloud(),local=new Map<string,string>();let resolveAI:(v:any)=>void=()=>{};
    const attempt=new PracticeAttempt('fixture',type,progressStorage(local),cloud.save,()=>'fixture');
    const state:any=type==='SpeakEZ'?{view:'review',selectedPart:2,task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:answer}:{text:answer,spmTask:{practiceMode:'Full'},isFullEssayMode:mode==='full',...(mode==='assembled'?{activePart:'PART 2',assemblyMode:true,essayComponents:{intro:answer,body1:'',body2:'',body3:'',conclusion:''}}:{})};
    const deferred=()=>new Promise(resolve=>{resolveAI=resolve;});
    const ui=renderProgressPage(type,state,{plan:'ez_plus',userGoal:'SPM',profile:{uid:'fixture',plan:'ez_plus'}},{
      '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt,complete:(f:any)=>attempt.complete(f),update:()=>{}})},
      '../hooks/useAudioRecorder':{useAudioRecorder:()=>({audioBlob:new Blob(['fixture']),duration:10,transcript:'',reset:()=>{}})},
      '../lib/gemini':{analyzeSPMEmail:deferred,analyzeSPMFullEssay:deferred,analyzeSPMSpeaking:deferred},
    },{realDraft:true});
    ui.flushEffects();ui.flushDraftTimers();
    findButton(ui.tree,mode==='assembled'?'Grade Full Essay':mode==='full'?'Grade Final Essay':type==='SpeakEZ'?'Get feedback on my answer':'Analyze Component').props.onClick();
    await tick();const id=attempt.id;const assessedAnswer=cloud.records.get(id).transcript;
    // Speaking switches to feedback during assessment; editing is represented by its controlled state.
    if(type==='SpeakEZ')state.reviewTranscript=editedAnswer;
    else findTextarea(ui.render()).props.onChange({target:{value:editedAnswer}});
    ui.render();ui.flushEffects();ui.flushDraftTimers();
    assert.equal(attempt.draft.text??attempt.draft.transcript,editedAnswer);
    resolveAI({score:91,feedback:'Snapshot feedback'});await tick();await tick();
    assert.equal(state.text??state.reviewTranscript,editedAnswer,'late response must not replace visible new answer');
    assert.equal(cloud.records.get(id).transcript,assessedAnswer);
    assert.equal(cloud.records.get(id).score,91);assert.equal(attempt.id,id);
    const persisted=new PracticeAttempt('fixture',type,progressStorage(local),cloud.save,()=>'fixture');
    assert.equal(persisted.draft.text??persisted.draft.transcript,editedAnswer,'completion snapshot must not overwrite live durable draft');
    assert.equal(attempt.status,'draft','new answer is not the acknowledged completion');
    assert.equal(state.showSuccess,false,'do not celebrate saving the newly edited answer');
    assert.equal(persisted.status,'draft');assert.equal(cloud.records.get('user').points,5);
  });
}
const answer='My synthetic learner answer explains why I enjoy reading.';
function byTitle(node:any,title:string):any {
  if(Array.isArray(node))return node.map(n=>byTitle(n,title)).find(Boolean);
  if(node&&typeof node==='object')return node.props?.title===title?node:byTitle(node.props?.children,title);
}
function memoryCloud() {
  const records=new Map<string,any>([['user',{points:0}]]); let offline=false;
  const save=async(_uid:string,session:any)=>{
    if(offline)throw Error('fixture offline');
    await persistSessionOnce(async work=>work({
      get:async(key:any)=>({exists:()=>records.has(key),data:()=>records.get(key)}),
      set:(key:any,value:any)=>{records.set(key,value);},
      update:(key:any,value:any)=>{records.set(key,{...records.get(key),...value});},
    }),session.id,'user',session,()=>({points:records.get('user').points+5}));
  };
  return {records,save,setOffline:(value:boolean)=>{offline=value;}};
}

test('WriteEZ actual handlers block New Scenario throughout deferred paid assessment, including after initial save',async()=>{
  const cloud=memoryCloud();let aiCalls=0,generated=0,resolveAI:(value:any)=>void=()=>{};
  const attempt=new PracticeAttempt('fixture','WriteEZ',{getItem:()=>null,setItem:()=>{}},cloud.save,()=>'fixture');
  const state:any={text:answer,spmTask:{practiceMode:'Full',theme:'fixture'}};
  const ui=renderProgressPage('WriteEZ',state,{plan:'ez_plus',userGoal:'SPM',profile:{uid:'fixture',plan:'ez_plus'}},{
    '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt,complete:(f:any)=>attempt.complete(f),update:()=>{}}),usePracticeDraft:()=>{}},
    '../lib/limits':{useDailyLimits:()=>({isLimitReached:()=>false,incrementUsage:async()=>{}})},
    '../services/questionBankService':{getRandomQuestion:async()=>{generated++;return {practiceMode:'Full',theme:'next'};}},
    '../lib/gemini':{analyzeSPMEmail:()=>{aiCalls++;return new Promise(resolve=>{resolveAI=resolve;});}},
  });
  findButton(ui.tree,'Analyze Component').props.onClick();await tick();
  const id=attempt.id;assert.equal(attempt.status,'saved');assert.equal(aiCalls,1);
  const pendingTree=ui.render();
  await byTitle(pendingTree,'New Scenario').props.onClick();await tick();
  findButton(ui.tree,'Analyze Component').props.onClick();await tick();
  resolveAI({score:81,feedback:'Synthetic feedback'});await tick();
  assert.equal(generated,0,'scenario handler must not rotate an attempt while AI owns it');
  assert.equal(byTitle(pendingTree,'New Scenario').props.disabled,true);
  assert.equal(attempt.id,id);assert.equal(cloud.records.size,2);
  assert.equal(cloud.records.get(id).score,81);assert.equal(cloud.records.get('user').points,5);
  assert.equal(aiCalls,1);
});

for(const type of ['WriteEZ','SpeakEZ'] as const)for(const plan of ['free','ez_plus']) {
  test(`${type} ${plan}: Finish same answer retries failed scored payload, not earlier unscored cloud record`,async()=>{
    const cloud=memoryCloud();const local=new Map<string,string>();let aiCalls=0;
    const attempt=new PracticeAttempt('fixture',type,progressStorage(local),cloud.save,()=>'fixture');
    const ui=renderProgressPage(type,type==='WriteEZ'?{text:answer,spmTask:{practiceMode:'Full'}}:{view:'review',selectedPart:2,task:{part:2,promptCard:{topic:'Fixture',prompts:[]}},reviewTranscript:answer},{plan,profile:{uid:'fixture',plan}},{
      '../hooks/usePracticeProgress':{usePracticeProgress:()=>({attempt,complete:(f:any)=>attempt.complete(f),update:()=>{}}),usePracticeDraft:()=>{}},
      '../lib/gemini':{analyzeSPMEmail:()=>{aiCalls++;throw Error('no assessment on retry');},analyzeSPMSpeaking:()=>{aiCalls++;throw Error('no assessment on retry');}},
    });
    await findButton(ui.tree,'Finish practice').props.onClick();
    const id=attempt.id;assert.equal(cloud.records.get(id).score,null);
    cloud.setOffline(true);
    await attempt.complete({transcript:answer,score:81,feedback:'Synthetic feedback',metrics:{grammar:81} as any});
    assert.equal(attempt.status,'not-synced');assert.equal(cloud.records.get(id).score,null);
    cloud.setOffline(false);
    await findButton(ui.render(),'Finish practice').props.onClick();
    assert.equal(attempt.status,'saved');assert.equal(attempt.id,id);
    assert.equal(cloud.records.get(id).score,81);
    assert.equal(cloud.records.get(id).feedback,'Synthetic feedback');
    assert.equal(cloud.records.get(id).metrics.grammar,81);
    assert.equal(cloud.records.size,2);assert.equal(cloud.records.get('user').points,5);assert.equal(aiCalls,0);
  });
}

test('edited answer cannot inherit or replace pending feedback; retry old then finish edited creates new unscored attempt',async()=>{
  const cloud=memoryCloud();const attempt=new PracticeAttempt('fixture','WriteEZ',{getItem:()=>null,setItem:()=>{}},cloud.save,()=>'fixture');
  await attempt.complete({transcript:answer});const id=attempt.id;
  cloud.setOffline(true);await attempt.complete({transcript:answer,score:81,feedback:'Original feedback'});
  const edited='My completely revised synthetic learner response.';
  attempt.writeDraft({text:edited});cloud.setOffline(false);
  assert.equal(await attempt.complete({transcript:edited,score:null,feedback:''}),false);
  assert.equal(attempt.status,'not-synced');assert.equal(cloud.records.size,2);
  await attempt.retry();assert.equal(cloud.records.get(id).transcript,answer);assert.equal(cloud.records.get(id).score,81);
  await attempt.complete({transcript:edited,score:null,feedback:''});
  assert.notEqual(attempt.id,id);assert.equal(cloud.records.get(attempt.id).score,null);
  assert.equal(cloud.records.get(attempt.id).feedback,'');assert.equal(cloud.records.get('user').points,10);
});

for(const source of ['cached bank','downloaded offline']) {
  test(`ReadEZ actual start/submit handlers create fresh attempts for same ${source} test, retaining ID for retry`,async()=>{
    const cloud=memoryCloud();const writes:any[]=[];
    const fixture={id:'same-reading-fixture',title:'Fixture',answers:{q1:'A'},parts:[{partNumber:1,questions:[{id:'q1',type:'MCQ',options:['A. Correct','B. Other']}]}]};
    const state:any={showTrialBank:false,selectedMode:1,isOfflineMode:source==='downloaded offline'};
    const ui=renderProgressPage('ReadEZ',state,{profile:{uid:'fixture',plan:'free'}},{
      '../lib/limits':{useDailyLimits:()=>({isLimitReached:()=>false,getRemaining:()=>5,incrementUsage:async()=>{}})},
      '../lib/firebase':{saveSession:async(uid:string,s:any)=>{writes.push(s);await cloud.save(uid,s);},getFriendlyFirebaseError:()=> 'Fixture offline'},
      '../services/questionBankService':{getRandomReadQuestion:async()=>fixture,markQuestionAsCompleted:async()=>{}},
      '../lib/offlineStorage':{getOfflineReadTests:async()=>[fixture]},
    });
    ui.flushEffects();await findButton(ui.render(),'Generate & Start Test').props.onClick();
    let tree=ui.render();ui.flushEffects();
    await findButton(tree,'Correct').props.onClick();tree=ui.render();
    cloud.setOffline(true);await findButton(tree,'Submit Test').props.onClick();
    assert.match(state.saveStatus,/not synced/);cloud.setOffline(false);
    findButton(ui.render(),'Retry result sync').props.onClick();await tick();
    assert.equal(writes[0].id,writes[1].id);assert.equal(cloud.records.get('user').points,5);
    // Start another attempt in the same mounted component with the exact same cached test object.
    state.state='IDLE';await findButton(ui.render(),'Generate & Start Test').props.onClick();
    tree=ui.render();ui.flushEffects();assert.equal(Object.keys(state.answers).length,0);
    await findButton(tree,'Other').props.onClick();await findButton(ui.render(),'Submit Test').props.onClick();
    assert.notEqual(writes[2].id,writes[1].id,'test identity is not attempt identity');
    assert.equal(cloud.records.size,3);assert.equal(cloud.records.get(writes[1].id).score,100);
    assert.equal(cloud.records.get(writes[2].id).score,0);assert.equal(cloud.records.get('user').points,10);
  });
}
