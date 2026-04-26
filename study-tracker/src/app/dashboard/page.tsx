'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, Subject } from '@/lib/supabase'
import DailyAgenda from '@/components/DailyAgenda'
import SubjectPanel from '@/components/SubjectPanel'
import Sidebar from '@/components/Sidebar'

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  
  // NEW: State to manage sidebar expansion
  const [isExpanded, setIsExpanded] = useState(false)

  const refreshData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: progData } = await supabase
      .from('user_topic_progress')
      .select('topic_id, status')
      .eq('user_id', user.id)

    const progMap: Record<string, string> = {}
    progData?.forEach(p => { progMap[p.topic_id] = p.status })

    const { data: subData } = await supabase
      .from('subjects')
      .select('*, chapters(*, topics(*))')
      .order('name')

    const enriched = (subData || []).map(s => ({
      ...s,
      chapters: (s.chapters || []).map((c: any) => ({
        ...c,
        topics: (c.topics || []).map((t: any) => ({
          ...t,
          status: progMap[t.id] || 'not_started' 
        }))
      }))
    }))

    setSubjects(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { refreshData() }, [refreshData])

  const inProgressTopics = subjects.flatMap(s => 
    s.chapters.flatMap(c => 
      c.topics.filter(t => t.status === 'in_progress').map(t => ({ 
        ...t, subjectName: s.short_name, color: s.color || 'var(--acc-violet)' 
      }))
    )
  )

  const finishedChapters = subjects.flatMap(s => 
    s.chapters.filter(c => c.topics.length > 0 && c.topics.every(t => t.status === 'finished'))
      .map(c => ({ 
        ...c, subjectName: s.short_name, color: s.color || 'var(--acc-green)' 
      }))
  )

  if (loading) return <div style={{ background: 'var(--bg)', height: '100vh' }} />

  return (
    <main style={mainContainer}>
      {/* SIDEBAR - Now takes isExpanded and onToggle props */}
      <Sidebar 
        subjects={subjects} 
        onSelectSubject={(s: Subject) => setSelectedSubject(s)} 
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      {/* CONTENT WRAPPER - Margin now reacts to isExpanded */}
      <div 
        className="custom-scrollbar" 
        style={{
          ...contentWrapper,
          marginLeft: isExpanded ? '280px' : '70px',
          width: isExpanded ? 'calc(100vw - 280px)' : 'calc(100vw - 70px)'
        }}
      >
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>DASHBOARD</h1>
            <p className="label-caps" style={{ fontSize: 9, opacity: 0.5, letterSpacing: '2px' }}>System Active / Tanushree</p>
          </div>
          <div style={badgeStyle}>LIVE SESSION</div>
        </header>
        
        {/* Stats Grid */}
        <div style={statsGrid}>
          {subjects.map(s => {
            const allT = s.chapters.flatMap(c => c.topics)
            const done = allT.filter(t => t.status === 'finished').length
            const pct = allT.length ? Math.round((done / allT.length) * 100) : 0
            return (
              <div key={s.id} style={{ ...statCard, borderLeft: `4px solid ${s.color}` }}>
                <p className="label-caps" style={{ fontSize: 10, opacity: 0.6, marginBottom: 8 }}>{s.short_name}</p>
                <h2 style={{ fontSize: 28, fontWeight: 900 }}>{pct}%</h2>
                <div style={progressBar(s.color, pct)} />
              </div>
            )
          })}
        </div>

        {/* Progress Section */}
        <div style={twoColGrid}>
          <div style={panelCard}>
            <h3 className="label-caps" style={{ color: 'var(--acc-amber)', marginBottom: 24, fontSize: 11 }}>◑ In Progress</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {inProgressTopics.slice(0, 4).map((t, i) => (
                <div key={i} style={rowItem}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                  <span style={{ fontSize: 9, color: t.color, fontWeight: 900, background: `${t.color}15`, padding: '4px 8px', borderRadius: 6 }}>{t.subjectName}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={panelCard}>
            <h3 className="label-caps" style={{ color: 'var(--acc-green)', marginBottom: 24, fontSize: 11 }}>● Completed</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {finishedChapters.slice(0, 4).map((c, i) => (
                <div key={i} style={rowItem}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--acc-green)' }}>{c.name}</span>
                  <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900 }}>{c.subjectName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Agenda */}
        <div style={{ marginTop: 40 }}>
           <DailyAgenda subjects={subjects} onUpdate={refreshData} />
        </div>
      </div>

      {selectedSubject && (
        <SubjectPanel 
          subject={selectedSubject} 
          onClose={() => setSelectedSubject(null)} 
          onUpdate={refreshData} 
        />
      )}
    </main>
  )
}

// --- Enhanced Styles ---
const mainContainer: React.CSSProperties = { 
  display: 'flex', 
  height: '100vh', 
  width: '100vw', 
  background: 'var(--bg)', 
  overflow: 'hidden' 
};

const contentWrapper: React.CSSProperties = { 
  flex: 1, 
  padding: '60px 80px 150px', 
  overflowY: 'auto',
  transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
};

const headerStyle = { 
  marginBottom: 60, 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start' 
};

const badgeStyle = {
  padding: '8px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '100px',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1,
  color: 'var(--acc-violet)'
};

const statsGrid = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
  gap: 24, 
  marginBottom: 60 
};

const statCard = { 
  padding: '30px', 
  background: 'rgba(255,255,255,0.02)', 
  borderRadius: '24px', 
  border: '1px solid var(--border)',
  position: 'relative' as const,
  overflow: 'hidden' as const
};

const progressBar = (color: string, pct: number) => ({
  position: 'absolute' as const,
  bottom: 0,
  left: 0,
  height: '3px',
  width: `${pct}%`,
  background: color,
  boxShadow: `0 0 10px ${color}`
});

const twoColGrid = { 
  display: 'grid', 
  gridTemplateColumns: '1fr 1fr', 
  gap: 32, 
  marginBottom: 60 
};

const panelCard = { 
  padding: '40px', 
  background: 'rgba(255,255,255,0.01)', 
  borderRadius: '32px', 
  border: '1px solid var(--border)',
  backdropFilter: 'blur(10px)'
};

const rowItem = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  padding: '16px 0', 
  borderBottom: '1px solid rgba(255,255,255,0.03)' 
};