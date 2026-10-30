import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { withoutRecordingData } from '../../src/lib/recordingPrivacy';
import { renderedText, findButton } from './speakezUiHarness';
export { renderedText, findButton };

// Runs real TSX event handlers, replacing browser/cloud/model boundaries only.
export function renderProgressPage(page: string, state: Record<string, any>, props: any, modules: Record<string, any> = {}, options: { realDraft?: boolean } = {}) {
  const source = readFileSync(new URL(`../../src/pages/${page}.tsx`, import.meta.url),'utf8');
  let code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  code = code.replace(/const \[([^,]+), ([^\]]+)\] = \(0, react_1\.useState\)\(/g,(_a,n,s)=>`const [${n}, ${s}] = useNamedState(${JSON.stringify(n)}, `);
  const jsx = (type:any,props:any)=>({type,props}); const noOp=()=>{}; const exports:any={}; const effects:any[]=[];
  const refs:any[]=[], memos:any[]=[], cleanups:any[]=[]; let refIndex=0, effectIndex=0, memoIndex=0, timerId=0;
  const timers=new Map<number,{run:()=>void,ms:number}>();
  const setTimer=(run:()=>void,ms:number)=>{timers.set(++timerId,{run,ms});return timerId;};
  const effectDeps:any[][]=[];
  const useEffect=(f:any,deps:any[])=>{const i=effectIndex++;const prior=effectDeps[i];if(!prior||!deps||deps.some((v,j)=>!Object.is(v,prior[j]))){effectDeps[i]=deps;effects.push(()=>{cleanups[i]?.();cleanups[i]=f();});}};
  const useMemo=(f:any,deps:any[])=>{const i=memoIndex++;if(!memos[i]||deps.some((v,j)=>!Object.is(v,memos[i].deps[j])))memos[i]={deps,value:f()};return memos[i].value;};
  let actualDraft:any;
  const require=(name:string):any=>{
    if(options.realDraft && name.endsWith('/usePracticeProgress'))return {...modules[name],usePracticeDraft:actualDraft};
    if(Object.hasOwn(modules,name))return modules[name];
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
    if(name==='react')return {default:{},lazy:()=>noOp,Suspense:'suspense',useRef:(current:any)=>refs[refIndex++]??(refs[refIndex-1]={current}),useEffect,useMemo};
    if(name==='react-router-dom')return {useNavigate:()=>noOp,useSearchParams:()=>[new URLSearchParams(),noOp]};
    if(name==='motion/react')return {motion:new Proxy({},{get:(_t,k)=>String(k)}),AnimatePresence:'presence'};
    if(name.endsWith('/useAudioRecorder'))return {useAudioRecorder:()=>({duration:0,transcript:'',reset:noOp})};
    if(name.endsWith('/limits'))return {useDailyLimits:()=>({isLimitReached:()=>false,getRemaining:()=>5}),CREDIT_COSTS:{speak:{deep:1}}};
    if(name.endsWith('/recordingPrivacy'))return {withoutRecordingData};
    if(name==='react-hot-toast')return {toast:{error:noOp,success:noOp}};
    if(name.endsWith('/questionBank'))return {PART1_QUESTION_BANK:[],PART2_QUESTION_BANK:[],PART3_QUESTION_BANK:[]};
    if(name.endsWith('/firebase'))return {auth:{currentUser:{uid:props.profile?.uid}},db:{}};
    return new Proxy({},{get:(_t,k)=>k==='__esModule'?false:noOp});
  };
  if(options.realDraft) {
    const hookExports:any={};
    const hookSource=readFileSync(new URL('../../src/hooks/usePracticeProgress.ts',import.meta.url),'utf8');
    vm.runInNewContext(ts.transpileModule(hookSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:hookExports,require,setTimeout:setTimer,clearTimeout:(id:number)=>timers.delete(id),window:{addEventListener:noOp,removeEventListener:noOp}});
    actualDraft=hookExports.usePracticeDraft;
  }
  vm.runInNewContext(code,{exports,require,console,crypto,Blob,fetch:async()=>({ok:false}),Audio:class{addEventListener(){} removeEventListener(){} pause(){}},navigator:{onLine:true},URLSearchParams,setTimeout:setTimer,setInterval:()=>0,clearInterval:noOp,window:{speechSynthesis:{getVoices:()=>[],addEventListener:noOp,removeEventListener:noOp,cancel:noOp},dispatchEvent:noOp,addEventListener:noOp,removeEventListener:noOp},CustomEvent:class{},localStorage:{getItem:()=>null,setItem:noOp},
    useNamedState:(name:string,initial:any)=>{if(!Object.hasOwn(state,name))state[name]=typeof initial==='function'?initial():initial;return [state[name],(value:any)=>{state[name]=typeof value==='function'?value(state[name]):value;}];},
  });
  const render=()=>{refIndex=0;effectIndex=0;memoIndex=0;return exports[page.split('/').pop()!](props);};
  const tree=render();
  return {tree,effects,state,render,flushEffects:()=>effects.splice(0).forEach(f=>f()),flushDraftTimers:()=>{for(const [id,timer] of timers)if(timer.ms===600){timers.delete(id);timer.run();}}};
}
