import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

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
      <h1 style={{ marginBottom: '0.5rem' }}>Runners — Dashboard</h1>
      <p style={{ color: '#71717a', marginBottom: '2rem' }}>
        Monitoramento em tempo real da biomecânica de corrida
      </p>

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

      {metrics && (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Métricas</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <MetricCard title="Cadência" value={metrics.cadence_steps_per_min} unit="passos/min" />
            <MetricCard title="GCT" value={metrics.ground_contact_time_s} unit="s" />
            <MetricCard title="Distância" value={metrics.distance_m} unit="m" />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Ângulos (joelho, quadril, tronco)</h3>
            <pre
              style={{
                background: '#18181b',
                padding: '1rem',
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 14,
              }}
            >
              {JSON.stringify(metrics.angles || {}, null, 2)}
            </pre>
          </div>
          <p style={{ color: '#71717a', fontSize: 14 }}>
            Placeholder para vídeo ao vivo ou último frame (integrar WebSocket em seguida).
          </p>
        </>
      )}
    </div>
  )
}

function MetricCard({ title, value, unit }) {
  return (
    <div
      style={{
        background: '#18181b',
        padding: '1rem',
        borderRadius: 8,
        border: '1px solid #27272a',
      }}
    >
      <div style={{ color: '#71717a', fontSize: 12, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>
        {value != null ? value : '—'} {unit}
      </div>
    </div>
  )
}
