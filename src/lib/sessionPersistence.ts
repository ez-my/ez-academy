import { compareResults } from './resultOrder';

// Shared transaction seam; the adapter supplies real Firestore references.
export async function persistSessionOnce(
  transact: (work: (tx: any) => Promise<void>) => Promise<any>,
  sessionRef: any, userRef: any, session: any,
  rewards: (user: any) => any,
): Promise<any> {
  let effective: any;
  await transact(async tx => {
    // All reads precede writes. Firestore retries this callback on conflicts.
    const previous = await tx.get(sessionRef);
    const user = await tx.get(userRef);
    const existing = previous.exists() ? previous.data() : null;
    // Use the same score/order/UUID reduction as the device ledger. A repeated
    // version is immutable; pre-version callers retain their historical updates.
    const comparison = existing ? compareResults(session, existing) : 1;
    effective = existing && (comparison < 0 || comparison === 0 && session.resultVersion)
      ? existing : { ...existing, ...session, timestamp: existing?.timestamp ?? session.timestamp };
    // A retained pre-version winner needs its own durable identity, not the
    // losing incoming identity. Stamp it in this same transaction before ack.
    if (session.resultVersion && (!effective.resultVersion || !Number.isSafeInteger(effective.resultOrder))) {
      effective = { ...effective, resultVersion: `legacy-cloud-${encodeURIComponent(session.id)}`, resultOrder: 0 };
    }
    tx.set(sessionRef, effective);
    if (!existing && user.exists()) tx.update(userRef, rewards(user.data()));
  });
  // Only return the effective version after the transaction actually commits.
  return effective;
}
