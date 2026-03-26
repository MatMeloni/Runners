import { useState, useEffect } from 'react'

import DashboardHeader from './components/DashboardHeader.jsx'
import MetricsDisplay from './components/MetricsDisplay.jsx'
import { API_BASE } from './config/api.js'

export default function App() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/metrics`)
      if (!res.ok) throw new Error('Falha ao carregar métricas')
      const data = await res.json()
      setMetrics(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <DashboardHeader />

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Carregando…' : 'Carregar métricas'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
          {error} — Verifique se a API está rodando em {API_BASE || 'http://localhost:8000'}.
        </p>
      )}

      <MetricsDisplay metrics={metrics} />
    </div>
  )
}
