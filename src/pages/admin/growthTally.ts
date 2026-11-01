export interface Tally { id: string; label: string; count: number; share: number; }

// Turns per source counts into the bars on the Growth tab. Anything that is not one of
// the listed sources (no answer, or an answer that is no longer offered) is shown as
// "Not answered", so the bars always add up to the total number of learners.
export function tallySources(
  total: number,
  bySource: Record<string, number>,
  label: (id: string) => string,
): { sources: Tally[]; answered: number } {
  const answered = Object.values(bySource).reduce((sum, n) => sum + n, 0);
  const divisor = total || 1;
  const rows: Tally[] = [
    ...Object.entries(bySource).map(([id, count]) => ({ id, label: label(id), count })),
    { id: 'unanswered', label: 'Not answered', count: Math.max(total - answered, 0) },
  ].map(row => ({ ...row, share: (row.count / divisor) * 100 }));
  return { sources: rows.sort((a, b) => b.count - a.count), answered };
}
