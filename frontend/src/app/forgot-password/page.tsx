'use client'
import { useState, useCallback } from 'react'
import { useOrgSettings } from '@/lib/orgSettings'
import PoweredBy from '@/lib/PoweredBy'

// Rate limit: 3 reset requests per 15 min
const RATE_KEY    = 'shq_reset_attempts'
const RATE_LIMIT  = 3
const RATE_WINDOW = 15 * 60 * 1000

function checkRateLimit() {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter(t => now - t < RATE_WINDOW)
    return { allowed: data.attempts.length < RATE_LIMIT, remaining: RATE_LIMIT - data.attempts.length }
  } catch { return { allowed: true, remaining: RATE_LIMIT } }
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

export default function ForgotPasswordPage() {
  const { settings, loading: settingsLoading } = useOrgSettings()
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimEmail = email.trim().toLowerCase()
    if (!trimEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    const rate = checkRateLimit()
    if (!rate.allowed) {
      setError('Too many reset requests. Please wait 15 minutes and try again.')
      return
    }
    setLoading(true)
    recordAttempt()
    try {
      // Use server-side route — no Supabase keys needed in the browser
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimEmail }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Something went wrong. Please try again.')
      }
      // Always show success — never reveal if email exists (prevents enumeration)
      setSent(true)
    } catch (err: any) {
      if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
        setError('Cannot reach the server. Check your internet connection.')
      } else {
        setError(err?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [email])

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, paddingLeft: 36, paddingRight: 12,
    background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 10,
    color: '#e8edf5', fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'border-color .15s, box-shadow .15s',
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#06090f', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)',
        }}/>
        <div style={{
          position: 'absolute', bottom: '-120px', left: '-120px', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(56,130,246,0.04) 0%, transparent 65%)',
        }}/>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: '#111827', border: '1px solid rgba(201,168,76,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 32px rgba(201,168,76,0.14), 0 2px 8px rgba(0,0,0,0.5)',
            animation: 'glow-pulse 3s ease-in-out infinite',
          }}>
            {!settingsLoading && settings.logoUrl
              ? <img src={settings.logoUrl} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }}/>
              : <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" width="30" height="30">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
            }
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(24px, 5vw, 30px)', fontWeight: 600,
            color: '#e8edf5', letterSpacing: '0.01em', lineHeight: 1.1, margin: 0,
          }}>
            {settingsLoading ? 'SanctuaryHQ' : (settings.appName || 'SanctuaryHQ')}
          </h1>
          <p style={{ color: '#7a8fa8', fontSize: 13, marginTop: 7 }}>
            {settingsLoading ? '' : (settings.tagline || 'Church Workforce Management')}
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(13,20,36,0.80)', border: '1px solid #1e2d45',
          borderRadius: 20, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}>

          {/* Card header */}
          <div style={{
            padding: '18px 24px 14px', borderBottom: '1px solid #1e2d45',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" width="16" height="16">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.01em' }}>
                Reset your password
              </div>
              <div style={{ fontSize: 11.5, color: '#4a6080', marginTop: 2 }}>
                We'll email you a secure reset link
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px' }}>
            {sent ? (
              /* Success state */
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="24" height="24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', marginBottom: 8 }}>
                  Check your inbox
                </div>
                <div style={{ fontSize: 13, color: '#7a8fa8', lineHeight: 1.65, marginBottom: 20 }}>
                  If <strong style={{ color: '#e8edf5' }}>{email}</strong> is registered, you'll receive a password reset link shortly. Check your spam folder if it doesn't arrive within 5 minutes.
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)',
                  fontSize: 11.5, color: '#7a8fa8', lineHeight: 1.6, marginBottom: 16,
                }}>
                  The link expires in <strong style={{ color: '#c9a84c' }}>1 hour</strong>. Click it from your email to set a new password.
                </div>
                <a href="/login" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  height: 44, borderRadius: 10, textDecoration: 'none',
                  background: 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                  border: '1px solid rgba(201,168,76,0.40)', color: '#06090f',
                  fontSize: 13.5, fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(201,168,76,0.25)',
                }}>
                  Back to Sign In
                </a>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
                {error && (
                  <div style={{
                    padding: '10px 13px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
                    display: 'flex', gap: 9, alignItems: 'flex-start',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span style={{ fontSize: 12.5, color: '#fca5a5', lineHeight: 1.55 }}>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" style={{
                    display: 'block', fontSize: 10.5, fontWeight: 600, color: '#7a8fa8',
                    letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 7,
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
                      id="email" type="email" autoComplete="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" disabled={loading}
                      style={{ ...inputStyle, opacity: loading ? 0.5 : 1 }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = '#1e2d45'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                  <p style={{ margin: '7px 0 0', fontSize: 11.5, color: '#4a6080', lineHeight: 1.6 }}>
                    Enter the email address associated with your account.
                  </p>
                </div>

                <button
                  type="submit" disabled={loading || !email}
                  style={{
                    width: '100%', height: 46, borderRadius: 10, fontWeight: 700,
                    fontSize: 14, cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                    background: (loading || !email)
                      ? 'rgba(201,168,76,0.25)'
                      : 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                    border: '1px solid ' + ((loading || !email) ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.40)'),
                    color: (loading || !email) ? 'rgba(201,168,76,0.5)' : '#06090f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: (loading || !email) ? 'none' : '0 4px 20px rgba(201,168,76,0.25)',
                    transition: 'all .15s',
                  }}
                >
                  {loading ? (
                    <>
                      <svg style={{ animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Sending reset link…
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', fontSize: 12, color: '#4a6080' }}>
                  Remembered it?{' '}
                  <a href="/login" style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>
                    Back to Sign In
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <PoweredBy dark />
        </div>
      </div>

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
