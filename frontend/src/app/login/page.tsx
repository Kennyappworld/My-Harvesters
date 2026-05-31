'use client'
import { useState, useEffect, useCallback, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ------------------------------------------------------------------
// Scripture rotation — shown on first login of the day
// ------------------------------------------------------------------
const DAILY_WORDS = [
  { verse: 'For where two or three gather in my name, there am I with them.', ref: 'Matthew 18:20' },
  { verse: 'Let us not give up meeting together, but let us encourage one another.', ref: 'Hebrews 10:25' },
  { verse: "How good and pleasant it is when God's people live together in unity!", ref: 'Psalm 133:1' },
  { verse: 'The Lord bless you and keep you; the Lord make his face shine on you.', ref: 'Numbers 6:24–25' },
  { verse: 'Commit to the Lord whatever you do, and he will establish your plans.', ref: 'Proverbs 16:3' },
  { verse: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { verse: 'Be strong and courageous. Do not be afraid; the Lord your God is with you.', ref: 'Joshua 1:9' },
]

// ------------------------------------------------------------------
// Demo credential store — in production this lives in the backend
// ------------------------------------------------------------------
const WORKFORCE_USERS: Record<string, { name: string; role: string; branch: string }> = {
  'pastor@hicc.org':        { name: 'Pastor Bolaji Idowu',   role: 'Senior Pastor',   branch: 'All branches' },
  'pastor.ikeja@hicc.org':  { name: 'Pastor Kanmi Adeyemi',  role: 'Branch Pastor',   branch: 'Ikeja' },
  'pastor.london@hicc.org': { name: 'Pastor James Osei',     role: 'Branch Pastor',   branch: 'London UK' },
  'segun@hicc.org':         { name: 'Segun Adeyemi',         role: 'Unit Head',        branch: 'Lekki HQ' },
}
const DEMO_PASSWORD = 'demo123'

// ------------------------------------------------------------------
// Welcome splash — shown only on first login
// ------------------------------------------------------------------
function WelcomeSplash({ name, onDone }: { name: string; onDone: () => void }) {
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(4)
  const [word] = useState(() => DAILY_WORDS[Math.floor(Math.random() * DAILY_WORDS.length)])

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const tick = setInterval(() => setCountdown(n => Math.max(0, n - 1)), 1000)
    const exit = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 4200)
    return () => { clearInterval(tick); clearTimeout(exit) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--navy)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity .4s',
      opacity: visible ? 1 : 0,
    }}>
      <div style={{ position: 'absolute', top: '-8%', left: '-4%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)', filter: 'blur(56px)' }} />
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem', position: 'relative' }}>
        <div style={{ width: 64, height: 64, background: 'var(--grad-brand)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--sh-brand)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="30" height="30"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,158,11,.85)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Grace and peace to you</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800, color: 'white', marginBottom: 6 }}>{name}</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginBottom: 26 }}>Harvesters International Christian Centre</p>
        <blockquote style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '18px 22px', marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,158,11,.75)', marginBottom: 10, letterSpacing: '.07em', textTransform: 'uppercase' }}>A word for today</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'white', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 10 }}>"{word.verse}"</p>
          <cite style={{ fontSize: 12, color: 'rgba(245,158,11,.9)', fontWeight: 700, fontStyle: 'normal' }}>— {word.ref}</cite>
        </blockquote>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,.35)', fontSize: 12 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--brand-lt)', fontFamily: 'var(--font-mono)' }}>{countdown}</span>
          <span>Taking you in…</span>
        </div>
        <button onClick={onDone} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,.25)', textDecoration: 'underline' }}>Skip</button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Forgot password flow
// ------------------------------------------------------------------
function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const sendReset = (e: FormEvent) => {
    e.preventDefault()
    if (!Object.keys(WORKFORCE_USERS).includes(email)) {
      setErr('No account found with that email address.')
      return
    }
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('otp') }, 1200)
  }

  const verifyOtp = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // In production, this verifies against the OTP sent by the backend
    setTimeout(() => { setLoading(false); setStep('done') }, 1000)
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t-2)', fontSize: 13, marginBottom: 24, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to sign in
      </button>

      {step === 'email' && (
        <div className="card glass" style={{ padding: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 6, color: 'var(--t-1)' }}>Reset your password</h2>
          <p style={{ fontSize: 13, color: 'var(--t-2)', marginBottom: 20, lineHeight: 1.6 }}>Enter your work email and we'll send a reset code.</p>
          {err && <p style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#ef4444', marginBottom: 16 }}>{err}</p>}
          <form onSubmit={sendReset}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Email address</label>
            <input className="input" type="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} placeholder="your@hicc.org" required autoFocus style={{ marginBottom: 14 }}/>
            <button type="submit" className="btn btn-brand" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <div className="card glass" style={{ padding: '2rem' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 6, color: 'var(--t-1)' }}>Check your inbox</h2>
          <p style={{ fontSize: 13, color: 'var(--t-2)', marginBottom: 20, lineHeight: 1.6 }}>A 6-digit code was sent to <strong style={{ color: 'var(--t-1)' }}>{email}</strong>. Enter it below along with your new password.</p>
          <form onSubmit={verifyOtp}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Reset code</label>
            <input className="input" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} required style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', letterSpacing: '.15em', fontSize: 18 }}/>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>New password</label>
            <input className="input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="At least 8 characters" minLength={8} required style={{ marginBottom: 14 }}/>
            <button type="submit" className="btn btn-brand" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading || otp.length < 6}>
              {loading ? 'Verifying…' : 'Set new password'}
            </button>
          </form>
          <button onClick={() => setStep('email')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t-3)', marginTop: 12, display: 'block' }}>Didn't get it? Try again</button>
        </div>
      )}

      {step === 'done' && (
        <div className="card glass" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--t-1)' }}>Password updated</h2>
          <p style={{ fontSize: 13, color: 'var(--t-2)', marginBottom: 20, lineHeight: 1.6 }}>You can now sign in with your new password.</p>
          <button onClick={onBack} className="btn btn-brand" style={{ justifyContent: 'center', width: '100%', padding: '11px' }}>Back to sign in</button>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------
// Main login page
// ------------------------------------------------------------------
export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [splash, setSplash] = useState<{ show: boolean; name: string }>({ show: false, name: '' })
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)

  // Check if the device supports WebAuthn / biometric
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setBiometricAvailable(available))
        .catch(() => setBiometricAvailable(false))
    }
  }, [])

  const handleSignIn = useCallback((email: string) => {
    const user = WORKFORCE_USERS[email]
    if (!user) return

    // Only show the splash on the first login of each day
    const todayKey = `hicc_splash_${new Date().toDateString()}`
    const seenToday = sessionStorage.getItem(todayKey)
    sessionStorage.setItem('hicc_user', JSON.stringify({ email, ...user }))

    if (!seenToday) {
      sessionStorage.setItem(todayKey, '1')
      setSplash({ show: true, name: user.name })
    } else {
      router.push('/dashboard')
    }
  }, [router])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const user = WORKFORCE_USERS[form.email]
    if (!user || form.password !== DEMO_PASSWORD) {
      setError('Email or password is incorrect. Please try again.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      handleSignIn(form.email)
    }, 800)
  }

  // Biometric auth via WebAuthn platform authenticator
  const handleBiometric = async () => {
    if (!biometricAvailable) return
    setBiometricLoading(true)
    try {
      // In production: fetch a challenge from /api/auth/webauthn/challenge
      // then call navigator.credentials.get() with that challenge.
      // Here we simulate the flow with a timeout and fall back gracefully.
      const supported = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!supported) throw new Error('Not available on this device')

      // Simulated credential request — replace with real SimpleWebAuthn call in production
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Check if a biometric-linked account exists in storage
          const stored = sessionStorage.getItem('hicc_biometric_email')
          if (stored && WORKFORCE_USERS[stored]) {
            resolve()
          } else {
            // First time: use the demo account as the linked credential
            sessionStorage.setItem('hicc_biometric_email', 'pastor@hicc.org')
            resolve()
          }
        }, 1000)
      })

      const linkedEmail = sessionStorage.getItem('hicc_biometric_email') || 'pastor@hicc.org'
      handleSignIn(linkedEmail)
    } catch {
      setError('Biometric sign-in unavailable. Please use your password.')
    } finally {
      setBiometricLoading(false)
    }
  }

  if (splash.show) {
    return <WelcomeSplash name={splash.name} onDone={() => { setSplash({ show: false, name: '' }); router.push('/dashboard') }} />
  }

  if (mode === 'forgot') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
        <ForgotPassword onBack={() => { setMode('login'); setError('') }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '-8%', left: '-4%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)', filter: 'blur(64px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: '-8%', right: '-4%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.1) 0%, transparent 70%)', filter: 'blur(56px)', pointerEvents: 'none' }}/>

      {/* Left brand panel — hidden on mobile */}
      <div style={{ display: 'none', flex: 1, background: 'var(--navy)', alignItems: 'center', justifyContent: 'center', padding: '3rem', position: 'relative' }} className="brand-panel">
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'var(--grad-brand)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--sh-brand)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="34" height="34"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-.02em', marginBottom: 8 }}>HARVESTERS</h1>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(245,158,11,.8)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 24 }}>International Christian Centre</p>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,.4), transparent)', marginBottom: 24 }}/>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>Raise kingdom champions — bonding the workforce in unity, growing every member spiritually.</p>
        </div>
      </div>

      {/* Right: login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--navy)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo for mobile / standalone */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 54, height: 54, background: 'var(--grad-brand)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: 'var(--sh-brand)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="26" height="26"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-.01em', marginBottom: 4 }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Sign in to your HICC workforce account</p>
          </div>

          <div className="card glass" style={{ padding: '2rem' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#ef4444', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={submit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,.55)', display: 'block', marginBottom: 6 }}>Email address</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@hicc.org" required autoFocus autoComplete="username email"/>
              </div>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,.55)', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter your password" required autoComplete="current-password" style={{ paddingRight: 44 }}/>
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.35)', padding: 4 }}>
                    {showPwd
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginBottom: 18 }}>
                <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--brand-lt)', padding: 0, textDecoration: 'none' }}>Forgot password?</button>
              </div>
              <button type="submit" className="btn btn-brand" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, fontWeight: 700 }} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".25"/><path d="M21 12a9 9 0 0 1-9 9"/></svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            {/* Biometric option — only shown if device supports it */}
            {biometricAvailable && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }}/>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' }}>or continue with</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }}/>
                </div>
                <button onClick={handleBiometric} disabled={biometricLoading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, background: 'rgba(255,255,255,.05)', cursor: 'pointer', color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 500, transition: 'all .15s', fontFamily: 'var(--font-body)' }}>
                  {biometricLoading
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-18 0"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M8 11a4 4 0 0 0 8 0"/><path d="M12 19v4"/><path d="M4.93 10.93A8 8 0 0 0 12 20a8 8 0 0 0 7.07-9.07"/><path d="M2 12c0-5.52 4.48-10 10-10"/></svg>
                  }
                  {biometricLoading ? 'Verifying…' : 'Face ID / Fingerprint'}
                </button>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>Uses your device's built-in biometric sensor. Your data never leaves this device.</p>
              </>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.25)', marginTop: '1.5rem' }}>
            New to HICC workforce? <Link href="/signup" style={{ color: 'var(--brand-lt)' }}>Register here</Link>
          </p>

          <style>{`
            @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
            @media (min-width: 768px) {
              .brand-panel { display: flex !important; }
            }
          `}</style>
        </div>
      </div>
    </div>
  )
}
