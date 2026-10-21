// GA4 funnel instrumentation. Initializes analytics with the measurementId
// already present in firebase-applet-config.json and exposes a safe trackEvent
// wrapper so funnel code never breaks the UI if analytics fails to load.
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { app } from './firebase';

let ga: Analytics | null = null;

export async function initAnalytics(): Promise<void> {
  if (ga) return;
  try {
    if (await isSupported()) ga = getAnalytics(app);
  } catch (err) {
    console.warn('Analytics unavailable:', err);
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!ga) return;
  try { logEvent(ga, name, params); } catch (err) { console.warn('trackEvent failed:', name, err); }
}

// --- Signup-source attribution ---
const ATTRIBUTION_KEY = 'ez_attribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** Capture UTMs (and referrer) from the landing URL once, persisting until signup. */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const utms: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = url.searchParams.get(key);
      if (value) utms[key] = value.slice(0, 100);
    }
    // First-touch wins: do not overwrite an earlier landing source.
    if (Object.keys(utms).length && !localStorage.getItem(ATTRIBUTION_KEY)) {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(utms));
    }
  } catch {}
}

export function attribution(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || '{}'); } catch { return {}; }
}

/** UTM params + referrer to attach to the signup_completed event. */
export function signupAttribution(): Record<string, unknown> {
  const params: Record<string, unknown> = { ...attribution() };
  if (typeof document !== 'undefined' && document.referrer) params.referrer = document.referrer.slice(0, 200);
  return params;
}
