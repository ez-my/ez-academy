import {Timestamp,type Firestore,type QueryDocumentSnapshot} from 'firebase-admin/firestore';

// Reads one collection group inside a time window. Dates were saved both as numbers and
// as Firestore Timestamps, so the window is queried both ways.
//
// If a query fails (a missing index, or the daily quota being used up) this returns
// nothing and adds a warning. It never falls back to reading the whole collection group:
// that fallback cost up to 10,001 reads per call and could use the free daily quota
// in a handful of admin page loads.
export async function boundedGroup(db:Firestore,group:string,field:string,start:number,end:number,warnings:string[]):Promise<QueryDocumentSnapshot[]>{
  try{
    const [a,b]=await Promise.all([
      db.collectionGroup(group).where(field,'>=',Timestamp.fromMillis(start)).where(field,'<',Timestamp.fromMillis(end)).limit(10001).get(),
      db.collectionGroup(group).where(field,'>=',start).where(field,'<',end).limit(10001).get(),
    ]);
    const unique=new Map([...a.docs,...b.docs].map(d=>[d.ref.path,d]));
    if(a.size>10000||b.size>10000)warnings.push('High activity: this report may be incomplete.');
    return [...unique.values()];
  }catch{
    warnings.push(`Could not load ${group}. This report is incomplete.`);
    return [];
  }
}
