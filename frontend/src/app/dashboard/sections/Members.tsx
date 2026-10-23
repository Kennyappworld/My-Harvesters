'use client'
import { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react'
import { notify } from '@/lib/toast'
import { branches, DEPARTMENTS } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportMembersCSV(list: any[], label = 'members') {
  const headers = ['Name','Phone','Email','Branch','Department','Role','Status','Joined','Birthday']
  const rows = list.map(m => [
    m.name, m.phone || '', m.email || '',
    branches.find((b:any) => b.id === m.branch)?.name || m.branch || '',
    DEPARTMENTS.find((d:any) => d.id === m.dept)?.name || m.dept || '',
    m.role || 'Member', m.status || 'active', m.joined || '', m.birthday || '',
  ])
  const csv = [headers, ...rows].map(r => r.map((v:string) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `${label}-${new Date().toISOString().slice(0,10)}.csv` })
  a.click(); URL.revokeObjectURL(url)
  notify.success(`Exported ${list.length} member${list.length !== 1 ? 's' : ''}`)
}

function parseJoinedDate(joined: string): Date | null {
  // "Jun 2023" or "2023-06-01"
  if (!joined) return null
  if (joined.includes('-')) return new Date(joined)
  const d = new Date(joined + ' 1')
  return isNaN(d.getTime()) ? null : d
}

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  : null

// Empty fallback — real members are always loaded from Supabase.
// Never use hardcoded names, phone numbers, or email addresses here
// as they may be mistaken for real person data.
const FALLBACK_MEMBERS: any[] = []

export default function Members({ onNavigate, memberSearch, onMemberSearchConsumed }: { onNavigate:(p:string)=>void; memberSearch?:string; onMemberSearchConsumed?:()=>void }) {
  const { user } = useSession()
  const [members, setMembers] = useState<any[]>(() => hydrate('sanctuaryhq_members' as any, FALLBACK_MEMBERS))
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
  const [joinFrom, setJoinFrom]   = useState('')
  const [joinTo, setJoinTo]       = useState('')
  const [bulkMode, setBulkMode]   = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [bulkMsgOpen, setBulkMsgOpen] = useState(false)
  const [bulkMsg, setBulkMsg]     = useState('')
  const [bulkChannel, setBulkChannel] = useState<'sms'|'whatsapp'>('whatsapp')
  const [bulkSending, setBulkSending] = useState(false)
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

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>, memberId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Strict type validation — reject anything that's not a real image
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_TYPES.includes(file.type)) {
      notify.error('Only JPEG, PNG, WebP or GIF images are allowed')
      return
    }
    // 2 MB cap — base64 in DB is not allowed (would bloat ~1.33× and cause slow queries)
    if (file.size > 2 * 1024 * 1024) { notify.error('Photo must be under 2MB'); return }

    if (!supabase) {
      notify.error('Supabase is not configured — photo upload requires a storage bucket')
      return
    }

    try {
      // Upload to Supabase Storage (bucket: avatars) — never store base64 in DB
      const ext = file.type.split('/')[1] || 'jpg'
      const path = `avatars/${memberId}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (upErr) {
        // If storage bucket doesn't exist yet, show a clear message
        if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('bucket')) {
          notify.error('Storage not set up: create an "avatars" bucket in Supabase Storage')
        } else {
          notify.error('Upload failed: ' + upErr.message)
        }
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // Update avatar_url via server API — not direct client mutation
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/worker/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, photo: publicUrl } : m))
      if (selected?.id === memberId) setSelected((s: any) => ({ ...s, photo: publicUrl }))
      notify.success('Photo updated')
    } catch (err: any) {
      notify.error('Upload failed: ' + (err?.message || 'Unknown error'))
    }
  }

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const newMember = {
      id: `m${Date.now()}`, ...form, role:'Member', status:'active',
      joined: new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'}),
      growth:0, attendance:0, photo:''
    }
    setMembers(prev => { const next = [...prev, newMember]; persist('sanctuaryhq_members' as any, next); return next })
    // Register new member via server API — not direct client insert
    if (supabase && user?.id) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/create-worker-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({
            email: form.email || null,
            password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '1!',
            name: form.name,
            phone: form.phone,
            branch_key: form.branch,
            dept: form.dept,
            role: 'worker',
          }),
        })
      } catch {}
    }
    setForm({ name:'', phone:'', email:'', branch:'lekki', dept:'ushering', birthday:'' })
    setShowAdd(false); setSaving(false)
    notify.success('Member registered successfully')
  }

  const updateGrowth = async (memberId: string, level: number) => {
    setMembers(prev => prev.map(m => m.id===memberId ? {...m, growth:level} : m))
    if (selected) setSelected((s:any) => ({...s, growth:level}))
    // Growth level update via server API — admin action on another member's record
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/worker/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ target_id: memberId, department: `growth_l${level}` }), // admin targets another worker
        })
      } catch {}
    }
  }

  const filtered = useMemo(() => members.filter(m => {
    const q = search.toLowerCase()
    if (!(m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.phone?.includes(q))) return false
    if (filterBranch !== 'all' && m.branch !== filterBranch) return false
    if (filterDept   !== 'all' && m.dept   !== filterDept)   return false
    // Join-date range filter
    if (joinFrom || joinTo) {
      const d = parseJoinedDate(m.joined)
      if (!d) return false
      if (joinFrom && d < new Date(joinFrom)) return false
      if (joinTo   && d > new Date(joinTo))   return false
    }
    return true
  }), [members, search, filterBranch, filterDept, joinFrom, joinTo])

  const checkedMembers = useMemo(() => filtered.filter(m => checkedIds.has(m.id)), [filtered, checkedIds])

  const toggleCheck = (id: string) => setCheckedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAll = () => {
    if (checkedIds.size === filtered.length) setCheckedIds(new Set())
    else setCheckedIds(new Set(filtered.map((m:any) => m.id)))
  }

  const sendBulkWhatsApp = () => {
    checkedMembers.forEach((m, i) => {
      setTimeout(() => {
        const msg = encodeURIComponent(bulkMsg.replace(/\{name\}/g, m.name.split(' ')[0]))
        const phone = (m.phone || '').replace(/\D/g,'')
        if (phone) window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
      }, i * 600)
    })
    notify.success(`Opened WhatsApp for ${checkedMembers.length} member${checkedMembers.length!==1?'s':''}`)
    setBulkMsgOpen(false)
  }

  const sendBulkSMS = async () => {
    setBulkSending(true)
    try {
      const payload = checkedMembers.map(m => ({
        to: (m.phone || '').replace(/\D/g,''),
        message: bulkMsg.replace(/\{name\}/g, m.name.split(' ')[0]),
      })).filter((p:any) => p.to.length >= 7)
      const res  = await fetch('/api/send-sms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages: payload }) })
      const data = await res.json()
      if (data.sent) notify.success(`SMS sent to ${data.sent} member${data.sent!==1?'s':''}`)
      else notify.error(data.error || 'SMS send failed')
    } catch { notify.error('Failed to send SMS') }
    setBulkSending(false)
    setBulkMsgOpen(false)
  }

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
                {checkedIds.size > 0 && <span style={{color:'#c9a84c',fontWeight:700}}> · {checkedIds.size} selected</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {/* Bulk action bar */}
              {bulkMode && checkedIds.size > 0 && (
                <>
                  <button className="btn btn-sm" onClick={() => exportMembersCSV(checkedMembers, 'selected-members')}>↓ Export ({checkedIds.size})</button>
                  <button onClick={() => { setBulkChannel('whatsapp'); setBulkMsgOpen(true) }} style={{
                    padding:'6px 12px', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer',
                    background:'rgba(37,211,102,0.10)', border:'1px solid rgba(37,211,102,0.28)', color:'#25d366',
                  }}>💬 WA ({checkedIds.size})</button>
                  <button onClick={() => { setBulkChannel('sms'); setBulkMsgOpen(true) }} className="btn btn-sm">📱 SMS ({checkedIds.size})</button>
                </>
              )}
              <button className={`btn btn-sm ${bulkMode?'btn-brand':''}`} onClick={()=>{setBulkMode(v=>!v);setCheckedIds(new Set())}}>
                {bulkMode ? '✓ Done selecting' : '☑ Select'}
              </button>
              <button className="btn btn-sm" onClick={() => exportMembersCSV(filtered, 'members')}>↓ Export</button>
              <button className="btn btn-brand btn-sm" onClick={()=>setShowAdd(v=>!v)}>+ Add member</button>
            </div>
          </div>

          {/* Bulk message composer */}
          {bulkMsgOpen && (
            <div style={{
              position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.6)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }} onClick={()=>setBulkMsgOpen(false)}>
              <div onClick={e=>e.stopPropagation()} style={{
                background:'var(--s-2)', borderRadius:16, padding:24, width:'min(500px,92vw)',
                border:'1px solid var(--border-md)',
              }}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>
                  {bulkChannel==='whatsapp' ? '💬 Bulk WhatsApp' : '📱 Bulk SMS'} to {checkedIds.size} members
                </div>
                <div style={{fontSize:11.5,color:'var(--t-3)',marginBottom:12}}>Use <code style={{color:'#c9a84c'}}>{'{name}'}</code> for first name</div>
                <textarea value={bulkMsg} onChange={e=>setBulkMsg(e.target.value)} rows={5}
                  placeholder="Type your message here… Hi {name}, this is a message from the church…"
                  style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:9,background:'var(--s-4)',border:'1px solid var(--border)',color:'var(--t-1)',fontSize:13,resize:'vertical',outline:'none',fontFamily:'var(--font-body)'}}
                />
                <div style={{display:'flex',gap:10,marginTop:12}}>
                  <button disabled={!bulkMsg.trim() || bulkSending}
                    onClick={bulkChannel==='whatsapp' ? sendBulkWhatsApp : sendBulkSMS}
                    className="btn btn-brand" style={{flex:1}}>
                    {bulkSending ? 'Sending…' : bulkChannel==='whatsapp' ? 'Open WhatsApp' : 'Send SMS'}
                  </button>
                  <button className="btn btn-ghost" onClick={()=>setBulkMsgOpen(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

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

          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'flex-end' }}>
            <input className="input" placeholder="Search name, email, phone…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:220 }}/>
            <select className="input" value={filterBranch} onChange={e=>setFilterBranch(e.target.value)} style={{ width:160 }}>
              <option value="all">All branches</option>
              {branches.map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="input" value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={{ width:180 }}>
              <option value="all">All departments</option>
              {DEPARTMENTS.map((d:any)=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
            {/* Join date range */}
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{fontSize:11,color:'var(--t-3)',whiteSpace:'nowrap'}}>Joined:</span>
              <input type="date" value={joinFrom} onChange={e=>setJoinFrom(e.target.value)} className="input" style={{width:140}} title="Joined from"/>
              <span style={{fontSize:11,color:'var(--t-3)'}}>–</span>
              <input type="date" value={joinTo} onChange={e=>setJoinTo(e.target.value)} className="input" style={{width:140}} title="Joined to"/>
              {(joinFrom||joinTo) && <button className="btn btn-ghost btn-sm" onClick={()=>{setJoinFrom('');setJoinTo('')}}>✕</button>}
            </div>
          </div>

          <div className="card card-p">
            <table className="tbl">
              <thead>
                <tr>
                  {bulkMode && <th style={{width:32}}><input type="checkbox" checked={checkedIds.size===filtered.length&&filtered.length>0} onChange={toggleAll} style={{accentColor:'#c9a84c'}}/></th>}
                  <th>Name</th><th>Branch</th><th>Department</th><th>Joined</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)' }}>Loading members…</td></tr>}
                {!loading && filtered.map((m:any) => (
                  <tr key={m.id} style={{ cursor:'pointer' }}
                    onClick={() => bulkMode ? toggleCheck(m.id) : setSelected(m)}
                    tabIndex={0} role="button"
                    className={checkedIds.has(m.id) ? 'row-selected' : ''}>
                    {bulkMode && (
                      <td onClick={e=>e.stopPropagation()}>
                        <input type="checkbox" checked={checkedIds.has(m.id)} onChange={()=>toggleCheck(m.id)} style={{accentColor:'#c9a84c'}}/>
                      </td>
                    )}
                    <td>
                      <strong>{m.name}</strong>
                      <div style={{ fontSize:11, color:'var(--t-3)' }}>{m.phone || m.email}</div>
                    </td>
                    <td style={{ fontSize:12 }}>{(branches as any[]).find((b:any)=>b.id===m.branch)?.name||m.branch}</td>
                    <td style={{ fontSize:12 }}>{(DEPARTMENTS as any[]).find((d:any)=>d.id===m.dept)?.icon} {(DEPARTMENTS as any[]).find((d:any)=>d.id===m.dept)?.name||m.dept}</td>
                    <td style={{ fontSize:12 }}>{m.joined||'—'}</td>
                    <td><span className={`chip chip-${m.status==='active'?'green':'amber'}`}>{m.status}</span></td>
                  </tr>
                ))}
                {!loading && filtered.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)' }}>No members found.</td></tr>}
              </tbody>
            </table>
          </div>
          <style>{`.row-selected{background:rgba(201,168,76,0.06)!important}`}</style>
        </>
      )}
    </div>
  )
}
