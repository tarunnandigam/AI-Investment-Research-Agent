import { useState, useRef, useCallback } from 'react';
import SearchBar from './components/SearchBar.jsx';
import AgentProgress from './components/AgentProgress.jsx';
import VerdictCard from './components/VerdictCard.jsx';
import ReportSections from './components/ReportSections.jsx';
import NotFoundCard from './components/NotFoundCard.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

const STATUS = {
  IDLE:        'idle',
  LOADING:     'loading',
  COMPLETE:    'complete',
  INSUFFICIENT:'insufficient_data',
  ERROR:       'error',
};

const STATS = [
  { value: '7', label: 'AI Agents', icon: '🤖' },
  { value: '3×', label: 'Faster via Parallel', icon: '⚡' },
  { value: '1hr', label: 'Cache TTL', icon: '💾' },
  { value: '100%', label: 'Real-time Data', icon: '🌐' },
];

const FEATURES = [
  {
    icon: '🔍',
    title: 'Live Web Research',
    desc: 'Tavily AI aggregates real-time market intelligence across thousands of sources.',
  },
  {
    icon: '🧠',
    title: 'Multi-Agent Pipeline',
    desc: '7 specialised agents work in parallel — classify, research, synthesise, decide.',
  },
  {
    icon: '📊',
    title: 'Financial Intelligence',
    desc: 'Alpha Vantage + LLM analysis delivers institutional-grade financial insights.',
  },
  {
    icon: '⚖️',
    title: 'Verdict Engine',
    desc: 'Zod-validated INVEST / PASS / WATCH verdicts with confidence scoring.',
  },
];

export default function App() {
  const [status, setStatus]               = useState(STATUS.IDLE);
  const [report, setReport]               = useState(null);
  const [errorMsg, setErrorMsg]           = useState('');
  const [insufficientData, setInsufficient] = useState(null);
  const [searchedCompany, setSearchedCompany] = useState('');
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeSteps, setActiveSteps]     = useState(new Set());
  const [latestMessage, setLatestMessage] = useState('');

  const eventSourceRef = useRef(null);

  const reset = useCallback(() => {
    setStatus(STATUS.IDLE);
    setReport(null);
    setErrorMsg('');
    setInsufficient(null);
    setCompletedSteps(new Set());
    setActiveSteps(new Set());
    setLatestMessage('');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const handleSearch = useCallback(async (companyName) => {
    reset();
    setSearchedCompany(companyName);
    setStatus(STATUS.LOADING);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      });

      if (response.status === 429) {
        setStatus(STATUS.ERROR);
        setErrorMsg('Too many requests. Please wait 10 seconds and try again.');
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setStatus(STATUS.ERROR);
        setErrorMsg(errData.error || `Server error: ${response.status}`);
        return;
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const orderedSteps = ['classifying','financials','research','overview','competition','risks','synthesizing','deciding'];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const msg of messages) {
          if (!msg.trim()) continue;

          const lines = msg.split('\n');
          let eventType = 'message';
          let dataStr   = '';

          for (const line of lines) {
            if (line.startsWith('event: '))      eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr   = line.slice(6).trim();
          }
          if (!dataStr) continue;

          let data;
          try { data = JSON.parse(dataStr); } catch { continue; }

          if (eventType === 'progress') {
            const step = data.step;
            setLatestMessage(data.message);
            setActiveSteps((prev) => new Set([...prev, step]));

            setCompletedSteps((prev) => {
              const n = new Set(prev);
              if (step === 'financials') n.add('classifying');
              if (['research','overview','competition','risks'].includes(step)) { n.add('classifying'); n.add('financials'); }
              if (step === 'synthesizing') { n.add('classifying'); n.add('financials'); n.add('research'); n.add('overview'); n.add('competition'); n.add('risks'); }
              if (step === 'deciding') { n.add('classifying'); n.add('financials'); n.add('research'); n.add('overview'); n.add('competition'); n.add('risks'); n.add('synthesizing'); }
              return n;
            });

            setActiveSteps((prev) => {
              const n = new Set(prev);
              if (step === 'financials') n.delete('classifying');
              if (step === 'synthesizing') { n.delete('research'); n.delete('overview'); n.delete('competition'); n.delete('risks'); }
              if (step === 'deciding') n.delete('synthesizing');
              return n;
            });

          } else if (eventType === 'complete') {
            setCompletedSteps(new Set(orderedSteps));
            setActiveSteps(new Set());
            setReport(data);
            setStatus(STATUS.COMPLETE);

          } else if (eventType === 'insufficient_data') {
            setCompletedSteps(new Set(orderedSteps));
            setActiveSteps(new Set());
            setInsufficient(data);
            setStatus(STATUS.INSUFFICIENT);

          } else if (eventType === 'error') {
            setStatus(STATUS.ERROR);
            setErrorMsg(data.message || 'An unexpected error occurred.');
          }
        }
      }
    } catch (err) {
      setStatus(STATUS.ERROR);
      setErrorMsg(err.message || 'Failed to connect to the research agent. Is the backend running?');
    }
  }, [reset]);

  const isLoading = status === STATUS.LOADING;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(11,15,26,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <button onClick={reset} className="flex items-center gap-2.5 group" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#ffffff' }}
            >
              <svg className="w-4 h-4" style={{ color: '#000000' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>InvestIQ</span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>AI Research</span>
            </div>
          </button>

          {/* Right pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="live-dot" />
            <span className="text-xs font-semibold" style={{ color: '#ffffff' }}>Live Research</span>
          </div>
        </div>
      </nav>

      {/* ── IDLE: Hero Page ────────────────────────────────────────────── */}
      {status === STATUS.IDLE && (
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 sm:py-28">
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              {/* Two-column layout */}
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                {/* Left Column: Text */}
                <div className="flex-1 text-center lg:text-left">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6 animate-fade-up"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff' }}
                  >
                    <svg className="w-3 h-3 animate-spin-slow" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                    AI-Powered Investment Intelligence
                  </div>

                  <h1
                    className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight mb-5 animate-fade-up"
                    style={{ animationDelay: '80ms', color: 'var(--text-primary)' }}
                  >
                    Institutional <br />
                    Research <br />
                    in Seconds.
                  </h1>

                  <p
                    className="text-base sm:text-lg leading-relaxed mb-8 animate-fade-up"
                    style={{ animationDelay: '160ms', color: 'var(--text-secondary)', maxWidth: '480px' }}
                  >
                    Enter any company. Our 7-agent AI pipeline delivers a clear{' '}
                    <span className="font-bold" style={{ color: 'var(--invest)' }}>INVEST</span>,{' '}
                    <span className="font-bold" style={{ color: 'var(--pass)' }}>PASS</span>, or{' '}
                    <span className="font-bold" style={{ color: 'var(--watch)' }}>WATCH</span>{' '}
                    verdict backed by real-time financial data.
                  </p>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
                    {STATS.map((s) => (
                      <div key={s.label} className="stat-card text-center lg:text-left p-3">
                        <div className="text-xl mb-1 text-white">{s.icon}</div>
                        <div className="text-xl font-bold font-display text-white">{s.value}</div>
                        <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Search Card */}
                <div className="flex-1 w-full lg:max-w-xl animate-fade-up" style={{ animationDelay: '120ms' }}>
                  <div
                    className="card-glass p-7 rounded-2xl relative overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    {/* Subtle corner glow removed */}

                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="live-dot" />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>RESEARCH ENGINE</span>
                      </div>
                      <h2 className="text-lg font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
                        Start your analysis
                      </h2>
                      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                        Search any company — public or private, Indian or global.
                      </p>

                      <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                    </div>
                  </div>

                  {/* Feature pills below search card */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {FEATURES.map((f, i) => (
                      <div
                        key={f.title}
                        className="card p-3.5 animate-fade-up"
                        style={{ animationDelay: `${300 + i * 60}ms` }}
                      >
                        <div className="text-xl mb-1.5">{f.icon}</div>
                        <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ── Non-idle states ───────────────────────────────────────────── */}
      {status !== STATUS.IDLE && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

          {/* Top bar: search again + company name */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Researching
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Analysis Complete
                </div>
              )}
              {searchedCompany && (
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  for <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{searchedCompany}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Inline mini search */}
              {!isLoading && (
                <div className="hidden sm:block w-72">
                  <SearchBar onSearch={handleSearch} isLoading={isLoading} compact />
                </div>
              )}
              <button
                id="new-research-btn"
                onClick={reset}
                className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                New Search
              </button>
            </div>
          </div>

          {/* Loading State */}
          {status === STATUS.LOADING && (
            <AgentProgress
              steps={completedSteps}
              activeSteps={activeSteps}
              latestMessage={latestMessage}
            />
          )}

          {/* Complete State */}
          {status === STATUS.COMPLETE && report && (
            <ErrorBoundary>
              <div className="space-y-5 animate-fade-up">
                <VerdictCard report={report} />
                <ReportSections sections={report.sections} chartData={report.chartData} />

                {/* Sources */}
                {report.sources && report.sources.length > 0 && (
                  <div className="card p-5">
                    <p className="section-label mb-3 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      Sources ({report.sources.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.sources.map((src, i) => {
                        let hostname = src;
                        try { hostname = new URL(src).hostname.replace('www.', ''); } catch {}
                        return (
                          <a
                            key={i}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#818cf8';
                              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                              e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            }}
                          >
                            {hostname}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ErrorBoundary>
          )}

          {/* Insufficient Data */}
          {status === STATUS.INSUFFICIENT && (
            <NotFoundCard
              message={insufficientData?.message}
              companyName={searchedCompany}
              onRetry={reset}
            />
          )}

          {/* Error State */}
          {status === STATUS.ERROR && (
            <div className="flex justify-center animate-fade-up">
              <div className="card p-8 w-full max-w-xl text-center">
                <div
                  className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.25)' }}
                >
                  <svg className="w-7 h-7" style={{ color: 'var(--pass)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Research Failed</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
                <button
                  id="error-retry-btn"
                  onClick={reset}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-5 px-4 mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ⚠️ AI-generated research for informational purposes only — not financial advice.
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Gemini 2.0 Flash · Tavily Search · Alpha Vantage
          </p>
        </div>
      </footer>
    </div>
  );
}
