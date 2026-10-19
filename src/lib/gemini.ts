// Server-backed clients. Regenerate with npm run generate:ai-clients.
import type { PracticeSession } from "../types";

import { invokeTask } from './aiTask';

export interface NLPConfig {
  useDeepFeedback?: boolean;
  wordCount?: number;
  isProPlus?: boolean;
  aiEngine?: 'gemini' | 'chatgpt';
}

export async function analyzeSpeech(
  transcript: string,
  userGoal: string,
  config?: NLPConfig
): Promise<Partial<PracticeSession>> {
  return invokeTask('spm.analyzeSpeech', [transcript, userGoal, config]);
}

export interface SPMTask {
  theme: string;
  friendName?: string;
  friendEmail?: string;
  subject?: string;
  situation?: string;
  emailBody?: string;
  title?: string;
  context?: string;
  bulletPoints?: string[];
  practiceMode: 'Full' | 'Introduction' | 'Body' | 'Conclusion';
  essayType?: 'Article' | 'Email' | 'Story' | 'Review' | 'Speech' | 'Report';
  partialEssay?: string;
}

export async function generateSPMEmailTask(requestedTheme?: string): Promise<SPMTask> {
  return invokeTask('spm.generateSPMEmailTask', [requestedTheme]);
}

export async function generateSPMPart2Task(mode: 'Full' | 'Introduction' | 'Body' | 'Conclusion' = 'Full', requestedTheme?: string): Promise<SPMTask> {
  return invokeTask('spm.generateSPMPart2Task', [mode, requestedTheme]);
}

export async function analyzeSPMPart2(
  task: SPMTask,
  studentResponse: string,
  config?: NLPConfig
): Promise<any> {
  return invokeTask('spm.analyzeSPMPart2', [task, studentResponse, config]);
}

export async function analyzeSPMFullEssay(
  task: SPMTask,
  fullEssay: string,
  config?: NLPConfig
): Promise<any> {
  return invokeTask('spm.analyzeSPMFullEssay', [task, fullEssay, config]);
}

export async function analyzeSPMEmail(
  task: SPMTask,
  studentResponse: string,
  config?: NLPConfig
): Promise<any> {
  return invokeTask('spm.analyzeSPMEmail', [task, studentResponse, config]);
}

export async function modularizeSPMTask(task: SPMTask, mode: 'Introduction' | 'Body' | 'Conclusion'): Promise<SPMTask> {
  return invokeTask('spm.modularizeSPMTask', [task, mode]);
}

export async function generateSPMPart3Task(
  type: 'Article' | 'Email' | 'Story' | 'Review' | 'Speech' | 'Report', 
  theme: string,
  mode: 'Full' | 'Introduction' | 'Body' | 'Conclusion' = 'Full'
): Promise<SPMTask> {
  return invokeTask('spm.generateSPMPart3Task', [type, theme, mode]);
}

export async function analyzeSPMPart3(task: SPMTask, essay: string, essayType: string, config?: NLPConfig) {
  return invokeTask('spm.analyzeSPMPart3', [task, essay, essayType, config]);
}

export interface SPMSpeakingTask {
  fallback?: boolean;
  part: 1 | 2 | 3;
  topic?: string;
  introduction?: string;
  questions?: string[]; // For Part 1
  promptCard?: {
    topic: string;
    prompts: string[];
    prepTip?: string;
  }; // For Part 2
  discussion?: {
    situation: string;
    points: string[];
    guides?: string[];
    decisionQuestion?: string;
    hotQuestion?: string;
  }; // For Part 3
}

export async function generateSPMSpeakingTask(part: 1 | 2 | 3 | 'Full', theme?: string, recentTopics: string[] = []): Promise<SPMSpeakingTask> {
  return invokeTask('spm.generateSPMSpeakingTask', [part, theme, recentTopics]);
}

export async function analyzeSPMSpeaking(
  part: number,
  task: SPMSpeakingTask,
  transcript: string,
  config?: NLPConfig
): Promise<any> {
  return invokeTask('spm.analyzeSPMSpeaking', [part, task, transcript, config]);
}

export async function evaluateSpeechTranscript(transcript: string): Promise<any> {
  return invokeTask('spm.evaluateSpeechTranscript', [transcript]);
}

export async function generateSocialSnippet(achievementTitle: string, achievementDesc: string): Promise<string> {
  return invokeTask('spm.generateSocialSnippet', [achievementTitle, achievementDesc]);
}
