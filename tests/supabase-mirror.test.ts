import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SupabaseMirror,mirrorFromEnv} from '../src/server/supabaseMirror';
import {buildDailyReport,dayStart} from '../src/server/dailyReport';

function fakeSupabase(tables:Record<string,any[]>={}){
  const calls:{method:string;url:URL;body?:any;headers:Record<string,string>}[]=[];
  const fetchImpl=async(input:string,init:RequestInit={})=>{
    const url=new URL(input),method=init.method||'GET',table=url.pathname.split('/').pop()!;
    const body=init.body?JSON.parse(String(init.body)):undefined;
    calls.push({method,url,body,headers:init.headers as Record<string,string>});
    if(method==='POST'){tables[table]=[...(tables[table]||[]),...body];return new Response(null,{status:201});}
    const limit=Number(url.searchParams.get('limit')||1000),offset=Number(url.searchParams.get('offset')||0);
    return new Response(JSON.stringify((tables[table]||[]).slice(offset,offset+limit)),{status:200});
  };
  return {fetchImpl,calls,tables};
}

test('mirror stays off without https url and service key',()=>{
  assert.equal(mirrorFromEnv({}),null);
  assert.equal(mirrorFromEnv({SUPABASE_URL:'http://x.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'k'}),null);
  assert.ok(mirrorFromEnv({SUPABASE_URL:'https://x.supabase.co/',SUPABASE_SERVICE_ROLE_KEY:'k'}));
});

test('upsert sends the key as a header, merges duplicates and splits large batches',async()=>{
  const f=fakeSupabase();const m=new SupabaseMirror({url:'https://x.supabase.co',key:'secret',fetchImpl:f.fetchImpl});
  await m.upsert('report_visits',Array.from({length:1200},(_,i)=>({id:String(i),user_id:'u',day:'2026-11-01',at:1})));
  assert.equal(f.calls.length,3);
  assert.equal(f.calls[0].headers.apikey,'secret');
  assert.match(f.calls[0].headers.Prefer,/merge-duplicates/);
  assert.equal(f.calls[0].url.searchParams.get('on_conflict'),'id');
  assert.equal(f.calls[0].url.searchParams.has('apikey'),false); // never put the key in the URL
});

test('selectAll pages through more than one thousand rows',async()=>{
  const f=fakeSupabase({report_tasks:Array.from({length:2500},(_,i)=>({id:String(i)}))});
  const m=new SupabaseMirror({url:'https://x.supabase.co',key:'k',fetchImpl:f.fetchImpl});
  assert.equal((await m.selectAll('report_tasks',[['select','id']])).length,2500);
});

test('syncRecent skips when a sync ran in the last ten minutes',async()=>{
  const now=Date.parse('2026-11-01T06:00:00Z');
  const f=fakeSupabase({report_sync:[{key:'last_sync',value:now-60000}]});
  const m=new SupabaseMirror({url:'https://x.supabase.co',key:'k',fetchImpl:f.fetchImpl});
  assert.deepEqual(await m.syncRecent({} as any,now),{skipped:true});
  assert.equal(f.calls.every(c=>c.method==='GET'),true); // no writes and no Firestore reads
});

test('loadWindow feeds the existing report builder and matches the Firestore shape',async()=>{
  const at=dayStart('2026-11-01')+3600000;
  const f=fakeSupabase({
    report_users:[{id:'u',email:'a@x.com',display_name:'Aina',created_at:at},{id:'admin',email:'ezacademy.my@gmail.com',display_name:'Admin',created_at:at}],
    report_tasks:[{id:'1',uid:'u',skill:'Reading',at,score:0},{id:'2',uid:'admin',skill:'Reading',at,score:90}],
    report_visits:[{user_id:'u',day:'2026-11-01',at}],
  });
  const m=new SupabaseMirror({url:'https://x.supabase.co',key:'k',fetchImpl:f.fetchImpl});
  const w=await m.loadWindow('2026-11-01',dayStart('2026-11-01')-13*86400000,dayStart('2026-11-01')+86400000);
  assert.equal(w.tasks[0].score,0); // a zero score stays zero
  const r=buildDailyReport('2026-11-01',w.users,w.tasks,w.visits);
  assert.equal(r.today.tasks,1);assert.equal(r.today.active,1);assert.equal(r.today.newUsers,1);assert.equal(r.learners[0].name,'Aina');
});

test('a Supabase error is reported instead of returning empty data',async()=>{
  const m=new SupabaseMirror({url:'https://x.supabase.co',key:'k',fetchImpl:async()=>new Response('no',{status:500})});
  await assert.rejects(()=>m.loadWindow('2026-11-01',0,1));
});
