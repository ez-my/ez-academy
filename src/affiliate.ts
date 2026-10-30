import { PACKAGES, PACKAGE_VERSION } from './packages';
export const MIN_CLAIM_CENTS = 1000;
export const AFFILIATE_TERMS = 'Minimum claim RM10. Payment will be transferred within 5 working days.';
export const COMMISSION_CENTS: Record<string, number> = {lite:100,plus:200,max:300,speak:100,write:100,read:100,listen:100};
export const affiliatePlans = Object.values(PACKAGES).filter(p => COMMISSION_CENTS[p.id]);
export const money = (cents: number) => `RM${(cents / 100).toFixed(2)}`;
export function commissionForOrder(order: any) {
  const plan = PACKAGES[order.planId as keyof typeof PACKAGES];
  return order.affiliateVersion === 1 && order.packageVersion === PACKAGE_VERSION && plan && order.amountInCents === plan.amountInCents && order.currency === 'MYR' ? COMMISSION_CENTS[plan.id] || 0 : 0;
}
export function validateClaim(amount: unknown, available: number) {
  if (!Number.isSafeInteger(amount) || Number(amount) < MIN_CLAIM_CENTS) throw Error('Minimum claim RM10.');
  if (Number(amount) > available) throw Error('Claim exceeds confirmed available balance.');
}
export function validateTransition(from: string, to: string) {
  if (!['Processing','Paid'].includes(to) || (from !== to && !((from === 'Submitted' && to === 'Processing') || (from === 'Processing' && to === 'Paid')))) throw Error('Invalid claim status change.');
}
