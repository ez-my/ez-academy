// Admin-editable prices, kept deliberately apart from the package catalogue.
//
// `packageVersion` is already overloaded: payments.ts branches on it to decide which
// entitlement ledger format a purchase is written in (see the `version:` field and the
// `![3,PACKAGE_VERSION].includes(...)` guard). Minting a new packageVersion for a price
// change would therefore quietly alter what a purchase grants. Prices get their own
// version line instead, so changing a price can never change an entitlement.
//
// Everything here is pure. The server resolves a price list once per request and passes
// it in, because the catalogue lookup happens inside a Firestore transaction and inside
// a synchronous filter, neither of which can await.

export interface PriceList {
  /** Monotonic, assigned on publish. Orders record the version they were priced under. */
  version: number;
  /** planId -> amount in cents. A plan absent here keeps its compiled-in price. */
  amountsInCents: Record<string, number>;
  publishedAt: number;
  publishedBy: string;
}

export interface PricedPlan {
  price: number;
  amountInCents: number;
}

/** RM1 to RM1000. Anything outside this is a typo or a mistake, not a pricing decision. */
export const MIN_PRICE_CENTS = 100;
export const MAX_PRICE_CENTS = 100000;

export const centsToRinggit = (cents: number): number => Math.round(cents) / 100;

/**
 * The price a plan carries under a given price list.
 * Falls back to the plan's compiled-in price, which is what every order placed before
 * the first publish must keep using.
 */
export function priceFor(planId: string, basePlan: PricedPlan, priceList?: PriceList | null): PricedPlan {
  const override = priceList?.amountsInCents?.[planId];
  if (typeof override !== 'number' || !Number.isFinite(override)) return basePlan;
  const amountInCents = Math.round(override);
  return { amountInCents, price: centsToRinggit(amountInCents) };
}

/** Apply a price list across a whole catalogue, leaving every other field untouched. */
export function applyPrices<T extends PricedPlan>(
  catalogue: Record<string, T>,
  priceList?: PriceList | null,
): Record<string, T> {
  if (!priceList) return catalogue;
  const out: Record<string, T> = {};
  for (const [planId, plan] of Object.entries(catalogue)) {
    out[planId] = { ...plan, ...priceFor(planId, plan, priceList) };
  }
  return out;
}

/**
 * Validate an admin's proposed prices before anything is stored.
 * Returns a list of problems; empty means the input is safe to publish.
 */
export function validateProposedPrices(
  proposed: unknown,
  knownPlanIds: readonly string[],
): string[] {
  const problems: string[] = [];
  if (!proposed || typeof proposed !== 'object' || Array.isArray(proposed)) {
    return ['Prices must be supplied as an object of plan id to amount in cents.'];
  }
  const entries = Object.entries(proposed as Record<string, unknown>);
  if (entries.length === 0) problems.push('No prices were supplied.');

  for (const [planId, value] of entries) {
    if (!knownPlanIds.includes(planId)) {
      problems.push(`Unknown plan "${planId}".`);
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      problems.push(`Price for "${planId}" must be a number of cents.`);
      continue;
    }
    if (!Number.isInteger(value)) {
      problems.push(`Price for "${planId}" must be a whole number of cents.`);
      continue;
    }
    if (value < MIN_PRICE_CENTS || value > MAX_PRICE_CENTS) {
      problems.push(
        `Price for "${planId}" must be between RM${centsToRinggit(MIN_PRICE_CENTS)} and RM${centsToRinggit(MAX_PRICE_CENTS)}.`,
      );
    }
  }
  return problems;
}

/**
 * Pick the price list an order was placed under.
 *
 * An order with no priceVersion predates admin pricing and must keep its compiled-in
 * price, so this returns null rather than the currently active list. Returning the
 * active list would re-price orders that are still in flight and make them fail
 * validation against the amount the customer was actually charged.
 */
export function priceListForOrder(
  order: { priceVersion?: unknown },
  byVersion: ReadonlyMap<number, PriceList>,
): PriceList | null {
  const version = order?.priceVersion;
  if (typeof version !== 'number' || !Number.isFinite(version)) return null;
  return byVersion.get(version) ?? null;
}
