'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase, AgendaSlot, Subject } from '@/lib/supabase'

interface Props { subjects: Subject[]; onUpdate?: () => void }

const SLOT_META = [
  { label: 'MORNING',   color: 'var(--acc-violet)', bg: 'rgba(196, 181, 253, 0.05)', border: 'rgba(196, 181, 253, 0.2)' },
  { label: 'AFTERNOON', color: 'var(--acc-sky)',    bg: 'rgba(125, 211, 252, 0.05)', border: 'rgba(125, 211, 252, 0.2)' },
  { label: 'EVENING',   color: 'var(--acc-rose)',   bg: 'rgba(253, 164, 175, 0.05)', border: 'rgba(253, 164, 175, 0.2)' },
]

export default function DailyAgenda({ subjects, onUpdate }: Props) {
  const [slots, setSlots] = useState<Record<string, (AgendaSlot | null)[]>>({})
  const [editing, setEditing] = useState<{ date: string; idx: number } | null>(null)
  
  // Form States
  const [formSubject, setFormSubject] = useState('')
  const [formChapter, setFormChapter] = useState('')
  const [formTopic, setFormTopic] = useState('')
  const [saving, setSaving] = useState(false)

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  const selectableChapters = useMemo(() => {
    const selected = subjects.find(s => s.id === formSubject)
    return selected ? selected.chapters : []
  }, [formSubject, subjects])

  const selectableTopics = useMemo(() => {
    const selected = selectableChapters.find(c => c.id === formChapter)
    return selected ? selected.topics : []
  }, [formChapter, selectableChapters])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use local time to ensure "Today" is accurate to your timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(2026, 4, 20); // May 20, 2026 (Month is 0-indexed, so 4 is May)
    
    const daysArr: string[] = [];
    let temp = new Date(today);
    
    // Safety check: if today is already past May 20, just show today
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    
    for(let i=0; i < diffDays; i++) {
      // Manual YYYY-MM-DD string to avoid ISO UTC shifting issues
      const y = temp.getFullYear();
      const m = String(temp.getMonth() + 1).padStart(2, '0');
      const d = String(temp.getDate()).padStart(2, '0');
      daysArr.push(`${y}-${m}-${d}`);
      
      temp.setDate(temp.getDate() + 1);
    }

    const { data } = await supabase
      .from('agenda_slots')
      .select('*')
      .eq('user_id', user.id) 
      .in('slot_date', daysArr);
    
    const map: Record<string, (AgendaSlot | null)[]> = {};
    daysArr.forEach(d => { map[d] = [null, null, null] });
    (data || []).forEach((s: any) => {
      if (map[s.slot_date]) map[s.slot_date][s.slot_index] = s;
    });
    setSlots(map);
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { alert("Please login"); return; }

    const { error } = await supabase.from('agenda_slots').upsert({ 
      user_id: user.id,
      slot_date: editing.date, 
      slot_index: editing.idx, 
      subject_id: formSubject || null, 
      topic_label: formTopic || null 
    }, { onConflict: 'user_id,slot_date,slot_index' });
    
    if (!error) { await load(); onUpdate?.(); setEditing(null); }
    setSaving(false);
  }

  const orderedDates = Object.keys(slots).sort();

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="custom-scrollbar" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 24 }}>
        {orderedDates.map((ds) => (
          <div key={ds} style={{ minWidth: 260, background: 'var(--surface)', borderRadius: 28, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 14 }}>
                {ds === new Date().toISOString().split('T')[0] ? `✨ TODAY (${formatDateLabel(ds)})` : formatDateLabel(ds)}
              </div>
            </div>
            <div style={{ padding: '16px', display: 'grid', gap: 12 }}>
              {SLOT_META.map((sm, idx) => {
                const slot = slots[ds][idx];
                const subj = subjects.find(s => s.id === slot?.subject_id);
                return (
                  <div key={idx} onClick={() => { setEditing({ date: ds, idx }); setFormSubject(slot?.subject_id || ''); setFormChapter(''); setFormTopic(slot?.topic_label || ''); }}
                    style={{ padding: '16px', borderRadius: 20, cursor: 'pointer', background: slot ? `${subj?.color}10` : sm.bg, border: `1px solid ${slot ? subj?.color : sm.border}` }}>
                    <div className="label-caps" style={{ fontSize: 9, color: slot ? subj?.color : sm.color, marginBottom: 6 }}>{sm.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{slot ? subj?.name : '+ SCHEDULE'}</div>
                    {slot?.topic_label && <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>{slot.topic_label}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,14,18,0.9)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface2)', padding: 40, borderRadius: 32, width: '100%', maxWidth: 440, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Schedule Session</h3>
            <div style={{ display: 'grid', gap: 20, marginBottom: 30 }}>
              <select value={formSubject} onChange={e => {setFormSubject(e.target.value); setFormChapter(''); setFormTopic('')}} style={inputStyle}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={formChapter} onChange={e => {setFormChapter(e.target.value); setFormTopic('')}} disabled={!formSubject} style={inputStyle}>
                <option value="">Select Chapter</option>
                {selectableChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={formTopic} onChange={e => setFormTopic(e.target.value)} disabled={!formChapter} style={inputStyle}>
                <option value="">Select Topic</option>
                {selectableTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEditing(null)} style={{ flex: 1, padding: 15, background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: 12 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ flex: 2, padding: 15, background: 'var(--acc-violet)', border: 'none', color: 'black', fontWeight: 800, borderRadius: 12 }}>
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white' };