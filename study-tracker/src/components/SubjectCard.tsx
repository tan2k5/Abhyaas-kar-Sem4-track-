'use client'
import { useState } from 'react'
import { supabase, Topic, TopicStatus, Subject } from '@/lib/supabase'
import ProgressBar from './ProgressBar'

const THEME = {
  violet: '#58355E',
  violetLight: '#7A4D80',
  tea: '#C4D6B0',
  border: 'rgba(88, 53, 94, 0.15)', // Increased visibility
  surface: '#F9FAFB',
  ink: '#111827', // Darker for visibility
  muted: '#4B5563' // Darker for visibility
}

const STATUS_CYCLE: Record<TopicStatus, TopicStatus> = {
  not_started: 'in_progress',
  in_progress: 'finished',
  finished: 'not_started',
}

const STATUS_STYLE: Record<TopicStatus, any> = {
  not_started: { bg: '#F3F4F6', color: '#374151', label: '○ Not Started' },
  in_progress: { bg: '#FEF3C7', color: '#92400E', label: '◑ In Progress' },
  finished: { bg: '#22C55E', color: '#FFFFFF', label: '● Done' }, // Higher contrast for Done
}

export default function SubjectCard({ subject, onUpdate }: { subject: Subject; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Calculate local progress for immediate visual feedback
  const allTopics = subject.chapters.flatMap(c => c.topics)
  const finishedCount = allTopics.filter(t => t.status === 'finished').length
  const progress = allTopics.length ? (finishedCount / allTopics.length) * 100 : 0

  const cycleStatus = async (topic: Topic) => {
    const nextStatus = STATUS_CYCLE[topic.status];

    /* OPTIMISTIC UPDATE:
      We wrap the call in a way that tells the parent to refresh 
      immediately while the DB call runs in the background.
    */
    
    // 1. Instantly update the database (fire and forget for the UI)
    const updatePromise = supabase
      .from('topics')
      .update({ status: nextStatus })
      .eq('id', topic.id);

    // 2. Update local state immediately via the parent's refresh logic
    // This makes the progress bar and labels jump instantly
    topic.status = nextStatus; 
    onUpdate(); 

    // 3. Handle errors silently or log them
    const { error } = await updatePromise;
    if (error) {
      console.error("Failed to update status:", error);
      // Optional: Refresh again to revert to DB state if it failed
      onUpdate(); 
    }
  }

  return (
    <div style={{
      background: 'white', borderRadius: 24, border: `2px solid ${THEME.border}`,
      overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', marginBottom: 24
    }}>
      {/* Header Card */}
      <div style={{
        background: `linear-gradient(135deg, ${THEME.violet} 0%, ${THEME.violetLight} 100%)`,
        padding: '24px', color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 6 }}>
              {subject.short_name}
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '10px 0 0' }}>{subject.name}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: progress === 100 ? '#4ADE80' : 'white' }}>
              {Math.round(progress)}%
            </span>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>COMPLETED</div>
          </div>
        </div>
        <ProgressBar value={progress} color={progress === 100 ? '#4ADE80' : THEME.tea} height={10} />
      </div>

      {/* Chapters List */}
      <div style={{ padding: '8px 0' }}>
        {subject.chapters.map(chapter => (
          <div key={chapter.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
            <button
              onClick={() => setExpanded(e => ({ ...e, [chapter.id]: !e[chapter.id] }))}
              style={{
                width: '100%', background: 'none', border: 'none', padding: '18px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', fontWeight: 800, color: THEME.violet, fontSize: 15
              }}
            >
              <span>{chapter.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ 
                  fontSize: 12, fontWeight: 700, background: '#F3F4F6', color: '#4B5563', 
                  padding: '2px 8px', borderRadius: 20 
                }}>
                  {chapter.topics.filter(t => t.status === 'finished').length} / {chapter.topics.length}
                </span>
                <span style={{ 
                  transform: expanded[chapter.id] ? 'rotate(90deg)' : 'none', 
                  transition: '0.2s', fontSize: 10 
                }}>▶</span>
              </div>
            </button>

            {expanded[chapter.id] && (
              <div style={{ padding: '4px 20px 20px', display: 'grid', gap: 8 }}>
                {chapter.topics.map(topic => (
                  <div key={topic.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', borderRadius: 14, background: THEME.surface,
                    border: `1px solid ${topic.status === 'finished' ? '#BBF7D0' : '#E5E7EB'}`,
                    transition: 'all 0.1s'
                  }}>
                    <span style={{ 
                      fontSize: 14, fontWeight: 600, 
                      color: topic.status === 'finished' ? '#6B7280' : '#111827',
                      textDecoration: topic.status === 'finished' ? 'line-through' : 'none'
                    }}>
                      {topic.name}
                    </span>
                    <button
                      onClick={() => cycleStatus(topic)}
                      style={{
                        padding: '8px 14px', borderRadius: 10, border: 'none',
                        fontSize: 11, fontWeight: 900, cursor: 'pointer',
                        background: STATUS_STYLE[topic.status].bg,
                        color: STATUS_STYLE[topic.status].color,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'transform 0.1s active:scale-95'
                      }}
                    >
                      {STATUS_STYLE[topic.status].label}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}