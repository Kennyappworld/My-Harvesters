'use client'
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SCRIPTURES = [
  { verse: "For where two or three gather in my name, there am I with them.", ref: 'Matthew 18:20' },
  { verse: "Let us not give up meeting together, as some are in the habit of doing, but let us encourage one another.", ref: 'Hebrews 10:25' },
  { verse: "How good and pleasant it is when God's people live together in unity!", ref: 'Psalm 133:1' },
  { verse: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.", ref: 'Numbers 6:24-25' },
  { verse: "Commit to the Lord whatever you do, and he will establish your plans.", ref: 'Proverbs 16:3' },
]

function ScriptureSplash({ name, onDone }: { name: string; onDone: () => void }) {
  const [opacity, setOpacity] = useState(0)
  const [countdown, setCountdown] = useState(4)
  const [scripture] = useState(() => SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)])

  useEffect(() => {
    setTimeout(() => setOpacity(1), 50)
    const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    const fade = setTimeout(() => { setOpacity(0); setTimeout(onDone, 500) }, 4000)
    return () => { clearTimeout(fade); clearInterval(iv) }
  }, [onDone])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'var(--s-1)', display:'flex', alignItems:'center', justifyContent:'center', transition:'opacity 0.5s ease', opacity }}>
      <div style={{ position:'absolute', top:'-10%', left:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ textAlign:'center', maxWidth:520, padding:'2rem', position:'relative' }}>
        <div style={{ width:52, height:52, background:'var(--brand)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'var(--sh-brand)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#09090B" strokeWidth="2" width="26" height="26"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div style={{ fontSize:11, fontWeight:500, color:'var(--brand)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Grace and peace to you</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.4rem,3vw,1.9rem)', fontWeight:700, color:'var(--t-1)', letterSpacing:'-0.02em', marginBottom:6, lineHeight:1.2 }}>{name}</div>
        <div style={{ fontSize:13, color:'var(--t-2)', marginBottom:28 }}>Harvesters International Christian Centre</div>
        <div style={{ background:'var(--s-2)', border:'0.5px solid var(--border)', borderRadius:14, padding:'20px 24px', marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--brand)', marginBottom:12, letterSpacing:'0.07em', textTransform:'uppercase' }}>A word for today</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:15.5, color:'var(--t-1)', lineHeight:1.75, fontStyle:'italic', marginBottom:12 }}>"{scripture.verse}"</div>
          <div style={{ fontSize:11.5, color:'var(--brand)', fontWeight:600 }}>— {scripture.ref}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--t-3)', fontSize:12 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--brand)', fontFamily:'var(--font-mono)' }}>{countdown}</div>
          <span>Entering your portal…</span>
        </div>
        <button onClick={onDone} style={{ marginTop:14, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--t-3)', textDecoration:'underline' }}>Enter now</button>
      </div>
    </div>
  )
}

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [splash, setSplash] = useState<{show:boolean;name:string}>({ show:false, name:'' })

  const USERS: Record<string,string> = {
    'pastor@hicc.org': 'Pastor Bolaji Idowu',
    'pastor.ikeja@hicc.org': 'Pastor Kanmi Adeyemi',
    'pastor.london@hicc.org': 'Pastor James Osei',
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('Enter a valid email address.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      if (USERS[form.email] && form.password === 'demo123') {
        const isFirst = !sessionStorage.getItem('hicc_welcomed')
        sessionStorage.setItem('hicc_welcomed', '1')
        if (isFirst) { setSplash({ show:true, name:USERS[form.email] }) }
        else { router.push('/dashboard') }
      } else {
        setError('Invalid credentials. Use pastor@hicc.org / demo123 for the demo.')
      }
    } catch { setError('Login failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (splash.show) return <ScriptureSplash name={splash.name} onDone={() => router.push('/dashboard')} />

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--s-1)', padding:'1rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-15%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ width:'100%', maxWidth:400, position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, background:'var(--brand)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'var(--sh-brand)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#09090B" strokeWidth="2" width="26" height="26"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, letterSpacing:'-0.03em', marginBottom:4 }}>Harvesters HICC</h1>
          <p style={{ fontSize:13, color:'var(--t-3)' }}>Leadership Platform</p>
        </div>
        <div className="card glass" style={{ padding:'2rem' }}>
          <h2 style={{ fontSize:18, fontWeight:600, marginBottom:5 }}>Welcome back</h2>
          <p style={{ fontSize:13, color:'var(--t-2)', marginBottom:'1.5rem' }}>Sign in to your leadership account</p>
          {error && (
            <div style={{ padding:'10px 12px', background:'var(--red-lt)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--red)', marginBottom:'1rem', display:'flex', gap:8, alignItems:'flex-start', border:'0.5px solid rgba(239,68,68,0.25)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Email address</label>
              <input className="input" type="email" placeholder="pastor@hicc.org" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required autoComplete="email" autoFocus/>
            </div>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPwd?'text':'password'} placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required style={{ paddingRight:40 }}/>
                <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t-3)', padding:4 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">{showPwd?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-brand" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'10px', opacity:loading?0.75:1 }}>
              {loading ? <><svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Signing in…</> : 'Sign in to dashboard'}
            </button>
          </form>
          <div style={{ marginTop:'1.25rem', padding:'10px 12px', background:'var(--s-3)', borderRadius:'var(--r)', fontSize:12, color:'var(--t-2)', border:'0.5px solid var(--border)' }}>
            <strong style={{ color:'var(--t-1)' }}>Demo:</strong> pastor@hicc.org · demo123
          </div>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--t-3)', marginTop:'1rem' }}>
          <Link href="/" style={{ color:'var(--brand)' }}>← Back to home</Link> · Private platform
        </p>
      </div>
    </div>
  )
}
