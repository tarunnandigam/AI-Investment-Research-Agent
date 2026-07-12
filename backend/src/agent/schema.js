import { z } from 'zod';

// ── Verdict enum ─────────────────────────────────────────────────────────────
export const VerdictEnum = z.enum(['INVEST', 'PASS', 'WATCH']);

// ── Final decision output schema (validated before sending to frontend) ──────
export const VerdictSchema = z.object({
  verdict: VerdictEnum,
  confidence: z.number().min(0).max(100),   // Bounded — LLM can't return 150 or -20
  reasoning: z.array(z.string()).min(1),
  risks: z.array(z.string()),
  sources: z.array(z.string()),
  metrics: z.object({
    sentiment: z.string(),
    marketPosition: z.string(),
    financialHealth: z.string(),
  }).optional(),
  chartData: z.array(z.object({
    label: z.string(),
    value: z.number(),
  })).optional(),
});

// ── Agent state schema ───────────────────────────────────────────────────────
// This is the shape of the state object passed through all LangGraph nodes.
export const AgentStateSchema = z.object({
  companyName: z.string(),

  // Set by classifyCompany node
  isPublic: z.boolean().optional(),
  ticker: z.string().nullable().optional(),

  // Set by research nodes
  overview: z.string().optional(),
  financials: z.string().optional(),
  competition: z.string().optional(),
  risks: z.string().optional(),

  // Set by synthesize node
  synthesis: z.string().optional(),

  // Set by decide node — final output
  verdict: VerdictEnum.optional(),
  confidence: z.number().min(0).max(100).optional(),
  reasoning: z.array(z.string()).optional(),
  riskPoints: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
  metrics: z.object({
    sentiment: z.string(),
    marketPosition: z.string(),
    financialHealth: z.string(),
  }).optional(),
  chartData: z.array(z.object({
    label: z.string(),
    value: z.number(),
  })).optional(),

  // Flag for graceful "not found" handling
  insufficientData: z.boolean().optional(),
  insufficientDataMessage: z.string().optional(),
});

// ── TypeScript-style type exports (for JSDoc) ────────────────────────────────
/**
 * @typedef {z.infer<typeof AgentStateSchema>} AgentState
 * @typedef {z.infer<typeof VerdictSchema>} Verdict
 */
