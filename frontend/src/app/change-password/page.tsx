'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Rate limit: max 5 attempts per 15 min
const RATE_KEY    = 'shq_chpw_attempts'
const RATE_LIMIT  = 5
const RATE_WINDOW = 15 * 60 * 1000

function checkRateLimit(): { allowed: boolean; resetMs: number } {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter((t: number) => now - t < RATE_WINDOW)
    const allowed = data.attempts.length < RATE_LIMIT
    const oldest = data.attempts[0]
    const resetMs = oldest ? RATE_WINDOW - (now - oldest) : 0
    return { allowed, resetMs }
  } catch {
    return { allowed: true, resetMs: 0 }
  }
}

function recordAttempt() {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter((t: number) => now - t < RATE_WINDOW)
    data.attempts.push(now)
    sessionStorage.setItem(RATE_KEY, JSON.stringify(data))
  } catch {}
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

const inputSt: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px',
  background: '#0d1424',
  border: '1px solid #1e2d45',
  borderRadius: 10,
  color: '#e8edf5',
  fontSize: 13.5,
  outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color .15s, box-shadow .15s',
  boxSizing: 'border-box',
}

export default function ChangePassword() {
  const router = useRouter()
  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)
  const [done, setDone]     = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [rateLocked, setRateLocked] = useState(false)

  // Verify auth before rendering
  useEffect(() => {
    if (!supabase) { setAuthed(false); return }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuthed(true)
      } else {
        router.replace('/login')
      }
    }).catch(() => {
      router.replace('/login')
    })
  }, [router])

  const checks = [
    ['8+ characters', pw.length >= 8],
    ['Uppercase letter', /[A-Z]/.test(pw)],
    ['Number', /[0-9]/.test(pw)],
  ] as [string, boolean][]

  const strong = checks.every(([, ok]) => ok)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')

    if (!strong) {
      setErr('Password must be at least 8 characters with an uppercase letter and a number.')
      return
    }
    if (pw !== pw2) { setErr('Passwords do not match.'); return }

    const rate = checkRateLimit()
    if (!rate.allowed) {
      const min = Math.ceil(rate.resetMs / 60000)
      setErr(`Too many attempts. Please wait ${min <= 1 ? '1 minute' : `${min} minutes`}.`)
      setRateLocked(true)
      return
    }

    setBusy(true)
    recordAttempt()

    try {
      if (!supabase) throw new Error('App not configured.')

      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) { setErr(error.message); setBusy(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('workers').update({ must_change_password: false }).eq('id', user.id)
      }
    } catch (ex: any) {
      setErr(ex?.message || 'Something went wrong. Please try again.')
      setBusy(false)
      return
    }

    setBusy(false)
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (authed === null) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#06090f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg style={{ animation: 'spin .75s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="2.5" width="24" height="24">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#06090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: '#111827',
            border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 28px rgba(201,168,76,0.14)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" width="28" height="28">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 26, fontWeight: 600, color: '#e8edf5',
            letterSpacing: '0.01em', marginBottom: 6,
          }}>
            Set your password
          </h1>
          <p style={{ fontSize: 13, color: '#7a8fa8', lineHeight: 1.65 }}>
            You're using a temporary password.<br/>
            Please set a new one to continue.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(13,20,36,0.80)',
          border: '1px solid #1e2d45',
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e2d45', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 8px rgba(201,168,76,0.5)' }}/>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.01em' }}>
              Choose a secure password
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>

            {done ? (
              <div style={{
                textAlign: 'center', padding: '24px 0',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.10)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" width="22" height="22">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#86efac' }}>
                  Password updated!
                </div>
                <div style={{ fontSize: 13, color: '#7a8fa8' }}>
                  Taking you to the dashboard…
                </div>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {err && (
                  <div style={{
                    padding: '10px 13px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
                    display: 'flex', gap: 9, alignItems: 'flex-start',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div style={{ fontSize: 12.5, color: '#fca5a5', lineHeight: 1.55 }}>{err}</div>
                  </div>
                )}

                {/* New password */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 10.5, fontWeight: 600,
                    color: '#7a8fa8', letterSpacing: '0.09em',
                    textTransform: 'uppercase', marginBottom: 7,
                  }}>
                    New password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pw}
                      onChange={e => { setPw(e.target.value); setErr(''); setRateLocked(false) }}
                      required minLength={8}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      disabled={busy || rateLocked}
                      autoComplete="new-password"
                      style={{ ...inputSt, paddingRight: 44, opacity: (busy || rateLocked) ? 0.5 : 1 }}
                      onFocus={e => { e.target.style.borderColor='rgba(201,168,76,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.12)' }}
                      onBlur={e => { e.target.style.borderColor='#1e2d45'; e.target.style.boxShadow='none' }}
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

                  {pw.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {checks.map(([label, ok]) => (
                        <span key={label} style={{
                          fontSize: 10.5, padding: '3px 8px', borderRadius: 99, fontWeight: 600,
                          background: ok ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${ok ? 'rgba(34,197,94,0.22)' : '#1e2d45'}`,
                          color: ok ? '#86efac' : '#4a6080',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          {ok ? '✓' : '○'} {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 10.5, fontWeight: 600,
                    color: '#7a8fa8', letterSpacing: '0.09em',
                    textTransform: 'uppercase', marginBottom: 7,
                  }}>
                    Confirm password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw2 ? 'text' : 'password'}
                      value={pw2}
                      onChange={e => { setPw2(e.target.value); setErr('') }}
                      required
                      placeholder="Repeat your new password"
                      disabled={busy || rateLocked}
                      autoComplete="new-password"
                      style={{
                        ...inputSt, paddingRight: 44,
                        borderColor: pw2.length > 0 && pw !== pw2 ? 'rgba(239,68,68,0.45)' : '#1e2d45',
                        opacity: (busy || rateLocked) ? 0.5 : 1,
                      }}
                      onFocus={e => { e.target.style.borderColor = pw2.length > 0 && pw !== pw2 ? 'rgba(239,68,68,0.45)' : 'rgba(201,168,76,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = pw2.length > 0 && pw !== pw2 ? 'rgba(239,68,68,0.35)' : '#1e2d45'; e.target.style.boxShadow='none' }}
                    />
                    <button type="button" onClick={() => setShowPw2(v => !v)} tabIndex={-1}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a6080', padding: 3, display: 'flex' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                        {showPw2
                          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                        }
                      </svg>
                    </button>
                  </div>
                  {pw2.length > 0 && pw !== pw2 && (
                    <div style={{ fontSize: 11.5, color: '#fca5a5', marginTop: 5 }}>
                      Passwords do not match
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={busy || rateLocked || !strong || pw !== pw2}
                  style={{
                    width: '100%', height: 46, marginTop: 2,
                    background: (strong && pw === pw2 && !rateLocked && !busy)
                      ? 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)'
                      : 'rgba(201,168,76,0.12)',
                    border: `1px solid ${(strong && pw === pw2 && !rateLocked) ? 'rgba(201,168,76,0.40)' : 'rgba(201,168,76,0.10)'}`,
                    borderRadius: 10,
                    color: (strong && pw === pw2 && !rateLocked && !busy) ? '#06090f' : 'rgba(201,168,76,0.35)',
                    fontSize: 14, fontWeight: 700,
                    cursor: (strong && pw === pw2 && !rateLocked && !busy) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all .15s',
                    boxShadow: (strong && pw === pw2 && !rateLocked && !busy) ? '0 4px 20px rgba(201,168,76,0.25)' : 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {busy ? (
                    <>
                      <svg style={{ animation: 'spin .75s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Updating…
                    </>
                  ) : rateLocked ? (
                    'Too many attempts — please wait'
                  ) : (
                    <>
                      Set password & continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Security note */}
          {!done && (
            <div style={{
              padding: '12px 24px', borderTop: '1px solid #1e2d45',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4a6080" strokeWidth="1.8" width="12" height="12" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span style={{ fontSize: 11, color: '#4a6080', lineHeight: 1.5 }}>
                Your password is encrypted and never stored in plain text.
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0d1424 inset !important;
          -webkit-text-fill-color: #e8edf5 !important;
        }
      `}</style>
    </div>
  )
}
