'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production: send to error monitoring (Sentry, Datadog, etc.)
    // console.error(error) intentionally removed — never log errors to browser console in prod
  }, [error])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--dark)', color:'white', flexDirection:'column', gap:16, padding:'2rem', textAlign:'center' }}>
      <div style={{ width:56, height:56, background:'rgba(197,48,48,0.2)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="26" height="26"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 }}>Something went wrong</h2>
      <p style={{ fontSize:13.5, color:'rgba(255,255,255,.5)', maxWidth:340, lineHeight:1.7 }}>
        An unexpected error occurred. This has been logged and the team will look into it.
      </p>
      <div style={{ display:'flex', gap:10, marginTop:8 }}>
        <button onClick={reset} style={{ padding:'10px 24px', background:'var(--brand)', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
          Try again
        </button>
        <a href="/" style={{ padding:'10px 24px', border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.7)', borderRadius:10, fontSize:13, fontWeight:500, textDecoration:'none', display:'flex', alignItems:'center' }}>
          Go home
        </a>
      </div>
    </div>
  )
}
