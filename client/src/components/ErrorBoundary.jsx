import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#0a0e17', color: '#e2e8f0', padding: '2rem', textAlign: 'center'
        }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dashboard Error</h1>
          <p style={{ color: '#94a3b8', maxWidth: '400px', marginBottom: '1.5rem' }}>
            An unexpected error occurred in the dashboard. This has been logged for review.
          </p>
          <code style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
            padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#f87171', maxWidth: '500px',
            overflow: 'auto', marginBottom: '1.5rem', display: 'block'
          }}>
            {this.state.error?.message || 'Unknown error'}
          </code>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600'
            }}
          >
            <RefreshCw size={16} /> Reload Dashboard
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
