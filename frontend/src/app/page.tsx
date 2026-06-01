'use client'
import Link from 'next/link'

// Simple, clean landing — just directs people to sign in
// The app itself is the product; the landing doesn't need to be a showcase
export default function Landing() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--dark)', color:'white', position:'relative', overflow:'hidden' }}>

      {/* Ambient orbs */}
      <div style={{ position:'fixed', top:'-15%', left:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(27,67,50,0.4) 0%, transparent 70%)', filter:'blur(70px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)', filter:'blur(56px)', pointerEvents:'none' }}/>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,.07)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', background:'rgba(13,31,22,0.85)', padding:'0 1.5rem' }}>
        <div style={{ maxWidth:1060, margin:'0 auto', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:32, height:32, background:'var(--grad-brand)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-brand)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            </div>
            <span style={{ fontSize:14, fontWeight:800, fontFamily:'var(--font-display)', letterSpacing:'-.01em', color:'white' }}>HICC Workforce</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Link href="/signup" style={{ fontSize:13, color:'rgba(255,255,255,.5)', textDecoration:'none', padding:'7px 14px' }}>Register</Link>
            <Link href="/login" className="btn btn-brand btn-sm" style={{ textDecoration:'none' }}>Sign in</Link>
          </div>
        </div>
      </nav>

      {/* Hero — confident, not cluttered */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'3rem 1.5rem', position:'relative' }}>

        <div style={{ width:60, height:60, background:'var(--grad-brand)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', boxShadow:'0 8px 32px rgba(27,67,50,0.45)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="28" height="28"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>

        <p style={{ fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:14 }}>Harvesters International Christian Centre</p>

        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2.2rem,6vw,4rem)', fontWeight:800, letterSpacing:'-.04em', lineHeight:1.06, color:'white', marginBottom:18, maxWidth:700 }}>
          One platform for the whole workforce
        </h1>

        <p style={{ fontSize:'clamp(14px,2vw,17px)', color:'rgba(255,255,255,.45)', lineHeight:1.7, maxWidth:480, marginBottom:38 }}>
          Member growth. Soul tracking. Community. Prayer. Pastoral intelligence. Every branch, one view.
        </p>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <Link href="/login" className="btn btn-brand btn-lg" style={{ textDecoration:'none', padding:'13px 32px', fontSize:15 }}>Sign in to your account</Link>
          <Link href="/signup" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', padding:'13px 26px', border:'1px solid rgba(255,255,255,.18)', borderRadius:20, fontSize:14, color:'rgba(255,255,255,.7)', fontWeight:500, fontFamily:'var(--font-body)', transition:'all .15s' }}>Register as a member</Link>
        </div>

        {/* Capability strip — clean, no icons, no clutter */}
        <div style={{ marginTop:56, display:'flex', gap:0, flexWrap:'wrap', justifyContent:'center', borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:36, maxWidth:640, width:'100%' }}>
          {['Growth analytics', 'Soul tracker', 'Community chat', 'Prayer wall', 'Pastoral pulse', 'Workforce', 'Meetings', 'Digital ID cards'].map((f, i) => (
            <span key={f} style={{ fontSize:12, color:'rgba(255,255,255,.32)', padding:'4px 12px', borderRight: i < 7 ? '1px solid rgba(255,255,255,.1)' : 'none', whiteSpace:'nowrap', lineHeight:2 }}>{f}</span>
          ))}
        </div>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.07)', padding:'1.25rem 1.5rem', textAlign:'center' }}>
        <p style={{ fontSize:11.5, color:'rgba(255,255,255,.2)' }}>© {new Date().getFullYear()} Harvesters International Christian Centre. All rights reserved.</p>
      </footer>
    </div>
  )
}
