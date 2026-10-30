import type { PracticeSession } from '../types';

type RankedResult = Pick<PracticeSession, 'score' | 'resultVersion' | 'resultOrder'>;
/** Shared device/cloud ordering: paid feedback, logical order, then UUID.
 * Pre-version cloud records sort before versioned records of the same score rank.
 */
export function compareResults(a: RankedResult, b: RankedResult): number {
  const rank = (r: RankedResult) => r.score == null ? 0 : 1;
  const order = (r: RankedResult) => typeof r.resultVersion === 'string' && r.resultVersion.length > 0 && Number.isSafeInteger(r.resultOrder) ? r.resultOrder! : -1;
  const version = (r: RankedResult) => order(r) === -1 ? '' : r.resultVersion!;
  return rank(a) - rank(b) || order(a) - order(b) || (version(a) > version(b) ? 1 : version(a) < version(b) ? -1 : 0);
}
