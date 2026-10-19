import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WARMUP_QUESTIONS,selectWarmupQuestions,parseWarmupHistory,WARMUP_VOICE} from '../src/speakingWarmup';
import {getExaminerVoice} from '../src/lib/examinerVoice';
test('12 consecutive warm-ups cover 48 distinct questions and never silently recycle',()=>{
 let history:string[]=[];const asked:string[]=[];
 for(let session=0;session<12;session++){
  const result=selectWarmupQuestions(history);assert.ok(result);assert.equal(result.questions.length,4);
  asked.push(...result.questions);history=parseWarmupHistory(JSON.stringify(result.history));
 }
 assert.equal(new Set(asked).size,48);assert.equal(history.length,48);assert.equal(selectWarmupQuestions(history),null);
});
test('bank has simple standalone questions without debates, duplicate prompts or embedded introductions',()=>{
 assert.equal(new Set(WARMUP_QUESTIONS.map(q=>q.text.toLowerCase())).size,48);
 for(const q of WARMUP_QUESTIONS){assert.ok(q.text.length<110);assert.equal((q.text.match(/\?/g)||[]).length,1);assert.doesNotMatch(q.text,/critically|discuss|government|climate change|mental health|economic|politic|advantages|disadvantages|hello/i);}
});
test('history tolerates corrupt local storage without importing unknown IDs',()=>{
 assert.deepEqual(parseWarmupHistory('{oops'),[]);assert.deepEqual(parseWarmupHistory('{}'),[]);
 assert.deepEqual(parseWarmupHistory('["warmup-0-0","warmup-0-0",7,"unknown"]'),['warmup-0-0']);
});
test('warm voice is cached separately and repeated playback reuses the clip',async()=>{
 const cache=new Map<string,Blob>();const bodies:any[]=[];
 const deps={read:async<T=any>(k:IDBValidKey)=>cache.get(String(k)) as T | undefined,write:async(k:any,v:any)=>{cache.set(k,v);},request:async(_url:any,init:any)=>{bodies.push(JSON.parse(init.body));return new Response(new Blob(['MP3']),{headers:{'Content-Type':'audio/mpeg'}});}};
 await getExaminerVoice('Hello friend.', 'token',undefined,deps,false);
 await getExaminerVoice('Hello friend.', 'token',undefined,deps,true);
 await getExaminerVoice('  Hello   friend. ', 'token',undefined,deps,true);
 assert.equal(bodies.length,2);assert.equal(bodies[1].warmup,true);assert.equal(cache.size,2);assert.equal(WARMUP_VOICE.voice,'coral');
});
