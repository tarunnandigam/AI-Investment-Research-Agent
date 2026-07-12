import { classifyCompany } from './nodes/classifyCompany.js';
import { researchFinancials } from './nodes/researchFinancials.js';
import { researchOverview } from './nodes/researchOverview.js';
import { researchCompetition } from './nodes/researchCompetition.js';
import { researchRisks } from './nodes/researchRisks.js';
import { synthesize } from './nodes/synthesize.js';
import { decide } from './nodes/decide.js';

/**
 * Run the full investment research agent pipeline.
 *
 * Pipeline (with parallel research optimization):
 *   START
 *   → classifyCompany         (public/private? ticker?)
 *   → researchFinancials      (Alpha Vantage + Tavily fallback)
 *   → [PARALLEL] researchOverview + researchCompetition + researchRisks
 *   → synthesize              (merge all findings)
 *   → decide                  (gpt-4o verdict with Zod validation)
 *   END
 *
 * @param {string} companyName - The company to research
 * @param {Function} emit - SSE emit function: (step, message) => void
 * @returns {Promise<object>} Final agent state
 */
export async function runResearchAgent(companyName, emit) {
  // ── Initial state ──────────────────────────────────────────────────────────
  let state = {
    companyName,
    emit,
    isPublic: false,
    ticker: null,
    overview: null,
    financials: null,
    competition: null,
    risks: null,
    synthesis: null,
    verdict: null,
    confidence: null,
    reasoning: [],
    riskPoints: [],
    sources: [],
    metrics: null,
    chartData: null,
    insufficientData: false,
    insufficientDataMessage: null,
  };

  // ── Node 1: Classify company ───────────────────────────────────────────────
  const classifyResult = await classifyCompany(state);
  state = { ...state, ...classifyResult };

  console.log(`[Graph] ${companyName} → isPublic: ${state.isPublic}, ticker: ${state.ticker}`);

  // ── Node 2: Research financials ────────────────────────────────────────────
  const financialsResult = await researchFinancials(state);
  state = { ...state, ...financialsResult };

  // ── Nodes 3/4/5 in PARALLEL: Overview + Competition + Risks ────────────────
  // Running in parallel with Promise.all reduces total time from ~12s to ~4s
  if (emit) emit('research', 'Running parallel research: overview, competition, and risks...');

  const [overviewResult, competitionResult, risksResult] = await Promise.all([
    researchOverview(state),
    researchCompetition(state),
    researchRisks(state),
  ]);

  state = {
    ...state,
    ...overviewResult,
    ...competitionResult,
    ...risksResult,
    // Merge sources from all nodes (including financials)
    sources: [
      ...(state.sources || []),
      ...(financialsResult.sources || []),
      ...(overviewResult.sources || []),
      ...(competitionResult.sources || []),
      ...(risksResult.sources || []),
    ],
  };

  // ── Check for insufficient data ────────────────────────────────────────────
  const allInsufficient =
    state.overview?.startsWith('Insufficient data') &&
    state.financials?.includes('No financial data') &&
    state.competition?.startsWith('Insufficient data');

  if (allInsufficient) {
    state.insufficientData = true;
    state.insufficientDataMessage = `We couldn't find enough reliable information about "${companyName}". This may be because:
• The company name is misspelled or too obscure
• The company doesn't have a significant online presence
• It may be a very early-stage or stealth startup

Please try a different or more complete company name.`;
    return state;
  }

  // ── Node 6: Synthesize ────────────────────────────────────────────────────
  const synthesisResult = await synthesize(state);
  state = { ...state, ...synthesisResult };

  // ── Node 7: Decide ────────────────────────────────────────────────────────
  const decideResult = await decide(state);
  state = { ...state, ...decideResult };

  // Deduplicate and clean sources
  state.sources = [...new Set(state.sources)].filter(Boolean).slice(0, 10);

  return state;
}
