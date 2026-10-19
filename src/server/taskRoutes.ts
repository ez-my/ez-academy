import {reserveMonitoredCall} from './operations';
import { aiAllowance } from './packageBudget';
import type { Express } from 'express';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import { validateTask } from './taskRegistry';
import { createTaskProvider, runWithProvider, type TaskProvider } from './providerContext';
import { previewAllows, reserveAIRequest } from './aiBudget';

export interface TaskRouteDependencies {
  verify(token: string): Promise<{ uid: string }>;
  allowed(uid: string): boolean;
  reserve(uid: string, requestId: string, task: string): Promise<string>;
  provider(uid?: string, skill?:string): TaskProvider;
  access?(uid:string,skill?:string,fullTest?:boolean):Promise<string|undefined>;
}
export function registerTaskRoutes(app: Express, database: Firestore, overrides?: TaskRouteDependencies) {
  const deps = overrides || {
    verify: token => getAuth().verifyIdToken(token, true),
    allowed: previewAllows,
    access: async (uid:string,skill?:string,fullTest=false) => {
      const balance=await aiAllowance(database,uid);
      if((skill&&!balance.skills[skill]?.paid)||(!skill&&!Object.values(balance.skills).some(s=>s.paid)))return 'free_template';
      if(fullTest&&(!skill||!balance.skills[skill]?.fullTests))return 'full_test';
      if(balance.legacy || balance.remaining>0 || (skill && balance.focus[skill]?.remaining>0)) return;
      return balance.included>0 || (skill && balance.focus[skill]) ? 'package_quota' : 'free_template';
    },
    reserve: (uid, id, task) => reserveAIRequest(database, uid, id, task),
    provider: (uid?: string, skill?:string) => createTaskProvider(process.env, undefined, units => reserveMonitoredCall(database, uid!, units, skill)),
  };
  app.post('/api/ai/task', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const token = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return res.status(401).json({ code: 'sign_in_required', error: 'Please sign in again.' });
    let uid: string;
    try { uid = (await deps.verify(token)).uid; } catch { return res.status(401).json({ code: 'sign_in_required', error: 'Please sign in again.' }); }
    if (!uid || !deps.allowed(uid)) return res.status(403).json({ code: 'preview_access', error: 'This preview is available to designated test accounts only.' });
    const requestId = req.get('X-EZ-Request-ID');
    if (!requestId || !/^[a-f0-9-]{36}$/i.test(requestId) || !req.body || Object.keys(req.body).some(key => !['task', 'args', 'skill'].includes(key))) return res.status(400).json({ code: 'invalid_request', error: 'Invalid request.' });
    const validated = validateTask(req.body.task, req.body.args);
    if (!validated) return res.status(400).json({ code: 'invalid_request', error: 'Invalid task or answer. Please check your input.' });
    try {
      const name=req.body.task as string;
      const defaultSkill = name.startsWith('muet.') || /Speech|Speaking|PeerTurn/.test(name) ? 'speak' : name.startsWith('spm.') ? 'write' : /ReadTest/.test(name) ? 'read' : /Audio|Transcript|generateSpeech/.test(name) ? 'listen' : undefined;
      const shared = ['practice.transcribeAudio','practice.translateWithDefinition','practice.generateSpeech','practice.generateStudyRecommendation','spm.analyzeSpeech'];
      const requested=req.body.skill;
      if (requested && (!['speak','write','read','listen'].includes(requested) || (!shared.includes(name) && requested!==defaultSkill))) return res.status(400).json({code:'invalid_request',error:'This AI task does not match the selected skill.'});
      const fullTest=name==='muet.analyzeMUETMockTest'||name==='spm.analyzeSPMFullEssay'||name==='spm.generateSPMPart2Task'&&(req.body.args?.[0]??'Full')==='Full'||name==='spm.generateSPMPart3Task'&&(req.body.args?.[2]??'Full')==='Full'||name==='spm.generateSPMSpeakingTask'&&req.body.args?.[0]==='Full'||/ReadTest/.test(name)&&req.body.args?.includes('FULL');
      const access=await deps.access?.(uid,requested || defaultSkill,fullTest);
      if(access==='full_test')return res.status(403).json({code:access,error:'Full tests are not included in your plan for this skill.'});
      if(access==='free_template') return res.status(403).json({code:access,skill:requested||defaultSkill,error:'Free access uses bank questions and general feedback templates. Upgrade for personalised AI feedback.'});
      if(access==='package_quota') return res.status(429).json({code:access,error:'Your AI credits have run out. Top up or renew to continue.'});
      const provider = deps.provider(uid,requested || defaultSkill);
      const reservation = await deps.reserve(uid, requestId, req.body.task);
      if (reservation === 'quota') return res.status(429).json({ code: 'quota', error: 'The AI usage limit has been reached. Please try again later.' });
      if (reservation === 'duplicate') return res.status(409).json({ code: 'duplicate', error: 'This request has already been submitted. Check its result before trying again.' });
      if (reservation !== 'allowed') return res.status(403).json({ code: 'profile_required', error: 'Please finish setting up your existing profile.' });
      const result = await runWithProvider(provider, () => validated.task.run(...validated.args));
      if (result === undefined || result === null) throw Object.assign(new Error('Incomplete result'), { code: 'invalid_response' });
      return res.json({ result });
    } catch (error: any) {
      // The browser never receives SDK diagnostics, credentials or raw request content.
      const code = error?.code;
      if (code === 'free_template') return res.status(403).json({code, error:error.message, skill:error.skill});
      if (code === 'package_quota') return res.status(429).json({code, error: error.message});
      if (code === 'not_configured') return res.status(503).json({ code, error: 'AI is not configured on this server yet.' });
      if (code === 'insufficient_quota') return res.status(503).json({ code: 'billing_unavailable', error: 'AI feedback is temporarily unavailable. Your answer was not scored.' });
      if (error?.status === 429) return res.status(429).json({ code: 'busy', error: 'AI is busy. Please try again in a moment.' });
      return res.status(code === 'invalid_response' ? 502 : 503).json({ code: 'ai_unavailable', error: 'The AI response was incomplete or unavailable. Your answer was not scored. Please try again.' });
    }
  });
}
