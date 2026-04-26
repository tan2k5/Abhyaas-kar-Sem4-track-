'use client'
import { useState, useEffect } from 'react'
import { Subject, supabase } from '@/lib/supabase'

type Props = { subjects: Subject[]; onClose: () => void }

export default function StopWatchModal({ subjects, onClose }: Props) {
  const [mode, setMode] = useState<'up' | 'down'>('up')
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)

  // Session Data
  const [startTime, setStartTime] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [sessionNote, setSessionNote] = useState('')
  const [isWasted, setIsWasted] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused) {
      // Capture start time the moment the button is pressed
      if (!startTime) {
        setStartTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      }
      interval = setInterval(() => {
        setSeconds((s) => (mode === 'down' ? (s > 0 ? s - 1 : 0) : s + 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, isPaused, mode, startTime])

  const saveToSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const endTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        subject_id: selectedSubject || null,
        duration_seconds: seconds,
        start_time: startTime || endTime,
        end_time: endTime,
        note: sessionNote,
        is_wasted: isWasted
      })

      if (error) throw error
      onClose()
    } catch (err: any) {
      alert("Error saving: " + err.message)
    }
  }

  const format = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sc = (s % 60).toString().padStart(2, '0')
    return { h, m, sc }
  }

  const { h, m, sc } = format(seconds)

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={row}>
          <div style={toggle}>
            <button onClick={() => {setMode('up'); setSeconds(0)}} style={tab(mode === 'up')}>UP</button>
            <button onClick={() => {
               const min = prompt("Minutes?", "25");
               if(min) { setSeconds(parseInt(min)*60); setMode('down'); }
            }} style={tab(mode === 'down')}>DOWN</button>
          </div>
          <button onClick={onClose} style={close}>✕</button>
        </div>

        {!showLogForm ? (
          <div style={{ textAlign: 'center' }}>
            <div style={display}>{h}:{m}:{sc}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={() => setIsActive(!isActive)} style={btnMain}>{isActive ? 'PAUSE' : 'START'}</button>
              {isActive && <button onClick={() => {setIsActive(false); setShowLogForm(true)}} style={btnStop}>FINISH</button>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>SESSION LOG</h3>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={input}>
              <option value="">No Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea placeholder="Notes..." value={sessionNote} onChange={e => setSessionNote(e.target.value)} style={{...input, height: 80}} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsWasted(false)} style={statBtn(!isWasted, '#8b5cf6')}>BEST</button>
              <button onClick={() => setIsWasted(true)} style={statBtn(isWasted, '#f43f5e')}>WASTED</button>
            </div>
            <button onClick={saveToSupabase} style={btnSave}>SAVE PROGRESS</button>
          </div>
        )}
      </div>
    </div>
  )
}

// Styles
const overlay: any = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const card: any = { background: '#0a0a0a', border: '1px solid #333', padding: 32, borderRadius: 32, width: '100%', maxWidth: 400, color: 'white' };
const row: any = { display: 'flex', justifyContent: 'space-between', marginBottom: 24 };
const toggle: any = { background: '#1a1a1a', padding: 4, borderRadius: 12, display: 'flex' };
const tab = (a: boolean): any => ({ padding: '6px 12px', border: 'none', borderRadius: 8, background: a ? 'white' : 'transparent', color: a ? 'black' : '#666', fontSize: 10, fontWeight: 800, cursor: 'pointer' });
const close = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 };
const display = { fontSize: 84, fontWeight: 900, letterSpacing: -4 };
const btnMain = { flex: 1, padding: 16, borderRadius: 16, border: 'none', background: 'white', color: 'black', fontWeight: 900, cursor: 'pointer' };
const btnStop = { padding: 16, borderRadius: 16, border: '1px solid #333', background: 'transparent', color: '#f43f5e', fontWeight: 900, cursor: 'pointer' };
const btnSave = { ...btnMain, background: '#8b5cf6', color: 'white' };
const input = { width: '100%', padding: 14, borderRadius: 12, background: '#1a1a1a', border: '1px solid #333', color: 'white' };
const statBtn = (a: boolean, c: string): any => ({ flex: 1, padding: 12, borderRadius: 12, border: a ? `1px solid ${c}` : '1px solid #333', background: a ? `${c}20` : 'transparent', color: a ? c : '#666', fontWeight: 900, fontSize: 10 });