'use client'
import { useEffect, useState } from 'react'
import { supabase, Subject, TopicStatus } from '@/lib/supabase'

interface Props {
  subject: Subject | null
  onClose: () => void
  onUpdate: () => void
}

const NEXT: Record<TopicStatus, TopicStatus> = {
  not_started: 'in_progress',
  in_progress: 'finished',
  finished: 'not_started',
}

const CHAPTER_ACCENTS = ['#c4b5fd', '#7dd3fc', '#fda4af', '#fcd34d', '#86efac', '#f0abfc']

export default function SubjectPanel({ subject, onClose, onUpdate }: Props) {
  const [userProgress, setUserProgress] = useState<Record<string, string>>({})
  const [openChapter, setOpenChapter] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    if (subject) {
      fetchProgress()
      if (subject.chapters?.[0]) setOpenChapter(subject.chapters[0].id)
    }
  }, [subject?.id])

  const fetchProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !subject) return
    
    const { data } = await supabase
      .from('user_topic_progress')
      .select('topic_id, status')
      .eq('user_id', user.id)

    const map: Record<string, string> = {}
    data?.forEach(p => { map[p.topic_id] = p.status })
    setUserProgress(map)
  }

  // Inside SubjectPanel...

const toggleStatus = async (topicId: string, current: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  setToggling(topicId)
  const nextStatus = NEXT[current as TopicStatus] || 'in_progress'

  // Update Supabase
  const { error } = await supabase.from('user_topic_progress').upsert({
    user_id: user.id,
    topic_id: topicId,
    status: nextStatus
  }, { onConflict: 'user_id,topic_id' })

  if (!error) {
    // 1. Update local UI state immediately for speed
    setUserProgress(prev => ({ ...prev, [topicId]: nextStatus }))
    
    // 2. Trigger the parent Dashboard to refresh its bars and counts
    onUpdate() 
  }
  setToggling(null)
}

  if (!subject) return null

  return (
    <>
      {/* Blurred Overlay */}
      <div 
        onClick={onClose} 
        className="anim-fade-in" 
        style={overlayStyle} 
      />

      {/* Slide-out Panel */}
      <div className="custom-scrollbar anim-slide-right" style={panelStyle}>
        
        {/* Header Area */}
        <div style={{ ...headerArea, borderBottom: `2px solid ${subject.color}20` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="label-caps" style={{ color: subject.color, fontSize: 10 }}>{subject.short_name}</span>
            <button onClick={onClose} style={closeBtn}>✕</button>
          </div>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{subject.name}</h2>
        </div>

        {/* Chapters Section */}
        <div style={{ padding: '32px' }}>
          {subject.chapters.map((ch, i) => {
            const accent = CHAPTER_ACCENTS[i % CHAPTER_ACCENTS.length]
            const isOpen = openChapter === ch.id
            
            return (
              <div key={ch.id} style={{ 
                marginBottom: 16, 
                borderRadius: 24, 
                overflow: 'hidden', 
                border: `1px solid ${isOpen ? accent : 'var(--border)'}`,
                background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent'
              }}>
                <button 
                  onClick={() => setOpenChapter(isOpen ? null : ch.id)} 
                  style={chapterHeader}
                >
                  <span style={{ fontWeight: 800, color: isOpen ? 'white' : 'var(--text-dim)' }}>
                    {i + 1}. {ch.name}
                  </span>
                  <span style={{ fontSize: 12 }}>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px' }}>
                    {ch.topics.map(t => {
                      const status = userProgress[t.id] || 'not_started'
                      const isFinished = status === 'finished'
                      const isProgress = status === 'in_progress'

                      return (
                        <button 
                          key={t.id} 
                          onClick={() => toggleStatus(t.id, status)}
                          disabled={toggling === t.id}
                          style={{
                            ...topicRow,
                            background: isFinished ? 'var(--acc-violet)' : 'rgba(255,255,255,0.03)',
                            color: isFinished ? 'black' : 'white',
                            borderColor: isFinished ? 'var(--acc-violet)' : 'rgba(255,255,255,0.05)',
                            opacity: toggling === t.id ? 0.5 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              ...statusDot,
                              background: isFinished ? 'black' : isProgress ? '#FCD34D' : 'transparent',
                              borderColor: isFinished ? 'black' : isProgress ? '#FCD34D' : 'var(--text-dim)'
                            }} />
                            <span style={{ 
                              fontWeight: 700, 
                              fontSize: 14,
                              textDecoration: isFinished ? 'line-through' : 'none'
                            }}>
                              {t.name}
                            </span>
                          </div>
                          <span className="label-caps" style={{ fontSize: 8, fontWeight: 900 }}>
                            {status.replace('_', ' ')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// --- STYLES ---

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(5, 14, 18, 0.9)',
  backdropFilter: 'blur(12px)',
  zIndex: 400
}

const panelStyle: React.CSSProperties = {
  position: 'fixed', right: 0, top: 0,
  height: '100vh',
  width: 'min(520px, 92vw)',
  background: 'var(--surface)',
  borderLeft: '1px solid var(--border)',
  zIndex: 401,
  overflowY: 'auto'
}

const headerArea: React.CSSProperties = {
  padding: '48px 40px 32px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
}

const closeBtn = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  color: 'white',
  width: 32, height: 32,
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 12
}

const chapterHeader: React.CSSProperties = {
  width: '100%',
  padding: '24px',
  background: 'none',
  border: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  textAlign: 'left'
}

const topicRow: React.CSSProperties = {
  width: '100%',
  padding: '16px 20px',
  marginBottom: '8px',
  borderRadius: '16px',
  border: '1px solid',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  textAlign: 'left'
}

const statusDot = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2px solid',
  transition: 'all 0.2s'
}