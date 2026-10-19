import {DAILY_PRACTICE_LIMITS as PLAN_LIMITS} from '../data/practiceLimits';
import {practiceRequest,startPractice} from './practice';
import { useState, useEffect } from 'react';
import { PlanType } from '../types';

export type SkillType = 'speak' | 'write' | 'read' | 'listen' | 'aiListen';

interface DailyLimits {
  speak: number;
  write: number;
  read: number;
  listen: number;
  aiListen: number;
}

export {DAILY_PRACTICE_LIMITS as PLAN_LIMITS} from '../data/practiceLimits';

export const CREDIT_COSTS = {
  speak: { basic: 1, deep: 2 },
  write: { basic: 2, deep: 4 },
  read: { basic: 1, deep: 1 },
  listen: { basic: 1, deep: 1 },
  aiListen: { basic: 2, deep: 5 },
};

export const useDailyLimits=(_plan:PlanType='free',_email:string|null=null)=>{
 const [skills,setSkills]=useState<Record<string,any>>({});
 const refresh=async()=>{try{const d=await practiceRequest('practice/status');setSkills(d.skills||{});}catch{setSkills({})}};
 useEffect(()=>{void refresh();const timer=setInterval(refresh,60000);window.addEventListener('ez-practice-update',refresh);return()=>{clearInterval(timer);window.removeEventListener('ez-practice-update',refresh)}},[]);
 const getRemaining=(skill:SkillType)=>Number(skills[skill==='aiListen'?'listen':skill]?.remaining||0);
 const incrementUsage=async(skill:SkillType,mock=false)=>{await startPractice(skill==='aiListen'?'listen':skill,mock);await refresh()};
 return {usage:Object.fromEntries(Object.entries(skills).map(([s,d])=>[s,d.used])) as unknown as DailyLimits,getRemaining,isLimitReached:(s:SkillType)=>getRemaining(s)<=0,incrementUsage};
};
