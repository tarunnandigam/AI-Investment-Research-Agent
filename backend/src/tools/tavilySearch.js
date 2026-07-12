import { tavily } from '@tavily/core';
import dotenv from 'dotenv';

dotenv.config();

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not set in environment variables');
    }
    client = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }
  return client;
}

/**
 * Search the web using Tavily API.
 * @param {string} query - The search query
 * @param {number} maxResults - Max number of results to return (default 5)
 * @returns {Promise<Array<{title: string, url: string, content: string}>>}
 */
export async function tavilySearch(query, maxResults = 5) {
  try {
    const tc = getClient();
    const response = await tc.search(query, {
      max_results: maxResults,
      search_depth: 'advanced',
      include_answer: true,
    });

    const results = (response.results || []).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || '',
    }));

    return results;
  } catch (err) {
    console.error(`[TavilySearch] Error for query "${query}":`, err.message);
    return [];
  }
}

/**
 * Format search results into a readable text block for LLM prompts.
 * @param {Array<{title, url, content}>} results
 * @returns {string}
 */
export function formatResults(results) {
  if (!results || results.length === 0) {
    return 'No search results found.';
  }
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join('\n\n---\n\n');
}
