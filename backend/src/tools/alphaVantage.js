import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = () => process.env.ALPHAVANTAGE_API_KEY;

/**
 * Fetch company overview from Alpha Vantage.
 * @param {string} ticker - Stock ticker symbol (e.g. "AAPL", "ZOMATO.BSE")
 * @returns {Promise<object|null>} Structured financial overview or null on failure
 */
export async function fetchCompanyOverview(ticker) {
  if (!API_KEY()) {
    console.warn('[AlphaVantage] ALPHAVANTAGE_API_KEY not set — skipping financial API call.');
    return null;
  }

  try {
    const res = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: API_KEY(),
      },
      timeout: 10000,
    });

    const data = res.data;

    // Alpha Vantage returns empty object or "Note" field when ticker not found
    if (!data || !data.Symbol || data.Note || data.Information) {
      console.warn(`[AlphaVantage] No data found for ticker: ${ticker}`);
      return null;
    }

    return {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      sector: data.Sector,
      industry: data.Industry,
      marketCap: data.MarketCapitalization,
      peRatio: data.PERatio,
      eps: data.EPS,
      dividendYield: data.DividendYield,
      fiftyTwoWeekHigh: data['52WeekHigh'],
      fiftyTwoWeekLow: data['52WeekLow'],
      revenuePerShareTTM: data.RevenuePerShareTTM,
      profitMargin: data.ProfitMargin,
      returnOnEquityTTM: data.ReturnOnEquityTTM,
      quarterlyRevenueGrowthYOY: data.QuarterlyRevenueGrowthYOY,
      analystTargetPrice: data.AnalystTargetPrice,
      currency: data.Currency,
      exchange: data.Exchange,
    };
  } catch (err) {
    console.error(`[AlphaVantage] Error fetching overview for ${ticker}:`, err.message);
    return null;
  }
}

/**
 * Format financial data into a readable summary string for LLM prompts.
 * @param {object|null} data
 * @returns {string}
 */
export function formatFinancialData(data) {
  if (!data) return 'Financial API data not available.';

  const fmt = (val) => (val && val !== 'None' ? val : 'N/A');

  return `
Company: ${fmt(data.name)} (${fmt(data.symbol)})
Exchange: ${fmt(data.exchange)} | Currency: ${fmt(data.currency)}
Sector: ${fmt(data.sector)} | Industry: ${fmt(data.industry)}
Market Cap: ${fmt(data.marketCap)}
P/E Ratio: ${fmt(data.peRatio)} | EPS: ${fmt(data.eps)}
Dividend Yield: ${fmt(data.dividendYield)}
52-Week High: ${fmt(data.fiftyTwoWeekHigh)} | 52-Week Low: ${fmt(data.fiftyTwoWeekLow)}
Profit Margin: ${fmt(data.profitMargin)}
Return on Equity (TTM): ${fmt(data.returnOnEquityTTM)}
Quarterly Revenue Growth (YoY): ${fmt(data.quarterlyRevenueGrowthYOY)}
Analyst Target Price: ${fmt(data.analystTargetPrice)}
Business Description: ${fmt(data.description)}
  `.trim();
}
