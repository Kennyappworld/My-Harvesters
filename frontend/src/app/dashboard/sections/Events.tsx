'use client'
import { useState } from 'react'
import { events } from '@/lib/data'

export default function Events() {
  const [items, setItems] = useState(events)

  const approve = (id: string) => setItems(p => p.map(e => e.id===id ? {...e, status:'approved'} : e))

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="section-title">Events</h1>
          <p className="section-sub">Upcoming events — branches submit, HQ approves</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <span className="badge badge-amber">{items.filter(e=>e.status==='pending').length} pending approval</span>
          <button className="btn btn-brand btn-sm">+ New event</button>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {items.map(e => (
          <div key={e.id} className="card" style={{ borderColor: e.status==='pending' ? 'rgba(245,158,11,0.35)' : 'var(--border)' }}>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ textAlign:'center', background:'var(--s-3)', borderRadius:'var(--r-sm)', padding:'8px 12px', minWidth:52 }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t-3)' }}>{e.date.split(' ')[0].toUpperCase()}</div>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:800, color:'var(--brand)', lineHeight:1 }}>{e.date.split(' ')[1]}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15, color:'var(--t-1)' }}>{e.title}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <span className={`badge ${e.status==='approved'?'badge-green':'badge-amber'}`}>{e.status}</span>
                    <span className="badge badge-blue">{e.category}</span>
                  </div>
                </div>
                <div style={{ fontSize:13, color:'var(--t-3)', marginBottom:10 }}>{e.branch} · {e.time}</div>
                {e.status === 'approved' && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="progress-bar" style={{ flex:1 }}>
                      <div className="progress-fill" style={{ width:`${(e.registered/e.capacity)*100}%`, background:'var(--green)' }} />
                    </div>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t-2)' }}>{e.registered}/{e.capacity} registered</span>
                  </div>
                )}
                {e.status === 'pending' && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-brand btn-sm" onClick={() => approve(e.id)}>✓ Approve</button>
                    <button className="btn btn-danger btn-sm">✗ Decline</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
