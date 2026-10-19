import {nextPracticeDay} from '../data/practiceLimits';
import {MUET_REVIEWED_TOPICS} from '../data/muetReviewedTopics';
import type {MUETTopic} from '../types/muet';
import type {Express} from 'express';
import type {Firestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import OpenAI from 'openai';
import {randomUUID} from 'node:crypto';
import {MUET_EXTRA_TOPICS} from '../data/muetExtraTopics';
import {MUET_TOPICS} from '../data/muetTopicsBank';
import {topicFingerprint,validateMUETTopic,unseenTopics} from './muetBankPolicy';
import {consumePracticeDay,malaysiaPracticeDay,hasPaidPractice,assertPracticeAllowed,assertSkillPractice} from './practicePolicy';
const SEED_TOPICS=[...MUET_REVIEWED_TOPICS,...MUET_EXTRA_TOPICS];
const revision='muet-speaking-v3';
const error=(message:string,status:number)=>Object.assign(Error(message),{status});
export function registerMUETBankRoutes(app:Express,db:Firestore,overrides?:{verify:(token:string)=>Promise<{uid:string}>;generate?:(titles:string[])=>Promise<unknown>}){
 const verify=async(req:any)=>{try{const token=req.headers.authorization?.replace(/^Bearer /i,'')||'';return overrides?await overrides.verify(token):await getAuth().verifyIdToken(token);}catch{throw error('Please sign in again.',401);}};
 const fail=(res:any,e:any)=>res.status(e.status||503).json({error:e.status?e.message:'The question bank is unavailable. Please try again.'});
 async function seed(){const ref=db.doc(`muet_bank_meta/${revision}`);if((await ref.get()).exists)return;const batch=db.batch();for(const topic of SEED_TOPICS){if(!validateMUETTopic(topic))throw Error('Invalid seed');batch.set(db.doc(`muet_speaking_bank/${topic.id}`),{...topic,fingerprint:topicFingerprint(topic),source:'original-practice',format:'MPM-CEFR',createdAt:Date.now()});}batch.set(ref,{seededAt:Date.now()});await batch.commit();}
 async function state(uid:string){
  const [bank,done,legacy]=await Promise.all([db.collection('muet_speaking_bank').get(),db.collection(`muet_progress/${uid}/completed`).get(),db.collection(`users/${uid}/sessions`).get()]);
  const completed=new Set<string>(done.docs.map(d=>d.id));
  for(const d of legacy.docs){const r=d.data().muetReport;if(r?.topicId){if(r.testType==='Mock'){completed.add(`${r.topicId}:Part1`);completed.add(`${r.topicId}:Part2`);}else completed.add(`${r.topicId}:${r.testType}`);}}
  return {topics:bank.docs.map(d=>d.data() as MUETTopic).filter(validateMUETTopic),completed};
 }
 async function refill(uid:string,mode:string){
  const lock=db.doc('muet_bank_meta/refill'),budget=db.doc(`muet_bank_days/${malaysiaPracticeDay()}`);const lease=randomUUID();
  await db.runTransaction(async t=>{const [l,b]=await Promise.all([t.get(lock),t.get(budget)]);if(Number(l.data()?.until)>Date.now())throw error('New topics are being added. Please try again shortly.',409);if(Number(b.data()?.attempts||0)>=4)throw error('New topics will be available later. Please try again tomorrow.',429);t.set(lock,{lease,until:Date.now()+90000});t.set(budget,{attempts:Number(b.data()?.attempts||0)+1});});
  try{
   const {topics}=await state(uid);const generated=overrides?.generate?await overrides.generate([...MUET_TOPICS,...topics].map(t=>t.title)):null;const result=generated?null:await new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:45000,maxRetries:0}).responses.create({model:'gpt-4o-mini',store:false,max_output_tokens:4200,text:{format:{type:'json_object'}},instructions:`Write 6 ORIGINAL MUET speaking practice sets, never official or predicted questions. Follow MPM CEFR-aligned 800/2 specifications: Part 1 B1-B2, familiar late-secondary/early-tertiary non-specialist context, situation 2-3 sentences including presentation audience; four DISTINCT A-D prompts starting "Talk about ", maximum 10 words each. Part 2 B2 conceptual/evaluative discussion linked thematically to Part 1, situation 2-3 sentences, central question, exactly five distinct mind map ideas of 1-3 words each, decision prompt to agree best suggestion. Simple accessible instructions, no model answers, no specialist knowledge, no invented facts. Different subjects and arguments from ALL titles provided. Do not reuse any provided existingQuestions, including paraphrases. Return JSON {topics:[{id,title,theme,part1:{situation,tasks:{A,B,C,D}},part2:{situation,centralQuestion,points:[...],decisionPrompt}}]}.`,input:JSON.stringify({existingTitles:[...MUET_TOPICS,...topics].map(t=>t.title),existingQuestions:topics.flatMap(t=>[...Object.values(t.part1.tasks),t.part2.centralQuestion]),mode})});
   if(result&&result.status!=='completed')throw Error('Incomplete');const parsed:any=generated||JSON.parse(result!.output_text);if(!Array.isArray(parsed.topics)||parsed.topics.length!==6)throw Error('Invalid batch');
   const prints=new Set(topics.map(topicFingerprint)),titles=new Set([...MUET_TOPICS,...topics].map(t=>t.title.trim().toLowerCase()));
   const normalise=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const questions=new Set(topics.flatMap(t=>[...Object.values(t.part1.tasks),t.part2.centralQuestion]).map(normalise));
   const fresh=parsed.topics.map((t:any)=>({...t,id:`muet_generated_${randomUUID()}`}));
   for(const topic of fresh){if(!validateMUETTopic(topic)||prints.has(topicFingerprint(topic))||titles.has(topic.title.trim().toLowerCase()))throw Error('Duplicate or invalid topic');const text=[...Object.values(topic.part1.tasks),topic.part2.centralQuestion];if(text.some(q=>questions.has(normalise(q))))throw Error('Repeated question');text.forEach(q=>questions.add(normalise(q)));prints.add(topicFingerprint(topic));titles.add(topic.title.trim().toLowerCase());}
   const batch=db.batch();for(const topic of fresh)batch.set(db.doc(`muet_speaking_bank/${topic.id}`),{...topic,fingerprint:topicFingerprint(topic),source:'ai-practice',format:'MPM-CEFR',createdAt:Date.now()});await batch.commit();
  }finally{await db.runTransaction(async t=>{const l=await t.get(lock);if(l.data()?.lease===lease)t.set(lock,{lease,until:0});});}
 }
 app.get('/api/muet/bank',async(req,res)=>{res.set('Cache-Control','private, no-store');try{const user=await verify(req),mode=String(req.query.mode||'Part1');if(!['Part1','Part2','Mock'].includes(mode))throw error('Choose a speaking part.',400);await seed();let data=await state(user.uid);let available=unseenTopics(data.topics,data.completed,mode);if(!available.length){await refill(user.uid,mode);data=await state(user.uid);available=unseenTopics(data.topics,data.completed,mode);}res.json({topics:available,total:data.topics.length,completed:data.topics.length-available.length});}catch(e){fail(res,e);}});
 app.post('/api/muet/start',async(req,res)=>{try{
  const user=await verify(req),{topicId,mode,requestId}=req.body||{};
  if(typeof topicId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(topicId)||!['Part1','Part2','Mock'].includes(mode)||typeof requestId!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(requestId))throw error('Choose a question.',400);
  const day=malaysiaPracticeDay(),daily=db.doc(`practice_days/${user.uid}_${day}`),receipt=db.doc(`muet_starts/${user.uid}_${requestId}`);
  const result=await db.runTransaction(async t=>{const [a,b,p,l,d,r,question]=await Promise.all([t.get(db.doc(`muet_progress/${user.uid}/completed/${topicId}:Part1`)),t.get(db.doc(`muet_progress/${user.uid}/completed/${topicId}:Part2`)),t.get(db.doc(`users/${user.uid}`)),t.get(db.doc(`package_entitlements/${user.uid}`)),t.get(daily),t.get(receipt),t.get(db.doc(`muet_speaking_bank/${topicId}`))]);
   if(!question.exists)throw error('Choose a question from the bank.',400);
   if((mode==='Part1'&&a.exists)||(mode==='Part2'&&b.exists)||(mode==='Mock'&&(a.exists||b.exists)))throw error('You have completed this question. Choose a new question.',409);
   const used=Number(d.data()?.used||0);if(r.exists){if(r.data()?.topicId!==topicId||r.data()?.mode!==mode||r.data()?.day&&r.data()?.day!==day)throw error('Use a new request for this question.',409);return {used};}const paid=hasPaidPractice(p.data()||{},l.data()||{},'speak');assertSkillPractice(p.data()||{},l.data()||{},d.data()||{},'speak',mode==='Mock');
   const updated=consumePracticeDay(p.data()||{},l.data()||{},d.data()||{},day,'speak',mode==='Mock');const next=updated.used;t.set(daily,updated);t.set(receipt,{topicId,mode,day,createdAt:Date.now()});return {used:next};
  });res.json(result);
 }catch(e){fail(res,e);}});
 app.post('/api/muet/complete',async(req,res)=>{try{
  const user=await verify(req),{topicId,mode,transcript,durationSeconds}=req.body||{};
  if(typeof topicId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(topicId)||!['Part1','Part2','Mock'].includes(mode)||typeof transcript!=='string'||transcript.length>50000||transcript.trim().split(/\s+/).length<5||!Number.isFinite(durationSeconds)||durationSeconds<0||durationSeconds>7200)throw error('Finish your response before completing this task.',400);
  const bank=await db.doc(`muet_speaking_bank/${topicId}`).get();if(!bank.exists&&!MUET_TOPICS.some(t=>t.id===topicId))throw error('Question not found.',404);
  const modes=mode==='Mock'?['Part1','Part2']:[mode];
  await db.runTransaction(async t=>{const refs=modes.map(m=>db.doc(`muet_progress/${user.uid}/completed/${topicId}:${m}`));const saved=await Promise.all(refs.map(r=>t.get(r)));refs.forEach((r,i)=>{if(!saved[i].exists)t.set(r,{topicId,mode:modes[i],completedAt:Date.now(),durationSeconds});});});
  res.json({saved:true});
 }catch(e){fail(res,e);}});
}
