import type { Request, Response } from 'express';

export interface FeedbackDependencies {
  verifyToken(token: string): Promise<unknown>;
  getKey(): string | undefined;
  complete(key: string, systemPrompt: string, userPrompt: string, temperature: number): Promise<{ content: string | null; finishReason: string | null }>;
}

// Kept separate from server startup so failures can be tested without a live key.
export function createFeedbackHandler(deps: FeedbackDependencies) {
  return async (req: Request, res: Response) => {
    const token = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return res.status(401).json({ code: 'sign_in_required', error: 'Please sign in again to get feedback.' });
    try { await deps.verifyToken(token); }
    catch { return res.status(401).json({ code: 'sign_in_required', error: 'Please sign in again to get feedback.' }); }

    const { systemPrompt = '', userPrompt, temperature = 0.4 } = req.body || {};
    if (typeof systemPrompt !== 'string' || typeof userPrompt !== 'string' || !userPrompt.trim() ||
        systemPrompt.length > 60000 || userPrompt.length > 60000 || !Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
      return res.status(400).json({ code: 'invalid_request', error: 'Please add your answer and try again.' });
    }
    const key = deps.getKey();
    if (!key) return res.status(503).json({ code: 'not_configured', error: 'AI feedback is not ready yet. Your answer was not scored. Please contact us.' });
    try {
      const result = await deps.complete(key, systemPrompt + '\nReturn a JSON object only.', userPrompt, temperature);
      if (!result.content || result.finishReason !== 'stop') throw { code: 'invalid_response' };
      let parsed: unknown;
      try { parsed = JSON.parse(result.content); } catch { throw { code: 'invalid_response' }; }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Object.keys(parsed).length) throw { code: 'invalid_response' };
      return res.json({ content: result.content });
    } catch (error: any) {
      // Never send provider error text (which can contain credentials) to browsers.
      const code = error?.code;
      if (code === 'insufficient_quota' || error?.status === 402) {
        return res.status(503).json({ code: 'billing_unavailable', error: 'AI feedback is temporarily unavailable. Your answer was not scored. Please try again later.' });
      }
      if (error?.status === 401 || error?.status === 403) {
        return res.status(503).json({ code: 'provider_auth_failed', error: 'AI feedback needs attention. Your answer was not scored. Please contact us.' });
      }
      if (error?.status === 429) return res.status(429).json({ code: 'busy', error: 'Feedback is busy. Your answer was not scored. Please try again in a moment.' });
      if (code === 'invalid_response') return res.status(502).json({ code, error: 'The AI feedback was incomplete. Your answer was not scored. Please try again.' });
      return res.status(503).json({ code: 'feedback_unavailable', error: 'Could not get feedback. Your answer is still here. Please try again.' });
    }
  };
}
