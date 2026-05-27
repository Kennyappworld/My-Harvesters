'use client'
import { useState } from 'react'

export default function Settings() {
  const [cleared, setCleared] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleClear = () => {
    if (!confirming) { setConfirming(true); return }
    // Clear all localStorage demo overrides and reset UI state
    localStorage.removeItem('hicc_data_cleared')
    localStorage.setItem('hicc_data_cleared', 'true')
    setCleared(true)
    setConfirming(false)
    // Force page reload to reflect cleared state
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:700 }}>
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-sub">Platform configuration — organisation profile and role management</p>
      </div>

      {[
        {
          title:'Organisation Profile',
          fields:[
            { label:'Organisation name',     value:'Harvesters International Christian Centre' },
            { label:'Senior Pastor',          value:'Pastor Bolaji Idowu' },
            { label:'Headquarters',           value:'Lekki Phase 1, Lagos, Nigeria' },
            { label:'Platform access',        value:'Internal — leadership only' },
          ]
        },
        {
          title:'Security',
          fields:[
            { label:'Session timeout',        value:'15 minutes (JWT)' },
            { label:'Refresh token lifetime', value:'7 days (httpOnly cookie)' },
            { label:'2FA',                    value:'Enabled for Senior Pastor and above' },
            { label:'Login attempt limit',    value:'10 per 15 minutes per IP' },
          ]
        },
        {
          title:'Platform Version',
          fields:[
            { label:'Frontend',  value:'Next.js 14 App Router · TypeScript' },
            { label:'Backend',   value:'Node.js / Express · JWT Auth' },
            { label:'Version',   value:'v4.0.0' },
            { label:'Built',     value:'May 2026' },
          ]
        }
      ].map((section, i) => (
        <div key={i} className="card">
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15, color:'var(--t-1)', marginBottom:16 }}>{section.title}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {section.fields.map((f, j) => (
              <div key={j} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--s-3)', borderRadius:'var(--r-sm)', border:'1px solid var(--border)' }}>
                <span style={{ fontSize:13.5, color:'var(--t-2)' }}>{f.label}</span>
                <span style={{ fontFamily:'var(--font-heading)', fontSize:13.5, fontWeight:500, color:'var(--t-1)' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card" style={{ background:'var(--red-lt)', border:'1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--red)', marginBottom:8 }}>Danger Zone</div>
        <div style={{ fontSize:13.5, color:'var(--t-2)', marginBottom:14 }}>
          These actions are irreversible. Senior Pastor access required.
        </div>

        {cleared ? (
          <div style={{ padding:'10px 16px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'var(--r-sm)', color:'#10B981', fontSize:13.5, fontWeight:600 }}>
            ✅ Demo data cleared. Reloading...
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:'var(--t-2)', padding:'10px 14px', background:'rgba(239,68,68,0.06)', borderRadius:'var(--r-sm)', border:'1px solid rgba(239,68,68,0.15)' }}>
              <strong style={{ color:'var(--red)' }}>Clear Demo Data</strong> — Removes all placeholder figures from the dashboard. Your real data can then be entered or imported. This cannot be undone.
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleClear}
              style={{ alignSelf:'flex-start', background: confirming ? '#dc2626' : undefined, transform: confirming ? 'scale(1.02)' : undefined }}
            >
              {confirming ? '⚠️ Click again to confirm — this cannot be undone' : 'Reset all demo data'}
            </button>
            {confirming && (
              <button onClick={() => setConfirming(false)} style={{ alignSelf:'flex-start', fontSize:12, color:'var(--t-3)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
