import { getLLM, withRetry } from '../llm.js';
import { tavilySearch, formatResults } from '../../tools/tavilySearch.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * researchRisks node
 * Searches for controversies, lawsuits, regulatory issues, and red flags.
 *
 * @param {import('../../schema.js').AgentState} state
 * @returns {Promise<Partial<import('../../schema.js').AgentState>>}
 */
export async function researchRisks(state) {
  const { companyName, emit } = state;

  if (emit) emit('risks', `Scanning for risks and red flags in "${companyName}"...`);

  const queries = [
    `${companyName} controversies lawsuits regulatory issues problems`,
    `${companyName} risks challenges concerns investors red flags`,
    `${companyName} fraud scandal investigation 2023 2024 2025`,
  ];

  const results = await Promise.all(queries.map((q) => tavilySearch(q, 4)));
  const combined = results.flat();

  if (combined.length === 0) {
    return { risks: 'No significant risk information found in search results.' };
  }

  const searchText = formatResults(combined);

  const prompt = `You are a risk analyst.

Based on the following search results about "${companyName}", identify and summarize key risk factors:
- Legal issues, lawsuits, or regulatory investigations
- Controversies or reputational concerns
- Business risks (market, competitive, operational)
- Financial risks (debt, cash flow issues)
- Red flags for investors

Search Results:
${searchText}

Format as clear bullet points. If no significant risks are found, state that clearly.
Be factual — only report what is supported by the search results.`;

  try {
    const response = await withRetry(() => getLLM().invoke(prompt));
    return { risks: response.content.trim() };
  } catch (err) {
    console.error('[researchRisks] LLM error:', err.message);
    return { risks: 'Could not summarize risk information.' };
  }
}
