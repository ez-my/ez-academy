export const SHARE_AI_REWARD=2;
export const ACHIEVEMENTS=[
 {id:'first_step',name:'First practice',description:'Complete your first saved practice',target:1},
 {id:'module_master',name:'10 practices',description:'Complete 10 saved practices',target:10},
 {id:'consistency_king',name:'7-day streak',description:'Practise for 7 days in a row',target:7},
 {id:'streak_30',name:'30-day streak',description:'Practise for 30 days in a row',target:30},
 {id:'early_bird',name:'Morning practice',description:'Complete a practice before 8 AM Malaysia time',target:1},
 {id:'night_owl',name:'Night practice',description:'Complete a practice at or after 10 PM Malaysia time',target:1},
 {id:'fast_learner',name:'5 practices in a day',description:'Complete 5 practices on one Malaysia calendar day',target:5},
 {id:'perfect_score',name:'Score 100%',description:'Score 100% in a saved practice',target:100},
 {id:'master_spm',name:'Score 90%',description:'Score at least 90% in a saved practice',target:90},
 {id:'polyglot',name:'All four skills',description:'Complete a practice in each of the four skills',target:4},
] as const;
export const malaysiaDay=(time:number)=>new Date(time+8*3600000).toISOString().slice(0,10);
export function evaluateAchievements(sessions:any[],now=Date.now()){
 const valid=sessions.map(s=>({...s,timestamp:typeof s.timestamp?.toMillis==='function'?s.timestamp.toMillis():s.timestamp})).filter(s=>['SpeakEZ','WriteEZ','ReadEZ','ListenEZ'].includes(s.type)&&Number.isFinite(s.timestamp)&&s.timestamp>0&&s.timestamp<=now&&Number.isFinite(s.score)&&s.score>=0&&s.score<=100);
 const days=[...new Set(valid.map(s=>malaysiaDay(s.timestamp)))].sort();let streak=0,best=0,last='';for(const day of days){streak=last&&Date.parse(day)-Date.parse(last)===86400000?streak+1:1;best=Math.max(best,streak);last=day;}
 const counts:Record<string,number>={};valid.forEach(s=>{const d=malaysiaDay(s.timestamp);counts[d]=(counts[d]||0)+1;});
 const hour=(s:any)=>new Date(s.timestamp+8*3600000).getUTCHours();
 const values:Record<string,number>={first_step:valid.length,module_master:valid.length,consistency_king:best,streak_30:best,early_bird:valid.some(s=>hour(s)<8)?1:0,night_owl:valid.some(s=>hour(s)>=22)?1:0,fast_learner:Math.max(0,...Object.values(counts)),perfect_score:Math.max(0,...valid.map(s=>s.score)),master_spm:Math.max(0,...valid.map(s=>s.score)),polyglot:new Set(valid.map(s=>s.type)).size};
 return ACHIEVEMENTS.map(a=>({...a,progress:Math.min(a.target,values[a.id]),unlocked:values[a.id]>=a.target}));
}
