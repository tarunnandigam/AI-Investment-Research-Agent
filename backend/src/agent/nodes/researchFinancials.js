import { getLLM, withRetry } from '../llm.js';
import { tavilySearch, formatResults } from '../../tools/tavilySearch.js';
import { fetchCompanyOverview, formatFinancialData } from '../../tools/alphaVantage.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * researchFinancials node
 * For public companies: tries Alpha Vantage API first, falls back to Tavily search.
 * For private companies: Tavily search only.
 *
 * @param {import('../../schema.js').AgentState} state
 * @returns {Promise<Partial<import('../../schema.js').AgentState>>}
 */
export async function researchFinancials(state) {
  const { companyName, isPublic, ticker, emit } = state;

  if (emit) emit('financials', `Fetching financial data for "${companyName}"...`);

  let dataText = '';
  let financialSources = [];

  // ── Public company: try Alpha Vantage first ──────────────────────────────
  if (isPublic && ticker) {
    const avData = await fetchCompanyOverview(ticker);
    if (avData) {
      dataText = formatFinancialData(avData);
    }
  }

  // ── Fallback / Private company: Tavily search ────────────────────────────
  if (!dataText) {
    const queries = [
      `${companyName} annual revenue profit loss financial results`,
      `${companyName} funding valuation investors financial performance`,
    ];

    const results = await Promise.all(queries.map((q) => tavilySearch(q, 4)));
    const combined = results.flat();
    financialSources = [...new Set(combined.map((r) => r.url).filter(Boolean))];

    if (combined.length === 0) {
      dataText = 'No financial data found via search.';
    } else {
      dataText = formatResults(combined);
    }
  }

  // ── LLM summarizes financial findings ───────────────────────────────────
  const prompt = `You are a financial analyst.\n\nBased on the following financial data about "${companyName}", provide a concise bullet-point summary of:\n- Revenue / funding / valuation\n- Profitability status (profitable / loss-making)\n- Key financial metrics (P/E, market cap, growth rate, etc. if available)\n- Financial health assessment\n\nData:\n${dataText}\n\nIf the data is insufficient, clearly state "Insufficient financial data available."\nFormat as bullet points. Be factual and concise.`;

  try {
    const response = await withRetry(() => getLLM().invoke(prompt));
    return { financials: response.content.trim(), sources: financialSources };
  } catch (err) {
    console.error('[researchFinancials] LLM error:', err.message);
    return { financials: 'Could not summarize financial data.', sources: financialSources };
  }
}
