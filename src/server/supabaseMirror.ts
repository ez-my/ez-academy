import {Timestamp,type Firestore} from 'firebase-admin/firestore';
import {dayKey,millis,reportTasks,MY_DAY,type ReportTask} from './dailyReport';
import {loadActivity} from './reportSource';

// Supabase is a read copy for the admin daily report. Firestore stays the source of
// truth for everything else. Every call here is optional: when the env variables are
// missing or Supabase is down, the report falls back to reading Firestore directly.

type FetchLike=(url:string,init?:RequestInit)=>Promise<Response>;
export interface MirrorOptions {url:string;key:string;fetchImpl?:FetchLike;}
export interface MirrorUser {id:string;email?:string|null;displayName?:string|null;createdAt:number;}
export interface MirrorVisit {userId:string;day:string;at:number;}
export interface MirrorWindow {users:MirrorUser[];tasks:ReportTask[];visits:MirrorVisit[];}

const PAGE=1000,CHUNK=500,SYNC_EVERY_MS=10*60*1000,SYNC_WINDOW_DAYS=3,TIMEOUT_MS=8000;
const chunks=<T>(rows:T[],size:number)=>Array.from({length:Math.ceil(rows.length/size)},(_,i)=>rows.slice(i*size,i*size+size));

export function mirrorFromEnv(env:Record<string,string|undefined>=process.env):SupabaseMirror|null{
  const url=env.SUPABASE_URL?.trim().replace(/\/+$/,''),key=env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if(!url||!key||!/^https:\/\//.test(url))return null;
  return new SupabaseMirror({url,key});
}

export class SupabaseMirror {
  private readonly url:string;private readonly key:string;private readonly fetchImpl:FetchLike;
  constructor(options:MirrorOptions){this.url=options.url;this.key=options.key;this.fetchImpl=options.fetchImpl??((u,i)=>fetch(u,i));}

  private async request(path:string,init:RequestInit={}){
    const res=await this.fetchImpl(`${this.url}/rest/v1/${path}`,{...init,signal:AbortSignal.timeout(TIMEOUT_MS),headers:{apikey:this.key,Authorization:`Bearer ${this.key}`,'Content-Type':'application/json',...(init.headers as Record<string,string>|undefined)}});
    if(!res.ok)throw new Error(`Supabase ${path.split('?')[0]} failed (${res.status})`);
    return res;
  }

  async upsert(table:string,rows:Record<string,unknown>[]){
    for(const part of chunks(rows,CHUNK))await this.request(`${table}?on_conflict=${table==='report_sync'?'key':'id'}`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(part)});
  }

  async selectAll<T>(table:string,params:[string,string][]):Promise<T[]>{
    const all:T[]=[];
    for(let offset=0;;offset+=PAGE){
      const query=new URLSearchParams([...params,['limit',String(PAGE)],['offset',String(offset)]]);
      const page=await (await this.request(`${table}?${query}`)).json() as T[];
      all.push(...page);
      if(page.length<PAGE)return all;
    }
  }

  async getState(key:string):Promise<number|null>{
    const rows=await this.selectAll<{value:number}>('report_sync',[['select','value'],['key',`eq.${key}`]]);
    return rows.length?Number(rows[0].value):null;
  }
  setState(key:string,value:number){return this.upsert('report_sync',[{key,value}]);}

  // Copies the last few days of activity from Firestore. Re-copying is safe because
  // every row has a stable id, so a repeat only overwrites the same record.
  async syncRecent(db:Firestore,now:number){
    const last=await this.getState('last_sync');
    if(last!==null&&now-last<SYNC_EVERY_MS)return {skipped:true};
    await this.setState('last_sync',now); // claim the slot first so parallel requests do not all sync
    await this.copyWindow(db,now-SYNC_WINDOW_DAYS*MY_DAY,now+MY_DAY,dayKey(now));
    return {skipped:false};
  }

  // Copies one window of Firestore activity, plus the profiles of the learners in it.
  async copyWindow(db:Firestore,start:number,end:number,lastDay:string){
    const {sessions,events,visits,warnings}=await loadActivity(db,start,end,lastDay);
    const tasks=reportTasks(sessions,events);
    // A task with no score must not erase a score that was already saved.
    const scored=tasks.filter(t=>t.score!==null).map(t=>({id:t.id,uid:t.uid,skill:t.skill,at:t.at,score:t.score}));
    const unscored=tasks.filter(t=>t.score===null).map(t=>({id:t.id,uid:t.uid,skill:t.skill,at:t.at}));
    await this.upsert('report_tasks',scored);
    await this.upsert('report_tasks',unscored);
    const visitRows=visits.filter(v=>v.userId&&v.day).map(v=>({id:`${v.userId}_${v.day}`,user_id:v.userId,day:v.day,at:millis(v.at)}));
    await this.upsert('report_visits',visitRows);
    await this.copyUsers(db,new Set([...tasks.map(t=>t.uid),...visitRows.map(v=>v.user_id)]),start);
    return {tasks:tasks.length,visits:visitRows.length,warnings};
  }

  // Fetches only profiles Supabase does not have yet, plus accounts created in the window.
  async copyUsers(db:Firestore,uids:Set<string>,since:number){
    const known=new Set<string>();
    for(const part of chunks([...uids],100)){
      const rows=await this.selectAll<{id:string}>('report_users',[['select','id'],['id',`in.(${part.map(id=>`"${id}"`).join(',')})`]]);
      rows.forEach(r=>known.add(r.id));
    }
    const missing=[...uids].filter(id=>!known.has(id));
    const docs=new Map<string,any>();
    for(const part of chunks(missing,100)){
      const snaps=await db.getAll(...part.map(id=>db.doc(`users/${id}`)));
      snaps.forEach(s=>{if(s.exists)docs.set(s.id,s.data());});
    }
    const [a,b]=await Promise.all([
      db.collection('users').where('createdAt','>=',Timestamp.fromMillis(since)).limit(5001).get(),
      db.collection('users').where('createdAt','>=',since).limit(5001).get(),
    ]);
    [...a.docs,...b.docs].forEach(d=>docs.set(d.id,d.data()));
    await this.upsert('report_users',[...docs.entries()].map(([id,u])=>({id,email:u.email??null,display_name:u.displayName??null,created_at:millis(u.createdAt)||0})));
  }

  async copyUserPage(rows:{id:string;data:any}[]){
    await this.upsert('report_users',rows.map(({id,data})=>({id,email:data.email??null,display_name:data.displayName??null,created_at:millis(data.createdAt)||0})));
  }

  async recordVisit(userId:string,day:string,at:number){
    await this.upsert('report_visits',[{id:`${userId}_${day}`,user_id:userId,day,at}]);
  }

  // Everything the report needs for one 14 day window, with no Firestore reads.
  async loadWindow(day:string,start:number,end:number):Promise<MirrorWindow>{
    const [users,tasks,visits]=await Promise.all([
      this.selectAll<any>('report_users',[['select','id,email,display_name,created_at'],['order','id.asc']]),
      this.selectAll<any>('report_tasks',[['select','id,uid,skill,at,score'],['at',`gte.${start}`],['at',`lt.${end}`],['order','id.asc']]),
      this.selectAll<any>('report_visits',[['select','user_id,day,at'],['day',`gte.${dayKey(start)}`],['day',`lte.${day}`],['order','id.asc']]),
    ]);
    return {
      users:users.map(u=>({id:u.id,email:u.email,displayName:u.display_name,createdAt:Number(u.created_at)||0})),
      tasks:tasks.map(t=>({id:t.id,uid:t.uid,skill:t.skill,at:Number(t.at),score:t.score===null||t.score===undefined?null:Number(t.score)})),
      visits:visits.map(v=>({userId:v.user_id,day:v.day,at:Number(v.at)})),
    };
  }
}
