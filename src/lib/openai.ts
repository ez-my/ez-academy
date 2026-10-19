// Feedback always goes through the server; no API keys belong in the browser.
export class FeedbackError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
    this.name = 'FeedbackError';
  }
}

export async function requestFeedback(
  systemPrompt: string,
  userPrompt: string,
  token: string,
  temperature = 0.4,
  fetcher: typeof fetch = fetch
): Promise<string> {
  if (!token) throw new FeedbackError('Please sign in again to get feedback.', 401, 'sign_in_required');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65000);
  try {
    const res = await fetcher('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ systemPrompt, userPrompt, temperature }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new FeedbackError(
        data?.error || 'Feedback is unavailable. Your answer was not scored. Please try again.',
        res.status, data?.code || 'feedback_unavailable'
      );
    }
    if (typeof data?.content !== 'string' || !data.content.trim()) {
      throw new FeedbackError('The AI feedback was incomplete. Your answer was not scored. Please try again.', 502, 'invalid_response');
    }
    return data.content;
  } catch (error) {
    if (error instanceof FeedbackError) throw error;
    throw new FeedbackError('Could not connect to feedback. Your answer is still here. Please try again.', 503, 'connection_failed');
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeFeedbackWithChatGPT(systemPrompt: string, userPrompt: string, temperature = 0.4): Promise<string> {
  const { auth } = await import('./firebase');
  const user = auth.currentUser;
  if (!user) throw new FeedbackError('Please sign in again to get feedback.', 401, 'sign_in_required');
  return requestFeedback(systemPrompt, userPrompt, await user.getIdToken(), temperature);
}
