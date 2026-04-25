'use client'
interface Props {
  value: number
  color?: string
  height?: number
  showPct?: boolean
}
export default function ProgressBar({ value, color = 'var(--acc-violet)', height = 7, showPct = false }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <div style={{ flex: 1, background: 'rgba(113,131,153,0.2)', borderRadius: height, height, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(value, 100)}%`, height: '100%',
          background: color, borderRadius: height,
          transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 10px ${color}55`,
        }} />
      </div>
      {showPct && (
        <span style={{ fontFamily: 'DM Mono', fontSize: 13, color, minWidth: 36, textAlign: 'right', fontWeight: 500 }}>
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}