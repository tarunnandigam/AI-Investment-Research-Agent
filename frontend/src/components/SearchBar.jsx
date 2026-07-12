import { useState, useRef } from 'react';

const SUGGESTIONS = [
  { label: 'Zomato', tag: 'NSE' },
  { label: 'Zepto', tag: 'Private' },
  { label: 'Reliance Industries', tag: 'NSE' },
  { label: 'Nvidia', tag: 'NASDAQ' },
  { label: 'Apple', tag: 'NASDAQ' },
  { label: 'Swiggy', tag: 'NSE' },
];

export default function SearchBar({ onSearch, isLoading, compact = false }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSearch(value.trim());
      setFocused(false);
    }
  }

  function handleSuggestion(label) {
    setValue(label);
    onSearch(label);
    setFocused(false);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="search-wrapper rounded-[14px]">
          <div
            className={`relative z-10 flex items-center gap-2 rounded-[13px] ${compact ? 'px-2 py-1.5' : 'px-4 py-3'}`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Search icon */}
            {!compact && (
              <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <svg className="w-4 h-4" style={{ color: '#ffffff' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
            )}

            {/* Input */}
            <input
              ref={inputRef}
              id="company-search-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Search any company — Zomato, Apple, Reliance..."
              disabled={isLoading}
              autoComplete="off"
              spellCheck="false"
              className={`flex-1 bg-transparent outline-none font-medium disabled:opacity-50 disabled:cursor-not-allowed ${compact ? 'text-xs' : 'text-base'}`}
              style={{ color: 'var(--text-primary)', caretColor: '#ffffff', minWidth: compact ? '80px' : 'auto' }}
            />

            {/* Clear */}
            {value && !isLoading && (
              <button
                type="button"
                onClick={() => { setValue(''); inputRef.current?.focus(); }}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--border)' }} />

            {/* Submit Button */}
            <button
              id="research-submit-btn"
              type="submit"
              disabled={isLoading || !value.trim()}
              className={`btn-primary flex-shrink-0 flex items-center gap-2.5 rounded-[10px] font-semibold ${compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'}`}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Analysing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  <span>Research</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Suggestions — hidden in compact mode */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSuggestion(s.label)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              {s.label}
              <span className="text-[10px] opacity-60">{s.tag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
