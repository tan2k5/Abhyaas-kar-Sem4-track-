'use client'
import { Subject, supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SidebarProps {
  subjects: Subject[]
  onSelectSubject: (s: Subject) => void
}

export default function Sidebar({ subjects, onSelectSubject }: SidebarProps) {
  const router = useRouter()
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    // 1. Get current local time
    const now = new Date()
    
    // 2. Create "Today" at exactly 00:00:00 local time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // 3. Create "Target" (May 12, 2026) at exactly 00:00:00 local time
    // Note: Month is 0-indexed in JS (January is 0, May is 4)
    const target = new Date(2026, 4, 12) 
    
    // 4. Calculate difference in milliseconds
    const diff = target.getTime() - today.getTime()
    
    // 5. Convert to days
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    setDaysLeft(days > 0 ? days : 0)
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/') 
    }
  }

  return (
    <aside style={sidebarStyle}>
      <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Deadline Card */}
        <div style={deadlineCard}>
          <p className="label-caps" style={{ fontSize: 9, color: 'var(--acc-violet)', marginBottom: 8 }}>MAY 12 DEADLINE</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {/* This will now show 16 days (as of April 26) */}
            <span style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{daysLeft}</span>
            <span className="label-caps" style={{ fontSize: 12, opacity: 0.6 }}>Days</span>
          </div>
        </div>

        {/* Library */}
        <p className="label-caps" style={{ fontSize: 10, marginBottom: 20, opacity: 0.5, letterSpacing: 2 }}>Library</p>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {subjects.map((s) => (
            <button key={s.id} onClick={() => onSelectSubject(s)} style={navBtn}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
            </button>
          ))}

          {/* Logout Styled like Subject Item */}
          <button onClick={handleLogout} style={{ ...navBtn, marginTop: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4d', boxShadow: '0 0 10px rgba(255, 77, 77, 0.3)' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#ff4d4d' }}>LOGOUT</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}

const sidebarStyle: React.CSSProperties = {
  width: 280,
  height: '100vh',
  background: 'rgba(5, 14, 18, 0.6)',
  borderRight: '1px solid var(--border)',
  backdropFilter: 'blur(20px)',
  position: 'sticky',
  top: 0
};

const deadlineCard: React.CSSProperties = {
  background: 'rgba(167, 139, 250, 0.05)',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid rgba(167, 139, 250, 0.1)',
  marginBottom: 40
};

const navBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: 'transparent',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  borderRadius: '12px',
  textAlign: 'left',
  marginBottom: 4
};