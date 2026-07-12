export default function NotFoundCard({ message, companyName, onRetry }) {
  return (
    <div className="w-full max-w-xl mx-auto animate-fade-up">
      <div className="card p-8 text-center">
        {/* Icon */}
        <div
          className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <svg className="w-8 h-8" style={{ color: 'var(--watch)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-5.428-1.59-1.59" />
          </svg>
        </div>

        <h3 className="text-xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
          Company Not Found
        </h3>

        {companyName && (
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            We searched for{' '}
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>"{companyName}"</span>
            {' '}but couldn't find enough reliable information.
          </p>
        )}

        <div
          className="p-4 rounded-xl text-left mb-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
        >
          {message ? (
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {[
                'The company name may be misspelled or too obscure',
                'It may not have significant online presence',
                'It might be a very early-stage or stealth startup',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--watch)' }} />
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={onRetry}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          Try Another Search
        </button>
      </div>
    </div>
  );
}
