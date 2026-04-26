'use client'
import { useState, useEffect } from 'react'
import { Subject, supabase } from '@/lib/supabase'
import { Trash2, X, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface Props { subjects: Subject[]; onClose: () => void }

export default function SessionLogModal({ subjects, onClose }: Props) {
  const [view, setView] = useState<'today' | 'weekly'>('today')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  // Manual Form States
  const [showAdd, setShowAdd] = useState(false)
  const [manualSub, setManualSub] = useState('')
  const [manualStart, setManualStart] = useState('09:00')
  const [manualEnd, setManualEnd] = useState('10:00')
  const [manualNote, setManualNote] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [view, weekOffset])

  const fetchLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase.from('study_sessions').select('*, subjects(name, color)')
    
    if (view === 'today') {
      const todayStr = new Date().toISOString().split('T')[0]
      query = query.gte('created_at', `${todayStr}T00:00:00.000Z`)
                   .lte('created_at', `${todayStr}T23:59:59.999Z`)
    } else {
      const start = new Date()
      start.setDate(start.getDate() - (start.getDay() || 7) + 1 + (weekOffset * 7))
      const end = new Date(start)
      end.setDate(end.getDate() + 6)

      query = query.gte('created_at', `${start.toISOString().split('T')[0]}T00:00:00.000Z`)
                   .lte('created_at', `${end.toISOString().split('T')[0]}T23:59:59.999Z`)
    }

    const { data } = await query.order('created_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('study_sessions').delete().eq('id', id)
    if (!error) {
      setLogs(prev => prev.filter(log => log.id !== id))
    }
  }

  const handleManualAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [sh, sm] = manualStart.split(':').map(Number)
    const [eh, em] = manualEnd.split(':').map(Number)
    const duration = ((eh * 60 + em) - (sh * 60 + sm)) * 60
    if (duration <= 0) return alert("Timing error")

    const { error } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject_id: manualSub || null,
      duration_seconds: duration,
      start_time: manualStart,
      end_time: manualEnd,
      note: manualNote,
      created_at: new Date().toISOString()
    })
    if (!error) { setShowAdd(false); setManualNote(''); fetchLogs(); }
  }

  const getWeekRangeLabel = () => {
    const start = new Date()
    start.setDate(start.getDate() - (start.getDay() || 7) + 1 + (weekOffset * 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  }

  const totalHrs = (logs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0) / 3600).toFixed(1)

  return (
    <div style={overlay}>
      <div style={glassCard}>
        <div style={header}>
          <div style={pillToggle}>
            <button onClick={() => setView('today')} style={pillBtn(view === 'today')}>Today</button>
            <button onClick={() => setView('weekly')} style={pillBtn(view === 'weekly')}>Weekly</button>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={20} color="white" /></button>
        </div>

        <div style={statBar}>
          <div>
            <span style={statLabel}>{view === 'today' ? "TODAY'S INTENSITY" : "WEEKLY MOMENTUM"}</span>
            <span style={statValue}>{totalHrs} <small style={{fontSize: 14, opacity: 0.4}}>HRS</small></span>
          </div>
          
          {view === 'weekly' ? (
            <div style={paginationGroup}>
              <button onClick={() => setWeekOffset(prev => prev - 1)} style={arrowBtn}><ChevronLeft size={16}/></button>
              <span style={weekLabel}>{getWeekRangeLabel()}</span>
              <button onClick={() => setWeekOffset(prev => prev + 1)} style={arrowBtn}><ChevronRight size={16}/></button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(!showAdd)} style={addBtn}>
              {showAdd ? 'CANCEL' : <><Plus size={14} style={{marginRight: 4}}/> ADD LOG</>}
            </button>
          )}
        </div>

        <div style={scrollArea} className="custom-scrollbar">
          {showAdd && view === 'today' && (
            <div style={formCard}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="time" value={manualStart} onChange={e => setManualStart(e.target.value)} style={input} />
                <input type="time" value={manualEnd} onChange={e => setManualEnd(e.target.value)} style={input} />
              </div>
              <select value={manualSub} onChange={e => setManualSub(e.target.value)} style={input}>
                <option value="">Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <textarea placeholder="Specific topic..." value={manualNote} onChange={e => setManualNote(e.target.value)} style={{...input, height: 60}} />
              <button onClick={handleManualAdd} style={saveBtn}>LOG TO DATABASE</button>
            </div>
          )}

          {logs.map(log => (
            <div key={log.id} style={logCard}>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={cardTop}>
                    <span style={{...subTag, color: log.subjects?.color || '#FFFFFF'}}>{log.subjects?.name || 'General'}</span>
                    <span style={timeRange}>{log.start_time || '00:00'} - {log.end_time || '00:00'}</span>
                  </div>
                  <div style={topicText}>{log.note || 'Deep work session'}</div>
                  <div style={footerRow}>
                    <span style={hourTag}>{(log.duration_seconds / 3600).toFixed(2)} HOURS</span>
                  </div>
                </div>
                
                <button onClick={() => handleDelete(log.id)} style={delBtn} title="Delete Log">
                  <Trash2 size={16} color="#FF4D4D" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Styles preserved and optimized
const overlay: any = { position: 'fixed', inset: 0, background: 'rgba(2, 6, 12, 0.95)', backdropFilter: 'blur(35px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const glassCard: any = { background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', width: '100%', maxWidth: 440, height: '80vh', borderRadius: 40, padding: 32, display: 'flex', flexDirection: 'column' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 };
const pillToggle = { background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 100, display: 'flex' };
const pillBtn = (a: boolean): any => ({ padding: '8px 24px', border: 'none', borderRadius: 100, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: a ? 'white' : 'transparent', color: a ? 'black' : 'rgba(255,255,255,0.4)' });
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const statBar = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' };
const statLabel = { display: 'block', fontSize: 8, fontWeight: 900, color: 'var(--acc-violet)', letterSpacing: 1 };
const statValue = { fontSize: 32, fontWeight: 900, color: 'white' };
const addBtn = { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: 12, fontSize: 10, fontWeight: 900, cursor: 'pointer' };
const paginationGroup = { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' };
const weekLabel = { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const };
const arrowBtn = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.5 };
const scrollArea: any = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 };
const formCard = { background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 10 };
const input = { background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: 12, borderRadius: 12, fontSize: 13, width: '100%' };
const saveBtn = { background: 'white', color: 'black', border: 'none', padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 11, cursor: 'pointer' };
const logCard = { background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' };
const cardTop = { display: 'flex', justifyContent: 'space-between', marginBottom: 8 };
const subTag = { fontSize: 10, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: 1 };
const timeRange = { fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700 };
const topicText = { fontSize: 16, fontWeight: 800, color: 'white', lineHeight: 1.4 };
const footerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 };
const hourTag = { fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 };
const delBtn = { background: 'rgba(255, 77, 77, 0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' };