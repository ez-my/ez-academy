import { TRIAL_LISTENING_KEYS } from './trialListeningKeys';
import { LISTENING_PARTS, TRIAL_LISTENING_TESTS, listeningTestLabel } from './trialListeningTests';
import type { ListeningPartResult, ListeningResult } from '../types/listening';
import type { PracticeSession } from '../types';

export function gradeListeningPart(testId: string, part: number, answers: Record<string,string>): ListeningPartResult {
  const key = TRIAL_LISTENING_KEYS[testId];
  const range = LISTENING_PARTS.find(item => item.id === part);
  if (!key) throw new Error('The matching answer key is not available yet. Your answers are kept.');
  if (!range) throw new Error('Choose a test part.');
  const snapshot: Record<string,string> = {};
  const questions = Array.from({length:range.last-range.first+1}, (_, i) => {
    const number = range.first + i;
    const answer = answers[number]?.trim() || '';
    const accepted = key.answers[number];
    if (!accepted?.length) throw new Error('This answer key is incomplete. Your answers are kept.');
    if (!answer) throw new Error('Answer every question in this part first.');
    snapshot[number] = answer;
    const normalise = (value:string) => value.normalize('NFKC').trim().replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').toLowerCase();
    const correct = accepted.some(value => normalise(value) === normalise(answer) &&
      (!key.capitalRequired?.includes(number) || answer[0] === value[0]) &&
      (!key.lowercaseRequired?.includes(number) || answer === answer.toLowerCase()));
    return {number, answer, accepted, correct};
  });
  return {part, answers:snapshot, questions, total:questions.length, correct:questions.filter(q=>q.correct).length};
}

export function samePartAnswers(result: ListeningPartResult, answers:Record<string,string>) {
  return Object.entries(result.answers).every(([number,value]) => (answers[number] || '').trim() === value);
}

export function buildListeningSession(uid:string, attemptId:string, testId:string, part:number,
  answers:Record<string,string>, previous?: PracticeSession & {listeningResult?:ListeningResult}) {
  const test = TRIAL_LISTENING_TESTS.find(test => test.id === testId);
  if (!test) throw new Error('This test was not found.');
  if (previous && (previous.userId !== uid || previous.testSetId !== testId)) throw new Error('Start a new attempt for this test.');
  const current = gradeListeningPart(testId,part,answers);
  const parts:Record<string,ListeningPartResult> = {};
  for (const old of Object.values(previous?.listeningResult?.parts || {})) {
    // Changed answers must be checked again. Never reuse caller-written marks.
    if (old?.answers && samePartAnswers(old, answers)) {
      try {parts[old.part] = gradeListeningPart(testId,old.part,old.answers);} catch { /* Ignore incomplete old data. */ }
    }
  }
  parts[part] = current;
  const correct = Object.values(parts).reduce((sum,p)=>sum+p.correct,0);
  const total = Object.values(parts).reduce((sum,p)=>sum+p.total,0);
  const result:ListeningResult = {parts,correct,total,percent:Math.round(correct/total*100)};
  const label = listeningTestLabel(test);
  const feedback = `# ${label}\n\nScore: **${correct}/${total} (${result.percent}%)**${total<30?' — checked parts only':''}\n\n` +
    Object.values(parts).sort((a,b)=>a.part-b.part).map(p=>`## Part ${p.part}: ${p.correct}/${p.total}\n\n`+
      p.questions.map(q=>`${q.number}. ${q.correct?'Correct':'Incorrect'} — Your answer: ${q.answer}. Correct answer: ${q.accepted.join(' / ')}.`).join('\n\n')).join('\n\n');
  const session:PracticeSession & {listeningResult:ListeningResult} = {
    id:`listen_trial_${attemptId}`,userId:uid,type:'ListenEZ',timestamp:Date.now(),duration:0,
    testSetId:testId,score:result.percent,answers:Object.assign({},...Object.values(parts).map(p=>p.answers)),
    transcript:`${label} · ${correct}/${total}${total<30?' · checked parts':''}`,feedback,listeningResult:result,
    metrics:{fluency:0,grammar:0,vocabulary:0,comprehension:result.percent,pronunciation:0,structure:0},
  };
  return session;
}

