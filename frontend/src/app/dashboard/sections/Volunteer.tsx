'use client'
import { useState } from 'react'
import { volunteerSlots } from '@/lib/data'

export default function Volunteer() {
  const [slots, setSlots] = useState(volunteerSlots)

  const signUp = (id: string) => {
    setSlots(p => p.map(s => s.id===id && s.confirmed < s.need ? {...s, confirmed:s.confirmed+1} : s))
  }

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="section-title">Workforce Scheduler</h1>
          <p className="section-sub">Serving slots for the upcoming Sunday — sign up or manage capacity</p>
        </div>
        <button className="btn btn-brand">+ Add slot</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
        {slots.map(s => {
          const pct = (s.confirmed/s.need)*100
          const full = s.confirmed >= s.need
          return (
            <div key={s.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:14, color:'var(--t-1)' }}>{s.title}</div>
                  <div style={{ fontSize:12, color:'var(--t-3)', marginTop:3 }}>{s.branch} · {s.date}</div>
                </div>
                <span className={`badge ${full?'badge-green':'badge-amber'}`}>{full?'Full':'Open'}</span>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12.5, color:'var(--t-2)' }}>
                  <span>Confirmed</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color: full?'var(--green)':'var(--t-1)' }}>{s.confirmed}/{s.need}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${pct}%`, background: s.color }} />
                </div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <span className="badge badge-teal" style={{ fontSize:11 }}>{s.dept}</span>
                {!full && <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={() => signUp(s.id)}>Sign up</button>}
                {full && <span style={{ marginLeft:'auto', fontSize:12, color:'var(--green)', fontFamily:'var(--font-heading)', fontWeight:500 }}>✓ Full</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
