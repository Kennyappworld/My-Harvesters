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
      try { sessionStorage.removeItem('shq_user') } catch {}
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

      // Set cookie with Secure flag on HTTPS, SameSite=Lax, 64-char hex token
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

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#06090f',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* ── Background decorations ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Gold glow top-right */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)',
        }}/>
        {/* Blue glow bottom-left */}
        <div style={{
          position: 'absolute', bottom: '-120px', left: '-120px',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(56,130,246,0.04) 0%, transparent 65%)',
        }}/>
        {/* Vertical center line */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '50%',
          width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.06) 30%, rgba(201,168,76,0.06) 70%, transparent)',
        }}/>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>

        {/* ── Logo & App Name ── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: '#111827',
            border: '1px solid rgba(201,168,76,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 32px rgba(201,168,76,0.14), 0 2px 8px rgba(0,0,0,0.5)',
            animation: 'glow-pulse 3s ease-in-out infinite',
            overflow: 'hidden',
          }}>
            {!settingsLoading && settings.logoUrl
              ? <img src={settings.logoUrl} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }}/>
              : <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" width="30" height="30">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
            }
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(24px, 5vw, 30px)',
            fontWeight: 600,
            color: '#e8edf5',
            letterSpacing: '0.01em',
            lineHeight: 1.1,
            margin: 0,
          }}>
            {settingsLoading ? 'SanctuaryHQ' : (settings.appName || 'SanctuaryHQ')}
          </h1>

          <p style={{ color: '#7a8fa8', fontSize: 13, marginTop: 7, letterSpacing: '0.01em' }}>
            {settingsLoading ? '' : (settings.tagline || 'Church Workforce Management')}
          </p>

          {!settingsLoading && settings.name && settings.name !== 'My Church' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10,
              background: 'rgba(201,168,76,0.07)',
              border: '1px solid rgba(201,168,76,0.16)',
              borderRadius: 99, padding: '3px 10px',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 6px rgba(201,168,76,0.5)' }}/>
              <span style={{ color: '#c9a84c', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.01em' }}>{settings.name}</span>
            </div>
          )}
        </div>

        {/* ── Form Card ── */}
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(13,20,36,0.80)',
          border: '1px solid #1e2d45',
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}>

          {/* Card header */}
          <div style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid #1e2d45',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.01em' }}>
                Sign in to your account
              </div>
              <div style={{ fontSize: 11.5, color: '#4a6080', marginTop: 2 }}>
                Workforce management portal
              </div>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            }}/>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>

            {/* Error alert */}
            {error && (
              <div style={{
                padding: '10px 13px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.20)',
                display: 'flex', gap: 9, alignItems: 'flex-start',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style={{ fontSize: 12.5, color: '#fca5a5', lineHeight: 1.55 }}>
                  {error}
                  {rateLock && resetIn > 0 && (
                    <div style={{ marginTop: 3, opacity: 0.7, fontSize: 11.5 }}>Resets in ~{formatMs(resetIn)}</div>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: 10.5, fontWeight: 600,
                color: '#7a8fa8',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                marginBottom: 7,
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4a6080" strokeWidth="1.8" width="14" height="14"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading || rateLock}
                  style={{
                    width: '100%', height: 44, paddingLeft: 36, paddingRight: 12,
                    background: '#0d1424',
                    border: '1px solid #1e2d45',
                    borderRadius: 10,
                    color: '#e8edf5',
                    fontSize: 13.5,
                    outline: 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: 'border-color .15s, box-shadow .15s',
                    boxSizing: 'border-box',
                    opacity: (loading || rateLock) ? 0.5 : 1,
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = '#1e2d45'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <label htmlFor="password" style={{
                display: 'block',
                fontSize: 10.5, fontWeight: 600,
                color: '#7a8fa8',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Password
              </label>
                <a href="/forgot-password" style={{ fontSize: 11, color: '#c9a84c', textDecoration: 'none', fontWeight: 600, opacity: 0.85 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4a6080" strokeWidth="1.8" width="14" height="14"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading || rateLock}
                  style={{
                    width: '100%', height: 44, paddingLeft: 36, paddingRight: 44,
                    background: '#0d1424',
                    border: '1px solid #1e2d45',
                    borderRadius: 10,
                    color: '#e8edf5',
                    fontSize: 13.5,
                    outline: 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: 'border-color .15s, box-shadow .15s',
                    boxSizing: 'border-box',
                    opacity: (loading || rateLock) ? 0.5 : 1,
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = '#1e2d45'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4a6080', padding: 3,
                    transition: 'color .12s',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#7a8fa8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a6080')}
                >
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
            <button
              type="submit"
              disabled={loading || rateLock || !email || !password}
              style={{
                width: '100%', height: 46, marginTop: 2,
                background: (loading || rateLock || !email || !password)
                  ? 'rgba(201,168,76,0.25)'
                  : 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                border: '1px solid ' + ((loading || rateLock || !email || !password) ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.40)'),
                borderRadius: 10,
                color: (loading || rateLock || !email || !password) ? 'rgba(201,168,76,0.5)' : '#06090f',
                fontSize: 14, fontWeight: 700,
                cursor: (loading || rateLock || !email || !password) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .15s',
                letterSpacing: '-0.01em',
                boxShadow: (loading || rateLock || !email || !password)
                  ? 'none'
                  : '0 4px 20px rgba(201,168,76,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              onMouseEnter={e => {
                if (!loading && !rateLock && email && password) {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,168,76,0.40), inset 0 1px 0 rgba(255,255,255,0.15)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = (!loading && !rateLock && email && password)
                  ? '0 4px 20px rgba(201,168,76,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Signing in…
                </>
              ) : rateLock ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Too many attempts
                </>
              ) : (
                <>
                  Sign In
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer note inside card */}
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid #1e2d45',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#4a6080" strokeWidth="1.8" width="12" height="12" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: 11, color: '#4a6080', lineHeight: 1.5 }}>
              Access is managed by your administrator. Contact them for accounts or password resets.
            </span>
          </div>
        </div>

        {/* Powered by */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <PoweredBy dark />
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(201,168,76,0.14), 0 2px 8px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 8px 40px rgba(201,168,76,0.35), 0 2px 8px rgba(0,0,0,0.5); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0d1424 inset !important;
          -webkit-text-fill-color: #e8edf5 !important;
        }
      `}</style>
    </div>
  )
}
