import type {PracticeSession} from '../types';

const SKILLS = [{type:'ReadEZ',label:'Reading'}, {type:'WriteEZ',label:'Writing'}, {type:'SpeakEZ',label:'Speaking'}, {type:'ListenEZ',label:'Listening'}] as const;

export function summarizePractice(sessions: PracticeSession[], days: number, now = Date.now()) {
  const recent = sessions.filter(session => SKILLS.some(skill => skill.type === session.type) && Number.isFinite(session.timestamp) && session.timestamp <= now && session.timestamp >= now - days * 86400000 && Number.isFinite(session.score) && session.score >= 0 && session.score <= 100).sort((a,b) => b.timestamp - a.timestamp);
  const skills = SKILLS.map(skill => {
    const practices = recent.filter(session => session.type === skill.type);
    return {label:skill.label,count:practices.length,value:practices.length ? Math.round(practices.reduce((sum,session)=>sum+session.score,0)/practices.length) : 0};
  });
  const measured = skills.filter(skill => skill.count > 0);
  return {recent,skills,overall:measured.length ? Math.round(measured.reduce((sum,skill)=>sum+skill.value,0)/measured.length) : null};
}
