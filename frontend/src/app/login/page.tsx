'use client'
import { useState, useEffect, useCallback } from 'react'
import { useOrgSettings } from '@/lib/orgSettings'
import PoweredBy from '@/lib/PoweredBy'

// Rate limit: max 5 attempts per 10 min window (per session)
const RATE_KEY    = 'shq_login_attempts'
const RATE_LIMIT  = 5
const RATE_WINDOW = 10 * 60 * 1000

function checkRateLimit(): { allowed: boolean; remaining: number; resetMs: number } {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter(t => now - t < RATE_WINDOW)
    const remaining = RATE_LIMIT - data.attempts.length
    const oldest = data.attempts[0]
    const resetMs = oldest ? RATE_WINDOW - (now - oldest) : 0
    return { allowed: remaining > 0, remaining, resetMs }
  } catch {
    return { allowed: true, remaining: RATE_LIMIT, resetMs: 0 }
  }
}

function recordAttempt() {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter(t => now - t < RATE_WINDOW)
    data.attempts.push(now)
    sessionStorage.setItem(RATE_KEY, JSON.stringify(data))
  } catch {}
}

function formatMs(ms: number) {
  const min = Math.ceil(ms / 60000)
  return min <= 1 ? '1 minute' : `${min} minutes`
}

export default function LoginPage() {
  const { settings, loading: settingsLoading } = useOrgSettings()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [rateLock, setRateLock] = useState(false)
  const [resetIn,  setResetIn]  = useState(0)

  // Check if already logged in
  useEffect(() => {
    const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('sanctuaryhq_session='))
    if (hasCookie) {
      const stored = sessionStorage.getItem('shq_user')
      if (stored) { window.location.href = '/dashboard'; return }
    }
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'session_expired') {
      setError('Your session expired. Please sign in again.')
    }
  }, [])

  // Rate lock countdown
  useEffect(() => {
    if (!rateLock) return
    const { resetMs } = checkRateLimit()
    setResetIn(resetMs)
    const t = setInterval(() => {
      const { allowed, resetMs: ms } = checkRateLimit()
      if (allowed) { setRateLock(false); setError(''); setResetIn(0); clearInterval(t) }
      else setResetIn(ms)
    }, 5000)
    return () => clearInterval(t)
  }, [rateLock])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const rate = checkRateLimit()
    if (!rate.allowed) {
      setRateLock(true)
      setError(`Too many attempts. Please wait ${formatMs(rate.resetMs)}.`)
      return
    }

    const trimEmail = email.trim().toLowerCase()
    if (!trimEmail || !password) { setError('Please enter your email and password.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) { setError('Enter a valid email address.'); return }

    setLoading(true)
    recordAttempt()

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) throw new Error('App is not configured. Contact your administrator.')

      const supabase = createClient(url, key)
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: trimEmail, password })

      if (authErr || !data?.session) {
        const msg = authErr?.message || 'Sign in failed'
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
          setError('Incorrect email or password.')
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email before signing in.')
        } else {
          setError(msg)
        }
        setLoading(false)
        return
      }

      const { data: worker, error: wErr } = await supabase
        .from('workers')
        .select('id,email,full_name,role,status,branch_key,department,avatar_url')
        .eq('email', trimEmail)
        .single()

      if (wErr || !worker) {
        await supabase.auth.signOut()
        setError('Your account is not set up yet. Contact your administrator.')
        setLoading(false)
        return
      }

      if (worker.status === 'inactive') {
        await supabase.auth.signOut()
        setError('Your account is inactive. Contact your administrator.')
        setLoading(false)
        return
      }

      // Generate cryptographically secure session token
      const tokenBytes = new Uint8Array(32)
      crypto.getRandomValues(tokenBytes)
      const sessionToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      sessionStorage.setItem('shq_user', JSON.stringify({
        id: worker.id, email: worker.email, name: worker.full_name,
        role: worker.role, branch_key: worker.branch_key,
        department: worker.department, avatar_url: worker.avatar_url,
      }))

      // Set cookie with Secure flag on HTTPS
      const expires = new Date(Date.now() + 30 * 60 * 1000).toUTCString()
      const isSecure = location.protocol === 'https:'
      document.cookie = `sanctuaryhq_session=${sessionToken}; path=/; expires=${expires}; SameSite=Lax${isSecure ? '; Secure' : ''}`

      try { sessionStorage.removeItem(RATE_KEY) } catch {}
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }, [email, password])

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, paddingLeft: 34, paddingRight: 12,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--r)', color: 'white', fontSize: 13.5, outline: 'none',
    transition: 'border-color .15s, box-shadow .15s', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, var(--dark) 0%, #0f2d1a 50%, var(--dark) 100%)',
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(22,101,52,0.25) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }}/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--brand) 0%, #22c55e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 12px 40px rgba(22,101,52,0.5)',
          }}>
            {!settingsLoading && settings.logoUrl
              ? <img src={settings.logoUrl} alt="logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}/>
              : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="28" height="28">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
            }
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,5vw,28px)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
            {settingsLoading ? 'SanctuaryHQ' : (settings.appName || 'SanctuaryHQ')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, letterSpacing: '-0.01em' }}>
            {settingsLoading ? '' : (settings.tagline || 'Church Workforce Management')}
          </p>
          {!settingsLoading && settings.name && settings.name !== 'My Church' && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12.5, marginTop: 4, fontWeight: 600 }}>{settings.name}</p>
          )}
        </div>

        {/* Form card */}
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r-xl)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>Sign in to your account</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Workforce management portal</div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>

            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--r)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style={{ fontSize: 12.5, color: '#fca5a5', lineHeight: 1.5 }}>
                  {error}
                  {rateLock && resetIn > 0 && <div style={{ marginTop: 4, opacity: 0.7 }}>Resets in ~{formatMs(resetIn)}</div>}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" width="14" height="14"
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input id="email" type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@church.org"
                  disabled={loading || rateLock}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='rgba(34,197,94,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(34,197,94,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" width="14" height="14"
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading || rateLock}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => { e.target.style.borderColor='rgba(34,197,94,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(34,197,94,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                    {showPw
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || rateLock || !email || !password}
              style={{
                width: '100%', height: 44, marginTop: 4,
                background: (loading || rateLock) ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                border: 'none', borderRadius: 'var(--r)', color: 'white',
                fontSize: 14, fontWeight: 700, cursor: (loading || rateLock) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .15s', letterSpacing: '-0.01em',
                boxShadow: (loading || rateLock) ? 'none' : '0 4px 20px rgba(22,163,74,0.35)',
              }}>
              {loading ? (
                <>
                  <svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Signing in…
                </>
              ) : rateLock ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Too many attempts
                </>
              ) : (
                <>
                  Sign in
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.7 }}>
            Access is managed by your church administrator.<br/>
            Contact them if you need an account or to reset your password.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem', position: 'relative', zIndex: 1 }}>
        <PoweredBy dark={false}/>
      </div>
    </div>
  )
}
