'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import PoweredBy from '@/lib/PoweredBy'
import { getOrgSettings } from '@/lib/orgSettings'

export default function Landing() {
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    const s = getOrgSettings()
    if (s.logoUrl) setLogoUrl(s.logoUrl)
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--dark)', color:'white', position:'relative', overflow:'hidden' }}>

      {/* Ambient orbs */}
      <div style={{ position:'fixed', top:'-15%', left:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(27,67,50,0.4) 0%, transparent 70%)', filter:'blur(70px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)', filter:'blur(56px)', pointerEvents:'none' }}/>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,.07)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', background:'rgba(13,31,22,0.88)', padding:'0 1.5rem' }}>
        <div style={{ maxWidth:1060, margin:'0 auto', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {logoUrl
              ? <img src={logoUrl} alt="Church logo" style={{ width:32, height:32, borderRadius:8, objectFit:'cover' }}/>
              : <div style={{ width:32, height:32, background:'var(--grad-brand)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-brand)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                </div>
            }
            <span style={{ fontSize:14, fontWeight:800, fontFamily:'var(--font-display)', letterSpacing:'-.01em', color:'white' }}>HICC Workforce</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Link href="/signup" style={{ fontSize:13, color:'rgba(255,255,255,.5)', textDecoration:'none', padding:'7px 14px' }}>Register</Link>
            <Link href="/login" className="btn btn-brand btn-sm" style={{ textDecoration:'none' }}>Sign in</Link>
          </div>
        </div>
      </nav>

      {/* Hero — centred, nothing beneath the two buttons */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'3rem 1.5rem', position:'relative' }}>

        {/* Logo mark */}
        <div style={{ width:64, height:64, background:'var(--grad-brand)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 30px', boxShadow:'0 8px 32px rgba(27,67,50,0.50)', overflow:'hidden' }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ width:64, height:64, objectFit:'cover' }}/>
            : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="30" height="30"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          }
        </div>

        {/* Church name */}
        <p style={{ fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:18 }}>
          Harvesters International Christian Centre
        </p>

        {/* Headline */}
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5.5vw,3.6rem)', fontWeight:800, letterSpacing:'-.04em', lineHeight:1.08, color:'white', marginBottom:16, maxWidth:680 }}>
          Welcome to the Harvesters Workers Community
        </h1>

        {/* Single unifying statement */}
        <p style={{ fontSize:'clamp(14px,1.8vw,16.5px)', color:'rgba(255,255,255,.5)', lineHeight:1.75, maxWidth:420, marginBottom:40, fontStyle:'italic' }}>
          Many members, one mission — raising champions for God's Kingdom, together.
        </p>

        {/* CTAs only — nothing else below */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <Link href="/login" className="btn btn-brand btn-lg" style={{ textDecoration:'none', padding:'14px 36px', fontSize:15, fontWeight:700 }}>
            Sign in to your account
          </Link>
          <Link href="/signup" style={{
            textDecoration:'none', display:'inline-flex', alignItems:'center',
            padding:'14px 28px', border:'1px solid rgba(255,255,255,.20)',
            borderRadius:20, fontSize:14, color:'rgba(255,255,255,.72)',
            fontWeight:500, fontFamily:'var(--font-body)', transition:'all .15s',
            backdropFilter:'blur(8px)', background:'rgba(255,255,255,.04)',
          }}>
            Register as a worker
          </Link>
        </div>
      </div>

      {/* Footer — copyright + powered by only */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'1rem 1.5rem', display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
        <p style={{ fontSize:11, color:'rgba(255,255,255,.18)', marginBottom:4 }}>
          © {new Date().getFullYear()} Harvesters International Christian Centre. All rights reserved.
        </p>
        <PoweredBy dark={true}/>
      </footer>
    </div>
  )
}
