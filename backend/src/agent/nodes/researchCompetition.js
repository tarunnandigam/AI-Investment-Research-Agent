import { getLLM, withRetry } from '../llm.js';
import { tavilySearch, formatResults } from '../../tools/tavilySearch.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * researchCompetition node
 * Searches for competitors, market position, and competitive advantages.
 *
 * @param {import('../../schema.js').AgentState} state
 * @returns {Promise<Partial<import('../../schema.js').AgentState>>}
 */
export async function researchCompetition(state) {
  const { companyName, emit } = state;

  if (emit) emit('competition', `Analyzing competitive landscape for "${companyName}"...`);

  const queries = [
    `${companyName} competitors market share competitive analysis`,
    `${companyName} vs competitors market position advantages`,
  ];

  const results = await Promise.all(queries.map((q) => tavilySearch(q, 4)));
  const combined = results.flat();

  if (combined.length === 0) {
    return { competition: 'Insufficient data: No competitive landscape information found.' };
  }

  const searchText = formatResults(combined);

  const prompt = `You are a market analyst.

Based on the following search results about "${companyName}", provide a concise bullet-point summary covering:
- Main competitors (name and brief description)
- Market position (leader, challenger, niche player, etc.)
- Market share if mentioned
- Key competitive advantages or differentiators
- Competitive threats

Search Results:
${searchText}

Format as clear bullet points. Be factual and concise.`;

  try {
    const response = await withRetry(() => getLLM().invoke(prompt));
    return { competition: response.content.trim() };
  } catch (err) {
    console.error('[researchCompetition] LLM error:', err.message);
    return { competition: 'Could not summarize competitive landscape.' };
  }
}
