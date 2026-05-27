'use client'
import { useState } from 'react'
import { prayerRequests } from '@/lib/data'

const AV_COLORS: Record<string,string> = { blue:'#3B82F6', amber:'var(--brand)', teal:'var(--accent)', purple:'#A855F7', red:'#EF4444' }
const scopeLabel: Record<string,{label:string;cls:string}> = {
  unit:   { label:'Unit',   cls:'badge-teal' },
  branch: { label:'Branch', cls:'badge-blue' },
  global: { label:'Global', cls:'badge-amber' },
}

export default function Prayer() {
  const [requests, setRequests] = useState(prayerRequests)
  const [newText, setNewText] = useState('')
  const [filter, setFilter] = useState<'all'|'unit'|'branch'|'global'>('all')

  const filtered = filter === 'all' ? requests : requests.filter(r => r.scope === filter)

  const elevate = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      const next = r.scope === 'unit' ? 'branch' : 'global'
      return { ...r, scope: next, interceding: r.interceding + 10 }
    }))
  }

  const intercede = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, interceding: r.interceding + 1 } : r))
  }

  const submit = () => {
    if (!newText.trim()) return
    setRequests(prev => [{
      id: String(Date.now()), author:'You', branch:'Lekki HQ', initials:'PB',
      avatar:'blue', time:'just now', scope:'unit', elevated:false,
      text: newText.trim(), interceding:0, responses:0
    }, ...prev])
    setNewText('')
  }

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 className="section-title">Prayer Wall</h1>
        <p className="section-sub">Requests scoped by unit → branch → global. Unit heads can elevate to branch; branch pastors can elevate to global.</p>
      </div>

      {/* Post new request */}
      <div className="card">
        <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15, marginBottom:12 }}>Post a Prayer Request</div>
        <textarea
          className="input" rows={3}
          style={{ resize:'vertical', minHeight:80 }}
          placeholder="Share your prayer request with your unit…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
        />
        <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-brand" onClick={submit}>Post to unit →</button>
        </div>
      </div>

      {/* Filter */}
      <div className="tab-bar" style={{ width:'fit-content' }}>
        {(['all','global','branch','unit'] as const).map(f => (
          <button key={f} className={`tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}{f==='all'?'':(f==='global'?' 🌐':f==='branch'?' 🏢':' 👥')}
          </button>
        ))}
      </div>

      {/* Requests */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ position:'relative' }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <div className="av av-md" style={{ background:`${AV_COLORS[r.avatar]||AV_COLORS.blue}22`, color:AV_COLORS[r.avatar]||AV_COLORS.blue, flexShrink:0 }}>{r.initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div>
                    <span style={{ fontFamily:'var(--font-heading)', fontWeight:600, color:'var(--t-1)', fontSize:14 }}>{r.author}</span>
                    <span style={{ fontSize:12, color:'var(--t-3)', marginLeft:8 }}>{r.branch}</span>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span className={`badge ${scopeLabel[r.scope].cls}`}>{scopeLabel[r.scope].label}</span>
                    <span style={{ fontSize:11.5, color:'var(--t-3)' }}>{r.time}</span>
                  </div>
                </div>
                <p style={{ fontSize:14, color:'var(--t-2)', lineHeight:1.65, marginBottom:12 }}>{r.text}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => intercede(r.id)}>
                    🙏 Interceding ({r.interceding})
                  </button>
                  {r.scope !== 'global' && (
                    <button className="btn btn-sm" style={{ background:'var(--brand-lt)', color:'var(--brand)', border:'1px solid rgba(245,158,11,0.3)' }} onClick={() => elevate(r.id)}>
                      ↑ Elevate to {r.scope==='unit'?'branch':'global'}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm">{r.responses} responses</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
