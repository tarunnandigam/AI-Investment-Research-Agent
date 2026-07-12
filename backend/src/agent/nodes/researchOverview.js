import { getLLM, withRetry } from '../llm.js';
import { tavilySearch, formatResults } from '../../tools/tavilySearch.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * researchOverview node
 * Searches for business model, founders, sector, and recent news.
 *
 * @param {import('../../schema.js').AgentState} state
 * @returns {Promise<Partial<import('../../schema.js').AgentState>>}
 */
export async function researchOverview(state) {
  const { companyName, emit } = state;

  if (emit) emit('overview', `Researching business overview of "${companyName}"...`);

  const queries = [
    `${companyName} company overview business model products services`,
    `${companyName} founders CEO history founding story`,
    `${companyName} latest news 2024 2025`,
  ];

  const results = await Promise.all(queries.map((q) => tavilySearch(q, 4)));
  const combined = results.flat();
  const sources = [...new Set(combined.map((r) => r.url).filter(Boolean))];

  if (combined.length === 0) {
    return {
      overview: 'Insufficient data: No overview information found for this company.',
      sources,
    };
  }

  const searchText = formatResults(combined);

  const prompt = `You are a business analyst.

Based on the following search results about "${companyName}", provide a concise bullet-point summary covering:
- What the company does (business model, products/services)
- Industry/sector it operates in
- Key founders or leadership
- When it was founded and where it's headquartered
- Recent notable news or developments

Search Results:
${searchText}

Format as clear bullet points. Be factual and concise. If information is unavailable for a point, skip it.`;

  try {
    const response = await withRetry(() => getLLM().invoke(prompt));
    return { overview: response.content.trim(), sources };
  } catch (err) {
    console.error('[researchOverview] LLM error:', err.message);
    return { overview: 'Could not summarize company overview.', sources };
  }
}
