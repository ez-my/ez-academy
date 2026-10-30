import {skillAccess,currentPurchase} from '../data/subscriptionAccess';
import {practiceQuota} from './practicePolicy';
import {PLAN_NAMES} from '../packages';
export function dashboardAccess(profile:any,ledger:any,usage:any,now=Date.now()){
 const extra=Math.max(0,Number(ledger.rewardPracticeCredits||0));
 const skills=Object.fromEntries(['read','write','speak','listen'].map(skill=>{const a=skillAccess(profile,ledger,skill,now),used=Number(usage.bySkill?.[skill]||0);if(a.extraFree){const q=practiceQuota(a,usage);return [skill,{...a,planLimit:a.limit,limit:a.limit+2+extra,shared:true,used:a.limit+2-q.remaining,remaining:q.remaining+extra,paidRemaining:q.paidRemaining,freeRemaining:q.freeRemaining,rewardRemaining:extra}];}return [skill,{...a,shared:!a.paid,used,remaining:Math.max(0,a.limit-(a.paid?used:Number(usage.used||0)))+extra,rewardRemaining:extra}];}));
 const bundle=currentPurchase(ledger,now);const focused=Object.entries(skills).filter(([,a])=>a.plan==='focus').map(([s])=>({speak:'SpeakEZ',write:'WriteEZ',read:'ReadEZ',listen:'ListenEZ'} as any)[s]);
 const base=bundle?.planId||Object.values(skills).find(a=>a.paid&&a.plan!=='focus')?.plan||'free';
 return {planLabel:base!=='free'?PLAN_NAMES[base]||base:focused.length?focused.join(' + ')+' Focus':'Free',sharedUsed:Number(usage.used||0),sharedRemaining:Math.max(0,2-Number(usage.used||0))+extra,practiceRewardCredits:extra,skills};
}
