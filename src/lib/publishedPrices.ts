import { useEffect, useState } from 'react';
import { PACKAGES } from '../packages';
import { applyPrices, type PriceList } from '../pricing';

// What a student is charged is decided by the server. These helpers let the pricing
// and checkout screens show that same figure, so the price on the page and the price
// on the bill cannot drift apart after an admin publishes a change.

type Catalogue = typeof PACKAGES;

let cached: Promise<PriceList | null> | null = null;

function fetchActivePrices(): Promise<PriceList | null> {
  cached ??= fetch('/api/pricing', { cache: 'no-store' })
    .then(response => (response.ok ? response.json() : null))
    .then(data =>
      data && data.amountsInCents && Object.keys(data.amountsInCents).length
        ? { version: data.version ?? 0, amountsInCents: data.amountsInCents, publishedAt: 0, publishedBy: '' }
        : null,
    )
    .catch(() => null);
  return cached;
}

/**
 * The catalogue with published prices applied. Returns the compiled-in catalogue
 * first so nothing waits on the network, then re-renders if a published list differs.
 */
export function usePublishedPackages(): Catalogue {
  const [packages, setPackages] = useState<Catalogue>(PACKAGES);

  useEffect(() => {
    let alive = true;
    fetchActivePrices().then(list => {
      if (alive && list) setPackages(applyPrices(PACKAGES as any, list) as Catalogue);
    });
    return () => { alive = false; };
  }, []);

  return packages;
}
