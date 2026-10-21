import {useEffect,useState} from 'react';
import {auth} from './firebase';
import {emitPaywall} from './paywall';
import {trackEvent} from './analytics';
export async function practiceRequest(path:string,body?:unknown){
 const user=auth.currentUser;if(!user)throw Error('Please sign in again.');
 const response=await fetch(`/api/${path}`,{cache:'no-store',method:body?'POST':'GET',headers:{Authorization:`Bearer ${await user.getIdToken()}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(!response.ok){
  const err=Object.assign(Error(data.error||'Could not load practice. Try again.'),{status:response.status,code:data.code});
  if(response.status===429)emitPaywall({code:data.code,skill:body&&typeof body==='object'?(body as any).skill:undefined,source:'practice'});
  throw err;
 }
 return data;
}
export async function startPractice(skill:string,mock=false){
 const result=await practiceRequest('practice/start',{skill,mock,requestId:crypto.randomUUID()});
 window.dispatchEvent(new Event('ez-practice-update'));
 try{
  const uid=auth.currentUser?.uid;
  if(uid&&!localStorage.getItem(`ez_first_practice:${uid}`)){
   localStorage.setItem(`ez_first_practice:${uid}`,'1');
   trackEvent('first_practice_started',{skill,mock});
  }
 }catch{}
 return result;
}
export function useTrialProgress(uid:string,skill:'read'|'listen'){
 const [progress,setProgress]=useState<Record<string,number[]>>({}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[blocked,setBlocked]=useState(false),[remaining,setRemaining]=useState(2);
 useEffect(()=>{let alive=true;const load=()=>{practiceRequest('practice/status').then(d=>{if(alive){setProgress(d.progress||{});setBlocked((d.skills?.[skill]?.remaining??Math.max(0,2-d.used))<=0);setRemaining(d.skills?.[skill]?.remaining??Math.max(0,2-d.used));setError('');}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});};load();let day=new Date(Date.now()+8*3600000).toISOString().slice(0,10);const timer=setInterval(()=>{const next=new Date(Date.now()+8*3600000).toISOString().slice(0,10);if(next!==day){day=next;load();}},60000);window.addEventListener('ez-practice-update',load);return()=>{alive=false;clearInterval(timer);window.removeEventListener('ez-practice-update',load);};},[uid]);
 return {parts:(id:string)=>progress[`${skill}:${id}`]||[],loading,error,blocked,remaining};
}
export function trialStatusClass(count:number,total:number){return count>=total?'border-[#80994a] bg-[#303d1c] text-[#c8dfa1]':count>0?'border-amber-400/50 bg-amber-400/10 text-amber-100':'';}
