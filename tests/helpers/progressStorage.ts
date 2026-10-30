// Browser-faithful localStorage enumeration; separate adapters can share one map.
export function progressStorage(values = new Map<string,string>(), setItem = (k:string,v:string)=>{values.set(k,v);}) {
  return { get length(){return values.size;}, key:(i:number)=>[...values.keys()][i]??null, getItem:(k:string)=>values.get(k)??null, setItem };
}
