import {skillAccess,currentPurchase} from '../data/subscriptionAccess';
import {practiceQuota} from './practicePolicy';
import {PLAN_NAMES} from '../packages';
export function dashboardAccess(profile:any,ledger:any,usage:any,now=Date.now()){
 const skills=Object.fromEntries(['read','write','speak','listen'].map(skill=>{const a=skillAccess(profile,ledger,skill,now),used=Number(usage.bySkill?.[skill]||0);if(a.extraFree){const q=practiceQuota(a,usage);return [skill,{...a,planLimit:a.limit,limit:a.limit+2,shared:true,used:a.limit+2-q.remaining,remaining:q.remaining,paidRemaining:q.paidRemaining,freeRemaining:q.freeRemaining}];}return [skill,{...a,shared:!a.paid,used,remaining:Math.max(0,a.limit-(a.paid?used:Number(usage.used||0)))}];}));
 const bundle=currentPurchase(ledger,now);const focused=Object.entries(skills).filter(([,a])=>a.plan==='focus').map(([s])=>({speak:'SpeakEZ',write:'WriteEZ',read:'ReadEZ',listen:'ListenEZ'} as any)[s]);
 const base=bundle?.planId||Object.values(skills).find(a=>a.paid&&a.plan!=='focus')?.plan||'free';
 return {planLabel:base!=='free'?PLAN_NAMES[base]||base:focused.length?focused.join(' + ')+' Focus':'Free',sharedUsed:Number(usage.used||0),sharedRemaining:Math.max(0,2-Number(usage.used||0)),skills};
}
