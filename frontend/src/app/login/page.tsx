'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Invalid email or password.'); return }
      // Store access token in memory (sessionStorage for this demo — use React context in production)
      sessionStorage.setItem('hicc_at', data.data.accessToken)
      router.push('/dashboard')
    } catch {
      // Demo mode: allow demo credentials without backend
      if (email === 'pastor@hicc.org' && password === 'demo123') {
        sessionStorage.setItem('hicc_at', 'demo-token')
        router.push('/dashboard')
      } else {
        setError('Unable to connect. Use pastor@hicc.org / demo123 for demo mode.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--s-1)', padding: 24,
    }}>
      {/* Background orbs */}
      <div style={{ position:'fixed', top:'20%', right:'15%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'15%', left:'10%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(15,184,164,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--grad-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 16px', boxShadow: 'var(--sh-brand)',
          }}>✦</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--t-1)' }}>HICC</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-3)', marginTop: 4, letterSpacing: '0.12em' }}>LEADERSHIP PLATFORM</div>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: 32, boxShadow: 'var(--sh-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--t-1)', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 13.5, color: 'var(--t-3)', marginBottom: 28 }}>Sign in to the leadership dashboard</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12.5, color: 'var(--t-2)', fontFamily: 'var(--font-heading)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email address</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="pastor@hicc.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ fontSize: 12.5, color: 'var(--t-2)', fontFamily: 'var(--font-heading)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--red-lt)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-brand"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '12px 24px', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in to dashboard →'}
            </button>
          </form>

          <div className="divider" />

          <div style={{
            padding: '12px 14px', background: 'var(--s-3)', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--t-3)', fontFamily: 'var(--font-heading)', fontWeight: 600, marginBottom: 6 }}>DEMO CREDENTIALS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t-2)' }}>pastor@hicc.org · demo123</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 13, color: 'var(--t-3)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
