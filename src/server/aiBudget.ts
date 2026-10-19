import type { Firestore } from 'firebase-admin/firestore';

export function previewAllows(uid: string, env: NodeJS.ProcessEnv = process.env) {
  return env.MIGRATION_MODE === 'production' || (env.MIGRATION_TEST_UIDS || '').split(',').map(value => value.trim()).includes(uid);
}

// These are server-side spend/abuse ceilings, separate from the unchanged
// existing practice limits and credit UI. No automatic credit debit is added.
export async function reserveAIRequest(database: Firestore, uid: string, requestId: string, task: string, env: NodeJS.ProcessEnv = process.env): Promise<'allowed' | 'quota' | 'duplicate' | 'no_profile'> {
  const day = new Date().toISOString().slice(0, 10); // Match original daily usage boundary.
  const totalRef = database.doc(`ai_request_usage/${day}`);
  const userRef = totalRef.collection('users').doc(uid);
  const requestRef = userRef.collection('requests').doc(requestId);
  const profileRef = database.doc(`users/${uid}`);
  return database.runTransaction(async transaction => {
    const [total, user, existing, profile] = await Promise.all([transaction.get(totalRef), transaction.get(userRef), transaction.get(requestRef), transaction.get(profileRef)]);
    if (existing.exists) return 'duplicate';
    if (!profile.exists) return 'no_profile';
    const plan = profile.data()?.plan || 'free';
    const defaultLimit = ({ free: 150, lite:300, plus:1000, max:2500, basic: 300, pro: 1000, pro_plus: 2500 } as Record<string, number>)[plan] || 150;
    const userLimit = Number(env.AI_REQUESTS_PER_USER_DAILY || defaultLimit);
    const globalLimit = Number(env.AI_REQUESTS_GLOBAL_DAILY || 5000);
    const totalCount = Number(total.data()?.count || 0), userCount = Number(user.data()?.count || 0);
    if (![userLimit, globalLimit, totalCount, userCount].every(Number.isFinite) || userLimit <= 0 || globalLimit <= 0 || totalCount < 0 || userCount < 0 || totalCount >= globalLimit || userCount >= userLimit) return 'quota';
    transaction.set(totalRef, { count: totalCount + 1 }, { merge: true });
    transaction.set(userRef, { count: userCount + 1 }, { merge: true });
    transaction.create(requestRef, { task, createdAt: new Date(), state: 'reserved' });
    return 'allowed';
  });
}
