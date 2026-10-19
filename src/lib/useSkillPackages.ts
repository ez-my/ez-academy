import {useEffect,useState} from 'react';
import {auth} from './firebase';
import {UserProfile,PlanType} from '../types';
export function useSkillPackages(profile:UserProfile|null){
 const [skills,setSkills]=useState<Record<string,{plan:PlanType;fullTests:boolean}>>({});
 useEffect(()=>{let active=true;setSkills({});const refresh=async()=>{try{const token=await auth.currentUser?.getIdToken();if(!token)return;const r=await fetch('/api/practice/status',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});if(r.ok&&active)setSkills((await r.json()).skills||{});}catch{}};void refresh();const timer=setInterval(refresh,60000);for(const event of ['focus','ez-ai-credits-changed','ez_profile_updated','ez-practice-update'])window.addEventListener(event,refresh);return()=>{active=false;clearInterval(timer);for(const event of ['focus','ez-ai-credits-changed','ez_profile_updated','ez-practice-update'])window.removeEventListener(event,refresh)};},[profile?.uid]);
 return (skill:string)=>profile?{...profile,plan:skills[skill]?.plan||'free',fullTestAccess:skills[skill]?.fullTests||false}:null;
}
