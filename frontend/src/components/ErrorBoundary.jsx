import React from 'react'
import i18n from '../i18n'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b', fontSize: 13 }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 15 }}>{i18n.t('errorBoundary.title')}</h3>
          <p style={{ margin: 0 }}>{i18n.t('errorBoundary.message')}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: 15, padding: '6px 12px', background: 'white', border: '1.5px solid #ef4444', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#ef4444' }}
          >
            {i18n.t('errorBoundary.retry')}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
