'use client'
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SCRIPTURES = [
  { verse: "For where two or three gather in my name, there am I with them.", ref: 'Matthew 18:20' },
  { verse: "Let us not give up meeting together, but let us encourage one another.", ref: 'Hebrews 10:25' },
  { verse: "How good and pleasant it is when God's people live together in unity!", ref: 'Psalm 133:1' },
  { verse: "The Lord bless you and keep you; the Lord make his face shine on you.", ref: 'Numbers 6:24-25' },
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
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', transition:'opacity 0.5s', opacity }}>
      <div style={{ position:'absolute', top:'-10%', left:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ textAlign:'center', maxWidth:500, padding:'2rem', position:'relative' }}>
        <div style={{ width:72, height:72, background:'var(--brand)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'var(--sh-brand)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="36" height="36"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(245,158,11,0.9)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Grace and peace to you</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, color:'white', letterSpacing:'-0.02em', marginBottom:8 }}>{name}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:28 }}>Harvesters International Christian Centre</div>
        <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:16, padding:'20px 24px', marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.8)', marginBottom:12, letterSpacing:'0.08em', textTransform:'uppercase' }}>A word for today</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:16, color:'white', lineHeight:1.75, fontStyle:'italic', marginBottom:12 }}>"{scripture.verse}"</div>
          <div style={{ fontSize:12, color:'rgba(245,158,11,0.9)', fontWeight:700 }}>— {scripture.ref}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'rgba(255,255,255,0.4)', fontSize:12 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', border:'2px solid var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--brand-lt)', fontFamily:'var(--font-mono)' }}>{countdown}</div>
          <span>Entering your portal…</span>
        </div>
        <button onClick={onDone} style={{ marginTop:14, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,0.3)', textDecoration:'underline' }}>Enter now</button>
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
  const [splash, setSplash] = useState<{show:boolean;name:string}>({show:false,name:''})

  const USERS: Record<string,string> = {
    'pastor@hicc.org':'Pastor Bolaji Idowu',
    'pastor.ikeja@hicc.org':'Pastor Kanmi Adeyemi',
    'pastor.london@hicc.org':'Pastor James Osei',
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
        if (isFirst) setSplash({show:true, name:USERS[form.email]})
        else router.push('/dashboard')
      } else {
        setError('Invalid credentials. Use pastor@hicc.org / demo123')
      }
    } catch { setError('Login failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (splash.show) return <ScriptureSplash name={splash.name} onDone={() => router.push('/dashboard')} />

  return (
    /* Dark navy background matching guide cover */
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--navy)', position:'relative', overflow:'hidden' }}>
      {/* Large purple orb left */}
      <div style={{ position:'fixed', top:'-20%', left:'-15%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(88,28,235,0.45) 0%, transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      {/* Smaller dark circle bottom right — matches guide */}
      <div style={{ position:'fixed', bottom:'-15%', right:'-10%', width:400, height:400, borderRadius:'50%', background:'rgba(50,30,100,0.6)', filter:'blur(60px)', pointerEvents:'none' }}/>

      {/* Left brand panel */}
      <div style={{ flex:'1 1 50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem', position:'relative' }}>
        {/* Cross logo — exact from guide */}
        <div style={{ width:96, height:96, background:'var(--brand)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:32, boxShadow:'0 8px 40px rgba(124,58,237,0.5)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="48" height="48"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        {/* HARVESTERS text — exact guide style */}
        <div style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, color:'white', letterSpacing:'0.15em', fontFamily:'var(--font-display)', marginBottom:8, textAlign:'center' }}>HARVESTERS</div>
        <div style={{ fontSize:'clamp(0.7rem,1.5vw,1rem)', fontWeight:600, color:'rgba(255,255,255,0.65)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:16, textAlign:'center' }}>INTERNATIONAL CHRISTIAN CENTER</div>
        {/* Gold divider line */}
        <div style={{ width:140, height:3, background:'var(--gold)', borderRadius:2, marginBottom:20 }}/>
        <div style={{ fontSize:16, fontStyle:'italic', color:'rgba(255,255,255,0.6)', fontFamily:'var(--font-display)', textAlign:'center' }}>Platform User Navigation Guide</div>
        <div style={{ fontSize:12, color:'rgba(245,158,11,0.7)', marginTop:12 }}>v5.0 · 2026</div>
      </div>

      {/* Right login panel */}
      <div style={{ flex:'0 0 420px', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', position:'relative' }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'2.5rem' }}>
            <div style={{ textAlign:'center', marginBottom:'2rem' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'white', fontFamily:'var(--font-display)', letterSpacing:'-0.02em', marginBottom:6 }}>Sign in to continue</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Leadership Portal · Harvesters HICC</div>
            </div>

            {error && (
              <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, fontSize:12.5, color:'#FCA5A5', marginBottom:16 }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>Email address</label>
                <input style={{ width:'100%', padding:'11px 14px', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontSize:13.5, background:'rgba(255,255,255,0.08)', color:'white', fontFamily:'var(--font-body)', outline:'none', transition:'border-color 0.15s' }}
                  type="email" placeholder="pastor@hicc.org" value={form.email}
                  onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                  onFocus={e=>{e.target.style.borderColor='var(--brand)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.15)'}}
                  required autoFocus/>
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input style={{ width:'100%', padding:'11px 42px 11px 14px', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:10, fontSize:13.5, background:'rgba(255,255,255,0.08)', color:'white', fontFamily:'var(--font-body)', outline:'none', transition:'border-color 0.15s' }}
                    type={showPwd?'text':'password'} placeholder="••••••••" value={form.password}
                    onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                    onFocus={e=>{e.target.style.borderColor='var(--brand)'}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.15)'}}
                    required/>
                  <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">{showPwd?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background:'var(--brand)', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'var(--font-display)', letterSpacing:'0.01em', boxShadow:'0 4px 20px rgba(124,58,237,0.45)', transition:'all 0.15s', opacity:loading?0.8:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <><svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="16" height="16"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Signing in…</> : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:16 }}>
              <span style={{ fontSize:12, color:'rgba(245,158,11,0.75)', cursor:'pointer' }}>Forgot Password?</span>
            </div>

            <div style={{ marginTop:'1.5rem', padding:'12px 14px', background:'rgba(255,255,255,0.05)', borderRadius:10, fontSize:12, color:'rgba(255,255,255,0.4)', textAlign:'center', border:'1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Demo:</span> pastor@hicc.org · demo123
            </div>
          </div>
          <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:'1rem' }}>
            Each role sees a different dashboard view
          </p>
        </div>
      </div>

      {/* Bottom right nav hint — matches guide */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, height:56, background:'rgba(26,18,69,0.9)', backdropFilter:'blur(10px)', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', gap:48 }}>
        {[['🏠','Home'],['👥','Members'],['🙏','Prayer'],['💬','Chat']].map(([icon,label])=>(
          <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:0.5 }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.6)', letterSpacing:'0.05em' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
