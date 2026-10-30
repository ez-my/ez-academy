import assert from 'node:assert/strict';
// In-memory Firestore substitute: staged atomic writes, serialized transactions,
// immutable reads, and the query operators used by the real affiliate routes.
export class AffiliateMemoryDb {
 docs=new Map<string,any>(); serial=Promise.resolve(); counter=0;
 doc(path:string){return this.ref(path);}
 snap(path:string):any {const value=this.docs.get(path);return {id:path.split('/').at(-1),exists:value!==undefined,data:()=>value===undefined?undefined:structuredClone(value),ref:this.ref(path)};}
 ref(path:string):any{return {id:path.split('/').at(-1),path,get:async()=>this.snap(path),set:async(data:any)=>this.write(path,data,false),update:async(data:any)=>this.write(path,data,true),create:async(data:any)=>{assert.equal(this.docs.has(path),false,'Create target must not exist');this.write(path,data,false);},collection:(name:string)=>this.collection(path+'/'+name)};}
 write(path:string,data:any,merge:boolean){const result=merge?structuredClone(this.docs.get(path)||{}):{};for(const [k,v]of Object.entries(data)){const type=(v as any)?.constructor?.name;result[k]=type==='NumericIncrementTransform'?(result[k]||0)+(v as any).operand:type==='ServerTimestampTransform'?Date.now():structuredClone(v);}this.docs.set(path,result);}
 collection(name:string):any {
  const query=(filters:any[]=[],sorts:any[]=[],limit=Infinity,cursor:any[]=[])=>({
   doc:(id?:string)=>this.ref(name+'/'+(id||`order-${++this.counter}`)),
   where:(key:string,op:string,value:any)=>{assert.equal(op,'==');return query([...filters,[key,value]],sorts,limit,cursor);},
   orderBy:(key:string,dir='asc')=>query(filters,[...sorts,[key,dir]],limit,cursor),
   limit:(n:number)=>query(filters,sorts,n,cursor),startAfter:(...values:any[])=>query(filters,sorts,limit,values),
   get:async()=>{let rows=[...this.docs].filter(([p,d])=>p.startsWith(name+'/')&&p.split('/').length===name.split('/').length+1&&filters.every(([k,v])=>d[k]===v)).map(([p])=>this.snap(p));
    const value=(r:any,k:string)=>k==='__name__'?r.id:r.data()[k];
    const cmp=(a:any,b:any)=>{for(const [k,dir]of sorts){const n=value(a,k)<value(b,k)?-1:value(a,k)>value(b,k)?1:0;if(n)return dir==='desc'?-n:n;}return 0;};
    rows.sort(cmp);if(cursor.length){const c={id:cursor[1],data:()=>Object.fromEntries(sorts.map(([k]:any,i:number)=>[k,cursor[i]]))};rows=rows.filter(r=>cmp(r,c)>0);}rows=rows.slice(0,limit);return {docs:rows,size:rows.length,empty:!rows.length};}
  });return query();
 }
 async runTransaction(fn:any){const before=this.serial;let release!:()=>void;this.serial=new Promise<void>(r=>release=r);await before;let wrote=false;const pending:any[]=[];try{const result=await fn({get:async(ref:any)=>{assert.equal(wrote,false,'All reads must precede writes');return this.snap(ref.path);},set:(r:any,d:any)=>{wrote=true;pending.push([r.path,d,false]);},update:(r:any,d:any)=>{wrote=true;pending.push([r.path,d,true]);},create:(r:any,d:any)=>{wrote=true;assert.equal(this.docs.has(r.path),false,'Create target must not exist');pending.push([r.path,d,false]);}});for(const [p,d,m]of pending)this.write(p,d,m);return result;}finally{release();}}
}
