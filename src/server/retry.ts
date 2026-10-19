// Provider calls have one bounded attempt within the Netlify execution budget.
// Retrying a task silently can duplicate spend and exceed the hosting timeout.
export async function withRetry<T>(fn: () => Promise<T>, ..._unused: unknown[]): Promise<T> { return fn(); }
export function getFriendlyErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'AI unavailable'; }
