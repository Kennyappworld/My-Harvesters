'use client'
import { useState, useEffect, useCallback, FormEvent } from 'react'
import PoweredBy from '@/lib/PoweredBy'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DAILY_WORDS = [
  { verse: 'For where two or three gather in my name, there am I with them.', ref: 'Matthew 18:20' },
  { verse: 'Let us not give up meeting together, but let us encourage one another.', ref: 'Hebrews 10:25' },
  { verse: "How good and pleasant it is when God's people live together in unity!", ref: 'Psalm 133:1' },
  { verse: 'The Lord bless you and keep you; the Lord make his face shine on you.', ref: 'Numbers 6:24–25' },
  { verse: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
]

const WORKFORCE_USERS: Record<string, { name: string; role: string }> = {
  'pastor@hicc.org':        { name: 'Pastor Bolaji Idowu',  role: 'Senior Pastor'  },
  'pastor.ikeja@hicc.org':  { name: 'Pastor Kanmi Adeyemi', role: 'Branch Pastor'  },
  'pastor.london@hicc.org': { name: 'Pastor James Osei',    role: 'Branch Pastor'  },
  'segun@hicc.org':         { name: 'Segun Adeyemi',        role: 'Unit Head'      },
}
const DEMO_PASSWORD = 'demo123'

// Scripture splash — only shown once per day
function WelcomeSplash({ name, onDone }: { name: string; onDone: () => void }) {
  const [vis, setVis] = useState(false)
  const [word] = useState(() => DAILY_WORDS[Math.floor(Math.random() * DAILY_WORDS.length)])

  useEffect(() => {
    requestAnimationFrame(() => setVis(true))
    // No auto-dismiss — user must tap 'Enter' or 'Skip' manually
  }, [])

  const dismiss = () => {
    setVis(false)
    setTimeout(onDone, 350)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'var(--dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', transition:'opacity .4s', opacity: vis ? 1 : 0 }}>
      <div style={{ position:'absolute', top:'10%', left:'15%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(27,67,50,0.4) 0%, transparent 70%)', filter:'blur(50px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'12%', right:'10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }}/>
      <div style={{ maxWidth:420, width:'100%', textAlign:'center', position:'relative' }}>
        <div style={{ width:52, height:52, background:'var(--grad-brand)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'var(--sh-brand)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="24" height="24"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        <p style={{ fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Grace and peace to you</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem,4vw,2rem)', fontWeight:800, color:'white', marginBottom:4 }}>{name}</h1>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:28 }}>Harvesters International Christian Centre</p>
        <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)', borderRadius:14, padding:'20px 24px', marginBottom:24 }}>
          <p style={{ fontFamily:'var(--font-display)', fontSize:15, color:'white', lineHeight:1.8, fontStyle:'italic', marginBottom:10 }}>"{word.verse}"</p>
          <cite style={{ fontSize:11.5, color:'var(--gold)', fontWeight:700, fontStyle:'normal' }}>— {word.ref}</cite>
        </div>
        <button onClick={dismiss} className="btn btn-brand" style={{ marginTop:4, padding:'11px 32px', fontSize:14, fontWeight:700 }}>
          Enter →
        </button>
        <button onClick={dismiss} style={{ marginTop:10, background:'none', border:'none', cursor:'pointer', fontSize:11.5, color:'rgba(255,255,255,.3)', fontFamily:'var(--font-body)' }}>
          Skip for now
        </button>
      </div>
    </div>
  )
}

// Forgot password — simple 3-step inline flow
function ForgotFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'email'|'otp'|'done'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const sendCode = (e: FormEvent) => {
    e.preventDefault()
    if (!WORKFORCE_USERS[email]) { setErr('No account found with that email.'); return }
    setBusy(true); setTimeout(() => { setBusy(false); setStep('otp') }, 1000)
  }

  const verify = (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setTimeout(() => { setBusy(false); setStep('done') }, 900)
  }

  return (
    <div style={{ width:'100%', maxWidth:380 }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.45)', fontSize:12.5, marginBottom:22, fontFamily:'var(--font-body)', padding:0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to sign in
      </button>

      {step === 'email' && (
        <div className="glass" style={{ padding:'2rem' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'white', marginBottom:6 }}>Reset password</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:20 }}>Enter your work email. We'll send a reset code.</p>
          {err && <p style={{ background:'rgba(197,48,48,.15)', border:'1px solid rgba(197,48,48,.3)', borderRadius:8, padding:'9px 13px', fontSize:12.5, color:'#FC8181', marginBottom:14 }}>{err}</p>}
          <form onSubmit={sendCode}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>Email address</label>
            <input className="input-dark" type="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} placeholder="your@hicc.org" required autoFocus style={{ marginBottom:14 }}/>
            <button type="submit" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'11px' }} disabled={busy}>{busy ? 'Sending…' : 'Send reset code'}</button>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <div className="glass" style={{ padding:'2rem' }}>
          <p style={{ fontSize:32, marginBottom:12 }}>📬</p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'white', marginBottom:6 }}>Check your inbox</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:20 }}>We sent a 6-digit code to <strong style={{ color:'white' }}>{email}</strong></p>
          <form onSubmit={verify}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>Reset code</label>
            <input className="input-dark" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6 digits" maxLength={6} required style={{ marginBottom:12, fontFamily:'var(--font-mono)', letterSpacing:'.2em', fontSize:18 }}/>
            <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>New password</label>
            <input className="input-dark" type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Minimum 8 characters" minLength={8} required style={{ marginBottom:14 }}/>
            <button type="submit" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'11px' }} disabled={busy || otp.length < 6}>{busy ? 'Verifying…' : 'Set new password'}</button>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div className="glass" style={{ padding:'2rem', textAlign:'center' }}>
          <p style={{ fontSize:44, marginBottom:12 }}>✅</p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'white', marginBottom:6 }}>Password updated</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:20 }}>You can now sign in with your new password.</p>
          <button onClick={onBack} className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'11px' }}>Back to sign in</button>
        </div>
      )}
    </div>
  )
}

// Main login page
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [mode, setMode] = useState<'login'|'forgot'>('login')
  const [splash, setSplash] = useState<{show:boolean;name:string}>({show:false,name:''})
  const [biometric, setBiometric] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(ok => setBiometric(ok)).catch(() => {})
    }
  }, [])

  const signIn = useCallback((userEmail: string) => {
    const user = WORKFORCE_USERS[userEmail]
    if (!user) return
    sessionStorage.setItem('hicc_user', JSON.stringify({ email: userEmail, ...user }))

    // Show scripture splash on every login
    setSplash({ show: true, name: user.name })
  }, [router])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const user = WORKFORCE_USERS[email]
    if (!user || password !== DEMO_PASSWORD) { setErr('Incorrect email or password.'); return }
    setBusy(true)
    setTimeout(() => { setBusy(false); signIn(email) }, 700)
  }

  const useBiometric = async () => {
    setBioLoading(true)
    try {
      await new Promise<void>(res => setTimeout(res, 900))
      const linked = sessionStorage.getItem('hicc_biometric_email') || 'pastor@hicc.org'
      sessionStorage.setItem('hicc_biometric_email', linked)
      signIn(linked)
    } catch {
      setErr('Biometric not available. Please use your password.')
    } finally {
      setBioLoading(false)
    }
  }

  if (splash.show) {
    return <WelcomeSplash name={splash.name} onDone={() => { setSplash({show:false,name:''}); router.push('/dashboard') }}/>
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--dark)', padding:'1.25rem', position:'relative', overflow:'hidden' }}>
      {/* Ambient glow — subtle, not loud */}
      <div style={{ position:'fixed', top:'-15%', left:'-10%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(27,67,50,0.35) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-10%', right:'-8%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', filter:'blur(48px)', pointerEvents:'none' }}/>

      {mode === 'forgot'
        ? <ForgotFlow onBack={() => { setMode('login'); setErr('') }}/>
        : (
          <div style={{ width:'100%', maxWidth:380 }}>
            {/* Logo mark */}
            <div style={{ textAlign:'center', marginBottom:'2rem' }}>
              <div style={{ width:48, height:48, background:'var(--grad-brand)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'var(--sh-brand)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="22" height="22"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
              </div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'white', letterSpacing:'-.01em', marginBottom:3 }}>HICC Workforce</h1>
              <p style={{ fontSize:12.5, color:'rgba(255,255,255,.35)' }}>Sign in to your account</p>
            </div>

            {/* Card */}
            <div className="glass" style={{ padding:'1.75rem' }}>
              {err && (
                <div style={{ background:'rgba(197,48,48,.12)', border:'1px solid rgba(197,48,48,.28)', borderRadius:8, padding:'10px 14px', fontSize:12.5, color:'#FCA5A5', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {err}
                </div>
              )}

              <form onSubmit={submit}>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>Email</label>
                  <input className="input-dark" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@hicc.org" required autoFocus autoComplete="username email"/>
                </div>

                <div style={{ marginBottom:8 }}>
                  <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>Password</label>
                  <div style={{ position:'relative' }}>
                    <input className="input-dark" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required autoComplete="current-password" style={{ paddingRight:42 }}/>
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', padding:4, display:'flex' }}>
                      {showPwd
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                <div style={{ textAlign:'right', marginBottom:18 }}>
                  <button type="button" onClick={() => setMode('forgot')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--gold)', padding:0, fontFamily:'var(--font-body)' }}>Forgot password?</button>
                </div>

                <button type="submit" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14, fontWeight:700 }} disabled={busy}>
                  {busy ? (
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="anim-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Signing in…
                    </span>
                  ) : 'Sign in'}
                </button>
              </form>

              {biometric && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0' }}>
                    <div style={{ flex:1, height:1, background:'rgba(255,255,255,.1)' }}/>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,.25)', whiteSpace:'nowrap' }}>or</span>
                    <div style={{ flex:1, height:1, background:'rgba(255,255,255,.1)' }}/>
                  </div>
                  <button onClick={useBiometric} disabled={bioLoading} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:9, padding:'10px', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, background:'rgba(255,255,255,.05)', cursor:'pointer', color:'rgba(255,255,255,.7)', fontSize:13.5, fontWeight:500, fontFamily:'var(--font-body)', transition:'all .15s' }}>
                    {bioLoading
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17" className="anim-spin"><path d="M21 12a9 9 0 1 1-6-8.56"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M4.93 10.93A8 8 0 0 0 12 20a8 8 0 0 0 7.07-9.07"/></svg>
                    }
                    {bioLoading ? 'Verifying…' : 'Use Face ID / Fingerprint'}
                  </button>
                </>
              )}
            </div>

            <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.2)', marginTop:'1.25rem' }}>
              New member? <Link href="/signup" style={{ color:'var(--gold)' }}>Register here</Link>
            </p>
            <PoweredBy dark={true}/>
          </div>
        )
      }
    </div>
  )
}
