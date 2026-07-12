import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card p-6 text-center"
          style={{ border: '1px solid rgba(255,77,79,0.25)', background: 'rgba(255,77,79,0.05)' }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--pass)' }}>Render Error</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error?.message || 'Something went wrong rendering this section.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-ghost mt-3 px-4 py-1.5 text-xs"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
