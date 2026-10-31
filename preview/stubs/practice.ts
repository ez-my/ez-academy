// Canned API responses for the preview harness. Shapes copied from the real
// routes so the screens render the states a learner would actually see.
import { useEffect, useState } from 'react';

const RESPONSES: Record<string, unknown> = {
  'practice/status': {
    day: new Date().toISOString().slice(0, 10), used: 1, planLabel: 'Free',
    skills: { speak: { used: 1, remaining: 1 }, write: { used: 0, remaining: 2 }, read: { used: 0, remaining: 2 }, listen: { used: 0, remaining: 2 } },
    progress: {}, paidSkills: { speak: false, write: false, read: false, listen: false },
  },
  'share/status': { day: new Date().toISOString().slice(0, 10), max: 7, canClaim: true, remaining: 7, reason: 'available' },
  'share/claim': { granted: true, message: 'One extra practice added. 6 share rewards left on this account.', remaining: 6 },
  leaderboard: {
    success: true,
    leaderboard: [
      { rank: 1, uid: 'u1', displayName: 'Haziq Rahman', school: 'SMK Seri Bintang', points: 2480, level: 'ADVANCED', isYou: false },
      { rank: 2, uid: 'u2', displayName: 'Mei Ling Tan', school: 'SMJK Chung Hwa', points: 2110, level: 'ADVANCED', isYou: false },
      { rank: 3, uid: 'u3', displayName: 'Arif Danial', school: 'SMK Bandar Utama', points: 1990, level: 'INTERMEDIATE', isYou: false },
      { rank: 4, uid: 'preview-learner', displayName: 'Nur Aisyah', school: 'SMK Taman Desa', points: 1840, level: 'INTERMEDIATE', isYou: true },
      { rank: 5, uid: 'u5', displayName: 'Kumar Raj', school: 'SMK Seri Bintang', points: 1620, level: 'INTERMEDIATE', isYou: false },
      { rank: 6, uid: 'u6', displayName: 'Siti Nurhaliza', school: 'SMK Putrajaya 1', points: 1410, level: 'BEGINNER', isYou: false },
    ],
  },
  'affiliate/account': { code: 'EZPREVIEW', availableCents: 0, pendingCents: 0, claims: [], referrals: 0 },
  'dashboard/today': {
    day: new Date().toISOString().slice(0, 10),
    savedWordCount: 4,
    sharedRemaining: 2,
    sharedLimit: 2,
    planLabel: 'Free',
    skills: {
      speak: { used: 1, remaining: 1, limit: 2, shared: true },
      write: { used: 0, remaining: 2, limit: 2, shared: true },
      read: { used: 0, remaining: 2, limit: 2, shared: true },
      listen: { used: 0, remaining: 2, limit: 2, shared: true },
    },
    word: {
      id: 'preview-word', word: 'Diligent', level: 'Intermediate', partOfSpeech: 'adjective',
      meaning: 'Working carefully and with steady effort.', malay: 'Rajin, tekun',
      example: 'She is a diligent student who revises every evening.',
      sourceUrl: 'https://dictionary.cambridge.org/',
    },
    vocabulary: { saved: false, sentence: '' },
  },
  achievements: { unlocked: ['first-practice', 'three-day-streak'], all: [] },
};

export async function practiceRequest(path: string, _body?: unknown) {
  const key = Object.keys(RESPONSES).find(k => path.startsWith(k));
  if (!key) { console.warn('[preview] unstubbed api call:', path); return {}; }
  return RESPONSES[key];
}

export async function startPractice() { window.dispatchEvent(new Event('ez-practice-update')); return { ok: true }; }

export const useDailyLimits = () => {
  const [skills, setSkills] = useState<Record<string, any>>({});
  useEffect(() => { void practiceRequest('practice/status').then((d: any) => setSkills(d.skills || {})); }, []);
  const getRemaining = (s: string) => Number(skills[s === 'aiListen' ? 'listen' : s]?.remaining || 0);
  return { usage: {} as any, getRemaining, isLimitReached: (s: string) => getRemaining(s) <= 0, incrementUsage: async () => {} };
};

export const CREDIT_COSTS = { speak: { basic: 1, deep: 2 }, write: { basic: 2, deep: 4 }, read: { basic: 1, deep: 1 }, listen: { basic: 1, deep: 1 }, aiListen: { basic: 2, deep: 5 } };
export const PLAN_LIMITS = {} as any;
export const useTrialProgress = () => ({ progress: {}, refresh: async () => {} });
export const trialProgressKey = (s: string, t: string) => `${s}:${t}`;
