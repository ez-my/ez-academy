export const MY_DAY=86400000;
export function millis(value:any):number {return typeof value==='number'?value:value?.toMillis?.()??(value?.seconds?value.seconds*1000:0);}
export function dayKey(value:number){return new Date(value+8*3600000).toISOString().slice(0,10);}
export function dayStart(day:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Invalid date');const at=Date.parse(`${day}T00:00:00+08:00`);if(!Number.isFinite(at)||dayKey(at)!==day)throw Error('Invalid date');return at;}
export interface ReportTask {id:string;uid:string;skill:string;at:number;score:number|null;}
const validScore=(n:any)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100?n:null;
export function reportTasks(sessions:any[],events:any[]):ReportTask[]{
 const rows=new Map<string,ReportTask>();
 for(const s of sessions){const uid=s.userId;if(!uid)continue;const skill=({ReadEZ:'Reading',ListenEZ:'Listening',WriteEZ:'Writing',SpeakEZ:'Speaking'} as any)[s.type];if(!skill)continue;
 const result=s.readingResult||s.listeningResult;
 if(result?.parts&&s.testSetId){for(const p of Object.values(result.parts) as any[]){const id=`${uid}:${s.type}:${s.testSetId}:${p.part}`;rows.set(id,{id,uid,skill,at:millis(s.timestamp),score:p.total>0?validScore(p.correct/p.total*100):null});}}
 else if(s.muetReport){const r=s.muetReport;for(const mode of r.testType==='Mock'?['Part1','Part2']:[r.testType]){const id=`${uid}:muet:${r.topicId}:${mode}`;rows.set(id,{id,uid,skill:'Speaking',at:millis(s.timestamp),score:r.testType==='Mock'?null:validScore(s.score)});}}
 else {const id=`${uid}:session:${s.id}`;rows.set(id,{id,uid,skill,at:millis(s.timestamp),score:validScore(s.score)});}
 }
 for(const e of events){if(!e.userId||!e.id)continue;rows.set(e.id,{id:e.id,uid:e.userId,skill:e.skill,at:millis(e.at),score:validScore(e.score)??rows.get(e.id)?.score??null});}
 return [...rows.values()].filter(r=>Number.isFinite(r.at)&&r.at>0);
}
export function buildDailyReport(day:string,users:any[],tasks:ReportTask[],visits:any[],includeAdmin=false){
 const end=dayStart(day)+MY_DAY,start=end-14*MY_DAY;
 const adminIds=new Set(users.filter(u=>u.email?.toLowerCase()==='ezacademy.my@gmail.com').map(u=>u.id));
 const allowed=(uid:string)=>includeAdmin||!adminIds.has(uid);
 const relevant=tasks.filter(t=>allowed(t.uid)&&t.at>=start&&t.at<end);
 const days=Array.from({length:14},(_,i)=>{const at=start+i*MY_DAY,key=dayKey(at),records=relevant.filter(t=>dayKey(t.at)===key),dayVisits=visits.filter(v=>allowed(v.userId)&&v.day===key);
 return {day:key,active:new Set([...records.map(r=>r.uid),...dayVisits.map(v=>v.userId)]).size,tasks:records.length,newUsers:users.filter(u=>allowed(u.id)&&dayKey(millis(u.createdAt)||0)===key).length,scored:records.filter(r=>r.score!==null).length};});
 const selected=relevant.filter(t=>dayKey(t.at)===day),prev=days[12],today=days[13];
 const skillRows=['Reading','Writing','Speaking','Listening'].map(skill=>{const rows=selected.filter(t=>t.skill===skill),scores=rows.filter(t=>t.score!==null);return {skill,tasks:rows.length,learners:new Set(rows.map(t=>t.uid)).size,scored:scores.length,average:scores.length?Math.round(scores.reduce((n,r)=>n+r.score!,0)/scores.length):null};});
 const learners=[...new Set([...selected.map(r=>r.uid),...visits.filter(v=>v.day===day&&allowed(v.userId)).map(v=>v.userId)])].map(uid=>{const u=users.find(u=>u.id===uid),rows=selected.filter(r=>r.uid===uid);return {id:uid,name:u?.displayName||'Learner',tasks:rows.length,skills:[...new Set(rows.map(r=>r.skill))],lastAt:Math.max(0,...rows.map(r=>r.at),...visits.filter(v=>v.day===day&&v.userId===uid).map(v=>millis(v.at)))};}).sort((a,b)=>b.tasks-a.tasks||b.lastAt-a.lastAt);
 return {day,today,previous:prev,days:days.slice(7).reverse(),previousWeekTasks:days.slice(0,7).reduce((n,d)=>n+d.tasks,0),weekTasks:days.slice(7).reduce((n,d)=>n+d.tasks,0),skills:skillRows,learners,totalUsers:users.filter(u=>allowed(u.id)).length,generatedAt:Date.now()};
}
