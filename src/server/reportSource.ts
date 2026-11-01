import type {Firestore} from 'firebase-admin/firestore';
import {dayKey} from './dailyReport';
import {boundedGroup} from './boundedGroup';

export interface ActivityWindow {sessions:any[];events:any[];visits:any[];warnings:string[];}

export async function loadActivity(db:Firestore,start:number,end:number,lastDay:string):Promise<ActivityWindow>{
  const warnings:string[]=[];
  const [s,e,v,m]=await Promise.all([
    boundedGroup(db,'sessions','timestamp',start,end,warnings),
    db.collection('usage_tasks').where('at','>=',start).where('at','<',end).limit(10001).get(),
    db.collection('usage_visits').where('day','>=',dayKey(start)).where('day','<=',lastDay).limit(10001).get(),
    boundedGroup(db,'completed','completedAt',start,end,warnings),
  ]);
  if(warnings.some(w=>w.startsWith('Could not load ')))
    throw new Error('An indexed activity query failed; mirror sync was not marked complete.');
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
