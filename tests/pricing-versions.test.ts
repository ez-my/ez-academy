import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGES, PACKAGE_VERSION } from '../src/packages';
import { orderPlan } from '../src/server/payments';
import { clearPriceCache, loadPriceState, publishPrices } from '../src/server/pricingStore';

// Enough Firestore for the price store: documents, a collection read, and set().
class FakeStore {
  docs = new Map<string, any>();
  doc(path: string): any {
    return {
      path,
      get: async () => ({ exists: this.docs.has(path), data: () => this.docs.get(path) }),
      set: async (data: any) => { this.docs.set(path, data); },
    };
  }
  collection(name: string): any {
    return {
      doc: (id: string) => this.doc(`${name}/${id}`),
      get: async () => ({
        docs: [...this.docs]
          .filter(([path]) => path.startsWith(`${name}/`))
          .map(([path, data]) => ({ id: path.split('/').at(-1), data: () => data })),
      }),
    };
  }
}

const fresh = () => { clearPriceCache(); return new FakeStore(); };

test('publishing mints sequential versions and moves the active pointer', async () => {
  const db = fresh();
  const first = await publishPrices(db as any, { lite: 700 }, 'admin@ez');
  assert.equal(first.version, 1);

  clearPriceCache();
  const second = await publishPrices(db as any, { lite: 900 }, 'admin@ez');
  assert.equal(second.version, 2, 'a price change never edits a published list');

  clearPriceCache();
  const state = await loadPriceState(db as any);
  assert.equal(state.active?.version, 2);
  assert.equal(state.byVersion.get(1)?.amountsInCents.lite, 700, 'version 1 is still readable and unchanged');
  assert.equal(state.byVersion.get(2)?.amountsInCents.lite, 900);
});

test('an order in flight keeps the price it was sold at after a publish', async () => {
  const db = fresh();
  await publishPrices(db as any, { lite: 500 }, 'admin@ez');
  clearPriceCache();

  // Someone starts checkout at RM5 and is charged 500 cents.
  const order = { planId: 'lite', packageVersion: PACKAGE_VERSION, priceVersion: 1, amountInCents: 500 };

  clearPriceCache();
  await publishPrices(db as any, { lite: 1500 }, 'admin@ez');
  clearPriceCache();
  const { byVersion } = await loadPriceState(db as any);

  const plan = orderPlan(order, byVersion);
  assert.equal(plan?.amountInCents, 500, 'the raised price must not be applied to an order already placed');
  assert.equal(order.amountInCents, plan?.amountInCents, 'so the order still passes payment validation');
});

test('a new order is priced at the published price, not the compiled-in one', async () => {
  const db = fresh();
  await publishPrices(db as any, { lite: 1500 }, 'admin@ez');
  clearPriceCache();
  const { active, byVersion } = await loadPriceState(db as any);

  const order = { planId: 'lite', packageVersion: PACKAGE_VERSION, priceVersion: active!.version, amountInCents: 1500 };
  const plan = orderPlan(order, byVersion);
  assert.equal(plan?.amountInCents, 1500);
  assert.notEqual(plan?.amountInCents, PACKAGES.lite.amountInCents, 'the compiled-in price is overridden');
});

test('an order from before admin pricing uses the compiled-in price', async () => {
  const db = fresh();
  await publishPrices(db as any, { lite: 1500 }, 'admin@ez');
  clearPriceCache();
  const { byVersion } = await loadPriceState(db as any);

  const order = { planId: 'lite', packageVersion: PACKAGE_VERSION, amountInCents: PACKAGES.lite.amountInCents };
  const plan = orderPlan(order, byVersion);
  assert.equal(plan?.amountInCents, PACKAGES.lite.amountInCents);
});

test('prices never touch entitlements', async () => {
  const db = fresh();
  await publishPrices(db as any, { lite: 1500 }, 'admin@ez');
  clearPriceCache();
  const { active, byVersion } = await loadPriceState(db as any);

  const plan = orderPlan({ planId: 'lite', packageVersion: PACKAGE_VERSION, priceVersion: active!.version }, byVersion);
  assert.equal(plan?.aiUnits, PACKAGES.lite.aiUnits);
  assert.equal(plan?.dailyLimit, PACKAGES.lite.dailyLimit);
  assert.equal(plan?.durationDays, PACKAGES.lite.durationDays);
  assert.equal(plan?.type, PACKAGES.lite.type);
});

test('publishing rejects prices that are not real prices', async () => {
  const db = fresh();
  await assert.rejects(() => publishPrices(db as any, { lite: -1 }, 'admin@ez'));
  await assert.rejects(() => publishPrices(db as any, { nope: 500 } as any, 'admin@ez'));
  await assert.rejects(() => publishPrices(db as any, { lite: 500.5 }, 'admin@ez'));
  clearPriceCache();
  const state = await loadPriceState(db as any);
  assert.equal(state.active, null, 'nothing was published');
});

test('a failed read falls back to compiled-in prices rather than failing payments', async () => {
  clearPriceCache();
  const broken = { doc: () => { throw new Error('firestore down'); }, collection: () => { throw new Error('firestore down'); } };
  const state = await loadPriceState(broken as any);
  assert.equal(state.active, null);
  assert.equal(state.byVersion.size, 0);

  const plan = orderPlan({ planId: 'lite', packageVersion: PACKAGE_VERSION }, state.byVersion);
  assert.equal(plan?.amountInCents, PACKAGES.lite.amountInCents);
});
