import {PACKAGES} from '../packages';
import {DAILY_PRACTICE_LIMITS} from './practiceLimits';
export const millis=(value:any)=>Number(value?.toMillis?.()??value??0);
export const currentPurchase=(ledger:any,now:number,skill?:string)=>(ledger.purchases||[]).filter((p:any)=>[3,4].includes(p.version)&&p.startsAt<=now&&p.expiresAt>now&&(skill?p.skill===skill:p.type==='subscription')).sort((a:any,b:any)=>b.startsAt-a.startsAt)[0];
export function skillAccess(profile:any,ledger:any,skill:string,now=Date.now()):any{
 const purchase=currentPurchase(ledger,now,skill),bundle=currentPurchase(ledger,now);
 const oldBundle=ledger.version===2&&millis(ledger.expiresAt)>now?ledger.planId:profile.plan&&profile.plan!=='free'&&(!millis(profile.planExpiresAt)||millis(profile.planExpiresAt)>now)?profile.plan:'free';
 const oldFocus=millis(ledger.focus?.[skill]?.expiresAt)>now?ledger.focus[skill]:null;
 const base=bundle?{plan:bundle.planId,limit:bundle.dailyLimits?.[skill]??bundle.dailyLimit,fullTests:bundle.fullTests,expiresAt:bundle.expiresAt}:oldBundle!=='free'&&(DAILY_PRACTICE_LIMITS as any)[oldBundle]?{plan:oldBundle,limit:(DAILY_PRACTICE_LIMITS as any)[oldBundle][skill],fullTests:!['lite'].includes(oldBundle),expiresAt:millis(ledger.expiresAt)||millis(profile.planExpiresAt)}:null;
 const focus=purchase?{plan:'focus',limit:purchase.dailyLimits?.[skill]??purchase.dailyLimit,fullTests:purchase.fullTests,expiresAt:purchase.expiresAt}:oldFocus?{plan:'focus',limit:(DAILY_PRACTICE_LIMITS.pro as any)[skill],fullTests:true,expiresAt:oldFocus.expiresAt}:null;
 const pools=[bundle,purchase].filter(p=>p?.version===4&&p.extraFree).map(p=>({id:p.id,limit:p.dailyLimit,shared:p.dailyScope==='bundle'}));
 if(pools.length&&!([base,focus].some(a=>a&&a.plan!=='free')&&[bundle,purchase].some(p=>p?.version===3))&&!oldFocus&&(!base||!!bundle))return {plan:bundle?.planId||'focus',paid:true,limit:pools.reduce((n,p)=>n+p.limit,0),fullTests:!!(base?.fullTests||focus?.fullTests),expiresAt:Math.max(...[bundle,purchase].filter(Boolean).map(p=>p.expiresAt)),extraFree:true,practicePools:pools};
 const selected=base&&focus?(base.limit>=focus.limit?base:focus):base||focus;
 return selected?{...selected,paid:true,fullTests:!!(base?.fullTests||focus?.fullTests)}:{plan:'free',paid:false,limit:2,fullTests:false,expiresAt:0};
}
