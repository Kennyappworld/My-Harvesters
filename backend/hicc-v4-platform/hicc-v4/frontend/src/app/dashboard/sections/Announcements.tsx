'use client'
import { useState } from 'react'
import { announcements } from '@/lib/data'

export default function Announcements() {
  const [items, setItems] = useState(announcements)
  const [compose, setCompose] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [scope, setScope] = useState<'all'|'branch'>('all')

  const publish = () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setItems(p => [{
      id: String(Date.now()), title:newTitle, from:'Senior Pastor', to: scope==='all'?'All branches':'Lekki HQ',
      date:'May 26', scope, reached:scope==='all'?71200:18200, read:0, status:'published', body:newBody,
    }, ...p])
    setNewTitle(''); setNewBody(''); setCompose(false)
  }

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="section-title">Announcements</h1>
          <p className="section-sub">Broadcasts with read receipts — see exactly who received and read each announcement</p>
        </div>
        <button className="btn btn-brand" onClick={() => setCompose(!compose)}>+ Compose</button>
      </div>

      {compose && (
        <div className="card fade-up" style={{ border:'1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15, marginBottom:16 }}>New Announcement</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input className="input" placeholder="Announcement title…" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
            <textarea className="input" rows={4} placeholder="Body…" style={{ resize:'vertical' }} value={newBody} onChange={e=>setNewBody(e.target.value)} />
            <div style={{ display:'flex', gap:10, alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:8 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--t-2)', cursor:'pointer' }}>
                  <input type="radio" name="scope" checked={scope==='all'} onChange={() => setScope('all')} /> All branches
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--t-2)', cursor:'pointer' }}>
                  <input type="radio" name="scope" checked={scope==='branch'} onChange={() => setScope('branch')} /> This branch only
                </label>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setCompose(false)}>Cancel</button>
                <button className="btn btn-brand btn-sm" onClick={publish}>Publish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {items.map(a => (
          <div key={a.id} className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15, color:'var(--t-1)', marginBottom:4 }}>{a.title}</div>
                <div style={{ fontSize:12.5, color:'var(--t-3)' }}>From {a.from} · To {a.to} · {a.date}</div>
              </div>
              <span className={`badge ${a.status==='published'?'badge-green':'badge-amber'}`}>{a.status}</span>
            </div>
            <p style={{ fontSize:13.5, color:'var(--t-2)', lineHeight:1.65, marginBottom:14 }}>{a.body}</p>
            {a.status === 'published' && a.reached > 0 && (
              <div style={{ padding:'10px 14px', background:'var(--s-3)', borderRadius:'var(--r-sm)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-heading)', fontWeight:600, marginBottom:3 }}>REACHED</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--t-1)' }}>{a.reached.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-heading)', fontWeight:600, marginBottom:3 }}>READ</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--green)' }}>{a.read.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-heading)', fontWeight:600, marginBottom:3 }}>READ RATE</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)' }}>{Math.round((a.read/a.reached)*100)}%</div>
                  </div>
                  <div style={{ flex:1, display:'flex', alignItems:'center' }}>
                    <div className="progress-bar" style={{ flex:1, height:8 }}>
                      <div className="progress-fill" style={{ width:`${Math.round((a.read/a.reached)*100)}%`, background:'var(--green)' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
