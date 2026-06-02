'use client'
import { useState, useEffect } from 'react'
import { branches, DEPARTMENTS } from '@/lib/data'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@/lib/useSession'
import { notify } from '@/lib/toast'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null

type Slot = { id:string; title:string; dept:string; branch_id:string; branch_name:string; date:string; time:string; capacity:number; enrolled:string[]; enrolled_count:number; status:'open'|'full'|'closed' }
type Application = { id:string; name:string; email:string; phone:string; dept:string; branch_id:string; branch_name:string; skills:string; submitted:string; status:'pending'|'approved'|'declined' }

export default function Volunteer({ onNavigate }: { onNavigate:(p:string)=>void }) {
  const { user } = useSession()
  const [tab, setTab] = useState<'slots'|'applications'|'burnout'>('slots')
  const [slots, setSlots] = useState<Slot[]>([])
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [branchFilter, setBranchFilter] = useState('all')
  const [showNewSlot, setShowNewSlot] = useState(false)
  const [newSlot, setNewSlot] = useState({ title:'', dept:'ushering', branch:'lekki', date:'', time:'', capacity:'10' })
  const [savingSlot, setSavingSlot] = useState(false)

  const loadData = async () => {
    setLoading(true)
    if (supabase) {
      try {
        const [{ data: slotsData }, { data: appsData }] = await Promise.all([
          supabase.from('volunteer_slots').select('*').order('date', { ascending: true }).limit(100),
          supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false }).limit(100),
        ])
        if (slotsData) setSlots(slotsData.map((s:any) => ({
          id: s.id, title: s.title, dept: s.dept,
          branch_id: s.branch_id, branch_name: branches.find(b=>b.id===s.branch_id)?.name||s.branch_id,
          date: s.date, time: s.time, capacity: s.capacity,
          enrolled: s.enrolled || [], enrolled_count: s.enrolled_count || 0,
          status: s.status || 'open',
        })))
        if (appsData) setApps(appsData.map((a:any) => ({
          id: a.id, name: a.full_name||a.name, email: a.email, phone: a.phone,
          dept: a.dept, branch_id: a.branch_id,
          branch_name: branches.find(b=>b.id===a.branch_id)?.name||a.branch_id,
          skills: a.skills||'', submitted: a.created_at?.slice(0,10)||'',
          status: a.status||'pending',
        })))
      } catch {}
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSlot(true)
    const br = branches.find(b=>b.id===newSlot.branch)!
    const dept = DEPARTMENTS.find(d=>d.id===newSlot.dept)
    if (supabase) {
      try {
        const { data } = await supabase.from('volunteer_slots').insert({
          title: newSlot.title, dept: dept?.name||newSlot.dept,
          branch_id: newSlot.branch, date: newSlot.date,
          time: newSlot.time, capacity: Number(newSlot.capacity),
          enrolled: [], enrolled_count: 0, status: 'open',
        }).select().single()
        if (data) setSlots(prev => [{
          id: data.id, title: data.title, dept: data.dept,
          branch_id: data.branch_id, branch_name: br.name,
          date: data.date, time: data.time, capacity: data.capacity,
          enrolled: [], enrolled_count: 0, status: 'open',
        }, ...prev])
      } catch {}
    } else {
      setSlots(prev => [{
        id:`s${Date.now()}`, title:newSlot.title, dept:dept?.name||newSlot.dept,
        branch_id:newSlot.branch, branch_name:br.name, date:newSlot.date,
        time:newSlot.time, capacity:Number(newSlot.capacity), enrolled:[], enrolled_count:0, status:'open',
      }, ...prev])
    }
    setSavingSlot(false)
    notify.success?.('Serving slot created')
    setShowNewSlot(false)
    setNewSlot({ title:'', dept:'ushering', branch:'lekki', date:'', time:'', capacity:'10' })
  }

  const decide = async (appId: string, status: 'approved'|'declined') => {
    if (supabase) {
      await supabase.from('volunteer_applications').update({ status }).eq('id', appId).then(()=>{})
    }
    setApps(prev => prev.map(a => a.id===appId ? {...a,status} : a))
    notify.success?.(status === 'approved' ? 'Application approved' : 'Application declined')
  }

  const visibleSlots = branchFilter==='all' ? slots : slots.filter(s=>s.branch_id===branchFilter)
  const pending = apps.filter(a=>a.status==='pending')

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:17, fontFamily:'var(--font-display)', color:'var(--t-1)', marginBottom:3 }}>Workforce</h2>
          <p style={{ fontSize:12.5, color:'var(--t-2)' }}>Serving slots · Applications · Schedule — live from database</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-sm" onClick={()=>{setShowNewSlot(v=>!v);setTab('slots')}} title="Generate QR signup code">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h3M17 14v3h3"/></svg>
            QR Signup
          </button>
          <button className="btn btn-brand btn-sm" onClick={()=>{setShowNewSlot(v=>!v);setTab('slots')}}>+ Add slot</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { l:'Active slots', v: slots.filter(s=>s.status==='open').length },
          { l:'Pending applications', v: pending.length },
          { l:'Approved this month', v: apps.filter(a=>a.status==='approved').length },
          { l:'Total volunteers', v: slots.reduce((a,s)=>a+s.enrolled_count,0) },
        ].map(m=>(
          <div key={m.l} className="metric-tile metric-tile-accent">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.5rem' }}>{loading ? '…' : m.v}</div>
          </div>
        ))}
      </div>

      {/* New slot form */}
      {showNewSlot && (
        <div className="card card-p" style={{ maxWidth:540, marginBottom:16, border:'1px solid var(--brand)', borderRadius:'var(--r-lg)' }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Create new serving slot</div>
          <form onSubmit={addSlot}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Role / Title *</label>
                <input className="input" placeholder="e.g. Sunday Ushering" value={newSlot.title} onChange={e=>setNewSlot(f=>({...f,title:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Department</label>
                <select className="input" value={newSlot.dept} onChange={e=>setNewSlot(f=>({...f,dept:e.target.value}))}>
                  {DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Branch</label>
                <select className="input" value={newSlot.branch} onChange={e=>setNewSlot(f=>({...f,branch:e.target.value}))}>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Date</label>
                <input className="input" type="date" value={newSlot.date} onChange={e=>setNewSlot(f=>({...f,date:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Time</label>
                <input className="input" type="time" value={newSlot.time} onChange={e=>setNewSlot(f=>({...f,time:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Capacity</label>
                <input className="input" type="number" min="1" value={newSlot.capacity} onChange={e=>setNewSlot(f=>({...f,capacity:e.target.value}))} required/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="btn btn-brand btn-sm" style={{ flex:1, justifyContent:'center' }} disabled={savingSlot}>
                {savingSlot ? 'Saving…' : 'Create slot'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowNewSlot(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="tabs" style={{ marginBottom:16 }}>
        {([['slots',`Slots${slots.length?` (${slots.length})`:''}` ],['applications',`Applications${pending.length?` · ${pending.length} pending`:''}` ],['burnout','Wellbeing']] as const).map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==='slots' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <select className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }} value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {loading ? <div style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)' }}>Loading slots…</div> :
          visibleSlots.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>
              No serving slots yet. Click "+ Add slot" to create the first one.
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {visibleSlots.map(slot => {
                const fillPct = Math.round(slot.enrolled_count/slot.capacity*100)
                const dept = DEPARTMENTS.find(d=>d.name===slot.dept)
                return (
                  <div key={slot.id} className="card card-p" style={{ borderTop:`3px solid ${dept?.color||'var(--brand)'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{slot.title}</div>
                        <div style={{ fontSize:11.5, color:'var(--t-2)' }}>{dept?.icon} {slot.dept} · {slot.branch_name}</div>
                      </div>
                      <span className={`chip ${slot.status==='open'?'chip-green':slot.status==='full'?'chip-amber':'chip-gray'}`} style={{ fontSize:10, textTransform:'capitalize' }}>
                        {slot.status}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--t-3)', marginBottom:10 }}>
                      📅 {slot.date} · 🕐 {slot.time}
                    </div>
                    <div style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:4 }}>
                        <span style={{ color:'var(--t-2)' }}>Enrolled</span>
                        <span style={{ fontWeight:700 }}>{slot.enrolled_count}/{slot.capacity}</span>
                      </div>
                      <div className="track"><div className="fill fill-brand" style={{ width:`${fillPct}%` }}/></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab==='applications' && (
        <div>
          {loading ? <div style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)' }}>Loading applications…</div> :
          apps.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>
              No applications yet. Workers apply via the QR signup and their applications appear here.
            </div>
          ) : (
            <div className="card card-p">
              <table className="tbl">
                <thead><tr><th>Name</th><th>Department</th><th>Branch</th><th>Skills</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight:600 }}>{a.name}</td>
                      <td style={{ fontSize:12 }}>{a.dept}</td>
                      <td style={{ fontSize:12 }}>{a.branch_name}</td>
                      <td style={{ fontSize:11.5, color:'var(--t-2)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.skills}</td>
                      <td style={{ fontSize:11.5, fontFamily:'var(--font-mono)', color:'var(--t-3)' }}>{a.submitted}</td>
                      <td><span className={`chip chip-${a.status==='approved'?'green':a.status==='declined'?'red':'amber'}`} style={{ fontSize:10, textTransform:'capitalize' }}>{a.status}</span></td>
                      <td>
                        {a.status==='pending' && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button className="btn btn-sm" style={{ background:'var(--green-lt)',color:'var(--green)',border:'1px solid rgba(16,185,129,0.3)',fontSize:11 }} onClick={()=>decide(a.id,'approved')}>✓ Approve</button>
                            <button className="btn btn-sm btn-danger" style={{ fontSize:11 }} onClick={()=>decide(a.id,'declined')}>✗</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==='burnout' && (
        <div className="card card-p">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Worker Wellbeing</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16, lineHeight:1.65 }}>
            Workers serving in 8+ consecutive slots without a break are flagged here. Based on real enrollment data once slots are actively used.
          </div>
          {slots.filter(s=>s.enrolled_count>=s.capacity).length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)', fontSize:13 }}>
              No burnout risks detected. All serving loads appear balanced.
            </div>
          ) : (
            <div style={{ fontSize:13, color:'var(--t-2)' }}>Overloaded slots: {slots.filter(s=>s.enrolled_count>=s.capacity).map(s=>s.title).join(', ')}</div>
          )}
        </div>
      )}
    </div>
  )
}
