import { transcribeAudio } from './providerContext';
import * as spm from './tasks/spm';
import * as muet from './tasks/muet';
import { GeminiService } from './tasks/practice';

type Rule = 'text' | 'short' | 'object' | 'array' | 'number' | readonly unknown[];
interface Task { run: (...args: any[]) => Promise<any>; rules: Rule[]; required: number }
const modes = ['Full', 'Introduction', 'Body', 'Conclusion'] as const;
const types = ['Article', 'Email', 'Story', 'Review', 'Speech', 'Report'] as const;
const candidate = ['A', 'B', 'C', 'D'] as const;
export const taskRegistry: Record<string, Task> = {
  'spm.analyzeSpeech': { run: spm.analyzeSpeech, rules: ['text', 'short', 'object'], required: 2 },
  'spm.generateSPMEmailTask': { run: spm.generateSPMEmailTask, rules: ['short'], required: 0 },
  'spm.generateSPMPart2Task': { run: spm.generateSPMPart2Task, rules: [modes, 'short'], required: 0 },
  'spm.analyzeSPMPart2': { run: spm.analyzeSPMPart2, rules: ['object', 'text', 'object'], required: 2 },
  'spm.analyzeSPMFullEssay': { run: spm.analyzeSPMFullEssay, rules: ['object', 'text', 'object'], required: 2 },
  'spm.analyzeSPMEmail': { run: spm.analyzeSPMEmail, rules: ['object', 'text', 'object'], required: 2 },
  'spm.modularizeSPMTask': { run: spm.modularizeSPMTask, rules: ['object', modes.slice(1)], required: 2 },
  'spm.generateSPMPart3Task': { run: spm.generateSPMPart3Task, rules: [types, 'short', modes], required: 2 },
  'spm.analyzeSPMPart3': { run: spm.analyzeSPMPart3, rules: ['object', 'text', types, 'object'], required: 3 },
  'spm.generateSPMSpeakingTask': { run: spm.generateSPMSpeakingTask, rules: [[1, 2, 3, 'Full'], 'short', 'array'], required: 1 },
  'spm.analyzeSPMSpeaking': { run: spm.analyzeSPMSpeaking, rules: [[1, 2, 3], 'object', 'text', 'object'], required: 3 },
  'spm.evaluateSpeechTranscript': { run: spm.evaluateSpeechTranscript, rules: ['text'], required: 1 },
  'spm.generateSocialSnippet': { run: spm.generateSocialSnippet, rules: ['short', 'text'], required: 2 },
  'muet.analyzeMUETPart1': { run: muet.analyzeMUETPart1, rules: ['object', candidate, 'text', 'number', 'text'], required: 4 },
  'muet.generateMUETPeerTurn': { run: muet.generateMUETPeerTurn, rules: ['object', candidate, candidate, 'array', ['start', 'respond', 'invite', 'agree', 'conclude']], required: 4 },
  'muet.analyzeMUETPart2': { run: muet.analyzeMUETPart2, rules: ['object', candidate, 'array', 'array', 'number'], required: 5 },
  'muet.analyzeMUETMockTest': { run: muet.analyzeMUETMockTest, rules: ['object', candidate, 'object', 'object'], required: 4 },
  'practice.transcribeAudio': { run: transcribeAudio, rules: ['text', 'short'], required: 2 },
  'practice.generateQuestionsFromTranscript': { run: GeminiService.generateQuestionsFromTranscript, rules: ['text'], required: 1 },
  'practice.generateQuestionsFromAudio': { run: GeminiService.generateQuestionsFromAudio, rules: ['text', 'short'], required: 2 },
  'practice.translateWithDefinition': { run: GeminiService.translateWithDefinition, rules: ['short', 'text'], required: 1 },
  'practice.generateSpeech': { run: GeminiService.generateSpeech, rules: ['text', ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede', 'Icarus', 'Leda']], required: 1 },
  'practice.generateReadTest': { run: GeminiService.generateReadTest, rules: ['short', ['FULL', 1, 2, 3, 4, 5]], required: 0 },
  'practice.generateStudyRecommendation': { run: GeminiService.generateStudyRecommendation, rules: ['object'], required: 1 },
};

function safeData(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (value === null || value === undefined || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= 60000;
  if (Array.isArray(value)) return value.length <= 300 && value.every(item => safeData(item, depth + 1));
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    return entries.length <= 100 && entries.every(([key, item]) => !['__proto__', 'prototype', 'constructor', 'systemPrompt', 'systemInstruction', 'apiKey'].includes(key) && safeData(item, depth + 1));
  }
  return false;
}

export function validateTask(taskName: unknown, rawArgs: unknown): { task: Task; args: any[] } | undefined {
  if (typeof taskName !== 'string' || !Object.hasOwn(taskRegistry, taskName) || !Array.isArray(rawArgs)) return;
  const task = taskRegistry[taskName];
  if (rawArgs.length < task.required || rawArgs.length > task.rules.length) return;
  const args = rawArgs.map(value => value === null ? undefined : value);
  for (let i = 0; i < task.rules.length; i++) {
    const value = args[i];
    if (value === undefined) { if (i < task.required) return; else continue; }
    const rule = task.rules[i];
    if (Array.isArray(rule)) { if (!rule.includes(value)) return; }
    else if (rule === 'text' || rule === 'short') {
      const max = ['practice.generateQuestionsFromAudio', 'practice.transcribeAudio'].includes(taskName as string) && i === 0 ? 4 * 1024 * 1024 : rule === 'short' ? 1000 : 60000;
      if (typeof value !== 'string' || value.length > max) return;
    } else if (rule === 'number') { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 86400) return; }
    else if (rule === 'array') { if (!Array.isArray(value) || !safeData(value)) return; }
    else if (rule === 'object') { if (!value || typeof value !== 'object' || Array.isArray(value) || !safeData(value)) return; }
  }
  // Existing routines assume a complete MUET topic and typed task data.
  if (taskName.startsWith('muet.')) {
    const topic = args[0];
    if (!topic.part1?.tasks || !topic.part2 || !Array.isArray(topic.part2.points)) return;
    if (candidate.some(key => typeof topic.part1.tasks[key] !== 'string')) return;
  }
  if (taskName === 'practice.generateSpeech' && args[0].length > 4000) return;
  return { task, args };
}
