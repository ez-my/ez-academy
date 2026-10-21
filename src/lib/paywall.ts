// Shared paywall signal: any client API layer can emit this and the global
// PaywallGate (mounted in App.tsx) renders the inline upgrade card.
export interface PaywallDetail {
  skill?: string;
  code?: string;
  source?: string;
}

export function emitPaywall(detail: PaywallDetail): void {
  window.dispatchEvent(new CustomEvent('ez-paywall', { detail }));
}
