import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createListeningAudioHandler} from '../src/server/listeningAudio';
import {createNetlifyListeningAudio} from '../netlify/functions/listening-audio';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {TRIAL_READING_TESTS} from '../src/data/trialReadingTests';
import {TRIAL_LISTENING_TESTS} from '../src/data/trialListeningTests';
import {isAuthorizedTrialAsset,mayDisplayTrialPaper} from '../src/lib/trialPaperRights';
import {registerPracticeRoutes} from '../src/server/practiceRoutes';
import {createListeningCheckHandler} from '../src/server/listeningResults';

async function serve(app:express.Express,action:(base:string)=>Promise<void>){
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 try{await action(`http://127.0.0.1:${(server.address() as any).port}`);}
 finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
}
test('held trial recordings fail closed without contacting Drive (GET, HEAD and ranges)',async()=>{
 let calls=0;
 const fetcher=(async()=>{calls++;return new Response('fixture',{headers:{'content-type':'audio/mpeg'}});}) as typeof fetch;
 const app=express();app.get('/api/listening/audio/:testId',createListeningAudioHandler(fetcher,()=>false));
 await serve(app,async base=>{
  for(const method of ['GET','HEAD']){
   const response=await fetch(base+'/api/listening/audio/kedah?authorized=true',{method,headers:{Range:'bytes=0-10'}});
   assert.equal(response.status,451);assert.match(response.headers.get('cache-control')||'',/no-store/);
   const netlify=await createNetlifyListeningAudio(fetcher,()=>false)(new Request('http://localhost/api/listening/audio/kedah?authorized=true',{method,headers:{Range:'bytes=0-10'}}));
   assert.equal(netlify.status,451);assert.match(netlify.headers.get('cache-control')||'',/no-store/);
  }
  assert.equal(calls,0);
 });
});
test('all 40 authorized recordings work with the default Express and Netlify policy, including HEAD and ranges',async()=>{
 let calls=0;
 const fetcher=(async(url,init)=>{calls++;assert.ok(TRIAL_LISTENING_TESTS.some(t=>String(url).includes(`id=${t.audioFileId}&`)));return new Response(init?.method==='HEAD'?null:'ID3',{status:206,headers:{'content-type':'audio/mpeg','content-length':'3','content-range':'bytes 0-2/100'}});}) as typeof fetch;
 const app=express();app.get('/api/listening/audio/:testId',createListeningAudioHandler(fetcher));
 await serve(app,async base=>{
  for(const t of TRIAL_LISTENING_TESTS)for(const method of ['GET','HEAD']){
   const response=await fetch(`${base}/api/listening/audio/${t.id}`,{method,headers:{Range:'bytes=0-2'}});
   assert.equal(response.status,206,t.id);assert.equal(await response.text(),method==='HEAD'?'':'ID3');
   const netlify=await createNetlifyListeningAudio(fetcher)(new Request(`http://localhost/api/listening/audio/${t.id}`,{method,headers:{Range:'bytes=0-2'}}));
   assert.equal(netlify.status,206,t.id);assert.equal(await netlify.text(),method==='HEAD'?'':'ID3');
  }
  assert.equal(calls,TRIAL_LISTENING_TESTS.length*4);
  for(const id of ['future-paper','kedah-2027','__proto__']){
   assert.equal((await fetch(`${base}/api/listening/audio/${id}?authorized=true`)).status,404);
   assert.equal((await createNetlifyListeningAudio(fetcher)(new Request(`http://localhost/api/listening/audio/${id}`))).status,404);
  }
  assert.equal(calls,TRIAL_LISTENING_TESTS.length*4,'unknown IDs never contact Drive');
 });
});
test('practice pages lazily restore the authorized original trial libraries',()=>{
 for(const page of ['ReadEZ','ListenEZ']){
  const source=readFileSync(`src/pages/${page}.tsx`,'utf8');
  assert.ok(/lazy\(/.test(source),page);
  assert.ok(/import\('\.\.\/components\/Trial(?:Reading|Listening)Library'\)/.test(source),page);
  assert.ok(/Suspense/.test(source),page);
 }
});
test('current inventoried trial families are authorized; unknown and future IDs remain held; originals stay byte-identical',()=>{
 for(const t of TRIAL_READING_TESTS)assert.equal(mayDisplayTrialPaper(t.id,'reading'),true,t.id);
 for(const t of TRIAL_LISTENING_TESTS)assert.equal(mayDisplayTrialPaper(t.id,'listening'),true,t.id);
 for(const id of ['future-paper','kedah-2027','KEDAH','__proto__','toString',''])assert.equal(mayDisplayTrialPaper(id),false,id);
 assert.equal(mayDisplayTrialPaper('kuala-lumpur','reading'),false);
 assert.equal(mayDisplayTrialPaper('kuala-lumpur-2026','listening'),false);
 for(const kind of ['reading','listening'] as const){
  const catalog=kind==='reading'?TRIAL_READING_TESTS:TRIAL_LISTENING_TESTS;
  for(const asset of catalog){
   assert.equal(isAuthorizedTrialAsset({...asset,id:asset.id+'-future'},kind),false);
   assert.equal(isAuthorizedTrialAsset({...asset,questionFileId:'replacement'},kind),false);
   assert.equal(isAuthorizedTrialAsset({...asset,answerFileId:'replacement'},kind),false);
   assert.equal(isAuthorizedTrialAsset({...asset,audioFileId:'replacement'},kind),false);
  }
 }
 const audit=JSON.parse(readFileSync('docs/paper-rights/inventory.json','utf8'));
 for(const f of audit.fingerprints)assert.equal(createHash('sha256').update(readFileSync(f.file)).digest('hex'),f.sha256,f.file);
 assert.equal(audit.reading.length,TRIAL_READING_TESTS.length);
 assert.equal(audit.listening.length,TRIAL_LISTENING_TESTS.length);
});
test('Listening readable view preserves marked original text instead of stripping confidentiality labels',async()=>{
 assert.ok(readFileSync('src/components/TrialListeningLibrary.tsx','utf8').includes('preserveOriginalTrialText'));
 const {preserveOriginalTrialText}=await import('../src/lib/trialPaperText');
 const marked='SULIT\n1119/4\nPart 1\nQuestion text\nTERHAD';
 assert.equal(preserveOriginalTrialText(marked),marked);
 assert.equal(preserveOriginalTrialText('Unmarked readable practice'),null);
 const {READABLE_TRIAL_PARTS}=await import('../src/data/trialListeningParts');
 let markedParts=0;
 for(const parts of Object.values(READABLE_TRIAL_PARTS))for(const text of Object.values(parts)){
  if(/\b(?:SULIT|TERHAD)\b/i.test(text)){markedParts++;assert.equal(preserveOriginalTrialText(text),text);}
 }
 assert.ok(markedParts>0);
});

test('publication checks authorization and original hashes before building',async()=>{
 assert.ok(readFileSync('vite.config.ts','utf8').includes('assertTrialPaperBuildAuthorized'));
 const {assertTrialPaperBuildAuthorized}=await import('../src/server/trialPaperBuildGuard');
 assert.doesNotThrow(()=>assertTrialPaperBuildAuthorized());
 assert.throws(()=>assertTrialPaperBuildAuthorized(()=>Buffer.from('changed original')),/Original trial asset changed/);
 const current=TRIAL_LISTENING_TESTS[0];
 TRIAL_LISTENING_TESTS.push({...current,id:'future-paper'});
 try{assert.throws(()=>assertTrialPaperBuildAuthorized(),/Unauthorized listening asset/);}
 finally{TRIAL_LISTENING_TESTS.pop();}
});

test('trial libraries enforce family authorization and do not wildcard-import future reading papers',()=>{
 for(const [name,kind] of [['TrialReadingLibrary','reading'],['TrialListeningLibrary','listening']]){
  const source=readFileSync(`src/components/${name}.tsx`,'utf8');
  assert.ok(source.includes('isAuthorizedTrialAsset'),name);
  assert.ok(source.includes('TrialPaperRightsNotice'),name);
  if(kind==='reading')assert.ok(!source.includes('import.meta.glob'),name);
 }
});

test('production build restores lazy trial libraries and every original scan byte-for-byte',{skip:!existsSync('dist-web/assets')},()=>{
 const files=readdirSync('dist-web/assets');
 for(const name of ['TrialReadingLibrary','TrialListeningLibrary'])assert.ok(files.some(n=>n.startsWith(name+'-')),name);
 const chunks=files.filter(n=>/\.js$/.test(n)).map(n=>readFileSync('dist-web/assets/'+n,'utf8')).join('\n');
 for(const t of [...TRIAL_READING_TESTS,...TRIAL_LISTENING_TESTS]){
  assert.ok(chunks.includes(t.questionFileId),t.id);
 }
 for(const name of readdirSync('src/data/readingPapers')){
  const paper=JSON.parse(readFileSync('src/data/readingPapers/'+name,'utf8'));
  for(const pages of Object.values(paper) as any[])for(const page of pages){
   for(const image of [page.image,page.figure].filter(Boolean)){
    const [,type,b64]=image.match(/^data:image\/(\w+);base64,(.*)$/s)!;
    const bytes=Buffer.from(b64,'base64'),hash=createHash('sha256').update(bytes).digest('hex').slice(0,20);
    assert.deepEqual(readFileSync(`dist-web/assets/reading-${hash}.${type==='jpeg'?'jpg':type}`),bytes,`${name} page ${page.number}`);
   }
  }
 }
});
test('all current trial families reach production grading defaults; missing Listening keys stay unscored',async()=>{
 const {TRIAL_READING_KEYS}=await import('../src/data/trialReadingKeys');
 const {TRIAL_LISTENING_KEYS}=await import('../src/data/trialListeningKeys');
 const store=new Map<string,any>();
 const snapshot=(path:string)=>({exists:store.has(path),data:()=>store.get(path)});
 const db:any={doc:(path:string)=>({path,get:async()=>snapshot(path)}),collection:(path:string)=>({get:async()=>({docs:[...store.entries()].filter(([key])=>key.startsWith(path+'/')).map(([,value])=>({data:()=>value}))})}),runTransaction:async(fn:any)=>fn({get:async(ref:any)=>snapshot(ref.path),set:(ref:any,value:any)=>store.set(ref.path,value)})};
 let uid='';const app=express();app.use(express.json());registerPracticeRoutes(app,db,async()=>({uid}));
 let graded=0,unscored=0;
 await serve(app,async base=>{
  for(const [kind,catalog,keys] of [['reading',TRIAL_READING_TESTS,TRIAL_READING_KEYS],['listening',TRIAL_LISTENING_TESTS,TRIAL_LISTENING_KEYS]] as const){
   for(const asset of catalog){
    uid=`fixture-${kind}-${asset.id}`;store.set(`users/${uid}`,{plan:'free'});
    const key=keys[asset.id];const answers=key?Object.fromEntries(Object.entries(key.answers).map(([n,values])=>[n,values[0]])):{1:'A'};
    const response=await fetch(`${base}/api/${kind}/check`,{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({testId:asset.id,part:1,answers})});
    if(!key){assert.equal(response.status,400,asset.id);assert.ok(![...store.keys()].some(k=>k.startsWith(`users/${uid}/sessions/`)));unscored++;}
    else{assert.equal(response.status,200,asset.id);const body=await response.json() as any;assert.equal(body.saved,true);assert.equal(body.result.parts[1].correct,kind==='reading'?8:7);graded++;}
   }
  }
 });
 assert.equal(graded,89);assert.equal(unscored,2);
});

test('unknown and cross-skill trial grading is denied before database access, grading or practice consumption',async()=>{
 const app=express();app.use(express.json());
 registerPracticeRoutes(app,{} as any,async()=>({uid:'rights-test'}));
 app.post('/legacy/check',createListeningCheckHandler({verifyToken:async()=>({uid:'rights-test'}),upsert:async()=>{throw Error('must not save');}}));
 await serve(app,async base=>{
  for(const [kind,testId] of [['reading','future-paper'],['listening','future-paper'],['reading','kuala-lumpur'],['listening','kuala-lumpur-2026'],['legacy','future-paper']]){
   const response=await fetch(`${base}/${kind==='legacy'?'legacy':`api/${kind}`}/check`,{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({testId,part:1,answers:{1:'A'},authorized:true})});
   assert.equal(response.status,451,`${kind}:${testId}`);assert.match(response.headers.get('cache-control')||'',/no-store/);
   assert.doesNotMatch(await response.text(),/correctAnswer|correctAnswers/);
  }
 });
});
