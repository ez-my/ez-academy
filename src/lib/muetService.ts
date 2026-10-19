// Server-backed clients. Regenerate with npm run generate:ai-clients.
import type { MUETTopic, MUETCandidateId, MUETExaminerReport, MUETDiscussionTurn } from '../types/muet';

import { invokeTask } from './aiTask';

const FILLER_WORDS = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'actually', 'basically', 'i mean', 'so yeah'];

export function detectFillers(text: string): { count: number; words: string[] } {
  if (!text) return { count: 0, words: [] };
  const lower = text.toLowerCase();
  const foundWords: string[] = [];
  let totalCount = 0;

  FILLER_WORDS.forEach(filler => {
    // Regex matching whole word/phrase
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      totalCount += matches.length;
      foundWords.push(`${filler} (${matches.length})`);
    }
  });

  return { count: totalCount, words: foundWords };
}

export function estimateSpeechPace(wordCount: number, durationSeconds: number): 'Calm & Measured' | 'Natural Flow' | 'Slightly Rushed' | 'Hesitant' {
  if (durationSeconds <= 0 || wordCount <= 0) return 'Hesitant';
  const wordsPerMinute = (wordCount / durationSeconds) * 60;
  if (wordsPerMinute < 85) return 'Hesitant';
  if (wordsPerMinute <= 135) return 'Calm & Measured';
  if (wordsPerMinute <= 165) return 'Natural Flow';
  return 'Slightly Rushed';
}

export async function analyzeMUETPart1(
  topic: MUETTopic,
  candidate: MUETCandidateId,
  transcript: string,
  durationSeconds: number,
  notes?: string
): Promise<MUETExaminerReport> {
  return invokeTask('muet.analyzeMUETPart1', [topic, candidate, transcript, durationSeconds, notes]);
}

export async function generateMUETPeerTurn(
  topic: MUETTopic,
  peerCandidate: MUETCandidateId,
  studentCandidate: MUETCandidateId,
  discussionHistory: MUETDiscussionTurn[],
  actionType: 'start' | 'respond' | 'invite' | 'agree' | 'conclude' = 'respond'
): Promise<{ text: string; skillType: 'Initiate' | 'Respond' | 'Develop' | 'Conclude' | 'Question' | 'Agreement' }> {
  return invokeTask('muet.generateMUETPeerTurn', [topic, peerCandidate, studentCandidate, discussionHistory, actionType]);
}

export async function analyzeMUETPart2(
  topic: MUETTopic,
  studentCandidate: MUETCandidateId,
  studentTurns: string[],
  fullHistory: MUETDiscussionTurn[],
  durationSeconds: number
): Promise<MUETExaminerReport> {
  return invokeTask('muet.analyzeMUETPart2', [topic, studentCandidate, studentTurns, fullHistory, durationSeconds]);
}

export async function analyzeMUETMockTest(
  topic: MUETTopic,
  candidate: MUETCandidateId,
  part1Report: MUETExaminerReport,
  part2Report: MUETExaminerReport
): Promise<MUETExaminerReport> {
  return invokeTask('muet.analyzeMUETMockTest', [topic, candidate, part1Report, part2Report]);
}
