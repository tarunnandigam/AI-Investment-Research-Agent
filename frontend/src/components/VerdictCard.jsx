import { useEffect, useState } from 'react';

function ConfidenceRing({ confidence, color }) {
  const [animated, setAnimated] = useState(0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(confidence), 200);
    return () => clearTimeout(t);
  }, [confidence]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="46" cy="46" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="confidence-ring"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-display text-white">{confidence}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">Very High</span>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className="text-sm font-bold text-white mb-1">Confidence</p>
        <p className="text-xs text-neutral-400 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Medium Term (6-18mo)
        </p>
      </div>
    </div>
  );
}

export default function VerdictCard({ report }) {
  const { verdict, confidence, reasoning, companyName, isPublic, ticker, metrics } = report;
  
  // In a monochrome theme, we use white/grey variations
  const vColor = verdict === 'INVEST' ? '#ffffff' : verdict === 'PASS' ? '#a3a3a3' : '#d4d4d4';
  
  const mSentiment  = metrics?.sentiment       || 'Neutral';
  const mMarketPos  = metrics?.marketPosition  || 'Analyzing';
  const mHealth     = metrics?.financialHealth || 'Unknown';

  // Join reasoning for the thesis
  const thesisText = (reasoning || []).join(' ');

  return (
    <div className="animate-scale-in">
      
      {/* Top Header: Company Name & Logo */}
      <div className="mb-6 flex items-center gap-4">
         <h1 className="text-4xl font-display font-extrabold text-white tracking-tight">
           {companyName}
         </h1>
      </div>
      <div className="flex items-center gap-3 mb-8">
         <span className="text-xl font-bold text-neutral-300">{ticker || companyName}</span>
         <span className="px-3 py-1 rounded-full text-xs font-medium border border-neutral-800 text-neutral-400">
           {isPublic ? 'Public Company' : 'Private Company'}
         </span>
         <span className="text-xs text-neutral-500 flex items-center gap-1">
           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           Analyzed just now
         </span>
      </div>

      {/* Metric Stat Cards (Horizontal Row) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'FINANCIAL HEALTH', val: '50', icon: '〰️', col: '#00c896' },
          { label: 'NEWS SENTIMENT', val: '60', icon: '📰', col: '#8b5cf6' },
          { label: 'RISK PROFILE', val: '60', icon: '⚠️', col: '#ff4d4f' },
          { label: 'INVESTMENT SCORE', val: '67', icon: '🎯', col: '#3b82f6' },
        ].map((m, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
             {/* Fake circular gauge */}
             <div className="relative w-12 h-12 flex-shrink-0">
               <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                 <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                 <circle cx="18" cy="18" r="15.915" fill="none" stroke={m.col} strokeWidth="3" strokeDasharray={`${m.val}, 100`} />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                 {m.val}
               </div>
             </div>
             <div>
               <div className="text-[10px] font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                 <span>{m.icon}</span> {m.label}
               </div>
               <div className="mt-1 h-1 w-16 bg-neutral-800 rounded-full overflow-hidden">
                 <div className="h-full rounded-full" style={{ width: `${m.val}%`, background: m.col }} />
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Pane: Verdict */}
        <div className="card p-8 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Verdict</p>
          <h2 className="text-5xl font-display font-extrabold text-white mb-8 tracking-tight" style={{ color: verdict === 'WATCH' ? '#fbbf24' : '#ffffff' }}>
            {verdict}
          </h2>
          
          <ConfidenceRing confidence={confidence} color={vColor} />
          
          <div className="mt-8 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-left text-xs text-neutral-400 leading-relaxed">
            <span className="text-blue-400 mr-1">◎</span>
            Based on the latest financial data and market trends, the AI has determined a <strong>{verdict}</strong> stance with {confidence}% confidence.
          </div>
        </div>

        {/* Right Pane: Investment Thesis */}
        <div className="card p-8 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-yellow-500">💡</span> Investment Thesis
          </h3>
          <div className="text-sm text-neutral-300 leading-[1.8] space-y-4">
            <p>
              {thesisText || "Our AI agents are compiling the investment thesis..."}
            </p>
            {mMarketPos && (
              <p>
                <strong>Market Context:</strong> {mMarketPos}
              </p>
            )}
            {mHealth && (
              <p>
                <strong>Financial Context:</strong> {mHealth}
              </p>
            )}
            {mSentiment && (
              <p>
                <strong>Sentiment Context:</strong> {mSentiment}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
