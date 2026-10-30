import React,{useEffect,useState} from 'react';
import {Gift} from 'lucide-react';
import {practiceRequest} from '../../lib/practice';

export function Rewards({uid,onRedeemed}:{uid:string;onRedeemed?:()=>void}){
 const [code,setCode]=useState(''),[history,setHistory]=useState<any[]>([]),[practiceCredits,setPracticeCredits]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=async()=>{try{const data=await practiceRequest('rewards/history');setHistory(data.history||[]);setPracticeCredits(data.practiceCredits||0);}catch(e:any){setError(e.message);}};
 useEffect(()=>{void load();},[uid]);
 const redeem=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{const result=await practiceRequest('rewards/redeem',{code:code.trim()});setMessage(result.message);setCode('');await load();onRedeemed?.();window.dispatchEvent(new Event('ez-practice-update'));}catch(e:any){setError(e.message);}finally{setBusy(false);}};
 return <section className="glass-card p-4 sm:p-5 space-y-4" aria-label="Rewards">
  <div className="flex items-center gap-2"><Gift size={20} className="text-primary"/><h3 className="text-base font-semibold">Rewards</h3></div>
  <p className="text-sm text-white/60">Reward codes are separate from your affiliate referral code.</p>
  <form onSubmit={redeem} className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="reward-code">Redeem Reward Code</label><input id="reward-code" autoComplete="off" required maxLength={32} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Redeem Reward Code" className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-white"/><button disabled={busy||!code.trim()} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-obsidian disabled:opacity-50">{busy?'Redeeming…':'Redeem'}</button></form>
  {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}{message&&<p role="status" className="text-sm text-primary">{message}</p>}
  {practiceCredits>0&&<p className="text-sm text-white/70">Extra practices available: {practiceCredits}</p>}
  <div><h4 className="text-sm font-semibold mb-2">Redemption history</h4>{history.length?<ul className="space-y-2">{history.map(item=><li key={item.code} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white/5 p-3 text-sm"><span>{item.code} · {item.message}</span><time className="text-white/50">{new Date(item.redeemedAt).toLocaleDateString('en-MY')}</time></li>)}</ul>:<p className="text-sm text-white/50">No rewards redeemed yet.</p>}</div>
 </section>;
}
