import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { runResearchAgent } from '../agent/graph.js';

const router = express.Router();

// ── In-memory cache: company name → { result, timestamp } ───────────────────
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(companyName) {
  const key = companyName.toLowerCase().trim();
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(companyName, result) {
  const key = companyName.toLowerCase().trim();
  cache.set(key, { result, timestamp: Date.now() });
}

// ── SSE helper ───────────────────────────────────────────────────────────────
function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── POST /api/research ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { companyName } = req.body;

  if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
    return res.status(400).json({
      error: 'Invalid request: companyName must be a non-empty string (min 2 characters).',
    });
  }

  const cleanName = companyName.trim();

  try {
    const logPath = path.join(process.cwd(), '..', 'chat-logs', 'requests.log');
    const logEntry = `[${new Date().toISOString()}] Requested company: ${cleanName}\n`;
    await fs.appendFile(logPath, logEntry);
  } catch (err) {
    console.error('[Research Route] Failed to write to chat-logs:', err);
  }

  // ── Set SSE headers ────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial ping to establish connection
  sendSSE(res, 'connected', { message: 'SSE connection established' });

  // ── Check cache first ──────────────────────────────────────────────────────
  const cached = getCached(cleanName);
  if (cached) {
    console.log(`[Research Route] Cache hit for: "${cleanName}"`);
    sendSSE(res, 'progress', {
      step: 'cache',
      message: `Loading cached results for "${cleanName}"...`,
    });

    if (cached.insufficientData) {
      sendSSE(res, 'insufficient_data', {
        message: cached.insufficientDataMessage,
        companyName: cleanName,
      });
    } else {
      sendSSE(res, 'complete', cached);
    }
    return res.end();
  }

  // ── Emit SSE progress events from agent nodes ──────────────────────────────
  const STEP_MAP = {
    classifying:   'classifying',
    financials:    'financials',
    overview:      'overview',
    competition:   'competition',
    risks:         'risks',
    research:      'research',
    synthesizing:  'synthesizing',
    deciding:      'deciding',
  };

  const emit = (step, message) => {
    const mappedStep = STEP_MAP[step] || step;
    console.log(`[SSE] ${mappedStep}: ${message}`);
    sendSSE(res, 'progress', { step: mappedStep, message });
  };

  // ── Global timeout (20s) ───────────────────────────────────────────────────
  const timeoutId = setTimeout(() => {
    sendSSE(res, 'error', {
      message: 'Research timed out after 2 minutes. Please try again.',
      code: 'TIMEOUT',
    });
    res.end();
  }, 120000); // 2 minutes total timeout (agent needs time)

  try {
    console.log(`[Research Route] Starting research for: "${cleanName}"`);
    const result = await runResearchAgent(cleanName, emit);

    clearTimeout(timeoutId);

    if (result.insufficientData) {
      sendSSE(res, 'insufficient_data', {
        message: result.insufficientDataMessage,
        companyName: cleanName,
      });
    } else {
      // Build clean response object
      const report = {
        companyName: cleanName,
        isPublic: result.isPublic,
        ticker: result.ticker,
        verdict: result.verdict,
        confidence: result.confidence,
        reasoning: result.reasoning || [],
        risks: result.riskPoints || [],
        sources: result.sources || [],
        sections: {
          overview: result.overview || 'No overview data available.',
          financials: result.financials || 'No financial data available.',
          competition: result.competition || 'No competition data available.',
          risks: result.risks || 'No risk data available.',
        },
        synthesis: result.synthesis || '',
        generatedAt: new Date().toISOString(),
      };

      setCache(cleanName, report);
      sendSSE(res, 'complete', report);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[Research Route] Agent error:', err);
    sendSSE(res, 'error', {
      message: err.message || 'An unexpected error occurred during research.',
      code: 'AGENT_ERROR',
    });
  } finally {
    res.end();
  }
});

export default router;
