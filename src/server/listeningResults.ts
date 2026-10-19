import type { Request, Response } from 'express';
import {gradeListeningPart,buildListeningSession} from '../data/listeningScoring';
export {gradeListeningPart,samePartAnswers,buildListeningSession} from '../data/listeningScoring';

interface Dependencies {
  verifyToken(token:string):Promise<{uid:string}>;
  upsert(uid:string,id:string,build:(previous?:any)=>ReturnType<typeof buildListeningSession>):Promise<ReturnType<typeof buildListeningSession>>;
}
export function createListeningCheckHandler(deps:Dependencies) {
  return async (req:Request,res:Response) => {
    const token=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    let uid:string;
    try {if(!token) throw Error(); uid=(await deps.verifyToken(token)).uid; if(!uid) throw Error();}
    catch {return res.status(401).json({error:'Please sign in again to check your answers.'});}
    const {testId,part,answers,attemptId}=req.body || {};
    if(typeof testId!=='string' || !Number.isInteger(part) || part<1 || part>4 ||
      typeof attemptId!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(attemptId) ||
      !answers || typeof answers!=='object' || Array.isArray(answers) || Object.entries(answers).some(([n,v])=>!/^(?:[1-9]|[12]\d|30)$/.test(n)||typeof v!=='string'||v.length>100)) {
      return res.status(400).json({error:'Please check your answers and try again.'});
    }
    try {gradeListeningPart(testId,part,answers);}
    catch(error) {return res.status(400).json({error:(error as Error).message});}
    try {
      const session=await deps.upsert(uid,`listen_trial_${attemptId}`,old=>buildListeningSession(uid,attemptId,testId,part,answers,old));
      return res.json({result:session.listeningResult,saved:true});
    } catch {return res.status(503).json({error:'Could not save your score. Your answers are kept. Please try again.'});}
  };
}
