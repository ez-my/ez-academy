// Global paywall gate: when a free user hits a plan limit (403/429 from the
// practice/AI APIs), show an inline upgrade card with the ToyyibPay checkout
// plans instead of leaving them on a bare error.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PACKAGES } from '../../packages';
import { trackEvent } from '../../lib/analytics';
import { emitPaywall, type PaywallDetail } from '../../lib/paywall';

export type { PaywallDetail };

const PLANS = [
  { id: 'plus', label: 'EZ Plus', highlight: true },
  { id: 'lite', label: 'EZ Lite', highlight: false },
] as const;

export const PaywallGate: React.FC = () => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PaywallDetail | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const next = (event as CustomEvent).detail || {};
      setDetail(next);
      trackEvent('paywall_shown', {
        skill: next.skill || undefined,
        code: next.code || undefined,
        source: next.source || 'ai_feedback',
      });
    };
    window.addEventListener('ez-paywall', handler);
    return () => window.removeEventListener('ez-paywall', handler);
  }, []);

  if (!detail) return null;

  const close = () => setDetail(null);

  const goCheckout = (planId: string) => {
    trackEvent('checkout_started', { plan: planId, source: 'paywall_gate', skill: detail.skill });
    close();
    navigate(`/checkout?plan=${planId}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Upgrade plan">
      <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-[#141610] p-6 text-white shadow-[0_0_40px_rgba(192,255,0,0.08)]">
        <h2 className="text-xl font-bold leading-snug">Nak teruskan practice? Upgrade sekarang:</h2>
        <p className="mt-2 text-sm text-white/60">
          {detail.skill ? `Free quota untuk ${detail.skill} hari ni dah habis.` : 'Free quota hari ni dah habis.'} Pilih plan untuk teruskan dengan AI feedback.
        </p>
        <div className="mt-5 space-y-3">
          {PLANS.map(({ id, highlight }) => {
            const plan = (PACKAGES as Record<string, any>)[id];
            return (
              <button
                key={id}
                onClick={() => goCheckout(id)}
                className={`w-full rounded-xl p-4 text-left transition-transform hover:scale-[1.01] ${
                  highlight
                    ? 'bg-primary text-obsidian shadow-lg shadow-primary/20'
                    : 'border border-white/15 bg-white/5 text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    {plan.name}
                    {highlight && <span className="ml-2 rounded-full bg-obsidian/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Best value</span>}
                  </span>
                  <span className="text-lg font-black">RM{plan.price}</span>
                </div>
                <p className={`mt-1 text-xs ${highlight ? 'text-obsidian/70' : 'text-white/60'}`}>
                  {plan.durationDays} hari · {plan.dailyLimit} practices sehari · {plan.aiUnits} AI units
                </p>
                <span className={`mt-3 inline-block w-full rounded-lg py-2 text-center text-xs font-bold uppercase tracking-widest ${highlight ? 'bg-obsidian text-primary' : 'bg-primary/10 text-primary border border-primary/30'}`}>
                  Bayar sekarang →
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <button className="text-primary font-semibold hover:underline" onClick={() => { close(); navigate('/app/pricing'); }}>
            Lihat semua plan
          </button>
          <button className="text-white/40 hover:text-white" onClick={close}>Nanti lah</button>
        </div>
      </div>
    </div>
  );
};
