import MetricCard from './MetricCard.jsx'

export default function MetricsDisplay({ metrics }) {
  if (!metrics) return null

  return (
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
  )
}
