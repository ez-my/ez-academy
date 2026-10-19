import {skillAccess} from '../data/subscriptionAccess';
export const PRACTICE_SKILLS=['speak','write','read','listen'] as const;
export const malaysiaPracticeDay=(now=Date.now())=>new Date(now+8*3600000).toISOString().slice(0,10);
export function hasPaidPractice(profile:any,ledger:any,skill:string,now=Date.now()){return skillAccess(profile,ledger,skill,now).paid}
export function assertPracticeAllowed(paid:boolean,used:number,mock=false){
 if(!paid&&mock)throw Object.assign(Error('Full tests are not included in your plan for this skill.'),{status:403});
 if(!paid&&used>=2)throw Object.assign(Error('Your 2 free practices are used today. Come back tomorrow or upgrade.'),{status:429});
}
export function assertSkillPractice(profile:any,ledger:any,data:any,skill:string,mock=false,now=Date.now()){
 const access=skillAccess(profile,ledger,skill,now);
 if(mock&&!access.fullTests)throw Object.assign(Error('Full tests are not included in your plan for this skill.'),{status:403});
 assertPracticeAllowed(access.paid,Number(data?.used||0));
 if(access.extraFree){const quota=practiceQuota(access,data);if((mock?quota.paidRemaining:quota.remaining)<=0)throw Object.assign(Error('Your plan practices and available free practices are used today. Come back tomorrow.'),{status:429});return access;}
 if(access.paid&&Number(data?.bySkill?.[skill]||0)>=access.limit)throw Object.assign(Error('Your daily practice limit for this skill is used. Come back tomorrow.'),{status:429});
 return access;
}

// v4 keeps the shared two-practice gift separate from paid entitlement pools.
export function practiceQuota(access:any,data:any){
 const freeRemaining=Math.max(0,2-Number(data?.used||0));
 const paidRemaining=(access.practicePools||[]).reduce((n:number,p:any)=>n+Math.max(0,p.limit-Number(data?.paidPools?.[p.id]||0)),0);
 return {freeRemaining,paidRemaining,remaining:freeRemaining+paidRemaining};
}
export function consumePracticeDay(profile:any,ledger:any,data:any,day:string,skill:string,mock=false,now=Date.now()){
 const access=assertSkillPractice(profile,ledger,data,skill,mock,now);
 const next={...data,day,used:Number(data?.used||0),bySkill:{...data?.bySkill,[skill]:Number(data?.bySkill?.[skill]||0)+1}};
 if(!access.extraFree){next.used+=access.paid?0:1;return next;}
 if(!mock&&next.used<2){next.used++;return next;}
 const pool=access.practicePools.find((p:any)=>Number(data?.paidPools?.[p.id]||0)<p.limit);
 if(!pool)throw Object.assign(Error('Your plan practices are used today.'),{status:429});
 return {...next,paidPools:{...data?.paidPools,[pool.id]:Number(data?.paidPools?.[pool.id]||0)+1}};
}
