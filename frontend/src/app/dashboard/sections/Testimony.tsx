'use client'
import { useState } from 'react'
import { testimonies } from '@/lib/data'

const AV_COLORS: Record<string,string> = { blue:'#3B82F6', amber:'var(--brand)', teal:'var(--accent)', purple:'#A855F7', red:'#EF4444' }
const CAT_BADGE: Record<string,string> = { Healing:'badge-green', Finance:'badge-amber', Salvation:'badge-blue', Breakthrough:'badge-purple' }

export default function Testimony() {
  const [items, setItems] = useState(testimonies)

  const celebrate = (id: string) => setItems(p => p.map(t => t.id===id ? {...t, celebrating:t.celebrating+1} : t))
  const feature = (id: string) => alert(`Testimony featured to all branches — in production this broadcasts to all 9 campus feeds`)

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="section-title">Testimony Feed</h1>
          <p className="section-sub">Celebrating what God is doing across the network. Feature a testimony to broadcast to all branches.</p>
        </div>
        <button className="btn btn-brand" onClick={() => alert('Share your testimony form — opens member submission flow')}>+ Share testimony</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {items.map(t => (
          <div key={t.id} className="card">
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
              <div className="av av-md" style={{ background:`${AV_COLORS[t.avatar]||AV_COLORS.blue}22`, color:AV_COLORS[t.avatar]||AV_COLORS.blue, flexShrink:0 }}>{t.initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--t-1)', fontSize:14 }}>{t.author}</div>
                    <div style={{ fontSize:12, color:'var(--t-3)' }}>{t.role} · {t.branch}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span className={`badge ${CAT_BADGE[t.category]||'badge-teal'}`}>{t.category}</span>
                    <span style={{ fontSize:12, color:'var(--t-3)' }}>{t.date}</span>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ fontSize:14.5, color:'var(--t-2)', lineHeight:1.7, marginBottom:16 }}>{t.text}</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => celebrate(t.id)}>🎉 Celebrating ({t.celebrating})</button>
              <button className="btn btn-ghost btn-sm">💬 {t.comments} comments</button>
              <button className="btn btn-sm" style={{ background:'var(--brand-lt)', color:'var(--brand)', border:'1px solid rgba(245,158,11,0.25)', marginLeft:'auto' }} onClick={() => feature(t.id)}>
                ✦ Feature to all branches
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
