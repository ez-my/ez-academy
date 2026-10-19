// Preserve the existing public service API while executing rubrics on the server.
import type { ListenQuestion } from '../types';
import { invokeTask } from '../lib/aiTask';

export class GeminiService {
static async generateQuestionsFromAudio(audioBase64: string, mimeType: string): Promise<{
    questions: ListenQuestion[];
    answers: Record<string, string>;
    transcript: string;
  }> {
  return invokeTask('practice.generateQuestionsFromAudio', [audioBase64, mimeType]);
}

static async translateWithDefinition(text: string, context?: string): Promise<{
    translation: string;
    definition: string;
    example: string;
    phonetic?: string;
  }> {
  return invokeTask('practice.translateWithDefinition', [text, context]);
}

static async generateSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Aoede' | 'Icarus' | 'Leda' = 'Aoede'): Promise<{ data: string; mimeType: string }> {
  return invokeTask('practice.generateSpeech', [text, voiceName]);
}

static async generateReadTest(topic: string = "General Knowledge", mode: 'FULL' | 1 | 2 | 3 | 4 | 5 = 'FULL'): Promise<any> {
  return invokeTask('practice.generateReadTest', [topic, mode]);
}

static async generateStudyRecommendation(userData: {
    name: string;
    level: string;
    goal: string;
    scores: Record<string, number>;
    metrics: Record<string, number>;
    recentSessions: any[];
  }): Promise<{
    analysis: string;
    recommendations: {
      title: string;
      desc: string;
      type: 'SpeakEZ' | 'WriteEZ' | 'ReadEZ' | 'ListenEZ';
    }[];
  }> {
  return invokeTask('practice.generateStudyRecommendation', [userData]);
}
}
