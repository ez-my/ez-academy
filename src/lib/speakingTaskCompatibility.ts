// Shared questions exist in both the legacy flat bank and generated task shapes.
// Never substitute the broad curriculum theme for the actual speaking topic.
export function normalizeSpeakingBankQuestion(data: any, part: 1 | 2 | 3 | 'Full'): any | null {
  if (!data || typeof data !== 'object') return null;
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const texts = (value: unknown) => Array.isArray(value) ? value.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()) : [];
  if (part === 2) {
    const topic = text(data.promptCard?.topic) || text(data.topic);
    const prompts = texts(data.promptCard?.prompts).length ? texts(data.promptCard.prompts) : texts(data.prompts);
    if (!topic || !prompts.length) return null;
    const prepTip = text(data.promptCard?.prepTip) || text(data.prepTip);
    return { ...data, part: 2, topic, prompts, prepTip, promptCard: { topic, prompts, ...(prepTip ? { prepTip } : {}) } };
  }
  if (part === 3) {
    const topic = text(data.discussion?.situation) || text(data.topic);
    const prompts = texts(data.discussion?.points).length ? texts(data.discussion.points) : texts(data.prompts);
    if (!topic || !prompts.length) return null;
    return { ...data, part: 3, topic, prompts, discussion: {
      ...data.discussion, situation: topic, points: prompts,
      guides: texts(data.discussion?.guides ?? data.guides),
      decisionQuestion: text(data.discussion?.decisionQuestion) || text(data.decisionQuestion),
      hotQuestion: text(data.discussion?.hotQuestion) || text(data.hotQuestion),
    } };
  }
  return data;
}
