import type { ReadPart, ReadTestSet } from '../types';

// Older generated bank entries split a passage and its questions into separate
// entries for the same part. Combine them in memory; never rewrite the bank.
export function normalizeReadTest(value: any, mode?: number | 'FULL', complete = false): (ReadTestSet & { theme?: string }) | null {
  if (!value || !Array.isArray(value.parts) || !value.answers || typeof value.answers !== 'object') return null;
  const grouped = new Map<number, ReadPart>();
  for (const raw of value.parts) {
    if (!raw || ![1, 2, 3, 4, 5].includes(raw.partNumber)) return null;
    if (typeof mode === 'number' && raw.partNumber !== mode) continue;
    const part: ReadPart = grouped.get(raw.partNumber) || { partNumber: raw.partNumber, instruction: '', questions: [] };
    if (typeof raw.instruction === 'string' && raw.instruction && !part.instruction.includes(raw.instruction)) part.instruction = [part.instruction, raw.instruction].filter(Boolean).join('\n');
    if (typeof raw.passage === 'string' && raw.passage) part.passage = [part.passage, raw.passage].filter(Boolean).join('\n\n');
    if (Array.isArray(raw.stimuli)) part.stimuli = [...(part.stimuli || []), ...raw.stimuli];
    if (Array.isArray(raw.questions)) part.questions.push(...raw.questions);
    grouped.set(raw.partNumber, part);
  }
  const parts = [...grouped.values()].sort((a, b) => a.partNumber - b.partNumber);
  if (!parts.length || (complete && mode === 'FULL' && parts.length !== 5)) return null;
  const answers: Record<string, string> = { ...value.answers };
  const ids = new Set<string>();
  const counts: Record<number, number> = { 1: 8, 2: 10, 3: 8, 4: 6, 5: 8 };
  for (const part of parts) {
    if (!part.questions.length || (complete && part.questions.length !== counts[part.partNumber])) return null;
    for (const q of part.questions) {
      if (!q || typeof q.id !== 'string' || !q.id || ids.has(q.id) || !Number.isInteger(q.number)) return null;
      ids.add(q.id);
      if (!['MCQ', 'GAPPED_TEXT', 'MATCHING', 'SHORT_ANSWER'].includes(q.type)) return null;
      const answer = answers[q.id] || answers[String(q.number)];
      if (typeof answer !== 'string' || !answer.trim()) return null;
      answers[q.id] = answer;
      if (q.type !== 'SHORT_ANSWER' && (!Array.isArray(q.options) || q.options.length < 3 || q.options.some(o => typeof o !== 'string'))) return null;
    }
  }
  return { ...value, parts, answers };
}
