import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { PACKAGES } from '../packages';
import { validateProposedPrices } from '../pricing';
import { authenticateFirebaseUser, isAuthorizedAdmin } from './payments';
import { loadPriceState, publishPrices } from './pricingStore';

export function registerPricingRoutes(app: Express, db: Firestore) {
  // Public: what a student is actually charged. Without this the pricing page would
  // keep showing the compiled-in price while checkout billed the published one.
  app.get('/api/pricing', async (_req, res) => {
    try {
      const { active } = await loadPriceState(db);
      res.set('Cache-Control', 'public, max-age=60');
      return res.json({ version: active?.version ?? null, amountsInCents: active?.amountsInCents ?? {} });
    } catch {
      return res.json({ version: null, amountsInCents: {} });
    }
  });

  app.use('/api/admin/pricing', async (req, res, next) => {
    try {
      if (!isAuthorizedAdmin(await authenticateFirebaseUser(req))) return res.sendStatus(403);
      res.set('Cache-Control', 'no-store');
      next();
    } catch {
      return res.sendStatus(403);
    }
  });

  app.get('/api/admin/pricing', async (_req, res) => {
    try {
      const { active, byVersion } = await loadPriceState(db);
      return res.json({
        // The structural catalogue stays in code; only the amounts are editable.
        plans: Object.values(PACKAGES).map(plan => ({
          id: plan.id,
          name: plan.name,
          type: plan.type,
          description: plan.description,
          defaultAmountInCents: plan.amountInCents,
          amountInCents: active?.amountsInCents?.[plan.id] ?? plan.amountInCents,
          isOverridden: typeof active?.amountsInCents?.[plan.id] === 'number',
        })),
        active,
        history: [...byVersion.values()].sort((a, b) => b.version - a.version).slice(0, 20),
      });
    } catch {
      return res.status(503).json({ error: 'Could not load prices. Please retry.' });
    }
  });

  app.post('/api/admin/pricing', async (req, res) => {
    const amountsInCents = req.body?.amountsInCents;
    const problems = validateProposedPrices(amountsInCents, Object.keys(PACKAGES));
    if (problems.length) return res.status(400).json({ error: problems.join(' ') });
    try {
      const identity = await authenticateFirebaseUser(req);
      const published = await publishPrices(db, amountsInCents, identity?.email || 'admin');
      return res.json({
        published,
        message:
          `Prices published as version ${published.version}. Orders already placed keep the price they were sold at.`,
      });
    } catch (error: any) {
      return res.status(503).json({ error: error?.message || 'Could not publish prices.' });
    }
  });
}
