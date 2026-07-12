import { useEffect, useRef } from 'react';

const STEPS = [
  { id: 'classifying',  label: 'Classify',    shortLabel: 'Classify',   icon: '🔍' },
  { id: 'financials',   label: 'Financials',  shortLabel: 'Finance',    icon: '📊' },
  { id: 'overview',     label: 'Overview',    shortLabel: 'Overview',   icon: '🏢' },
  { id: 'competition',  label: 'Competition', shortLabel: 'Compete',    icon: '⚔️'  },
  { id: 'risks',        label: 'Risks',       shortLabel: 'Risks',      icon: '⚠️'  },
  { id: 'synthesizing', label: 'Synthesis',   shortLabel: 'Synth',      icon: '🧠' },
  { id: 'deciding',     label: 'Verdict',     shortLabel: 'Verdict',    icon: '⚖️'  },
];

function StepNode({ step, status }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${status === 'pending' ? 'opacity-35' : 'opacity-100'}`}>
      {/* Circle */}
      <div className={`
        w-9 h-9 rounded-full flex items-center justify-center relative z-10 flex-shrink-0
        transition-all duration-300
        ${status === 'done'    ? 'bg-invest/20 border border-invest/40' :
          status === 'active'  ? 'bg-accent/20 border border-accent/60 shadow-[0_0_12px_rgba(99,102,241,0.4)]' :
                                 'border border-border bg-bg-card'}
      `}>
        {status === 'done' ? (
          <svg className="w-4 h-4 text-invest" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : status === 'active' ? (
          <span className="text-sm animate-spin-slow">{step.icon}</span>
        ) : (
          <span className="text-sm grayscale">{step.icon}</span>
        )}
        {/* Active ping */}
        {status === 'active' && (
          <span className="absolute inset-0 rounded-full border border-accent/30 animate-ping opacity-50" />
        )}
      </div>

      {/* Label */}
      <span className={`text-[10px] font-semibold text-center leading-tight
        ${status === 'done'   ? 'text-invest' :
          status === 'active' ? 'text-accent' :
                                'text-text-muted'}
      `}
        style={{ color: status === 'done' ? 'var(--invest)' : status === 'active' ? 'var(--accent)' : 'var(--text-muted)' }}>
        {step.shortLabel}
      </span>
    </div>
  );
}

export default function AgentProgress({ steps, activeSteps, latestMessage }) {
  const doneCount = steps.size;
  const totalCount = STEPS.length;
  const progressPercent = Math.round((doneCount / totalCount) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-up">
      {/* Top bar — status + percentage */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <svg className="w-4 h-4 animate-spin-slow" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Running AI Pipeline</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{doneCount} of {totalCount} stages complete</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{progressPercent}<span className="text-sm font-normal ml-0.5" style={{ color: 'var(--text-secondary)' }}>%</span></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-4" style={{ background: 'var(--border)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #6366f1, #00c896)',
            }}
          />
        </div>

        {/* Horizontal Steps */}
        <div className="flex items-start justify-between gap-1 overflow-x-auto pb-1">
          {STEPS.map((step, idx) => {
            const isDone   = steps.has(step.id);
            const isActive = !isDone && activeSteps?.has(step.id);
            const status   = isDone ? 'done' : isActive ? 'active' : 'pending';

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <StepNode step={step} status={status} />
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1 mt-[-18px] rounded-full transition-all duration-500
                      ${isDone ? 'opacity-100' : 'opacity-20'}`}
                    style={{ background: isDone ? 'var(--invest)' : 'var(--border)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live message */}
      {latestMessage && (
        <div className="card px-4 py-3 flex items-start gap-3 animate-fade-up">
          <div className="live-dot mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {latestMessage}
          </p>
        </div>
      )}

      {/* Step details — list */}
      <div className="mt-4 space-y-2">
        {STEPS.map((step) => {
          const isDone   = steps.has(step.id);
          const isActive = !isDone && activeSteps?.has(step.id);
          if (!isDone && !isActive) return null;

          return (
            <div
              key={step.id}
              className="card flex items-center gap-3 px-4 py-2.5 animate-slide-right"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                ${isDone ? 'bg-invest/20' : 'bg-accent/20'}`}>
                {isDone ? (
                  <svg className="w-3 h-3" style={{ color: 'var(--invest)' }} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                )}
              </div>
              <span className="text-sm font-medium flex-1" style={{ color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                {step.label}
              </span>
              <span className="text-[10px] font-mono font-bold"
                style={{ color: isDone ? 'var(--invest)' : 'var(--accent)' }}>
                {isDone ? 'DONE' : 'RUNNING'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
