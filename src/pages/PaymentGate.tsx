import React, { lazy, useEffect, useState } from 'react';
import PaymentUnderConstruction from './PaymentUnderConstruction';

const Checkout = lazy(() => import('./Checkout').then(m => ({ default: m.Checkout })));
const PaymentStatus = lazy(() => import('./PaymentStatus').then(m => ({ default: m.PaymentStatus })));

export default function PaymentGate({ status = false }: { status?: boolean }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/payments/status', { cache: 'no-store', signal: controller.signal })
      .then(async response => response.ok && (await response.json()).enabled === true)
      .then(setEnabled)
      .catch(() => { if (!controller.signal.aborted) setEnabled(false); });
    return () => controller.abort();
  }, []);
  if (enabled === null) return <div className="min-h-screen flex items-center justify-center" role="status">Loading payment options…</div>;
  if (!enabled) return <PaymentUnderConstruction />;
  return status ? <PaymentStatus /> : <Checkout />;
}
