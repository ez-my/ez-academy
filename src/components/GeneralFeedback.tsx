import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
export const GENERAL_GUIDANCE:Record<string,string[]>={
 speak:['Answer the question directly, then explain your main idea.','Add a relevant example and a short conclusion.','Record and replay on your device to check pace, pauses and clarity.','Practise linking ideas with because, however and for example.'],
 write:['Cover every task point and stay relevant to the reader.','Organise your answer with a clear opening, paragraphs and closing.','Check tense, subject–verb agreement, spelling and punctuation.','Review the word limit and add examples to support your points.'],
 read:['Read the question first and identify key words.','Find evidence in the passage before choosing your answer.','Watch for paraphrases and distractors; do not rely on a familiar word alone.','Review the bank answer key and revisit the relevant paragraph.'],
 listen:['Read the questions before playback and predict the information needed.','Listen for names, numbers, contrast words and the speaker’s intention.','Use the available answer key to review errors.','Replay available audio and practise taking short notes.'],
};
export function GeneralFeedbackPanel({skill}:{skill:string}){
 return <aside className="m-4 p-5 rounded-2xl bg-white/5 border border-white/10 text-sm space-y-3">
  <h3 className="font-bold text-primary">General practice feedback — free</h3>
  <p className="text-white/60">This is a study checklist, not an AI assessment of your answer. No score or CEFR level is assigned.</p>
  <ul className="list-disc pl-5 space-y-2 text-white/70">{(GENERAL_GUIDANCE[skill]||GENERAL_GUIDANCE.write).map(item=><li key={item}>{item}</li>)}</ul>
  <Link to="/app/pricing" className="inline-block text-primary font-bold">Get personalised feedback</Link>
 </aside>;
}
export function GeneralFeedbackDialog(){
 const [skill,setSkill]=useState<string|null>(null);
 useEffect(()=>{const handler=(event:Event)=>setSkill((event as CustomEvent).detail?.skill||'write');window.addEventListener('ez-general-feedback',handler);return()=>window.removeEventListener('ez-general-feedback',handler);},[]);
 if(!skill)return null;
 return <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="General practice feedback"><div className="max-w-xl w-full bg-[#111] rounded-2xl p-4"><GeneralFeedbackPanel skill={skill}/><button onClick={()=>setSkill(null)} className="w-full bg-white/10 p-3 rounded-xl">Continue practice</button></div></div>;
}
