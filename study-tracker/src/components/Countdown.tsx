'use client'
import { useEffect, useState } from 'react'

const EXAM = new Date('2026-05-12T09:00:00')

export default function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = EXAM.getTime() - Date.now()
      if (diff <= 0) return
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      background: 'rgba(14,45,57,0.8)',
      border: '1px solid rgba(196,181,253,0.2)',
      borderRadius: 16,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at top right, rgba(196,181,253,0.1), transparent 60%)',
        pointerEvents: 'none',
      }} />
      <p className="label-caps" style={{ marginBottom: 12, color: 'var(--lavender)', opacity: 0.7 }}>
        Exam Day · May 12
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ v: t.d, l: 'DAYS' }, { v: t.h, l: 'HRS' }, { v: t.m, l: 'MIN' }, { v: t.s, l: 'SEC' }].map(u => (
          <div key={u.l} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              background: 'rgba(59,94,107,0.5)',
              border: '1px solid rgba(166,169,182,0.2)',
              borderRadius: 10,
              padding: '10px 4px',
              fontFamily: 'DM Mono',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--lavender)',
              lineHeight: 1,
              marginBottom: 5,
            }}>
              {String(u.v).padStart(2, '0')}
            </div>
            <span className="label-caps" style={{ fontSize: 9 }}>{u.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}