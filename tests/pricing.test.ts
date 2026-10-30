import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPrices,
  priceFor,
  priceListForOrder,
  validateProposedPrices,
  type PriceList,
} from '../src/pricing';
import { PACKAGES } from '../src/packages';

const planIds = Object.keys(PACKAGES);
const basePlan = { price: 5, amountInCents: 500 };

const list = (version: number, amountsInCents: Record<string, number>): PriceList => ({
  version,
  amountsInCents,
  publishedAt: 1_700_000_000_000,
  publishedBy: 'admin',
});

test('a plan with no override keeps its compiled-in price', () => {
  assert.deepEqual(priceFor('lite', basePlan, null), basePlan);
  assert.deepEqual(priceFor('lite', basePlan, list(1, { plus: 1200 })), basePlan);
});

test('an override sets both the cents and the ringgit figure', () => {
  assert.deepEqual(priceFor('lite', basePlan, list(1, { lite: 750 })), { price: 7.5, amountInCents: 750 });
});

test('applying prices leaves every other field of a plan untouched', () => {
  const priced: Record<string, any> = applyPrices(PACKAGES as any, list(1, { lite: 900 }));
  assert.equal(priced.lite.amountInCents, 900);
  assert.equal(priced.lite.price, 9);
  assert.equal(priced.lite.aiUnits, PACKAGES.lite.aiUnits);
  assert.equal(priced.lite.durationDays, PACKAGES.lite.durationDays);
  assert.equal(priced.lite.type, PACKAGES.lite.type);
  assert.equal(priced.plus.amountInCents, PACKAGES.plus.amountInCents, 'plans without an override are unchanged');
});

test('an order placed before admin pricing keeps its compiled-in price', () => {
  // The order carries no priceVersion. Returning the active list here would re-price
  // an order already in flight and fail it against what the customer was charged.
  const byVersion = new Map([[1, list(1, { lite: 9999 })]]);
  assert.equal(priceListForOrder({}, byVersion), null);
  assert.equal(priceListForOrder({ priceVersion: undefined }, byVersion), null);
});

test('an order keeps the price it was sold at after a later publish', () => {
  const v1 = list(1, { lite: 500 });
  const v2 = list(2, { lite: 1500 });
  const byVersion = new Map([[1, v1], [2, v2]]);

  const inFlight = { priceVersion: 1 };
  assert.equal(priceFor('lite', basePlan, priceListForOrder(inFlight, byVersion)).amountInCents, 500);

  const placedAfter = { priceVersion: 2 };
  assert.equal(priceFor('lite', basePlan, priceListForOrder(placedAfter, byVersion)).amountInCents, 1500);
});

test('an unknown price version resolves to no list rather than the newest one', () => {
  const byVersion = new Map([[1, list(1, { lite: 500 })]]);
  assert.equal(priceListForOrder({ priceVersion: 99 }, byVersion), null);
  assert.equal(priceListForOrder({ priceVersion: 'latest' as any }, byVersion), null);
});

test('proposed prices are rejected when they are not real prices', () => {
  assert.deepEqual(validateProposedPrices({ lite: 500 }, planIds), []);

  assert.ok(validateProposedPrices({}, planIds).length, 'empty is rejected');
  assert.ok(validateProposedPrices(null, planIds).length, 'null is rejected');
  assert.ok(validateProposedPrices([500], planIds).length, 'an array is rejected');
  assert.ok(validateProposedPrices({ nonsense: 500 }, planIds)[0].includes('Unknown plan'));
  assert.ok(validateProposedPrices({ lite: '500' }, planIds)[0].includes('number of cents'));
  assert.ok(validateProposedPrices({ lite: 500.5 }, planIds)[0].includes('whole number'));
  assert.ok(validateProposedPrices({ lite: 0 }, planIds)[0].includes('between'));
  assert.ok(validateProposedPrices({ lite: -500 }, planIds)[0].includes('between'));
  assert.ok(validateProposedPrices({ lite: 10_000_000 }, planIds)[0].includes('between'));
  assert.ok(validateProposedPrices({ lite: NaN }, planIds)[0].includes('number of cents'));
});

test('every plan in the live catalogue can be priced', () => {
  const everyPlan = Object.fromEntries(planIds.map(id => [id, 1000]));
  assert.deepEqual(validateProposedPrices(everyPlan, planIds), []);
});
