import type { Firestore } from 'firebase-admin/firestore';
import { PACKAGES } from '../packages';
import { validateProposedPrices, type PriceList } from '../pricing';

// Published price lists are immutable and append-only. An order records the version it
// was priced under, so a later publish can never change what an in-flight order owes.
const ACTIVE_DOC = 'pricing/active';
const VERSIONS = 'pricing_versions';

export interface PriceState {
  active: PriceList | null;
  byVersion: ReadonlyMap<number, PriceList>;
}

export const EMPTY_PRICE_STATE: PriceState = { active: null, byVersion: new Map() };

// Functions are short-lived, so a small TTL keeps the read cost down without letting a
// published change sit unseen for long. publishPrices clears it outright.
const CACHE_TTL_MS = 30_000;
let cache: { state: PriceState; expiresAt: number } | null = null;

export function clearPriceCache() {
  cache = null;
}

function toPriceList(data: any): PriceList | null {
  if (!data || typeof data.version !== 'number' || !data.amountsInCents) return null;
  return {
    version: data.version,
    amountsInCents: data.amountsInCents,
    publishedAt: Number(data.publishedAt) || 0,
    publishedBy: String(data.publishedBy || ''),
  };
}

/**
 * Every published price list, plus whichever is currently active.
 *
 * Resolved once per request and passed down, because the catalogue lookup happens
 * inside a Firestore transaction and inside a synchronous filter — neither can await.
 * A read failure returns the empty state, which means compiled-in prices: payments keep
 * working at the prices in the source tree rather than failing closed on a bad read.
 */
export async function loadPriceState(db: Firestore): Promise<PriceState> {
  if (cache && cache.expiresAt > Date.now()) return cache.state;
  try {
    const [activeSnap, versionSnaps] = await Promise.all([
      db.doc(ACTIVE_DOC).get(),
      db.collection(VERSIONS).get(),
    ]);
    const byVersion = new Map<number, PriceList>();
    for (const doc of versionSnaps.docs) {
      const list = toPriceList(doc.data());
      if (list) byVersion.set(list.version, list);
    }
    const activeVersion = activeSnap.exists ? Number(activeSnap.data()?.version) : NaN;
    const active = Number.isFinite(activeVersion) ? byVersion.get(activeVersion) ?? null : null;
    const state: PriceState = { active, byVersion };
    cache = { state, expiresAt: Date.now() + CACHE_TTL_MS };
    return state;
  } catch (error) {
    console.error('Could not load published prices; falling back to compiled-in prices:', error);
    return EMPTY_PRICE_STATE;
  }
}

/**
 * Publish a new price list. Mints the next version rather than editing an existing one,
 * so orders already placed keep the price they were sold at.
 */
export async function publishPrices(
  db: Firestore,
  amountsInCents: Record<string, number>,
  publishedBy: string,
): Promise<PriceList> {
  const problems = validateProposedPrices(amountsInCents, Object.keys(PACKAGES));
  if (problems.length) throw new Error(problems.join(' '));

  const existing = await db.collection(VERSIONS).get();
  const highest = existing.docs.reduce((max, doc) => Math.max(max, Number(doc.data()?.version) || 0), 0);
  const version = highest + 1;

  const list: PriceList = { version, amountsInCents, publishedAt: Date.now(), publishedBy };
  // Written before the pointer moves, so the active version always resolves to a
  // version document that already exists.
  await db.collection(VERSIONS).doc(String(version)).set(list);
  await db.doc(ACTIVE_DOC).set({ version, publishedAt: list.publishedAt, publishedBy });

  clearPriceCache();
  return list;
}
