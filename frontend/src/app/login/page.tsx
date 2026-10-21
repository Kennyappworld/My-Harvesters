'use client'
import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import PoweredBy from '@/lib/PoweredBy'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useOrgSettings } from '@/lib/orgSettings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                 ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                 ?? ''

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ── Scripture splash pool ─────────────────────────────────────────────────────
const DAILY_WORDS = [
  { verse: "The LORD your God is with you, the Mighty Warrior who saves.", ref: "Zephaniah 3:17 (NIV)" },
  { verse: "I can do all this through him who gives me strength.", ref: "Philippians 4:13 (NIV)" },
  { verse: "Trust in the LORD with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5 (NIV)" },
  { verse: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you.", ref: "Jeremiah 29:11 (NIV)" },
  { verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you.", ref: "Joshua 1:9 (NIV)" },
  { verse: "Come to me, all you who are weary and burdened, and I will give you rest.", ref: "Matthew 11:28 (NIV)" },
  { verse: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles.", ref: "Isaiah 40:31 (NIV)" },
  { verse: "And we know that in all things God works for the good of those who love him.", ref: "Romans 8:28 (NIV)" },
  { verse: "The name of the LORD is a fortified tower; the righteous run to it and are safe.", ref: "Proverbs 18:10 (NIV)" },
  { verse: "Delight yourself in the LORD, and he will give you the desires of your heart.", ref: "Psalm 37:4 (ESV)" },
]

// ── Rate limiting (client-side, paired with server-side Supabase check) ────────
const RATE_LIMIT = { maxAttempts: 5, windowMs: 60_000 }

type RateState = { attempts: number; firstAttempt: number; lockedUntil: number }

function getRateState(email: string): RateState {
  try {
    const raw = sessionStorage.getItem(`rl_${btoa(email.toLowerCase())}`)
    if (!raw) return { attempts: 0, firstAttempt: 0, lockedUntil: 0 }
    return JSON.parse(raw)
  } catch {
    return { attempts: 0, firstAttempt: 0, lockedUntil: 0 }
  }
}

function setRateState(email: string, state: RateState) {
  try {
    sessionStorage.setItem(`rl_${btoa(email.toLowerCase())}`, JSON.stringify(state))
  } catch {}
}

function checkRateLimit(email: string): { allowed: boolean; secondsLeft: number } {
  const s = getRateState(email)
  const now = Date.now()
  if (s.lockedUntil > now) {
    return { allowed: false, secondsLeft: Math.ceil((s.lockedUntil - now) / 1000) }
  }
  return { allowed: true, secondsLeft: 0 }
}

function recordAttempt(email: string, success: boolean) {
  const s = getRateState(email)
  const now = Date.now()
  if (success) {
    setRateState(email, { attempts: 0, firstAttempt: 0, lockedUntil: 0 })
    return
  }
  const attempts = s.attempts + 1
  const firstAttempt = s.attempts === 0 ? now : s.firstAttempt
  const lockedUntil = attempts >= RATE_LIMIT.maxAttempts ? now + RATE_LIMIT.windowMs : 0
  setRateState(email, { attempts, firstAttempt, lockedUntil })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { settings } = useOrgSettings()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [locked, setLocked]     = useState(false)
  const [lockSecs, setLockSecs] = useState(0)
  const [word, setWord]         = useState(DAILY_WORDS[0])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reason = params?.get('reason')
  const from   = params?.get('from') ? decodeURIComponent(params.get('from')!) : '/dashboard'

  // Pick today's scripture
  useEffect(() => {
    const idx = new Date().getDate() % DAILY_WORDS.length
    setWord(DAILY_WORDS[idx])
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!locked) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setLockSecs(s => {
        if (s <= 1) { setLocked(false); clearInterval(timerRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [locked])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }

    // Client-side rate limit check
    const { allowed, secondsLeft } = checkRateLimit(email)
    if (!allowed) {
      setLocked(true); setLockSecs(secondsLeft)
      setError(`Too many attempts. Please wait ${secondsLeft}s before trying again.`)
      return
    }

    setLoading(true)

    if (!supabase) {
      setError('Authentication service not configured. Please contact your administrator.')
      setLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError || !data.session) {
        recordAttempt(email, false)
        const { allowed: stillAllowed, secondsLeft: sl } = checkRateLimit(email)
        if (!stillAllowed) {
          setLocked(true); setLockSecs(sl)
          setError(`Too many failed attempts. Please wait ${sl}s before trying again.`)
        } else {
          setError('Incorrect email or password. Please try again.')
        }
        setLoading(false)
        return
      }

      // Success — record and set session cookie
      recordAttempt(email, true)

      // Generate a secure session token (UUID)
      const sessionToken = data.session.access_token.slice(-36) || crypto.randomUUID()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `churchos_session=${sessionToken}; path=/; expires=${expires}; SameSite=Lax`
      // Clear legacy cookie
      document.cookie = 'hicc_session=; path=/; max-age=0'

      // Update last_seen in workers table (best effort)
      try {
        await supabase
          .from('workers')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', data.session.user.id)
      } catch {}

      await new Promise(r => setTimeout(r, 80))
      router.push(from.startsWith('/') ? from : '/dashboard')
    } catch {
      setError('A connection error occurred. Please check your internet and try again.')
      setLoading(false)
    }
  }, [email, password, from, router])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', color: 'var(--t-1)',
    }}>
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: 'clamp(0px, 100% - 480px, 560px) 1fr',
        minHeight: '100dvh',
      }}>
        {/* ── Left panel — Scripture ── */}
        <div style={{
          background: 'linear-gradient(160deg, #0D1F16 0%, #1B4332 60%, #2D6A4F 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: 'clamp(32px, 5vw, 64px)',
        }}>
          {/* Logo + App name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: 'rgba(201,168,76,0.2)',
                border: '1.5px solid rgba(201,168,76,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>✝</div>
            )}
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                {settings.appName}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>
                {settings.name}
              </div>
            </div>
          </div>

          {/* Scripture */}
          <div style={{ maxWidth: 420 }}>
            <svg viewBox="0 0 32 28" fill="none" width="36" height="36" style={{ marginBottom: 20, opacity: 0.5 }}>
              <path d="M0 28V16C0 8.533 4.267 3.2 12.8 0l2.133 3.2C10.267 4.8 7.467 8 7.467 12H14V28H0zm18 0V16C18 8.533 22.267 3.2 30.8 0L32.933 3.2C28.267 4.8 25.467 8 25.467 12H32V28H18z" fill="rgba(201,168,76,0.6)"/>
            </svg>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2.5vw, 26px)',
              fontWeight: 500, color: 'rgba(255,255,255,0.92)', lineHeight: 1.5, marginBottom: 20,
            }}>
              {word.verse}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(201,168,76,0.9)', fontStyle: 'italic', fontWeight: 600 }}>
              — {word.ref}
            </p>
          </div>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            &copy; {new Date().getFullYear()} {settings.name}
          </div>
        </div>

        {/* ── Right panel — Login form ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(24px, 4vw, 64px)', background: 'var(--bg)',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
                color: 'var(--t-1)', letterSpacing: '-0.02em', marginBottom: 6,
              }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 14, color: 'var(--t-3)' }}>
                Sign in to your {settings.name} workspace
              </p>
            </div>

            {/* Session notices */}
            {reason === 'session_expired' && (
              <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--r)', marginBottom: 20, fontSize: 13, color: '#92400e', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span>⏱</span>
                <span>Your session expired. Please sign in again.</span>
              </div>
            )}
            {reason === 'suspended' && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r)', marginBottom: 20, fontSize: 13, color: '#991b1b' }}>
                Your account has been suspended. Please contact your administrator.
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r)',
                marginBottom: 20, fontSize: 13, color: '#991b1b',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Email address
                </label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@church.org"
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={locked || loading}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                    disabled={locked || loading}
                    style={{ width: '100%', paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-3)', padding: 4,
                    }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-brand"
                disabled={loading || locked}
                style={{
                  width: '100%', justifyContent: 'center', padding: '13px',
                  fontSize: 15, fontWeight: 700, marginTop: 4,
                  opacity: loading || locked ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginRight: 8 }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Signing in…
                  </>
                ) : locked ? (
                  `Locked — wait ${lockSecs}s`
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p style={{ marginTop: 24, fontSize: 12.5, color: 'var(--t-3)', textAlign: 'center', lineHeight: 1.6 }}>
              Access is by invitation only. Contact your administrator<br/>
              if you need an account or to reset your password.
            </p>
          </div>
        </div>
      </div>

      <PoweredBy />
    </div>
  )
}
