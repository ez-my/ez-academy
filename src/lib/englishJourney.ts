import type {PracticeSession} from '../types';
const kinds=[['Reading','ReadEZ','read'],['Writing','WriteEZ','write'],['Speaking','SpeakEZ','speak'],['Listening','ListenEZ','listen']] as const;
const day=(n:number)=>new Date(n+8*3600000).toISOString().slice(0,10);
export function englishJourney(sessions:PracticeSession[],now=Date.now()){
 const midnight=Date.parse(day(now)+'T00:00:00+08:00'),start=midnight-6*86400000,previous=start-7*86400000;
 const valid=sessions.filter(s=>Number.isFinite(s.timestamp)&&s.timestamp<=now&&typeof s.score==='number'&&Number.isFinite(s.score)&&s.score>=0&&s.score<=100);
 const average=(rows:PracticeSession[])=>rows.length?Math.round(rows.reduce((n,s)=>n+s.score,0)/rows.length):null;
 const skills=kinds.map(([label,type,key])=>{const rows=valid.filter(s=>s.type===type);const current=rows.filter(s=>s.timestamp>=start),prior=rows.filter(s=>s.timestamp>=previous&&s.timestamp<start);const score=average(current),before=average(prior);return {label,key,score,count:current.length,change:score!==null&&before!==null?score-before:null};});
 const days=Array.from({length:7},(_,i)=>{const date=day(start+i*86400000);return {day:date,score:average(valid.filter(s=>day(s.timestamp)===date))};});
 const weeks=Array.from({length:4},(_,i)=>{const from=start-(3-i)*7*86400000,to=from+7*86400000;return {label:`W${i+1}`,from:day(from),score:average(valid.filter(s=>s.timestamp>=from&&s.timestamp<to))};});
 return {skills,days,weeks,count:valid.filter(s=>s.timestamp>=start).length};
}
