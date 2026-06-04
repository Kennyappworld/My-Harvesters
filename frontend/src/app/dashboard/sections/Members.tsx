'use client'
import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { notify } from '@/lib/toast'
import { branches, DEPARTMENTS } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  : null

const FALLBACK_MEMBERS = [
  { id:'m1', name:'Emmanuel Abiola',  branch:'lekki',  dept:'ushering', role:'Unit Head', status:'active',  joined:'Nov 2024', phone:'+234 810 111 2222', email:'emmanuel@hicc.org',  growth:3, attendance:92, birthday:'Mar 14', photo:'' },
  { id:'m2', name:'Funke Oladipo',    branch:'ikeja',  dept:'prayer',   role:'Member',    status:'active',  joined:'Dec 2024', phone:'+234 803 222 3333', email:'funke.o@hicc.org',    growth:2, attendance:78, birthday:'Jul 22', photo:'' },
  { id:'m3', name:'Ngozi Kalu',       branch:'lekki',  dept:'worship',  role:'Member',    status:'active',  joined:'Oct 2024', phone:'+234 706 333 4444', email:'ngozi.k@hicc.org',    growth:3, attendance:95, birthday:'Feb 5',  photo:'' },
]

export default function Members({ onNavigate, memberSearch, onMemberSearchConsumed }: { onNavigate:(p:string)=>void; memberSearch?:string; onMemberSearchConsumed?:()=>void }) {
  const { user } = useSession()
  const [members, setMembers] = useState<any[]>(() => hydrate('hicc_members' as any, FALLBACK_MEMBERS))
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (memberSearch) {
      setSearch(memberSearch)
      onMemberSearchConsumed?.()
    }
  }, [memberSearch])
  const [filterBranch, setFilterBranch] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', email:'', branch:'lekki', dept:'ushering', birthday:'' })
  const photoRef = useRef<HTMLInputElement>(null)

  // Load real members from Supabase
  useEffect(() => {
    if (!supabase) return
    setLoading(true)
    const load = async () => {
      try {
        const { data } = await supabase.from('workers').select('*').order('created_at', { ascending: false })
        if (data && data.length > 0) {
          const mapped = data.map((w:any) => ({
            id: w.id, name: w.full_name, branch: w.branch_id, dept: w.department || 'ushering',
            role: w.role?.replace(/_/g,' ') || 'Member', status: 'active',
            joined: new Date(w.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'}),
            phone: w.phone || '—', email: w.email, growth: 0, attendance: 0,
            birthday: '', photo: w.avatar_url || '',
          }))
          setMembers(mapped)  // No PII cache — load fresh each session
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>, memberId: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { notify.error('Photo must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, photo: dataUrl } : m))
      if (selected?.id === memberId) setSelected((s:any) => ({ ...s, photo: dataUrl }))
      if (supabase) {
        await supabase.from('workers').update({ avatar_url: dataUrl }).eq('id', memberId)
      }
    }
    reader.readAsDataURL(file)
  }

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const newMember = {
      id: `m${Date.now()}`, ...form, role:'Member', status:'active',
      joined: new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'}),
      growth:0, attendance:0, photo:''
    }
    setMembers(prev => { const next = [...prev, newMember]; persist('hicc_members' as any, next); return next })
    // Write to Supabase workers table
    if (supabase && user?.id) {
      await supabase.from('workers').insert({
        email: form.email || `worker_${Date.now()}@hicc.org`,
        full_name: form.name, phone: form.phone,
        branch_id: form.branch, department: form.dept, role: 'worker',
      })
    }
    setForm({ name:'', phone:'', email:'', branch:'lekki', dept:'ushering', birthday:'' })
    setShowAdd(false); setSaving(false)
    notify.success('Member registered successfully')
  }

  const updateGrowth = async (memberId: string, level: number) => {
    setMembers(prev => prev.map(m => m.id===memberId ? {...m, growth:level} : m))
    if (selected) setSelected((s:any) => ({...s, growth:level}))
    if (supabase) {
      await supabase.from('workers').update({ department: `growth_l${level}` }).eq('id', memberId)
    }
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return (m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)) &&
      (filterBranch==='all' || m.branch===filterBranch) &&
      (filterDept==='all' || m.dept===filterDept)
  })

  const thisMonth = new Date().toLocaleDateString('en-US',{month:'short'})
  const birthdays = members.filter(m => m.birthday?.startsWith(thisMonth))

  return (
    <div>
      {selected ? (
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={()=>setSelected(null)}>← All members</button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>
            <div className="card card-p" style={{ textAlign:'center' }}>
              <div style={{ position:'relative', width:72, height:72, margin:'0 auto 12px' }}>
                {selected.photo
                  ? <img src={selected.photo} alt={selected.name} style={{ width:72, height:72, borderRadius:18, objectFit:'cover', border:'2px solid var(--border-md)' }}/>
                  : <div className="av av-lg av-purple" style={{ width:72, height:72, fontSize:22 }}>{selected.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</div>}
                <button onClick={()=>photoRef.current?.click()} title="Change photo" style={{ position:'absolute', bottom:-4, right:-4, width:24, height:24, borderRadius:'50%', background:'var(--brand)', border:'2px solid var(--s-1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="12" height="12"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
                <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handlePhotoUpload(e,selected.id)}/>
              </div>
              <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>{selected.name}</div>
              <div style={{ fontSize:12, color:'var(--t-2)', marginTop:3 }}>{DEPARTMENTS.find(d=>d.id===selected.dept)?.name||selected.dept}</div>
              <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:2 }}>{branches.find(b=>b.id===selected.branch)?.name||selected.branch}</div>
              <span className={`chip chip-${selected.status==='active'?'green':'amber'}`} style={{ marginTop:10 }}>{selected.status}</span>
            </div>
            <div>
              <div className="card card-p" style={{ marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Growth Passport</div>
                {['Growth Track Level 1','Growth Track Level 2','Growth Track Level 3'].map((level,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--border)', cursor:'pointer' }} onClick={()=>updateGrowth(selected.id, i+1)}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:i<selected.growth?'var(--green)':'var(--s-4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {i<selected.growth && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize:13, color:i<selected.growth?'var(--t-1)':'var(--t-3)' }}>{level}</span>
                    {i<selected.growth && <span className="chip chip-green" style={{ marginLeft:'auto' }}>Complete</span>}
                  </div>
                ))}
              </div>
              <div className="card card-p">
                <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Details</div>
                {[['Phone',selected.phone],['Email',selected.email||'—'],['Branch',branches.find(b=>b.id===selected.branch)?.name||selected.branch],['Department',DEPARTMENTS.find(d=>d.id===selected.dept)?.name||selected.dept],['Joined',selected.joined],['Attendance',`${selected.attendance}%`],['Birthday',selected.birthday||'—']].map(([l,v])=>(
                  <div key={l} className="stat-row"><span style={{ fontSize:12, color:'var(--t-2)' }}>{l}</span><span style={{ fontSize:12.5, fontWeight:500 }}>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Members</div>
              <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>
                {loading ? 'Loading from database…' : `${filtered.length} showing · ${members.length} total`}
              </div>
            </div>
            <button className="btn btn-brand btn-sm" onClick={()=>setShowAdd(v=>!v)}>+ Add member</button>
          </div>

          {birthdays.length > 0 && (
            <div style={{ padding:'12px 16px', background:'rgba(245,158,11,0.10)', borderRadius:'var(--r)', marginBottom:14, border:'1px solid rgba(245,158,11,0.25)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>🎂</span>
              <div><div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>Birthdays this month</div>
              <div style={{ fontSize:12, color:'var(--t-2)' }}>{birthdays.map((m:any)=>m.name).join(', ')}</div></div>
            </div>
          )}

          {showAdd && (
            <div className="card card-p" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Register new member</div>
              <form onSubmit={addMember}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Full name *</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Phone *</label><input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Birthday</label><input className="input" type="date" value={form.birthday} onChange={e=>setForm(f=>({...f,birthday:e.target.value}))}/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Branch</label><select className="input" value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Department</label><select className="input" value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))}>{DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}</select></div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" className="btn btn-brand btn-sm" disabled={saving}>{saving?'Saving…':'Register member'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

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
              <thead><tr><th>Name</th><th>Branch</th><th>Department</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)' }}>Loading members…</td></tr>}
                {!loading && filtered.map((m:any) => (
                  <tr key={m.id} style={{ cursor:'pointer' }} onClick={()=>setSelected(m)} tabIndex={0} role="button">
                    <td><strong>{m.name}</strong><div style={{ fontSize:11, color:'var(--t-3)' }}>{m.email}</div></td>
                    <td style={{ fontSize:12 }}>{branches.find(b=>b.id===m.branch)?.name||m.branch}</td>
                    <td style={{ fontSize:12 }}>{DEPARTMENTS.find(d=>d.id===m.dept)?.icon} {DEPARTMENTS.find(d=>d.id===m.dept)?.name||m.dept}</td>
                    <td style={{ fontSize:12 }}>{m.role}</td>
                    <td><span className={`chip chip-${m.status==='active'?'green':'amber'}`}>{m.status}</span></td>
                  </tr>
                ))}
                {!loading && filtered.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)' }}>No members found.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
