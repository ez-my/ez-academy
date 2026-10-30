import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Copy,Wallet,ArrowUpRight,Check} from 'lucide-react';
import {affiliateRequest} from '../../lib/affiliate';
import {AFFILIATE_TERMS,MIN_CLAIM_CENTS,money} from '../../affiliate';
import './affiliate.css';
export function AffiliateWallet({uid,request=affiliateRequest}:{uid:string;request?:typeof affiliateRequest}) {
  const [data,setData]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[show,setShow]=useState(false),[copied,setCopied]=useState('');
  const [amount,setAmount]=useState('10.00'),[method,setMethod]=useState('DuitNow'),[name,setName]=useState(''),[duitNowId,setId]=useState(''),[qr,setQr]=useState(''),[requestId,setRequestId]=useState(()=>crypto.randomUUID());
  const load=async()=>{try {setData(await request('affiliate/account',{}));setError('');}catch(e:any){setError(e.message);}};
  useEffect(()=>{void load();},[uid]);
  const copy=async(value:string,kind:string)=>{try {await navigator.clipboard.writeText(value);setCopied(kind);setTimeout(()=>setCopied(''),2000);}catch{setError('Could not copy. Select and copy the code below.');}};
  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setError('');
    try {await request('affiliate/claims',{requestId,amountCents:Math.round(Number(amount)*100),method,recipientName:name,duitNowId,qr});setShow(false);setRequestId(crypto.randomUUID());await load();}
    catch(e:any){setError(e.message);}finally{setBusy(false);}
  }
  return <section className="affiliate-surface affiliate-wallet" aria-label="Affiliate wallet">
    <div className="flex items-center justify-between gap-3 mb-5"><h2 className="text-xl font-semibold flex items-center gap-2"><Wallet size={22}/> Affiliate wallet</h2><Link to="/affiliate" className="text-sm text-blue-200 inline-flex gap-1 items-center">How it works <ArrowUpRight size={16}/></Link></div>
    {error&&<p role="alert" className="mb-4 text-amber-200">{error} <button className="underline" onClick={load}>Retry</button></p>}
    {!data?<p className="text-blue-100/70">{error?'Wallet unavailable.':'Loading your referral code and balance…'}</p>:<>
      <div className="grid md:grid-cols-2 gap-6"><div><p className="affiliate-eyebrow">Confirmed available balance</p><p className="text-4xl font-semibold my-3">{money(data.availableCents)}</p><p className="text-sm text-blue-100/70">In claims: {money(data.reservedCents)} · Paid: {money(data.paidCents)}</p>
      <progress aria-label="Progress toward minimum claim" value={Math.min(data.availableCents,MIN_CLAIM_CENTS)} max={MIN_CLAIM_CENTS} className="affiliate-progress my-4"/>
      <p className="text-sm text-blue-100">{data.availableCents>=MIN_CLAIM_CENTS?'Your balance is ready to claim.':`${money(MIN_CLAIM_CENTS-data.availableCents)} to your next claim.`}</p></div>
      <div><p className="affiliate-eyebrow">Your referral code</p><div className="flex gap-2 mt-3"><code className="affiliate-code flex-1">{data.code}</code><button className="affiliate-secondary" aria-label="Copy referral code" onClick={()=>copy(data.code,'code')}>{copied==='code'?<Check size={18}/>:<Copy size={18}/>}</button></div><p className="text-xs text-blue-100/70 break-all mt-3">{location.origin}/?ref={data.code}</p><button className="affiliate-secondary mt-3" onClick={()=>copy(`${location.origin}/?ref=${data.code}`,'link')}>{copied==='link'?'Link copied':'Copy referral link'}</button></div></div>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-white/15"><p className="text-sm text-blue-100/80 max-w-md">{AFFILIATE_TERMS}</p><button className="affiliate-primary" disabled={data.availableCents<MIN_CLAIM_CENTS||busy} onClick={()=>{setShow(!show);setAmount((data.availableCents/100).toFixed(2));}}>{show?'Close form':'Claim commission'}</button></div>
      {show&&<form onSubmit={submit} className="affiliate-form mt-6 grid sm:grid-cols-2 gap-4"><label>Claim amount (RM)<input required type="number" step="0.01" min="10" max={data.availableCents/100} value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Payout method<select value={method} onChange={e=>setMethod(e.target.value)}><option>DuitNow</option><option>Touch n Go eWallet QR</option></select></label><label>Account holder name<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>{method==='DuitNow'?<label>DuitNow ID (phone, NRIC or account ID)<input required maxLength={100} value={duitNowId} onChange={e=>setId(e.target.value)}/></label>:<label>Touch n Go eWallet QR image<input required type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{setQr('');const file=e.target.files?.[0];if(!file)return;if(file.size>440000){setError('Choose a QR image smaller than 440 KB.');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>setQr(String(reader.result));reader.readAsDataURL(file);}}/><span className="text-xs">PNG, JPG or WebP, up to 440 KB.</span></label>}{method!=='DuitNow'&&qr&&<img src={qr} alt="Your payout QR" className="w-28 rounded-lg"/>}<p className="sm:col-span-2 text-sm text-blue-100/70">Your claim amount is reserved when submitted. Check your payout details before continuing.</p><button disabled={busy||(method!=='DuitNow'&&!qr)} className="affiliate-primary" type="submit">{busy?'Submitting…':'Submit claim'}</button></form>}
      <div className="mt-7"><h3 className="font-semibold mb-3">Claim history</h3>{!data.claims.length?<p className="text-sm text-blue-100/60">No claims yet. Share your code to start earning.</p>:<ul className="space-y-3">{data.claims.map((c:any)=><li key={c.id} className="flex flex-wrap items-center justify-between gap-2 bg-white/5 p-3 rounded-xl text-sm"><div>{money(c.amountCents)} · {c.method}<p className="text-xs text-blue-100/60 mt-1">{new Date(c.submittedAt).toLocaleDateString('en-MY')}</p></div><span className="affiliate-status">{c.status}</span></li>)}</ul>}</div>
    </>}
  </section>;
}
