import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
// Trigger restart to load new .env variables
import dotenv from 'dotenv';
import path from 'path';

// Ensure dotenv is configured to load the correct keys
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Returns a centralized instance of the Gemini LLM.
 * Uses gemini-1.5-flash — lighter quota, same capability for this use case.
 * @returns {ChatGoogleGenerativeAI}
 */
export const getLLM = () => {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    maxOutputTokens: 2048,
    temperature: 0,
    apiKey: process.env.GEMINI_API_KEY,
    maxRetries: 3,
  });
};

/**
 * Wraps an async LLM call with exponential backoff retry on 429 rate limit errors.
 * @param {() => Promise<any>} fn
 * @param {number} maxAttempts
 * @returns {Promise<any>}
 */
export async function withRetry(fn, maxAttempts = 4) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.message?.includes('429') || err?.status === 429;
      if (is429 && attempt < maxAttempts) {
        // Extract retry delay from error message if available
        const retryMatch = err.message?.match(/retryDelay":"(\d+)s"/);
        const retrySeconds = retryMatch ? parseInt(retryMatch[1], 10) : 0;
        const backoff = Math.max(retrySeconds * 1000, Math.pow(2, attempt) * 1000);
        console.warn(`[LLM] 429 rate limit, attempt ${attempt}/${maxAttempts}. Retrying in ${backoff / 1000}s...`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      console.error("[withRetry] LLM threw an unexpected error:", err.stack || err);
      throw err;
    }
  }
}
