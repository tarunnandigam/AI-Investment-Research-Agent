import { getLLM, withRetry } from '../llm.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * classifyCompany node
 * Determines if the company is publicly listed and guesses the stock ticker.
 *
 * @param {import('../schema.js').AgentState} state
 * @returns {Promise<Partial<import('../schema.js').AgentState>>}
 */
export async function classifyCompany(state) {
  const { companyName, emit } = state;

  if (emit) emit('classifying', `Classifying "${companyName}" — checking if publicly listed...`);

  const prompt = `You are a financial analyst assistant.
Given the company name: "${companyName}"

Determine:
1. Is this company publicly listed on any stock exchange? Answer strictly YES or NO.
2. If YES, what is the most likely stock ticker symbol? (e.g. AAPL, ZOMATO.NS, RELIANCE.NS, etc.)
   If listed on NSE/BSE (Indian exchanges), append .NS or .BSE accordingly.
   If you are unsure of the ticker, output null.
3. If NO, output null for the ticker.

Respond ONLY with valid JSON in this exact format:
{
  "isPublic": true or false,
  "ticker": "TICKER_SYMBOL" or null
}

Do not include any explanation or extra text.`;

  try {
    const response = await withRetry(() => getLLM().invoke(prompt));
    const text = response.content.trim();

    // Strip markdown code fences if LLM adds them
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      isPublic: Boolean(parsed.isPublic),
      ticker: parsed.ticker || null,
    };
  } catch (err) {
    console.error('[classifyCompany] Failed to parse LLM response:', err.message);
    // Fallback: assume private, no ticker
    return { isPublic: false, ticker: null };
  }
}
