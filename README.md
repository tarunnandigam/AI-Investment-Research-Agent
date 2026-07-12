# InvestIQ: AI Investment Research Agent

## Overview — what it does
InvestIQ is a multi-agent AI pipeline designed to deliver institutional-grade investment research in seconds. Given any company name (public or private, domestic or global), the system orchestrates 7 specialized AI agents to autonomously gather real-time data, analyze financial health, evaluate competitive positioning, and assess risk. 

The output is a decisive **INVEST**, **PASS**, or **WATCH** verdict accompanied by a confidence score, a synthesized investment thesis, and a visually appealing monochrome dashboard.

## How to run it

### Prerequisites
- Node.js (v18+)
- Three API Keys:
  - **Gemini API Key** (for the LLM engine)
  - **Tavily API Key** (for real-time web search)
  - **AlphaVantage API Key** (for financial market data)

### Setup Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/tarunnandigam/AI-Investment-Research-Agent.git
   cd AI-Investment-Research-Agent
   ```
2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder and add your keys:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_key_here
   TAVILY_API_KEY=your_tavily_key_here
   ALPHAVANTAGE_API_KEY=your_alphavantage_key_here
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Setup the Frontend:**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Access the App:**
   Open your browser and navigate to `http://localhost:5173`.

## How it works — approach and architecture
The architecture follows a modular, event-driven pattern split into a React frontend and an Express/Node.js backend. The core intelligence is driven by **LangGraph**, which coordinates a stateful multi-agent workflow.

### The 7-Agent Pipeline
1. **Classifier Agent:** Determines if the company is public or private and identifies its stock ticker.
2. **Financial Analyst Agent:** Fetches quantitative metrics (PE ratio, revenue growth, SMA) via AlphaVantage.
3. **Web Researcher Agent:** Uses Tavily to scrape real-time news, sentiment, and market context.
4. **Overview Agent:** Synthesizes the core business model and value proposition.
5. **Competitor Agent:** Maps the competitive landscape and industry threats.
6. **Risk Agent:** Identifies regulatory, operational, and macroeconomic red flags.
7. **Verdict & Synthesis Agent:** Consolidates all gathered context, applying a strict Zod schema to enforce a final structured output (INVEST/PASS/WATCH, confidence score 0-100, thesis).

**Communication:** The backend streams the graph's execution progress to the frontend via Server-Sent Events (SSE). This ensures the user isn't left waiting blindly during the 10-30 seconds of heavy AI computation, providing a highly responsive "Live Research" feel.

## Key decisions & trade-offs
- **Gemini 2.0 Flash:** Chose Gemini over Groq/OpenAI for its exceptionally fast time-to-first-token, massive context window, and robust structured output capabilities (crucial for adhering to the Zod schemas).
- **LangGraph over LangChain Chains:** Opted for LangGraph to maintain strict state management. This allows the agents to easily share memory (the `ResearchState`) and execute tasks conditionally (e.g., skipping AlphaVantage if the company is private).
- **Server-Sent Events (SSE) vs WebSockets:** Used SSE for streaming progress updates. It’s significantly lighter and easier to implement than WebSockets for unidirectional server-to-client streaming.
- **Monochrome Design:** Deliberately stepped away from colorful, generic dashboards to implement a sleek, institutional black-and-white aesthetic to convey authority and focus purely on the data.
- **Trade-off - Simple Caching:** Implemented an in-memory cache with a 1-hour TTL to prevent redundant LLM API calls and save costs. In a true production environment, this would be swapped out for Redis.

## Example runs
- **Zomato (Public, NSE):** Successfully identified the ticker, fetched financials, and noted its strong market share in quick-commerce (Blinkit) vs Swiggy. Rendered a WATCH/INVEST verdict depending on recent quarter profitability.
- **Apple (Public, NASDAQ):** Pulled extensive global news sentiment and massive financial data points. Accurately highlighted antitrust risks and iPhone cycle dependencies.
- **Zepto (Private):** Handled gracefully. Bypassed the AlphaVantage financial fetch, relying purely on Tavily web search to pull recent funding rounds and rapid quick-commerce expansion metrics.

## What you would improve with more time
- **Deeper Financial Modeling:** Integrate a DCF (Discounted Cash Flow) agent that attempts to build a rudimentary valuation model based on historical AlphaVantage data.
- **PDF Export:** Allow users to download the final research report as a cleanly formatted PDF.
- **Redis & Database Integration:** Replace in-memory caching with Redis, and use PostgreSQL to store user search history and track portfolio changes over time.
- **Expanded Tooling:** Give the agents access to SEC Edgar filings (10-K, 10-Q) directly for deeper institutional-grade analysis.

## Bonus: LLM Chat Logs
As mandated, the complete, raw IDE chat logs capturing the entire thought process, debugging, and iterative build cycle of this project have been included. 
- You can find them in the `chat-logs` directory of this repository!
