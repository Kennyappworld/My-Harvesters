'use client'
import { useState } from 'react'
import { branches, DEPARTMENTS } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { notify } from '@/lib/toast'

type Slot = {
  id: string; title: string; dept: string; branch: string; date: string
  time: string; capacity: number; enrolled: string[]; status: 'open'|'full'|'closed'
}
type Application = {
  id: string; name: string; email: string; phone: string
  dept: string; branch: string; skills: string; submitted: string; status: 'pending'|'approved'|'declined'
}

const INIT_SLOTS: Slot[] = [
  { id:'s1', title:'Sunday Ushering', dept:'Ushering', branch:'Lekki HQ', date:'Jun 8 2026', time:'7:00 AM', capacity:20, enrolled:['Emeka O','Tosin A','Ngozi K','Femi B','Ada C'], status:'open' },
  { id:'s2', title:'Worship Team (Lead)', dept:'Worship & Music', branch:'Lekki HQ', date:'Jun 8 2026', time:'7:30 AM', capacity:8, enrolled:['Tolu M','Seun A','Kemi B','Dare O','Chisom E','Peace N','Fola T','Yemi A'], status:'full' },
  { id:'s3', title:'KidsHouse Coordinator', dept:'KidsHouse', branch:'Gbagada', date:'Jun 8 2026', time:'9:00 AM', capacity:6, enrolled:['Blessing O','Chidi N'], status:'open' },
  { id:'s4', title:'Media & Live Stream', dept:'Media & Technology', branch:'Ikeja', date:'Jun 8 2026', time:'6:30 AM', capacity:5, enrolled:['Kenny A','Rotimi B','Sola F'], status:'open' },
  { id:'s5', title:'Prayer Team Lead', dept:'Prayer & Intercession', branch:'Abuja', date:'Jun 8 2026', time:'6:00 AM', capacity:12, enrolled:['Elder Taiwo','Sister Grace','Bro Ike'], status:'open' },
  { id:'s6', title:'Traffic & Security', dept:'Security & Traffic', branch:'Lekki HQ', date:'Jun 8 2026', time:'7:00 AM', capacity:15, enrolled:['Bro Ibrahim','Bro Emeka','Sis Amaka'], status:'open' },
]

const INIT_APPS: Application[] = [
  { id:'a1', name:'Adaeze Okonkwo', email:'adaeze@gmail.com', phone:'+234 810 111 2222', dept:'Worship & Music', branch:'Lekki HQ', skills:'Vocalist, acoustic guitar, 5 years worship experience', submitted:'May 28', status:'pending' },
  { id:'a2', name:'Kolade Nwachukwu', email:'kolade@gmail.com', phone:'+234 803 222 3333', dept:'Media & Technology', branch:'London UK', skills:'Video editing, live streaming, OBS Studio', submitted:'May 29', status:'pending' },
  { id:'a3', name:'Chisom Eze', email:'chisom.e@yahoo.com', phone:'+234 706 333 4444', dept:'KidsHouse', branch:'Gbagada', skills:'Primary teacher, child psychology background', submitted:'May 30', status:'approved' },
  { id:'a4', name:'Richard Eze', email:'richard.e@gmail.com', phone:'+234 815 444 5555', dept:'Ushering', branch:'Abuja', skills:'Hospitality training, 2 years serving experience', submitted:'May 31', status:'declined' },
]

export default function Volunteer({ onNavigate }: { onNavigate:(p:string)=>void }) {
  const [tab, setTab] = useState<'slots'|'applications'|'burnout'|'schedule'>('slots')
  const [slots, setSlots] = useState<Slot[]>(() => hydrate('hicc_volunteer_slots' as any, INIT_SLOTS))
  const [apps, setApps] = useState<Application[]>(() => hydrate('hicc_volunteer_apps' as any, INIT_APPS))
  const [branchFilter, setBranchFilter] = useState('all')
  const [showNewSlot, setShowNewSlot] = useState(false)
  const [newSlot, setNewSlot] = useState({ title:'', dept:'Ushering', branch:'lekki', date:'', time:'', capacity:'10' })

  const visibleSlots = branchFilter === 'all' ? slots : slots.filter(s => s.branch === branches.find(b=>b.id===branchFilter)?.name)
  const pending = apps.filter(a=>a.status==='pending')

  const enroll = (slotId: string) => {
    setSlots(prev => {
      const n = prev.map(s => s.id===slotId && s.enrolled.length < s.capacity
        ? { ...s, enrolled:[...s.enrolled,'You'], status: s.enrolled.length+1>=s.capacity?'full':'open' as any }
        : s
      )
      persist('hicc_volunteer_slots' as any, n); return n
    })
    notify.success('You\'ve been added to the serving slot!')
  }

  const addSlot = (e: React.FormEvent) => {
    e.preventDefault()
    const br = branches.find(b=>b.id===newSlot.branch)!
    const slot: Slot = { id:`s${Date.now()}`, title:newSlot.title, dept:newSlot.dept, branch:br.name, date:newSlot.date, time:newSlot.time, capacity:Number(newSlot.capacity), enrolled:[], status:'open' }
    setSlots(prev => { const n=[slot,...prev]; persist('hicc_volunteer_slots' as any, n); return n })
    notify.success('Serving slot created')
    setShowNewSlot(false); setNewSlot({ title:'', dept:'Ushering', branch:'lekki', date:'', time:'', capacity:'10' })
  }

  const decide = (appId: string, status: 'approved'|'declined') => {
    setApps(prev => { const n=prev.map(a=>a.id===appId?{...a,status}:a); persist('hicc_volunteer_apps' as any, n); return n })
    notify.success(status==='approved' ? 'Application approved' : 'Application declined')
  }

  // Burnout detection — anyone enrolled in 8+ consecutive slots
  const BURNOUT_RISK = [
    { name:'Segun Adeyemi', dept:'Ushering', branch:'Lekki HQ', weeks:10, role:'Unit Head' },
    { name:'Chika Obi', dept:'Worship & Music', branch:'Abuja', weeks:11, role:'Member' },
    { name:'Ngozi Kalu', dept:'Prayer & Intercession', branch:'Lekki HQ', weeks:9, role:'Member' },
  ]

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:17, fontFamily:'var(--font-display)', color:'var(--t-1)', marginBottom:3 }}>Workforce</h2>
          <p style={{ fontSize:12.5, color:'var(--t-2)' }}>Serving slots · Applications · Burnout alerts · Schedule</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {pending.length > 0 && <span className="chip chip-amber">{pending.length} pending applications</span>}
          <button className="btn btn-brand btn-sm" onClick={()=>setShowNewSlot(v=>!v)}>+ Add slot</button>
          <button className="btn btn-sm" title="Generate QR signup code" onClick={()=>onNavigate('settings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h3M17 14v3h3"/></svg>
            QR Signup
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { l:'Open slots',      v:slots.filter(s=>s.status==='open').length,  accent:'var(--brand)' },
          { l:'Full slots',      v:slots.filter(s=>s.status==='full').length,   accent:'var(--gold)' },
          { l:'Pending apps',    v:pending.length,                              accent:'var(--amber)' },
          { l:'Burnout risk',    v:BURNOUT_RISK.length,                         accent:'var(--red)' },
        ].map(m=>(
          <div key={m.l} className="metric-tile" style={{ borderTop:`3px solid ${m.accent}` }}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.6rem' }}>{m.v}</div>
          </div>
        ))}
      </div>

      {/* New slot form */}
      {showNewSlot && (
        <div className="card card-p" style={{ marginBottom:16, background:'var(--brand-soft)', border:'1.5px solid var(--border-md)' }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Create serving slot</div>
          <form onSubmit={addSlot}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Title</label>
                <input className="input" value={newSlot.title} onChange={e=>setNewSlot(n=>({...n,title:e.target.value}))} placeholder="e.g. Sunday Ushering" required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Department</label>
                <select className="select" value={newSlot.dept} onChange={e=>setNewSlot(n=>({...n,dept:e.target.value}))}>
                  {DEPARTMENTS.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Branch</label>
                <select className="select" value={newSlot.branch} onChange={e=>setNewSlot(n=>({...n,branch:e.target.value}))}>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Date</label>
                <input className="input" type="date" value={newSlot.date} onChange={e=>setNewSlot(n=>({...n,date:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Time</label>
                <input className="input" type="time" value={newSlot.time} onChange={e=>setNewSlot(n=>({...n,time:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Capacity</label>
                <input className="input" type="number" min="1" max="200" value={newSlot.capacity} onChange={e=>setNewSlot(n=>({...n,capacity:e.target.value}))}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="submit" className="btn btn-brand btn-sm">Create slot</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowNewSlot(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="tabs" style={{ marginBottom:16 }}>
        {([['slots','Serving slots'],['applications','Applications'],['burnout','Burnout alerts'],['schedule','By department']] as const).map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>
            {l}{k==='applications'&&pending.length>0?` (${pending.length})`:''}
          </button>
        ))}
      </div>

      {tab==='slots' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)' }}>Branch:</span>
            <button onClick={()=>setBranchFilter('all')} className={`btn btn-sm ${branchFilter==='all'?'btn-brand':''}`}>All</button>
            {branches.map(b=><button key={b.id} onClick={()=>setBranchFilter(b.id)} className={`btn btn-sm ${branchFilter===b.id?'btn-brand':''}`}>{b.short}</button>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {visibleSlots.map(slot=>{
              const pct = Math.round((slot.enrolled.length/slot.capacity)*100)
              return (
                <div key={slot.id} className="card" style={{ overflow:'hidden', borderLeft:`3px solid ${slot.status==='full'?'var(--amber)':'var(--brand)'}` }}>
                  <div style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13.5, color:'var(--t-1)' }}>{slot.title}</div>
                        <div style={{ fontSize:11.5, color:'var(--t-2)', marginTop:2 }}>{slot.dept} · {slot.branch}</div>
                      </div>
                      <span className={`chip ${slot.status==='full'?'chip-amber':'chip-green'}`}>{slot.status==='full'?'Full':'Open'}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--t-2)', marginBottom:10 }}>
                      📅 {slot.date} · ⏰ {slot.time}
                    </div>
                    <div style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--t-2)', marginBottom:4 }}>
                        <span>{slot.enrolled.length} / {slot.capacity} enrolled</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:pct>=100?'var(--amber)':'var(--brand)' }}>{pct}%</span>
                      </div>
                      <div className="track"><div className="fill" style={{ width:`${pct}%`, background:pct>=100?'var(--gold)':'var(--grad-brand)' }}/></div>
                    </div>
                    {slot.enrolled.length > 0 && (
                      <div style={{ fontSize:11, color:'var(--t-3)', marginBottom:10 }}>
                        {slot.enrolled.slice(0,3).join(', ')}{slot.enrolled.length>3?` +${slot.enrolled.length-3} more`:''}
                      </div>
                    )}
                    {slot.status !== 'full' && (
                      <button className="btn btn-brand btn-sm" style={{ width:'100%', justifyContent:'center' }} onClick={()=>enroll(slot.id)}>
                        Sign up to serve
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab==='applications' && (
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'12px 18px', background:'linear-gradient(90deg,rgba(27,67,50,0.05) 0%,transparent 100%)', borderBottom:'1px solid var(--border-md)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-display)' }}>Volunteer applications</span>
            <span style={{ fontSize:11.5, color:'var(--t-3)' }}>{pending.length} pending review</span>
          </div>
          <table className="tbl">
            <thead><tr><th>Applicant</th><th>Department</th><th>Branch</th><th>Submitted</th><th>Skills</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {apps.map(a=>(
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'var(--t-3)' }}>{a.email}</div>
                  </td>
                  <td><span className="chip chip-brand" style={{ fontSize:11 }}>{a.dept}</span></td>
                  <td><span className="chip chip-gray" style={{ fontSize:11 }}>{a.branch}</span></td>
                  <td style={{ fontSize:12, color:'var(--t-2)' }}>{a.submitted}</td>
                  <td style={{ fontSize:12, color:'var(--t-2)', maxWidth:200 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.skills}</div></td>
                  <td>
                    <span className={`chip ${a.status==='approved'?'chip-green':a.status==='declined'?'chip-red':'chip-amber'}`}>{a.status}</span>
                  </td>
                  <td>
                    {a.status==='pending' && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-brand" style={{ fontSize:11 }} onClick={()=>decide(a.id,'approved')}>Approve</button>
                        <button className="btn btn-sm btn-danger" style={{ fontSize:11 }} onClick={()=>decide(a.id,'declined')}>Decline</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='burnout' && (
        <div>
          <div style={{ background:'rgba(197,48,48,0.06)', border:'1px solid rgba(197,48,48,0.2)', borderRadius:'var(--r)', padding:'10px 16px', marginBottom:14, display:'flex', gap:8, alignItems:'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize:12.5, color:'var(--t-2)', margin:0 }}>These workers have served every week for 8+ consecutive weeks without a break. A personal message from leadership can prevent burnout and disengagement.</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {BURNOUT_RISK.map(r=>(
              <div key={r.name} className="card" style={{ borderLeft:'3px solid var(--red)', overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div className="av av-md av-brand">{r.name.split(' ').map((n:string)=>n[0]).join('')}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13.5 }}>{r.name}</div>
                      <div style={{ fontSize:11.5, color:'var(--t-2)' }}>{r.role} · {r.dept} · {r.branch}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:20, color:'var(--red)' }}>{r.weeks}</div>
                      <div style={{ fontSize:10, color:'var(--t-3)' }}>weeks serving</div>
                    </div>
                    <button className="btn btn-sm btn-brand">Send appreciation</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='schedule' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
          {DEPARTMENTS.map(dept=>{
            const deptSlots = slots.filter(s=>s.dept===dept.name)
            const total = deptSlots.reduce((a,s)=>a+s.enrolled.length,0)
            const capacity = deptSlots.reduce((a,s)=>a+s.capacity,0)
            return (
              <div key={dept.id} className="card" style={{ overflow:'hidden', borderTop:`3px solid ${dept.color}` }}>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:20 }}>{dept.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{dept.name}</div>
                      <div style={{ fontSize:11, color:'var(--t-3)' }}>{dept.head}</div>
                    </div>
                  </div>
                  {capacity > 0 ? (
                    <>
                      <div className="track" style={{ marginBottom:6 }}>
                        <div className="fill" style={{ width:`${Math.min(100,Math.round(total/capacity*100))}%`, background:dept.color }}/>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--t-2)' }}>
                        <span>{total} enrolled</span>
                        <span>{capacity} capacity · {deptSlots.length} slot{deptSlots.length!==1?'s':''}</span>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize:12, color:'var(--t-3)', fontStyle:'italic' }}>No slots this week</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
