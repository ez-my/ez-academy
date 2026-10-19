export interface Translation {
  translation: string;
  definition: string;
  example: string;
  phonetic?: string;
}

export async function requestTranslation(text: string, context: string | undefined, token: string, fetcher: typeof fetch = fetch): Promise<Translation> {
  if (!token) throw new Error('Please sign in to translate.');
  const response = await fetcher('/api/ai/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, context }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Translation is temporarily unavailable.');
  if (!data || ['translation', 'definition', 'example'].some(key => typeof data[key] !== 'string' || !data[key].trim())) {
    throw new Error('The translation was incomplete. Please try again.');
  }
  return data;
}

