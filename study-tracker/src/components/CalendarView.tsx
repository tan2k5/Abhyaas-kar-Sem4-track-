'use client'
import { useEffect, useState } from 'react'
import { supabase, TodoItem } from '@/lib/supabase'

const EXAM_DATE = new Date('2026-05-12')

export default function CalendarView() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [today] = useState(new Date())
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  useEffect(() => {
    supabase.from('todos').select('*').then(({ data }) => { if (data) setTodos(data) })
  }, [])

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const todosByDate: Record<string, TodoItem[]> = {}
  todos.forEach(t => {
    if (!todosByDate[t.due_date]) todosByDate[t.due_date] = []
    todosByDate[t.due_date].push(t)
  })

  const toDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const isToday = (d: number) => {
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year
  }

  const isExamDay = (d: number) => {
    return EXAM_DATE.getDate() === d && EXAM_DATE.getMonth() === month && EXAM_DATE.getFullYear() === year
  }

  const daysUntilExam = Math.ceil((EXAM_DATE.getTime() - today.getTime()) / 86400000)
  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 12px rgba(88,53,94,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: 3, color: 'var(--muted)', marginBottom: 4 }}>
              SCHEDULE
            </p>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 20, color: 'var(--violet)' }}>
              {MONTHS[month]} {year}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {daysUntilExam > 0 && (
              <span style={{
                fontFamily: 'DM Mono', fontSize: 10, letterSpacing: 1,
                background: 'var(--surface)', color: 'var(--violet)',
                padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)',
              }}>
                {daysUntilExam}d to exam
              </span>
            )}
            <button onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 }}>‹</button>
            <button onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 }}>›</button>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '12px 16px 0' }}>
        {DAYS.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontFamily: 'DM Mono', fontSize: 10, letterSpacing: 1,
            color: 'var(--muted)', padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '4px 16px 16px', gap: 2 }}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = toDateStr(day)
          const dayTodos = todosByDate[dateStr] || []
          const hasTodos = dayTodos.length > 0
          const hasIncomplete = dayTodos.some(t => !t.completed)
          const allDone = hasTodos && !hasIncomplete

          return (
            <div key={day} style={{
              aspectRatio: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              position: 'relative',
              cursor: hasTodos ? 'pointer' : 'default',
              background: isExamDay(day)
                ? 'var(--violet)'
                : isToday(day)
                ? 'var(--tea)'
                : 'transparent',
              border: isToday(day) ? '2px solid var(--tea-dark)' : '2px solid transparent',
            }}>
              <span style={{
                fontFamily: 'DM Mono',
                fontSize: 12,
                fontWeight: isToday(day) || isExamDay(day) ? 500 : 400,
                color: isExamDay(day) ? 'white' : isToday(day) ? 'var(--violet-dark)' : 'var(--ink)',
              }}>
                {day}
              </span>
              {hasTodos && (
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', marginTop: 2,
                  background: allDone ? 'var(--tea-dark)' : 'var(--warn)',
                }} />
              )}
              {isExamDay(day) && (
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', fontFamily: 'DM Mono' }}>EXAM</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        {[
          { color: 'var(--tea)', label: 'Today' },
          { color: 'var(--warn)', label: 'Pending tasks' },
          { color: 'var(--tea-dark)', label: 'Done' },
          { color: 'var(--violet)', label: 'Exam' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
            <span style={{ fontFamily: 'DM Mono', fontSize: 9, letterSpacing: 1, color: 'var(--muted)' }}>
              {l.label.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}