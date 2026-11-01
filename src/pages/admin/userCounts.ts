import { useCallback, useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, type Query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { PlanType } from '../../types';

// Every plan except 'free' counts as a paying subscriber.
export const PAID_PLANS: Exclude<PlanType, 'free'>[] = ['basic', 'pro', 'pro_plus', 'lite', 'plus', 'max', 'focus'];

// A count query is billed at one read per 1,000 matching index entries, so counting
// thousands of learners costs a handful of reads instead of one read per learner.
export async function countOf(source: Query): Promise<number> {
  return (await getCountFromServer(source)).data().count;
}

export async function loadUserCounts() {
  const users = collection(db, 'users');
  const [totalUsers, activeSubscribers] = await Promise.all([
    countOf(query(users)),
    countOf(query(users, where('plan', 'in', PAID_PLANS))),
  ]);
  return { totalUsers, activeSubscribers };
}

export function useUserCounts() {
  const [counts, setCounts] = useState({ totalUsers: 0, activeSubscribers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setFailed(false);
    try { setCounts(await loadUserCounts()); }
    catch (error) { console.error('Could not count learners:', error); setFailed(true); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { ...counts, isLoading, failed, refresh };
}
