export const getFreeFeedbackCount = (): number => {
  return parseInt(localStorage.getItem('ez_free_feedback_count') || '0', 10);
};

export const incrementFreeFeedbackCount = () => {
  const current = getFreeFeedbackCount();
  const next = current + 1;
  localStorage.setItem('ez_free_feedback_count', next.toString());
  return next;
};

export const canUseAIFeedback = (plan: string): boolean => {
  if (plan !== 'free') return true;
  return getFreeFeedbackCount() < 3;
};
