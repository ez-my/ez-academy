import type {Firestore} from 'firebase-admin/firestore';
import {createHash} from 'node:crypto';
import OpenAI from 'openai';
import {malaysiaDay} from '../achievements';
import {MARKETING_DEFAULTS,MARKETING_RESERVE_RM} from './marketing';

export const MARKETING_VOICE_INSTRUCTIONS='Speak the exact supplied words only. Warm, relaxed, reassuring Malaysian bilingual tutor with a gentle smile. Bahasa Melayu must sound fluent and conversational with natural Malaysian code switching; English skill names are clear. Explain to one student, not a robotic announcement or exaggerated advert. Moderate pace, soft expressive phrasing, natural short pauses. SpeakEZ, WriteEZ, ReadEZ, ListenEZ are brand names: pronounce Speak Easy, Write Easy, Read Easy, Listen Easy. Do not read labels or add extra dialogue.';
export async function marketingVoice(db:Firestore,id:string,text:string,synthesize?:(text:string)=>Promise<Buffer>,now=Date.now()){
 const day=malaysiaDay(now),month=day.slice(0,7),job=db.doc(`marketing_voice_jobs/${id}`),monthly=db.doc(`marketing_months/${month}`),daily=db.doc(`marketing_voice_days/${day}`),config=db.doc('marketing/config');
 await db.runTransaction(async t=>{
  const [j,m,d,c]=await Promise.all([t.get(job),t.get(monthly),t.get(daily),t.get(config)]);
  if(j.exists)throw Object.assign(new Error('This narration request was already submitted. Use the downloaded file.'),{code:'duplicate'});
  if(Number(d.data()?.attempts||0)>=4)throw Object.assign(new Error('Daily limit reached: four marketing voice attempts.'),{code:'limit'});
  const reserved=Number(m.data()?.reservedRM||0)+MARKETING_RESERVE_RM,budget=Number(c.data()?.monthlyBudgetRM??MARKETING_DEFAULTS.monthlyBudgetRM);
  if(Math.round(reserved*100)>Math.round(budget*100))throw Object.assign(new Error('Marketing AI budget reached.'),{code:'budget'});
  t.set(job,{status:'generating',createdAt:now,characters:text.length,textHash:createHash('sha256').update(text).digest('hex'),voice:'coral',synthetic:true});
  t.set(monthly,{reservedRM:reserved,voiceAttempts:Number(m.data()?.voiceAttempts||0)+1},{merge:true});
  t.set(daily,{attempts:Number(d.data()?.attempts||0)+1},{merge:true});
 });
 try{
  const run=synthesize||async function(input:string){const result=await new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:25000,maxRetries:0}).audio.speech.create({model:'gpt-4o-mini-tts',voice:'coral',input,instructions:MARKETING_VOICE_INSTRUCTIONS,response_format:'mp3'});return Buffer.from(await result.arrayBuffer());};
  const audio=await run(text);if(!audio.length||audio.length>650000)throw new Error('Invalid voice output');
  await job.set({status:'done',completedAt:Date.now(),bytes:audio.length},{merge:true});return audio;
 }catch{await job.set({status:'failed',failedAt:Date.now()},{merge:true});throw Object.assign(new Error('Voice unavailable. The conservative reserve remains; an API attempt may be billed.'),{code:'unavailable'});}
 // Audio is returned in memory, never stored in Firebase or mixed with learner recordings/credits.
}
