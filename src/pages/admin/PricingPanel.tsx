import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, DollarSign, RefreshCcw, Save } from 'lucide-react';
import { practiceRequest } from '../../lib/practice';
import { MAX_PRICE_CENTS, MIN_PRICE_CENTS, centsToRinggit, type PriceList } from '../../pricing';
import { TooltipHelp } from './TooltipHelp';

interface PlanRow {
  id: string;
  name: string;
  type: string;
  description: string;
  defaultAmountInCents: number;
  amountInCents: number;
  isOverridden: boolean;
}

const toCents = (ringgit: string): number => Math.round(Number(ringgit) * 100);

// Prices are edited here and published as a new version. Changing a price never
// edits a published one, so anything already bought keeps the price it was sold at.
export const PricingPanel: React.FC = () => {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [history, setHistory] = useState<PriceList[]>([]);
  const [active, setActive] = useState<PriceList | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await practiceRequest('admin/pricing');
      setPlans(data.plans || []);
      setActive(data.active || null);
      setHistory(data.history || []);
      setDraft(Object.fromEntries((data.plans || []).map((p: PlanRow) => [p.id, centsToRinggit(p.amountInCents).toFixed(2)])));
    } catch (err: any) {
      setError(err?.message || 'Could not load prices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changed = plans.filter(plan => toCents(draft[plan.id] ?? '') !== plan.amountInCents);
  const invalid = plans.filter(plan => {
    const cents = toCents(draft[plan.id] ?? '');
    return !Number.isInteger(cents) || cents < MIN_PRICE_CENTS || cents > MAX_PRICE_CENTS;
  });

  const publish = async () => {
    setIsPublishing(true);
    setError('');
    setNotice('');
    try {
      const amountsInCents = Object.fromEntries(plans.map(plan => [plan.id, toCents(draft[plan.id])]));
      const result = await practiceRequest('admin/pricing', { amountsInCents });
      setNotice(result.message);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not publish prices.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-4 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight flex items-center">
              Pricing
              <TooltipHelp text="Publishing creates a new price version. Orders already placed keep the price they were sold at, and what each plan includes never changes here." />
            </h3>
            <p className="text-xs text-white/40 mt-1">
              {active
                ? `Version ${active.version}, published ${new Date(active.publishedAt).toLocaleDateString('en-MY')} by ${active.publishedBy}`
                : 'No prices published yet — the catalogue prices in the code are live.'}
            </p>
          </div>
          <button onClick={load} disabled={isLoading} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
            <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 p-4 rounded-2xl border border-red-500/30 bg-red-500/5 text-sm text-red-300 flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-5 p-4 rounded-2xl border border-primary/30 bg-primary/5 text-sm text-primary flex items-start gap-3">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> {notice}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-white/50 py-8 text-center">Loading prices…</p>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => {
              const cents = toCents(draft[plan.id] ?? '');
              const isInvalid = !Number.isInteger(cents) || cents < MIN_PRICE_CENTS || cents > MAX_PRICE_CENTS;
              const isChanged = cents !== plan.amountInCents;
              return (
                <div key={plan.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-wrap items-center gap-4 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{plan.name}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30 border border-white/10 rounded px-1.5 py-0.5">{plan.type}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 line-clamp-1">{plan.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <label htmlFor={`price-${plan.id}`} className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-1">Price (RM)</label>
                      <input
                        id={`price-${plan.id}`}
                        type="number"
                        step="0.01"
                        min={centsToRinggit(MIN_PRICE_CENTS)}
                        max={centsToRinggit(MAX_PRICE_CENTS)}
                        value={draft[plan.id] ?? ''}
                        onChange={event => setDraft(prev => ({ ...prev, [plan.id]: event.target.value }))}
                        aria-invalid={isInvalid}
                        className={`w-28 min-h-11 rounded-lg border bg-black/30 px-3 text-sm text-white tabular-nums ${
                          isInvalid ? 'border-red-500/60' : isChanged ? 'border-primary/60' : 'border-white/15'
                        }`}
                      />
                    </div>
                    <div className="text-right w-24">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-1">In code</div>
                      <div className="text-sm text-white/50 tabular-nums">RM {centsToRinggit(plan.defaultAmountInCents).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && (
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-white/50">
              {invalid.length > 0
                ? `${invalid.length} ${invalid.length === 1 ? 'price is' : 'prices are'} outside RM${centsToRinggit(MIN_PRICE_CENTS)}–RM${centsToRinggit(MAX_PRICE_CENTS)}.`
                : changed.length === 0
                  ? 'No changes to publish.'
                  : `${changed.length} ${changed.length === 1 ? 'price' : 'prices'} changed. Publishing takes effect on new orders only.`}
            </p>
            <button
              onClick={publish}
              disabled={isPublishing || changed.length === 0 || invalid.length > 0}
              className="btn-primary py-3 px-8 flex items-center gap-2 disabled:opacity-40 rounded-2xl"
            >
              {isPublishing ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Publish prices</span>
            </button>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="glass-card p-4 sm:p-8">
          <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
            <DollarSign size={15} className="text-primary" /> Published versions
          </h3>
          <div className="divide-y divide-white/10">
            {history.map(entry => (
              <div key={entry.version} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white">Version {entry.version}</span>
                  {active?.version === entry.version && <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-primary">Live</span>}
                  <p className="text-white/40 mt-0.5">{entry.publishedBy}</p>
                </div>
                <div className="text-right text-white/50">
                  <p>{new Date(entry.publishedAt).toLocaleString('en-MY')}</p>
                  <p className="mt-0.5">
                    {Object.entries(entry.amountsInCents).map(([id, cents]) => `${id} RM${centsToRinggit(cents).toFixed(2)}`).join(' · ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
