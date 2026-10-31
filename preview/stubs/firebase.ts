// Local preview stubs. Nothing here talks to Firebase: the preview harness exists
// so the signed-in screens can be opened and inspected on this machine without an
// account, without touching the real project, and without spending anything.
import type { UserProfile } from '../../src/types';

export const PREVIEW_PROFILE: UserProfile = {
  uid: 'preview-learner', email: 'preview@localhost', displayName: 'Nur Aisyah',
  goal: 'SPM', level: 'INTERMEDIATE', onboardingCompleted: true,
  streak: 6, points: 1840, weeklyGoalProgress: 62, weeklyGoalMinutes: 15,
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
  plan: 'free', credits: 3, school: 'SMK Taman Desa', referralSource: 'tiktok',
  dailyGoalMinutes: 15, micEnabled: true, soundEnabled: true,
};

const noop: any = () => undefined;
const asyncNoop: any = async () => undefined;

export const auth: any = { currentUser: { uid: PREVIEW_PROFILE.uid, email: PREVIEW_PROFILE.email, getIdToken: async () => 'preview-token', emailVerified: true } };
export const db: any = {};

export enum OperationType { GET = 'GET', CREATE = 'CREATE', UPDATE = 'UPDATE', DELETE = 'DELETE' }
export const handleFirestoreError = (error: unknown) => { console.warn('[preview] firestore call ignored', error); };
export const getFriendlyFirebaseError = () => 'Preview error message.';

export const getUserProfile = async () => PREVIEW_PROFILE;
export const saveUserProfile = asyncNoop;
export const updateProfile = asyncNoop;
export const updateDailyGoal = asyncNoop;
export const submitFeedback = asyncNoop;
export const saveSession = asyncNoop;
export const logout = asyncNoop;
export const loginWithEmail = asyncNoop;
export const loginWithGoogle = asyncNoop;
export const registerWithEmail = asyncNoop;
export const resetPassword = asyncNoop;
export const sendVerification = asyncNoop;
export const updateSiteConfig = asyncNoop;

export const getSiteConfig = async () => null;
export const getActivityLogs = async () => ([
  { id: 'a1', userId: PREVIEW_PROFILE.uid, type: 'PRACTICE', message: 'Completed a ReadEZ practice', timestamp: Date.now() - 36e5 },
  { id: 'a2', userId: PREVIEW_PROFILE.uid, type: 'ACHIEVEMENT', message: 'Six day streak', timestamp: Date.now() - 9e7 },
]);
export const getSessions = async () => ([
  { id: 's1', userId: PREVIEW_PROFILE.uid, type: 'ReadEZ', timestamp: Date.now() - 36e5, duration: 480, score: 78 },
  { id: 's2', userId: PREVIEW_PROFILE.uid, type: 'WriteEZ', timestamp: Date.now() - 18e7, duration: 900, score: 64 },
  { id: 's3', userId: PREVIEW_PROFILE.uid, type: 'SpeakEZ', timestamp: Date.now() - 36e7, duration: 300, score: 71 },
]);

export const onAuthStateChanged = (_a: unknown, cb: any) => { cb(auth.currentUser); return noop; };
export const subscribeToUserProfile = (_uid: string, cb: any) => { cb(PREVIEW_PROFILE); return noop; };
export const subscribeToModules = (cb: any) => { cb([]); return noop; };

// Firestore primitives, inert.
export const doc = noop, collection = noop, collectionGroup = noop, query = noop;
export const where = noop, orderBy = noop, limit = noop, increment = noop;
export const serverTimestamp = noop, writeBatch = () => ({ set: noop, update: noop, commit: asyncNoop });
export const setDoc = asyncNoop, addDoc = asyncNoop, updateDoc = asyncNoop, deleteDoc = asyncNoop;
export const getDocs = async () => ({ docs: [], empty: true, size: 0, forEach: noop });
export const getCountFromServer = async () => ({ data: () => ({ count: 0 }) });
export const onSnapshot = (_ref: unknown, cb: any) => { if (typeof cb === 'function') cb({ exists: () => false, data: () => undefined, docs: [] }); return noop; };
export const Timestamp = { fromMillis: (ms: number) => ({ toMillis: () => ms, toDate: () => new Date(ms) }), now: () => ({ toMillis: () => Date.now() }) } as any;
export type User = any;
