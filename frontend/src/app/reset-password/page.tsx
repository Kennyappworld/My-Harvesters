'use client'
/**
 * /reset-password — Password reset callback page
 *
 * Supabase sends users here after clicking the reset link in their email.
 * The URL contains a token hash fragment that Supabase resolves automatically.
 * This page lets the user choose a new password and then signs them out
 * so they must sign in fresh (no auto-session from reset flow).
 *
 * Security:
 *  - Validates Supabase session from the reset token before rendering form
 *  - Password: min 8 chars, requires mixed case + number
 *  - Rate limit: 5 attempts per 15 min
 *  - Clears sanctuaryhq_session cookie after successful reset
 *  - Must also set must_change_password = false in workers table
 */
import { useState, useEffect, useCallback } from 'react'
import { useOrgSettings } from '@/lib/orgSettings'
import PoweredBy from '@/lib/PoweredBy'
import { createClient } from '@supabase/supabase-js'

const RATE_KEY    = 'shq_resetpw_attempts'
const RATE_LIMIT  = 5
const RATE_WINDOW = 15 * 60 * 1000

function checkRateLimit() {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter(t => now - t < RATE_WINDOW)
    return { allowed: data.attempts.length < RATE_LIMIT }
  } catch { return { allowed: true } }
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

function validatePassword(pw: string): string | null {
  if (pw.length < 8)            return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw))       return 'Include at least one uppercase letter.'
  if (!/[a-z]/.test(pw))       return 'Include at least one lowercase letter.'
  if (!/[0-9]/.test(pw))       return 'Include at least one number.'
  return null
}

function StrengthBar({ pw }: { pw: string }) {
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length
  const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#10b981']
  const labels = ['','Weak','Fair','Good','Strong','Very strong']
  if (!pw) return null
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: score >= i ? colors[score-1] : '#1e2d45',
            transition: 'background .2s',
          }}/>
        ))}
      </div>
      <div style={{ fontSize: 11, color: score >= 4 ? '#22c55e' : score >= 2 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
        {labels[score]}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const { settings, loading: settingsLoading } = useOrgSettings()
  const [sessionReady, setSessionReady] = useState<'loading'|'ok'|'invalid'>('loading')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  const supabase = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    return createClient(url, key)
  })()

  // Supabase handles the token in the URL hash automatically.
  // We just need to wait for the session to be established.
  useEffect(() => {
    if (!supabase) { setSessionReady('invalid'); return }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setSessionReady('ok')
      } else if (event === 'SIGNED_OUT') {
        setSessionReady('invalid')
      }
    })
    // Also check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady('ok')
      else {
        // Give the hash fragment a moment to resolve
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!s) setSessionReady('invalid')
          })
        }, 2000)
      }
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!checkRateLimit().allowed) {
      setError('Too many attempts. Please wait 15 minutes.')
      return
    }
    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (!supabase) { setError('App not configured.'); return }

    setLoading(true)
    recordAttempt()
    try {
      // 1. Update auth password
      const { data, error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr

      // 2. Clear must_change_password flag in workers table
      if (data.user?.id) {
        await supabase
          .from('workers')
          .update({ must_change_password: false })
          .eq('id', data.user.id)
      }

      // 3. Clear session cookies and sign out
      document.cookie = 'sanctuaryhq_session=; path=/; max-age=0; SameSite=Lax; Secure'
      document.cookie = 'sanctuaryhq_session=; path=/; max-age=0'
      try { sessionStorage.removeItem('shq_user') } catch {}

      await supabase.auth.signOut()
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. The reset link may have expired.')
    } finally {
      setLoading(false)
    }
  }, [password, confirm, supabase])

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, paddingLeft: 36, paddingRight: 44,
    background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 10,
    color: '#e8edf5', fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'border-color .15s, box-shadow .15s',
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#06090f', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)' }}/>
        <div style={{ position: 'absolute', bottom: '-120px', left: '-120px', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(56,130,246,0.04) 0%, transparent 65%)' }}/>
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
            color: '#e8edf5', margin: 0,
          }}>
            {settingsLoading ? 'SanctuaryHQ' : (settings.appName || 'SanctuaryHQ')}
          </h1>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(13,20,36,0.80)', border: '1px solid #1e2d45',
          borderRadius: 20, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}>

          {/* Header */}
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#e8edf5' }}>Set new password</div>
              <div style={{ fontSize: 11.5, color: '#4a6080', marginTop: 2 }}>Choose a strong, unique password</div>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Loading state */}
            {sessionReady === 'loading' && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#7a8fa8' }}>
                <svg style={{ animation: 'spin 0.75s linear infinite', margin: '0 auto 12px', display: 'block' }}
                  viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" width="24" height="24">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Verifying reset link…
              </div>
            )}

            {/* Invalid / expired */}
            {sessionReady === 'invalid' && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="22" height="22">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', marginBottom: 8 }}>Link expired or invalid</div>
                <div style={{ fontSize: 13, color: '#7a8fa8', lineHeight: 1.65, marginBottom: 20 }}>
                  This password reset link has expired or already been used. Reset links are valid for 1 hour.
                </div>
                <a href="/forgot-password" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  height: 44, borderRadius: 10, textDecoration: 'none',
                  background: 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                  color: '#06090f', fontSize: 13.5, fontWeight: 700,
                }}>
                  Request a new link
                </a>
              </div>
            )}

            {/* Done */}
            {done && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="24" height="24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', marginBottom: 8 }}>Password updated!</div>
                <div style={{ fontSize: 13, color: '#7a8fa8', lineHeight: 1.65, marginBottom: 20 }}>
                  Your password has been changed successfully. Please sign in with your new password.
                </div>
                <a href="/login" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  height: 44, borderRadius: 10, textDecoration: 'none',
                  background: 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                  color: '#06090f', fontSize: 13.5, fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(201,168,76,0.25)',
                }}>
                  Sign In →
                </a>
              </div>
            )}

            {/* Form */}
            {sessionReady === 'ok' && !done && (
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

                {/* New password */}
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#7a8fa8', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 7 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4a6080" strokeWidth="1.8" width="14" height="14"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type={showPw ? 'text' : 'password'} autoComplete="new-password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, number" disabled={loading}
                      style={{ ...inputStyle, opacity: loading ? 0.5 : 1 }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = '#1e2d45'; e.target.style.boxShadow = 'none' }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a6080', padding: 3, display: 'flex' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                        {showPw
                          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                        }
                      </svg>
                    </button>
                  </div>
                  <StrengthBar pw={password}/>
                </div>

                {/* Confirm */}
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#7a8fa8', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 7 }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4a6080" strokeWidth="1.8" width="14" height="14"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type={showPw ? 'text' : 'password'} autoComplete="new-password" required
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat new password" disabled={loading}
                      style={{
                        ...inputStyle,
                        opacity: loading ? 0.5 : 1,
                        borderColor: confirm && confirm !== password ? 'rgba(239,68,68,0.4)' : '#1e2d45',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = confirm && confirm !== password ? 'rgba(239,68,68,0.4)' : '#1e2d45'; e.target.style.boxShadow = 'none' }}
                    />
                    {confirm && confirm === password && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" width="13" height="13"
                        style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div style={{ padding: '10px 12px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: '#7a8fa8', fontWeight: 600, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Requirements</div>
                  {[
                    { label: 'At least 8 characters', ok: password.length >= 8 },
                    { label: 'Uppercase letter (A–Z)', ok: /[A-Z]/.test(password) },
                    { label: 'Lowercase letter (a–z)', ok: /[a-z]/.test(password) },
                    { label: 'Number (0–9)', ok: /[0-9]/.test(password) },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={r.ok ? '#22c55e' : '#2a3f5f'} strokeWidth="2.5" width="12" height="12">
                        {r.ok ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="8"/>}
                      </svg>
                      <span style={{ fontSize: 11.5, color: r.ok ? '#86efac' : '#4a6080' }}>{r.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm || !!validatePassword(password) || password !== confirm}
                  style={{
                    width: '100%', height: 46, borderRadius: 10, fontWeight: 700, fontSize: 14,
                    cursor: 'pointer',
                    background: (loading || !password || !confirm || !!validatePassword(password) || password !== confirm)
                      ? 'rgba(201,168,76,0.25)'
                      : 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                    border: '1px solid rgba(201,168,76,0.40)',
                    color: (loading || !password || !confirm) ? 'rgba(201,168,76,0.5)' : '#06090f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all .15s',
                    boxShadow: '0 4px 20px rgba(201,168,76,0.20)',
                  }}
                >
                  {loading ? (
                    <>
                      <svg style={{ animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Updating password…
                    </>
                  ) : (
                    <>
                      Set New Password
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
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
