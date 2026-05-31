'use client'
import { useState } from 'react'
import { branches, DEPARTMENTS } from '@/lib/data'

const SAMPLE_MEMBERS = [
  { id:'m1', name:'Emmanuel Abiola',  branch:'lekki',  dept:'ushering', role:'Unit Head', status:'active',  joined:'Nov 2024', phone:'+234 810 111 2222', email:'emmanuel@hicc.org',  growth:3, attendance:92, birthday:'Mar 14' },
  { id:'m2', name:'Funke Oladipo',    branch:'ikeja',  dept:'prayer',   role:'Member',    status:'active',  joined:'Dec 2024', phone:'+234 803 222 3333', email:'funke.o@hicc.org',    growth:2, attendance:78, birthday:'Jul 22' },
  { id:'m3', name:'Ngozi Kalu',       branch:'lekki',  dept:'worship',  role:'Member',    status:'active',  joined:'Oct 2024', phone:'+234 706 333 4444', email:'ngozi.k@hicc.org',    growth:3, attendance:95, birthday:'Feb 5' },
  { id:'m4', name:'Richard Eze',      branch:'abuja',  dept:'media',    role:'Unit Head', status:'active',  joined:'Feb 2025', phone:'+234 809 444 5555', email:'richard.e@hicc.org',  growth:2, attendance:85, birthday:'Sep 3' },
  { id:'m5', name:'Toyin Okafor',     branch:'lekki',  dept:'kids',     role:'Member',    status:'active',  joined:'Mar 2025', phone:'+234 813 555 6666', email:'',                    growth:1, attendance:70, birthday:'Apr 18' },
  { id:'m6', name:'Kolade Nwachukwu', branch:'london', dept:'outreach', role:'Member',    status:'pending', joined:'May 2025', phone:'+44 798 777 8888',  email:'kolade@gmail.com',    growth:0, attendance:0,  birthday:'Dec 12' },
]

export default function Members({ onNavigate }: { onNavigate:(p:string)=>void }) {
  const [members, setMembers] = useState(SAMPLE_MEMBERS)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', email:'', branch:'lekki', dept:'ushering', birthday:'' })

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    const matchBranch = filterBranch === 'all' || m.branch === filterBranch
    const matchDept   = filterDept === 'all' || m.dept === filterDept
    return matchSearch && matchBranch && matchDept
  })

  const addMember = (e: React.FormEvent) => {
    e.preventDefault()
    setMembers(prev => [...prev, { id:`m${Date.now()}`, ...form, role:'Member', status:'active', joined: new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'}), growth:0, attendance:0 }])
    setForm({ name:'', phone:'', email:'', branch:'lekki', dept:'ushering', birthday:'' }); setShowAdd(false)
  }

  // Birthdays this month
  const thisMonth = new Date().toLocaleDateString('en-US',{month:'short'})
  const birthdays = members.filter(m => m.birthday.startsWith(thisMonth))

  return (
    <div>
      {selected ? (
        // ── MEMBER PROFILE ──
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={()=>setSelected(null)}>← All members</button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>
            <div className="card card-p" style={{ textAlign:'center' }}>
              <div className="av av-lg av-purple" style={{ width:64, height:64, fontSize:22, margin:'0 auto 12px' }}>{selected.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</div>
              <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>{selected.name}</div>
              <div style={{ fontSize:12, color:'var(--t-2)', marginTop:3 }}>{DEPARTMENTS.find(d=>d.id===selected.dept)?.name||selected.dept}</div>
              <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:2 }}>{branches.find(b=>b.id===selected.branch)?.name}</div>
              <span className={`chip chip-${selected.status==='active'?'green':'amber'}`} style={{ marginTop:10 }}>{selected.status}</span>
            </div>
            <div>
              <div className="card card-p" style={{ marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Growth Passport</div>
                {['Growth Track Level 1','Growth Track Level 2','Growth Track Level 3'].map((level, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--border)' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background: i<selected.growth?'var(--green)':'var(--navy-4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {i<selected.growth && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize:13, color: i<selected.growth?'var(--t-1)':'var(--t-3)' }}>{level}</span>
                    {i<selected.growth && <span className="chip chip-green" style={{ marginLeft:'auto' }}>Complete</span>}
                  </div>
                ))}
              </div>
              <div className="card card-p">
                <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Details</div>
                {[['Phone',selected.phone],['Email',selected.email||'—'],['Branch',branches.find(b=>b.id===selected.branch)?.name],['Department',DEPARTMENTS.find(d=>d.id===selected.dept)?.name],['Joined',selected.joined],['Attendance',`${selected.attendance}%`],['Birthday',selected.birthday||'—']].map(([l,v])=>(
                  <div key={l} className="stat-row"><span style={{ fontSize:12, color:'var(--t-2)' }}>{l}</span><span style={{ fontSize:12.5, fontWeight:500 }}>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ── MEMBER LIST ──
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Members</div>
              <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>{filtered.length} showing · {members.length} total</div>
            </div>
            <button className="btn btn-brand btn-sm" onClick={()=>setShowAdd(v=>!v)}>+ Add member</button>
          </div>

          {birthdays.length > 0 && (
            <div style={{ padding:'12px 16px', background:'rgba(245,158,11,0.10)', borderRadius:'var(--r)', marginBottom:14, border:'1px solid rgba(245,158,11,0.25)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>🎂</span>
              <div><div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>Birthdays this month</div>
              <div style={{ fontSize:12, color:'var(--t-2)' }}>{birthdays.map(m=>m.name).join(', ')}</div></div>
            </div>
          )}

          {showAdd && (
            <div className="card card-p" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Register new member</div>
              <form onSubmit={addMember}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Full name</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Phone</label><input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Birthday</label><input className="input" type="date" value={form.birthday} onChange={e=>setForm(f=>({...f,birthday:e.target.value}))}/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Branch</label><select className="input" value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Department</label><select className="input" value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))}>{DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}</select></div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" className="btn btn-brand btn-sm">Register member</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input className="input" placeholder="Search members…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:220 }}/>
            <select className="input" value={filterBranch} onChange={e=>setFilterBranch(e.target.value)} style={{ width:160 }}>
              <option value="all">All branches</option>
              {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="input" value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={{ width:180 }}>
              <option value="all">All departments</option>
              {DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
          </div>

          <div className="card card-p">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Branch</th><th>Department</th><th>Role</th><th>Attendance</th><th>Growth</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} style={{ cursor:'pointer' }} onClick={()=>setSelected(m)}>
                    <td><strong>{m.name}</strong></td>
                    <td style={{ fontSize:12 }}>{branches.find(b=>b.id===m.branch)?.name}</td>
                    <td style={{ fontSize:12 }}>{DEPARTMENTS.find(d=>d.id===m.dept)?.icon} {DEPARTMENTS.find(d=>d.id===m.dept)?.name}</td>
                    <td style={{ fontSize:12 }}>{m.role}</td>
                    <td><span style={{ color:m.attendance>=85?'var(--green)':m.attendance>=70?'var(--amber)':'var(--red)', fontWeight:700, fontFamily:'var(--font-mono)' }}>{m.attendance}%</span></td>
                    <td>{'⭐'.repeat(Math.min(m.growth,3))}<span style={{ fontSize:10, color:'var(--t-3)' }}> L{m.growth}</span></td>
                    <td><span className={`chip chip-${m.status==='active'?'green':'amber'}`}>{m.status}</span></td>
                  </tr>
                ))}
                {filtered.length===0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)' }}>No members found.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
