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
      {/* SIDEBAR - Kept separate from main scroll */}
      <Sidebar 
        subjects={subjects} 
        onSelectSubject={(s: Subject) => setSelectedSubject(s)} 
      />

      <div className="custom-scrollbar" style={contentWrapper}>
        {/* Header */}
        <header style={headerStyle}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 900 }}>DASHBOARD</h1>
          <p className="label-caps" style={{ fontSize: 9, opacity: 0.5 }}>Tan is the best</p>
        </header>
        
        {/* Stats Grid */}
        <div style={statsGrid}>
          {subjects.map(s => {
            const allT = s.chapters.flatMap(c => c.topics)
            const done = allT.filter(t => t.status === 'finished').length
            const pct = allT.length ? Math.round((done / allT.length) * 100) : 0
            return (
              <div key={s.id} style={{ ...statCard, borderLeft: `4px solid ${s.color}` }}>
                <p className="label-caps" style={{ fontSize: 10, opacity: 0.6 }}>{s.short_name}</p>
                <h2 style={{ fontSize: 28, fontWeight: 900 }}>{pct}%</h2>
              </div>
            )
          })}
        </div>

        {/* Progress Section */}
        <div style={twoColGrid}>
          <div style={panelCard}>
            <h3 className="label-caps" style={{ color: 'var(--acc-amber)', marginBottom: 20 }}>◑ In Progress</h3>
            {inProgressTopics.slice(0, 4).map((t, i) => (
              <div key={i} style={rowItem}>
                <span style={{ fontWeight: 700 }}>{t.name}</span>
                <span style={{ fontSize: 9, color: t.color, fontWeight: 900 }}>{t.subjectName}</span>
              </div>
            ))}
          </div>

          <div style={panelCard}>
            <h3 className="label-caps" style={{ color: 'var(--acc-green)', marginBottom: 20 }}>● Completed</h3>
            {finishedChapters.slice(0, 4).map((c, i) => (
              <div key={i} style={rowItem}>
                <span style={{ fontWeight: 700, color: 'var(--acc-green)' }}>{c.name}</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900 }}>{c.subjectName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Agenda till May 20 */}
        <DailyAgenda subjects={subjects} onUpdate={refreshData} />
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

// Styles
const mainContainer: React.CSSProperties = { display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg)', overflow: 'hidden' };
const contentWrapper: React.CSSProperties = { flex: 1, padding: '40px 60px 150px', overflowY: 'auto' };
const headerStyle = { marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 40 };
const statCard = { padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid var(--border)' };
const twoColGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 };
const panelCard = { padding: 32, background: 'var(--surface)', borderRadius: 28, border: '1px solid var(--border)' };
const rowItem = { display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' };