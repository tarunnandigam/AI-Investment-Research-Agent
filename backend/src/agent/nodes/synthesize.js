import { getLLM, withRetry } from '../llm.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * synthesize node
 * Merges all research findings into a coherent structured summary.
 *
 * @param {import('../../schema.js').AgentState} state
 * @returns {Promise<Partial<import('../../schema.js').AgentState>>}
 */
export async function synthesize(state) {
  const { companyName, overview, financials, competition, risks, emit } = state;

  if (emit) emit('synthesizing', `Synthesizing all research findings for "${companyName}"...`);

  const prompt = `You are an investment research analyst preparing a comprehensive briefing.

Synthesize the following research sections about "${companyName}" into a coherent investment analysis summary.
Focus on connecting the dots between the different sections and identifying the overall investment thesis.

## Business Overview
${overview || 'Not available'}

## Financial Data
${financials || 'Not available'}

## Competitive Landscape
${competition || 'Not available'}

## Risks & Red Flags
${risks || 'Not available'}

Provide a well-structured synthesis that:
1. Summarizes the company's core strengths
2. Highlights the most important financial signals
3. Assesses the competitive position
4. Weighs the key risks vs opportunities
5. Gives an overall investment thesis in 2-3 sentences

Be analytical and balanced. This synthesis will be used to make a final investment recommendation.`;

  try {
    const response = await withRetry(() => getLLM().invoke(prompt));
    return { synthesis: response.content.trim() };
  } catch (err) {
    console.error('[synthesize] LLM error:', err.message);
    return { synthesis: 'Could not synthesize research findings.' };
  }
}
