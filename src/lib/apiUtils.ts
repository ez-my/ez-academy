import axios from "axios";
import { toast } from "react-hot-toast";

/**
 * Enhanced retry logic with exponential backoff and specific Gemini error handling.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000,
  context: string = "AI Operation",
  showToast: boolean = false
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.response?.status || error?.status;
    const message = error?.response?.data?.error?.message || error?.message || "";
    
    const isRateLimit = 
      status === 429 || 
      message.includes('429');

    const lowerMessage = message.toLowerCase();
    const isExhausted =
      status === 402 ||
      lowerMessage.includes('prepayment credits are depleted') ||
      lowerMessage.includes('billing account') ||
      lowerMessage.includes('billing details') ||
      lowerMessage.includes('account is not active') ||
      lowerMessage.includes('credit balance') ||
      lowerMessage.includes('quota') ||
      lowerMessage.includes('resource_exhausted');

    const isNetworkError = 
      !status || 
      status >= 500 || 
      message.includes('Network Error') || 
      message.includes('timeout');

    // Handle Billing and Quota specifically with a comforting message
    if (isExhausted) {
      const upgradeMsg = "AI feedback is temporarily unavailable. Your answer was not scored. Please try again later.";
      console.warn(`[${context}] Limit Reached (Billing/Quota):`, message);
      if (showToast) toast.error(upgradeMsg, { id: 'api-limit-error' });
      throw new Error(upgradeMsg);
    }
    
    // Handle API Key missing or invalid
    if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
      const keyMsg = "The AI service needs attention. Please contact us.";
      console.warn(`[${context}] API Key Error:`, message);
      if (showToast) toast.error(keyMsg, { id: 'api-key-error' });
      throw new Error(keyMsg);
    }

    // Retry for Rate Limits or Network Issues
    if (retries > 0 && (isRateLimit || isNetworkError)) {
      const waitTime = isRateLimit ? delay * 2 : delay;
      console.warn(`[${context}] ${isRateLimit ? "Rate limited" : "Network issue"}. Retrying in ${waitTime}ms... (${retries} retries left)`);
      if (showToast && retries === 1) toast.loading("Server busy, final retry...", { id: 'retry-toast' });
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return withRetry(fn, retries - 1, waitTime * (isRateLimit ? 2 : 1.5), context, showToast);
    }
    
    // Final user-friendly error mapping
    let finalError = "";
    if (isRateLimit) {
      finalError = "The AI is currently overwhelmed by high traffic. We're retrying, but please wait a moment before trying again.";
    } else if (isNetworkError) {
      finalError = "Connection lost or server is busy. Please check your internet and try again.";
    } else if (status === 401 || status === 403) {
      finalError = `Authentication/Permission failed (${status}): ${message}. Please refresh the page and try again.`;
    } else {
      finalError = message || `An unexpected error occurred during ${context}. Please try again.`;
    }

    console.warn(`[${context}] Handled Error:`, error?.message || error);
    if (showToast) {
      toast.dismiss('retry-toast');
      toast.error(finalError, { id: 'api-final-error' });
    }
    throw new Error(finalError);
  }
}

/**
 * Maps common technical errors to user-friendly messages for the UI.
 */
export function getFriendlyErrorMessage(error: any): string {
  const message = error?.message || String(error);
  const lowerMessage = message.toLowerCase();
  
  if (message.includes("AI feedback is temporarily unavailable")) {
    return message;
  }
  
  if (lowerMessage.includes("quota") || lowerMessage.includes("429") || lowerMessage.includes("resource_exhausted") || lowerMessage.includes("depleted") || lowerMessage.includes("billing") || lowerMessage.includes("not active")) {
    return "AI feedback is temporarily unavailable. Your answer was not scored. Please try again later.";
  }
  
  if (message.includes("Network") || message.includes("timeout") || message.includes("Connection")) {
    return "Connection issue detected. Please check your internet and try again.";
  }

  if (message.includes("invalid response format") || message.includes("could not be understood")) {
    return "The AI had trouble generating a response. Trying again usually fixes this!";
  }

  return message || "Something went wrong. Please try again.";
}
