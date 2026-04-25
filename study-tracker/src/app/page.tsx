'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) alert(error.message)
      else alert("Check your email for the confirmation link!")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main style={containerStyle}>
      <div style={authCard}>
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 className="font-display" style={logoStyle}>
            Abhyaas<span style={{ color: 'var(--acc-violet)' }}> Karr</span>
          </h1>
          <p className="label-caps" style={subtitleStyle}>
            {isRegistering ? 'CREATE MASTER ACCOUNT' : 'SYSTEM ACCESS'}
          </p>
        </header>

        <form onSubmit={handleAuth} style={{ display: 'grid', gap: 24 }}>
          <div style={inputGroup}>
            <label className="label-caps" style={labelStyle}>INSTITUTIONAL EMAIL</label>
            <input 
              type="email" 
              placeholder="id@apsit.edu.in" 
              style={glassInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div style={inputGroup}>
            <label className="label-caps" style={labelStyle}>ENCRYPTION KEY</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              style={glassInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? 'PROCESSING...' : isRegistering ? 'REGISTER' : 'LOGIN'}
          </button>
        </form>

        <button 
          onClick={() => setIsRegistering(!isRegistering)} 
          style={toggleBtn}
        >
          {isRegistering ? "ALREADY HAVE ACCESS? LOGIN" : "REQUEST ACCESS / REGISTER"}
        </button>
      </div>
    </main>
  )
}

// --- High Fidelity Glassmorphism Styles ---

const containerStyle: React.CSSProperties = {
  width: '100vw', height: '100vh', background: 'var(--bg)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
};

const authCard: React.CSSProperties = {
  width: '100%', maxWidth: 420, padding: '48px',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '40px', border: '1px solid rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(40px)',
  boxShadow: '0 40px 100px rgba(0,0,0,0.6)'
};

const glassInput: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '18px', borderRadius: '16px',
  color: 'white', fontSize: '15px', outline: 'none',
  transition: 'all 0.3s ease',
};

const labelStyle = {
  fontSize: 9, color: 'var(--acc-violet)', fontWeight: 900,
  letterSpacing: '1.5px', marginBottom: 8, paddingLeft: 4
};

const primaryBtn: React.CSSProperties = {
  marginTop: 8, padding: '20px', borderRadius: '16px', border: 'none',
  background: 'var(--acc-violet)', color: 'black',
  fontWeight: 900, fontSize: 12, letterSpacing: 2, cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(167, 139, 250, 0.2)'
};

const toggleBtn: React.CSSProperties = {
  marginTop: 32, width: '100%', background: 'none', border: 'none',
  color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800,
  letterSpacing: 1, cursor: 'pointer', textAlign: 'center'
};

const logoStyle = { fontSize: 56, fontWeight: 900, letterSpacing: '-3px', margin: 0 };
const subtitleStyle = { fontSize: 9, opacity: 0.4, marginTop: 4, letterSpacing: 4 };
const inputGroup = { display: 'flex', flexDirection: 'column' as 'column' };