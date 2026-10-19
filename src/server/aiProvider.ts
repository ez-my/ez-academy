import OpenAI from 'openai';

// A Gemini implementation can later implement this contract. Automatic
// fallback is deliberately absent until output compatibility is evaluated.
export interface AIProvider {
  json(instructions: string, input: string): Promise<unknown>;
}

export function createOpenAIProvider(apiKey: string, model: string): AIProvider {
  const client = new OpenAI({ apiKey, timeout: 25000, maxRetries: 0 });
  return {
    async json(instructions, input) {
      const result = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: instructions }, { role: 'user', content: input }],
        response_format: { type: 'json_object' },
        max_completion_tokens: 700,
      });
      if (result.choices[0]?.finish_reason !== 'stop') throw new Error('Incomplete response');
      return JSON.parse(result.choices[0]?.message?.content || 'null');
    },
  };
}

