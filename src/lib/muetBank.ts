import {useEffect,useState} from 'react';
import {practiceRequest} from './practice';
import {auth} from './firebase';
import type {MUETTopic} from '../types/muet';
export function pickMUETTopic(topics:MUETTopic[],exclude?:string){const pool=topics.filter(t=>t.id!==exclude);const source=pool.length?pool:topics;return source.length?source[Math.floor(Math.random()*source.length)]:null;}
export function useMUETBank(mode:'Part1'|'Part2'|'Mock',setTopic:(topic:MUETTopic)=>void){
 const [topics,setTopics]=useState<MUETTopic[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[version,setVersion]=useState(0);
 useEffect(()=>{let alive=true;setLoading(true);(async()=>{const uid=auth.currentUser?.uid;if(uid){let reports:any[]=[];try{const saved=JSON.parse(localStorage.getItem(`ez_muet_sessions_${uid}`)||'[]');if(Array.isArray(saved))reports=saved;}catch{}for(const r of reports.slice(0,300)){const key=`ez-muet-migrated:${uid}:${r.id}`;if(localStorage.getItem(key))continue;if(r.topicId&&['Part1','Part2','Mock'].includes(r.testType)&&typeof r.rawTranscript==='string'&&r.rawTranscript.trim().split(/\s+/).length>=5){await completeMUETTask(r.topicId,r.testType,r.rawTranscript,r.durationSeconds||0);try{localStorage.setItem(key,'1');}catch{}}}}return practiceRequest(`muet/bank?mode=${mode}`);})().then(d=>{if(alive){setTopics(d.topics);const next=pickMUETTopic(d.topics);if(next)setTopic(next);setError(next?'':'No new questions yet. Please try again shortly.');}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[mode,version]);
 return {topics,loading,error,reload:()=>setVersion(v=>v+1),random:(exclude?:string)=>{const next=pickMUETTopic(topics,exclude);if(next)setTopic(next);}};
}
export async function completeMUETTask(topicId:string,mode:'Part1'|'Part2'|'Mock',transcript:string,durationSeconds:number){await practiceRequest('muet/complete',{topicId,mode,transcript,durationSeconds});}

export async function startMUETTask(topicId:string,mode:'Part1'|'Part2'|'Mock',requestId=crypto.randomUUID()){const result=await practiceRequest('muet/start',{topicId,mode,requestId});window.dispatchEvent(new Event('ez-practice-update'));return result;}
