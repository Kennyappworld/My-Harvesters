'use client'
import { useState } from 'react'
import { members, branches } from '@/lib/data'

const AV_COLORS: Record<string,string> = { blue:'#3B82F6', amber:'var(--brand)', teal:'var(--accent)', purple:'#A855F7', red:'#EF4444', green:'#22C55E' }

export default function Members() {
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [selected, setSelected] = useState<typeof members[0]|null>(null)

  const filtered = members.filter(m =>
    (branchFilter==='all' || m.branch.toLowerCase().includes(branchFilter)) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.branch.toLowerCase().includes(search.toLowerCase()))
  )

  const statusBadge = (s: string) => s==='active'?'badge-green':s==='at-risk'?'badge-amber':'badge-red'
  const roleBadge   = (r: string) => r==='branch_pastor'?'badge-purple':r==='unit_head'?'badge-blue':'badge-teal'

  return (
    <div className="fade-in" style={{ display:'flex', gap:16 }}>
      {/* List */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <h1 className="section-title">Members Directory</h1>
          <p className="section-sub">{members.length} records shown — filter by branch or name</p>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <input className="input" style={{ flex:1 }} placeholder="Search by name or branch…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="input" style={{ width:'auto' }} value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}>
            <option value="all">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(m => (
            <div key={m.id} className="card"
              style={{ cursor:'pointer', transition:'border-color 0.2s', borderColor: selected?.id===m.id ? 'var(--brand)' : 'var(--border)' }}
              onClick={() => setSelected(m)}
            >
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div className="av av-md" style={{ background:`${AV_COLORS[m.avatar]||AV_COLORS.blue}22`, color:AV_COLORS[m.avatar]||AV_COLORS.blue }}>{m.initials}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontWeight:600, color:'var(--t-1)', fontSize:14 }}>{m.name}</div>
                  <div style={{ fontSize:12, color:'var(--t-3)' }}>{m.branch} · {m.unit}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                  <span className={`badge ${statusBadge(m.status)}`}>{m.status}</span>
                  <span className={`badge ${roleBadge(m.role)}`}>{m.role.replace('_',' ')}</span>
                  <span className="badge badge-teal">GT Lvl {m.gtLevel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Passport panel */}
      {selected && (
        <div style={{ width:300, flexShrink:0 }}>
          <div className="card" style={{ position:'sticky', top:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15 }}>Growth Passport</div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'var(--t-3)', cursor:'pointer', fontSize:18 }}>×</button>
            </div>

            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div className="av av-lg" style={{ background:`${AV_COLORS[selected.avatar]||AV_COLORS.blue}22`, color:AV_COLORS[selected.avatar]||AV_COLORS.blue, margin:'0 auto 10px' }}>{selected.initials}</div>
              <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:16, color:'var(--t-1)' }}>{selected.name}</div>
              <div style={{ fontSize:12.5, color:'var(--t-3)' }}>{selected.branch} · Joined {selected.joined}</div>
              <div style={{ marginTop:8, display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                <span className={`badge ${statusBadge(selected.status)}`}>{selected.status}</span>
                <span className={`badge ${roleBadge(selected.role)}`}>{selected.role.replace('_',' ')}</span>
              </div>
            </div>

            <div className="divider" />

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Growth Track', value:`Level ${selected.gtLevel} of 3`, icon:'📖', pct: (selected.gtLevel/3)*100 },
                { label:'Giving Faithfulness', value: selected.giving ? 'Regular' : 'Irregular', icon:'₦', pct: selected.giving ? 85 : 20 },
                { label:'Serving Record', value: selected.serving ? 'Active volunteer' : 'Not serving', icon:'🤝', pct: selected.serving ? 70 : 0 },
              ].map((s,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <div style={{ fontSize:12.5, color:'var(--t-2)' }}>{s.icon} {s.label}</div>
                    <div style={{ fontSize:12.5, color:'var(--t-1)', fontFamily:'var(--font-heading)', fontWeight:500 }}>{s.value}</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${s.pct}%`, background: s.pct>60?'var(--green)':s.pct>30?'var(--amber)':'var(--red)' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" />
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <div style={{ fontSize:12, color:'var(--t-3)' }}>Milestones</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                {selected.gtLevel >= 1 && <span className="badge badge-blue">✓ GT Level 1</span>}
                {selected.gtLevel >= 2 && <span className="badge badge-amber">✓ GT Level 2</span>}
                {selected.gtLevel >= 3 && <span className="badge badge-green">✓ GT Level 3</span>}
                {selected.serving && <span className="badge badge-teal">⚡ Serving</span>}
              </div>
            </div>

            <div className="divider" />
            <button className="btn btn-brand" style={{ width:'100%', justifyContent:'center' }}>
              Send pastoral message
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
