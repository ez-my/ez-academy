export class AITaskError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}

export async function invokeTask<T = any>(task: string, args: unknown[]): Promise<T> {
  const { auth } = await import('./firebase');
  if (!auth.currentUser) throw new AITaskError('Please sign in to use this feature.', 401, 'sign_in_required');
  const token = await auth.currentUser.getIdToken();
  if (task === 'practice.generateQuestionsFromAudio' && typeof args[0] === 'string') {
    const { transcribeLocalAudio } = await import('./localAudioProcessing');
    const transcript = await transcribeLocalAudio(args[0], (data, mime) => invokeTask<string>('practice.transcribeAudio', [data, mime]));
    return invokeTask<T>('practice.generateQuestionsFromTranscript', [transcript]);
  }
  const response = await fetch('/api/ai/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-EZ-Request-ID': crypto.randomUUID() },
    body: JSON.stringify({ task, args, skill: currentSkill() }),
    signal: AbortSignal.timeout(55000),
  });
  const data = await response.json().catch(() => null);
  if (data?.code === 'free_template') window.dispatchEvent(new CustomEvent('ez-general-feedback',{detail:{skill:data.skill || currentSkill()}}));
  if (!response.ok) throw new AITaskError(data?.error || 'This feature is temporarily unavailable. Please try again.', response.status, data?.code || 'ai_unavailable');
  if (!data || !Object.hasOwn(data, 'result')) throw new AITaskError('The AI response was incomplete. Please try again.', 502, 'invalid_response');
  return data.result;
}

function currentSkill() {
 const route=window.location.pathname;
 return /speakez|evaluator|muet/.test(route)?'speak':/writeez/.test(route)?'write':/readez/.test(route)?'read':/listenez/.test(route)?'listen':undefined;
}
