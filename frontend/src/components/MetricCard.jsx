export default function MetricCard({ title, value, unit }) {
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
