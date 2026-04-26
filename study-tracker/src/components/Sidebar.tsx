'use client'
import { Subject, supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, Timer, ClipboardList, LogOut, BookOpen } from 'lucide-react'
import StopWatchModal from '@/components/StopWatchModal'
import SessionLogModal from '@/components/SessionLogModal'

interface SidebarProps {
  subjects: Subject[]
  onSelectSubject: (s: Subject) => void
  isExpanded: boolean
  onToggle: () => void
}

export default function Sidebar({ subjects, onSelectSubject, isExpanded, onToggle }: SidebarProps) {
  const router = useRouter()
  const [showStopwatch, setShowStopwatch] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) router.push('/') 
  }

  return (
    <>
      <aside style={{ ...sidebarStyle, width: isExpanded ? 280 : 72 }} className="sidebar-scroll">
        <div style={innerContainer}>
          
          <button onClick={onToggle} style={menuBtn} title="Toggle Sidebar">
            <Menu size={24} strokeWidth={2.5} color="#FFFFFF" />
          </button>

          <nav style={{ ...navArea, alignItems: isExpanded ? 'flex-start' : 'center' }}> 
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setShowStopwatch(true)} style={navBtn} title="Stopwatch">
                <Timer size={24} strokeWidth={2.5} color="#FFFFFF" style={iconShadow('var(--acc-violet)')} />
                {isExpanded && <span style={btnText}>STOPWATCH</span>}
              </button>

              <button onClick={() => setShowLogs(true)} style={navBtn} title="Session Logs">
                <ClipboardList size={24} strokeWidth={2.5} color="#FFFFFF" style={iconShadow('var(--acc-sky)')} />
                {isExpanded && <span style={btnText}>SESSION LOGS</span>}
              </button>
            </div>

            <div style={divider} />

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subjects.map((s) => (
                <button key={s.id} onClick={() => onSelectSubject(s)} style={navBtn} title={s.name}>
                  <BookOpen size={22} strokeWidth={2.5} color="#FFFFFF" style={iconShadow(s.color)} />
                  {isExpanded && <span style={subjectText}>{s.name}</span>}
                </button>
              ))}
            </div>
          </nav>

          <button onClick={handleLogout} style={logoutBtn} title="Logout">
            <LogOut size={22} strokeWidth={2.5} color="#FF4D4D" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 77, 77, 0.4))' }} />
            {isExpanded && <span style={logoutText}>LOGOUT</span>}
          </button>
        </div>
      </aside>

      {showStopwatch && <StopWatchModal subjects={subjects} onClose={() => setShowStopwatch(false)} />}
      {showLogs && <SessionLogModal subjects={subjects} onClose={() => setShowLogs(false)} />}
    </>
  )
}

const sidebarStyle: React.CSSProperties = { height: '100vh', background: '#050E12', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'fixed', top: 0, left: 0, overflowY: 'auto', overflowX: 'hidden', zIndex: 1000, transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' };
const innerContainer: React.CSSProperties = { padding: '24px 0', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' };
const menuBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', width: '50px', height: '50px', marginBottom: '40px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const navArea: React.CSSProperties = { flex: 1, width: '100%', display: 'flex', flexDirection: 'column', padding: '0 10px' };
const navBtn: React.CSSProperties = { width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '16px', flexShrink: 0 };
const iconShadow = (color: string) => ({ flexShrink: 0, filter: `drop-shadow(0 0 5px ${color}66)` });
const divider = { height: '1px', width: '30px', background: 'rgba(255,255,255,0.1)', margin: '30px auto', flexShrink: 0 };
const btnText = { color: '#FFFFFF', fontWeight: 900, fontSize: 11, letterSpacing: 2, whiteSpace: 'nowrap' as const };
const subjectText = { color: '#FFFFFF', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' as const, opacity: 0.9 };
const logoutBtn = { ...navBtn, marginTop: 'auto', marginBottom: '20px' };
const logoutText = { fontWeight: 900, fontSize: 11, color: '#FF4D4D', letterSpacing: 2 };