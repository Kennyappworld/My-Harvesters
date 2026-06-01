'use client'
import { useState, useEffect } from 'react'
import { prayerRequests } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'

const SCOPE_COL: Record<string,string> = { unit:'var(--green)', branch:'var(--blue)', global:'var(--red)' }

export default function Prayer() {
  const [requests, setRequests] = useState(() => hydrate('hicc_prayer_requests', prayerRequests.map(r => ({ ...r, isInterceding: false }))))
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text:'', scope:'unit' })
  const [saved, setSaved] = useState(false)

  const filtered = filter === 'all' ? requests : requests.filter(r => r.scope === filter)

  const intercede = (id: string) => {
    setRequests(prev => { const n = prev.map(r => r.id === id ? { ...r, interceding: r.isInterceding ? r.interceding-1 : r.interceding+1, isInterceding: !r.isInterceding } : r); persist('hicc_prayer_requests', n); return n })
  }

  const elevate = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, scope: r.scope === 'unit' ? 'branch' : 'global' } : r))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text.trim()) return
    setRequests(prev => [{
      id: `p${Date.now()}`, author:'You', branch:'Lekki HQ', branchId:'lekki',
      initials:'BI', av:'brand', time:'just now', scope: form.scope as any,
      elevated: false, text: form.text, interceding: 0, responses: 0, isInterceding: false
    }, ...prev])
    setForm({ text:'', scope:'unit' }); setSaved(true)
    setTimeout(() => { setSaved(false); setShowForm(false) }, 2000)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Prayer Wall</div>
          <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>Unit → Branch → Global elevation · {requests.length} active requests</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={()=>setShowForm(v=>!v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Post request
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {[['all','All'],['unit','Unit'],['branch','Branch'],['global','Global']].map(([k,l]) => (
          <button key={k} className={`tab ${filter===k?'active':''}`} onClick={()=>setFilter(k)}>{l}</button>
        ))}
      </div>

      {/* Post form */}
      {showForm && (
        <div className="card card-p" style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Post a prayer request</div>
          {saved && <div style={{ padding:'8px 12px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--green)', marginBottom:12, fontWeight:600 }}>✓ Prayer request posted.</div>}
          <form onSubmit={submit}>
            <textarea className="input" rows={3} placeholder="Share your prayer request…" value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} style={{ resize:'vertical', marginBottom:10 }}/>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <select className="input" value={form.scope} onChange={e=>setForm(f=>({...f,scope:e.target.value}))} style={{ width:160 }}>
                <option value="unit">Unit only</option>
                <option value="branch">Branch</option>
                <option value="global">Global</option>
              </select>
              <button type="submit" className="btn btn-brand btn-sm" style={{ flexShrink:0 }}>Post request</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Requests */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className={`av av-md av-${r.av}`}>{r.initials}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{r.author}</div>
                  <div style={{ fontSize:11, color:'var(--t-3)', marginTop:1 }}>{r.branch} · {r.time}</div>
                </div>
              </div>
              <span style={{ background:`${SCOPE_COL[r.scope]}20`, color:SCOPE_COL[r.scope], border:`1px solid ${SCOPE_COL[r.scope]}40`, padding:'2px 10px', borderRadius:100, fontSize:11, fontWeight:600 }}>{r.scope}</span>
            </div>

            <div style={{ fontSize:13.5, color:'var(--t-1)', lineHeight:1.75, marginBottom:14, paddingLeft:46 }}>{r.text}</div>

            <div style={{ display:'flex', gap:10, alignItems:'center', paddingLeft:46, flexWrap:'wrap' }}>
              <button onClick={()=>intercede(r.id)} className="btn btn-sm" style={{ background: r.isInterceding?'var(--red-lt)':'transparent', border:`1px solid ${r.isInterceding?'var(--red)':'var(--border-md)'}`, color:r.isInterceding?'var(--red)':'var(--t-2)', gap:5 }}>
                <svg viewBox="0 0 24 24" fill={r.isInterceding?'var(--red)':'none'} stroke={r.isInterceding?'var(--red)':'currentColor'} strokeWidth="2" width="12" height="12"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {r.interceding} praying
              </button>

              {r.scope !== 'global' && (
                <button onClick={()=>elevate(r.id)} className="btn btn-sm" style={{ gap:5 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  Elevate to {r.scope==='unit'?'branch':'global'}
                </button>
              )}

              {r.responses > 0 && (
                <span style={{ fontSize:11.5, color:'var(--t-3)' }}>{r.responses} responses</span>
              )}

              {r.elevated && <span className="chip chip-gold">Elevated</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>No prayer requests in this scope yet.</div>}
      </div>
    </div>
  )
}
