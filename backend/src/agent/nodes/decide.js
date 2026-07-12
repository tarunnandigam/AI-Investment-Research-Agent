import { getLLM, withRetry } from '../llm.js';
import { VerdictSchema } from '../schema.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * decide node
 * Uses gpt-4o to output final INVEST/PASS/WATCH verdict.
 * Output is validated against Zod VerdictSchema.
 * Retries once if validation fails.
 *
 * @param {import('../../schema.js').AgentState} state
 * @returns {Promise<Partial<import('../../schema.js').AgentState>>}
 */
export async function decide(state) {
  const { companyName, synthesis, overview, financials, competition, risks, sources, emit } = state;

  if (emit) emit('deciding', `Making final investment decision for "${companyName}"...`);

  const buildPrompt = () => `You are a senior investment analyst making a final recommendation.

Based on comprehensive research about "${companyName}", provide your investment recommendation.

## Research Synthesis
${synthesis || 'Not available'}

## Supporting Data
Business Overview: ${overview || 'Not available'}
Financial Health: ${financials || 'Not available'}
Competitive Position: ${competition || 'Not available'}
Risk Assessment: ${risks || 'Not available'}

## Instructions
Provide a final investment verdict as valid JSON ONLY. No explanations outside the JSON.
The verdict must be one of: "INVEST", "PASS", or "WATCH"
- INVEST: Strong fundamentals, good growth prospects, manageable risks
- PASS: Poor fundamentals, excessive risks, or business model concerns
- WATCH: Interesting but needs more time/data, or mixed signals

Respond with ONLY this JSON (no markdown fences, no extra text):
{
  "verdict": "INVEST" | "PASS" | "WATCH",
  "confidence": <integer between 0 and 100>,
  "reasoning": [
    "Reason 1 for the verdict",
    "Reason 2 for the verdict",
    "Reason 3 for the verdict"
  ],
  "risks": [
    "Key risk 1",
    "Key risk 2"
  ],
  "sources": [
    "source URL 1",
    "source URL 2"
  ],
  "metrics": {
    "sentiment": "Bullish | Bearish | Neutral",
    "marketPosition": "e.g. Market Leader, Challenger, Niche",
    "financialHealth": "e.g. Strong, Stable, Weak"
  },
  "chartData": [
    { "label": "Month 1", "value": 50 },
    { "label": "Month 2", "value": 55 }
  ]
}`;

  async function attemptDecision() {
    const response = await withRetry(() => getLLM().invoke(buildPrompt()));
    const text = response.content.trim();

    // Strip any accidental markdown fences
    const jsonStr = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonStr);

    // Inject collected sources if LLM didn't provide enough
    if (!parsed.sources || parsed.sources.length === 0) {
      parsed.sources = (sources || []).slice(0, 5);
    }

    // Validate with Zod — throws if invalid
    return VerdictSchema.parse(parsed);
  }

  let verdict;
  try {
    verdict = await attemptDecision();
  } catch (firstErr) {
    console.warn('[decide] First attempt failed, retrying...', firstErr.message);
    try {
      verdict = await attemptDecision();
    } catch (secondErr) {
      console.error('[decide] Both attempts failed:', secondErr.message);
      // Return a safe fallback
      return {
        verdict: 'WATCH',
        confidence: 30,
        reasoning: ['Insufficient data quality to make a confident recommendation.'],
        riskPoints: ['Unable to fully validate research findings.'],
        sources: sources || [],
        metrics: {
          sentiment: 'Neutral',
          marketPosition: 'Unknown',
          financialHealth: 'Unknown',
        },
        chartData: [
          { label: 'Jan', value: 0 },
          { label: 'Feb', value: 0 }
        ]
      };
    }
  }

  return {
    verdict: verdict.verdict,
    confidence: verdict.confidence,
    reasoning: verdict.reasoning,
    riskPoints: verdict.risks,
    sources: verdict.sources,
    metrics: verdict.metrics,
    chartData: verdict.chartData,
  };
}
