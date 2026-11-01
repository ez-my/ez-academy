import {Timestamp,type Firestore} from 'firebase-admin/firestore';
import {dayKey} from './dailyReport';

export interface ActivityWindow {sessions:any[];events:any[];visits:any[];warnings:string[];}

// Reads a bounded window of learner activity from Firestore. Timestamps were saved
// both as numbers and as Firestore Timestamps, so every range is queried both ways.
async function boundedGroup(db:Firestore,group:string,field:string,start:number,end:number,warnings:string[]){
  try{
    const [a,b]=await Promise.all([
      db.collectionGroup(group).where(field,'>=',Timestamp.fromMillis(start)).where(field,'<',Timestamp.fromMillis(end)).limit(10001).get(),
      db.collectionGroup(group).where(field,'>=',start).where(field,'<',end).limit(10001).get(),
    ]);
    const unique=new Map([...a.docs,...b.docs].map(d=>[d.ref.path,d]));
    if(a.size>10000||b.size>10000)warnings.push('High activity: this report may be incomplete.');
    return [...unique.values()];
  }catch(error){
    // A missing index must never turn a bounded query into a collection scan.
    throw new Error(`Indexed ${group}.${field} query failed`,{cause:error});
  }
}

export async function loadActivity(db:Firestore,start:number,end:number,lastDay:string):Promise<ActivityWindow>{
  const warnings:string[]=[];
  const [s,e,v,m]=await Promise.all([
    boundedGroup(db,'sessions','timestamp',start,end,warnings),
    db.collection('usage_tasks').where('at','>=',start).where('at','<',end).limit(10001).get(),
    db.collection('usage_visits').where('day','>=',dayKey(start)).where('day','<=',lastDay).limit(10001).get(),
    boundedGroup(db,'completed','completedAt',start,end,warnings),
  ]);
  if(e.size>10000||v.size>10000)warnings.push('Large result: some records may be missing.');
  const sessions=s.filter(d=>d.ref.path.startsWith('users/')).map(d=>({id:d.id,...d.data()}));
  const events:any[]=e.docs.map(d=>d.data());
  for(const d of m){
    if(!d.ref.path.startsWith('muet_progress/'))continue;
    const r=d.data(),uid=d.ref.path.split('/')[1];
    events.push({id:`${uid}:muet:${r.topicId}:${r.mode}`,userId:uid,skill:'Speaking',at:r.completedAt,score:null});
  }
  return {sessions,events,visits:v.docs.map(d=>d.data()),warnings};
}
