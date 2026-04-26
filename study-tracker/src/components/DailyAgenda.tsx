'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase, AgendaSlot, Subject } from '@/lib/supabase'

interface Props { subjects: Subject[]; onUpdate?: () => void }

const SLOT_META = [
  { label: 'MORNING',   color: 'var(--acc-violet)', bg: 'rgba(196, 181, 253, 0.05)', border: 'rgba(196, 181, 253, 0.2)' },
  { label: 'AFTERNOON', color: 'var(--acc-sky)',    bg: 'rgba(125, 211, 252, 0.05)', border: 'rgba(125, 211, 252, 0.2)' },
  { label: 'EVENING',   color: 'var(--acc-rose)',   bg: 'rgba(253, 164, 175, 0.05)', border: 'rgba(253, 164, 175, 0.2)' },
  { label: 'CUSTOM',    color: '#94a3b8',           bg: 'rgba(148, 163, 184, 0.05)', border: 'rgba(148, 163, 184, 0.2)' },
]

export default function DailyAgenda({ subjects, onUpdate }: Props) {
  const [slots, setSlots] = useState<Record<string, (AgendaSlot | null)[]>>({})
  const [editing, setEditing] = useState<{ date: string; idx: number } | null>(null)
  const [targetDateStr, setTargetDateStr] = useState('')
  
  // View Modes
  const [viewMode, setViewMode] = useState<'timeline' | 'history'>('timeline')
  const [weekOffset, setWeekOffset] = useState(0) 
  
  // Form States
  const [formSubject, setFormSubject] = useState('')
  const [formChapter, setFormChapter] = useState('')
  const [formTopic, setFormTopic] = useState('') 
  const [customNote, setCustomNote] = useState('') 
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('study-os-target')
    setTargetDateStr(saved || '2026-05-12')
  }, [])

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }

  const getWeekRangeLabel = () => {
    const start = new Date()
    start.setDate(start.getDate() - (start.getDay() || 7) + 1 + (weekOffset * 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${formatDateLabel(start.toISOString())} - ${formatDateLabel(end.toISOString())}`
  }

  const load = async () => {
    if (!targetDateStr) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let daysArr: string[] = []
    const now = new Date()
    // Midnight Start Fix: Ensures we start strictly at 00:00:00 today
    let temp = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (viewMode === 'timeline') {
      const [ty, tm, td] = targetDateStr.split('-').map(Number)
      const targetDate = new Date(ty, tm - 1, td)
      
      const diffTime = targetDate.getTime() - temp.getTime()
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1)
      
      for(let i=0; i < diffDays; i++) {
        const y = temp.getFullYear()
        const m = String(temp.getMonth() + 1).padStart(2, '0')
        const d = String(temp.getDate()).padStart(2, '0')
        daysArr.push(`${y}-${m}-${d}`)
        temp.setDate(temp.getDate() + 1)
      }
    } else {
      // HISTORY: Monday to Sunday window
      temp.setDate(temp.getDate() - (temp.getDay() || 7) + 1 + (weekOffset * 7))
      for(let i=0; i < 7; i++) {
        const y = temp.getFullYear()
        const m = String(temp.getMonth() + 1).padStart(2, '0')
        const d = String(temp.getDate()).padStart(2, '0')
        daysArr.push(`${y}-${m}-${d}`)
        temp.setDate(temp.getDate() + 1)
      }
    }

    const { data } = await supabase.from('agenda_slots').select('*').eq('user_id', user.id).in('slot_date', daysArr)
    
    const newMap: Record<string, (AgendaSlot | null)[]> = {}
    daysArr.forEach(d => { newMap[d] = [null, null, null, null] }) 

    if (data) {
      data.forEach((s: any) => {
        if (newMap[s.slot_date]) newMap[s.slot_date][s.slot_index] = s
      })
    }
    setSlots(newMap)
  }

  useEffect(() => { load() }, [targetDateStr, subjects, viewMode, weekOffset])

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const finalTopicLabel = customNote.trim() !== '' ? customNote : formTopic

    const { error } = await supabase.from('agenda_slots').upsert({ 
      user_id: user.id,
      slot_date: editing.date, 
      slot_index: editing.idx, 
      subject_id: formSubject || null, 
      topic_label: finalTopicLabel || null 
    }, { onConflict: 'user_id,slot_date,slot_index' })
    
    if (!error) { 
      await load()
      onUpdate?.()
      setEditing(null)
      setCustomNote('')
    }
    setSaving(false)
  }

  const orderedDates = Object.keys(slots).sort()

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={headerLayout}>
        <div>
          <h2 style={headerTitle}>{viewMode === 'timeline' ? 'UPCOMING' : 'ARCHIVE'}</h2>
          <div style={pillToggle}>
             <button onClick={() => { setViewMode('timeline'); setWeekOffset(0); }} style={pillBtn(viewMode === 'timeline')}>Timeline</button>
             <button onClick={() => setViewMode('history')} style={pillBtn(viewMode === 'history')}>History</button>
          </div>
        </div>
        
        {viewMode === 'timeline' ? (
          <button onClick={() => {
            const userInput = prompt("Set Target Deadline (YYYY-MM-DD):", targetDateStr)
            if (userInput) {
              localStorage.setItem('study-os-target', userInput)
              setTargetDateStr(userInput)
            }
          }} style={smallBtnStyle}>SET TARGET</button>
        ) : (
          <div style={navGroup}>
             <button onClick={() => setWeekOffset(p => p - 1)} style={arrowBtn}>←</button>
             <span style={weekRangeTxt}>{getWeekRangeLabel()}</span>
             <button onClick={() => setWeekOffset(p => p + 1)} style={arrowBtn}>→</button>
          </div>
        )}
      </div>

      <div className="custom-scrollbar" style={timelineWrapper}>
        {orderedDates.map((ds) => (
          <div key={ds} style={dayCard}>
            <div style={dayHeader}>
              <div style={dateText}>
                {ds === new Date().toISOString().split('T')[0] ? `✨ TODAY (${formatDateLabel(ds)})` : formatDateLabel(ds)}
              </div>
            </div>
            <div style={{ padding: '20px', display: 'grid', gap: 12 }}>
              {SLOT_META.map((sm, idx) => {
                const slot = slots[ds]?.[idx]
                const subj = subjects.find(s => s.id === slot?.subject_id)
                return (
                  <div key={idx} onClick={() => { 
                    setEditing({ date: ds, idx })
                    setFormSubject(slot?.subject_id || '')
                    setFormTopic(slot?.topic_label || '')
                    setCustomNote(slot?.topic_label || '')
                  }}
                    style={{ 
                      padding: '16px', borderRadius: 22, cursor: 'pointer', 
                      background: slot ? `${subj?.color || '#ffffff'}10` : sm.bg, 
                      border: `1px solid ${slot ? (subj?.color || sm.border) : sm.border}` 
                    }}>
                    <div className="label-caps" style={{ fontSize: 9, color: slot ? (subj?.color || sm.color) : sm.color, marginBottom: 6, fontWeight: 900 }}>{sm.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{slot ? (subj?.name || "CUSTOM") : '+ SCHEDULE'}</div>
                    {slot?.topic_label && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4, color: 'white' }}>{slot.topic_label}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Plan Session</h3>
            <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
              <select value={formSubject} onChange={e => setFormSubject(e.target.value)} style={inputStyle as any}>
                <option value="">Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <textarea placeholder="Specific topic or task..." value={customNote} onChange={e => setCustomNote(e.target.value)} style={inputStyle as any} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEditing(null)} style={cancelBtn}>Cancel</button>
              <button onClick={save} disabled={saving} style={confirmBtn}>
                {saving ? 'SAVING...' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Style Objects ---
const pillToggle = { display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 100, marginTop: 12, width: 'fit-content' };
const pillBtn = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', border: 'none', borderRadius: 100, fontSize: 10, fontWeight: 900, cursor: 'pointer',
  background: active ? 'white' : 'transparent', color: active ? 'black' : 'rgba(255,255,255,0.4)', transition: '0.2s'
});
const navGroup = { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' };
const weekRangeTxt = { fontSize: 10, fontWeight: 900, color: '#8b5cf6', letterSpacing: 1 };
const arrowBtn = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, opacity: 0.6 };
const headerLayout: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 };
const headerTitle: React.CSSProperties = { margin: 0, fontWeight: 900, fontSize: 32, color: 'white' };
const timelineWrapper: React.CSSProperties = { display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 24 };
const dayCard: React.CSSProperties = { minWidth: 280, background: 'rgba(255,255,255,0.02)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' };
const dayHeader: React.CSSProperties = { padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const dateText: React.CSSProperties = { fontWeight: 800, color: 'white', fontSize: 14 };
const inputStyle = { width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', minHeight: 60 };
const smallBtnStyle: React.CSSProperties = { padding: '10px 18px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#8b5cf6', borderRadius: '12px', fontSize: '10px', fontWeight: 900, cursor: 'pointer', letterSpacing: 1 };
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalCard: React.CSSProperties = { background: '#0a0a0a', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: 460, border: '1px solid rgba(255,255,255,0.1)' };
const confirmBtn: React.CSSProperties = { flex: 2, padding: 18, background: 'white', border: 'none', color: 'black', fontWeight: 900, borderRadius: 16, cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { flex: 1, padding: 18, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 16, cursor: 'pointer' };