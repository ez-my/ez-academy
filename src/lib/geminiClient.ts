import type { GoogleGenAI } from "@google/genai";
export { Modality } from "@google/genai";

// Legacy features are ported one task at a time. Never initialize a paid
// provider with browser credentials, even if old environment variables exist.
export const getGenAI = (): GoogleGenAI => {
  throw new Error('This AI feature is not available in the migration preview yet. Please use the current EZ Academy app.');
};

export function getModel(_modelName = "gemini-3.8-flash") {
  return getGenAI().models.generateContent;
}
