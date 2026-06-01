'use client'
import { useState, useEffect, useRef } from 'react'
import { branches, DEPARTMENTS } from '@/lib/data'
import { QRCodeSVG } from 'qrcode.react'

const INITIAL_USERS = [
  { id:'u1', name:'Pastor Bolaji Idowu',  email:'pastor@hicc.org',         role:'senior_pastor', branch:'lekki',  dept:'admin',    status:'active',  joined:'Jan 2024' },
  { id:'u2', name:'Pastor Kanmi Adeyemi', email:'pastor.ikeja@hicc.org',   role:'branch_pastor', branch:'ikeja',  dept:'admin',    status:'active',  joined:'Jan 2024' },
  { id:'u3', name:'Pastor James Osei',    email:'pastor.london@hicc.org',  role:'branch_pastor', branch:'london', dept:'admin',    status:'active',  joined:'Jan 2024' },
  { id:'u4', name:'Segun Adeyemi',        email:'segun.a@hicc.org',        role:'unit_head',     branch:'lekki',  dept:'ushering', status:'active',  joined:'Mar 2024' },
  { id:'u5', name:'Tosin Obi',            email:'tosin.o@hicc.org',        role:'unit_head',     branch:'gbagada',dept:'kids',     status:'active',  joined:'Apr 2024' },
  { id:'u6', name:'Emeka Nwosu',          email:'emeka.n@hicc.org',        role:'member',        branch:'lekki',  dept:'worship',  status:'pending', joined:'May 2024' },
  { id:'u7', name:'Ngozi Kalu',           email:'ngozi.k@hicc.org',        role:'member',        branch:'lekki',  dept:'prayer',   status:'pending', joined:'May 2024' },
]

const ROLE_LABELS: Record<string,string> = { senior_pastor:'Senior Pastor', branch_pastor:'Branch Pastor', unit_head:'Unit Head', member:'Member' }
const ROLE_COLORS: Record<string,string> = { senior_pastor:'var(--brand)', branch_pastor:'var(--purple)', unit_head:'var(--teal)', member:'var(--green)' }

function QRCodeWidget({ value, size=160 }: { value:string; size?:number }) {
  return (
    <div style={{ background:'white', padding:12, borderRadius:12, display:'inline-block', boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
      <QRCodeSVG value={value} size={size} fgColor="#1a1040" bgColor="#ffffff" level="M" />
    </div>
  )
}


// ── General Settings — fully editable ──────────────────────────────────────
function GeneralSettings() {
  const [platformName, setPlatformName] = useState('Harvesters HICC Workforce Platform')
  const [followUpSchedule, setFollowUpSchedule] = useState(['2 weeks','4 weeks','3 months','4 months'])
  const [sessionTimeout, setSessionTimeout] = useState('15')
  const [allowSelfRegister, setAllowSelfRegister] = useState(true)
  const [requireApproval, setRequireApproval] = useState(true)
  const [saved, setSaved] = useState(false)

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false), 2500) }

  return (
    <div style={{ maxWidth:540 }}>
      {saved && (
        <div style={{ background:'var(--green-lt)', border:'1px solid rgba(27,158,90,0.3)', borderRadius:'var(--r)', padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--green)', fontWeight:600 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
          Settings saved
        </div>
      )}

      <div className="card card-p" style={{ marginBottom:12 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:14 }}>Platform identity</h3>
        <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Platform name</label>
        <input className="input" value={platformName} onChange={e=>setPlatformName(e.target.value)} placeholder="Platform name" style={{ marginBottom:12 }}/>
        <div className="stat-row"><span style={{ fontSize:12.5, color:'var(--t-2)' }}>Version</span><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t-1)', fontWeight:600 }}>v7.0</span></div>
        <div className="stat-row"><span style={{ fontSize:12.5, color:'var(--t-2)' }}>Backend</span><span style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>● Railway · Online</span></div>
        <div className="stat-row"><span style={{ fontSize:12.5, color:'var(--t-2)' }}>Frontend</span><span style={{ fontSize:12, color:'var(--t-1)', fontWeight:600 }}>Vercel · my-harvesters.vercel.app</span></div>
      </div>

      <div className="card card-p" style={{ marginBottom:12 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:14 }}>Session & security</h3>
        <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Access token expiry (minutes)</label>
        <select className="select" value={sessionTimeout} onChange={e=>setSessionTimeout(e.target.value)} style={{ marginBottom:4 }}>
          {['5','10','15','30','60'].map(v=><option key={v} value={v}>{v} minutes</option>)}
        </select>
        <p style={{ fontSize:11.5, color:'var(--t-3)', marginTop:4 }}>Shorter expiry is more secure. Users are re-authenticated automatically via refresh token.</p>
      </div>

      <div className="card card-p" style={{ marginBottom:12 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:14 }}>Registration settings</h3>
        {[
          { label:'Allow self-registration via QR code', note:'Members can sign up by scanning branch QR codes', val:allowSelfRegister, set:setAllowSelfRegister },
          { label:'Require admin approval for new accounts', note:'New registrations are pending until approved', val:requireApproval, set:setRequireApproval },
        ].map(s => (
          <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--t-1)' }}>{s.label}</div>
              <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:2 }}>{s.note}</div>
            </div>
            <button onClick={()=>s.set((v:boolean)=>!v)} style={{ width:44, height:24, borderRadius:100, border:'none', cursor:'pointer', background:s.val?'var(--brand)':'var(--s-4)', transition:'background .2s', position:'relative', flexShrink:0, marginLeft:16 }}>
              <span style={{ position:'absolute', top:2, left:s.val?22:2, width:20, height:20, borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left .2s' }}/>
            </button>
          </div>
        ))}
      </div>

      <div className="card card-p" style={{ marginBottom:20 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:14 }}>Follow-up schedule</h3>
        <p style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:14 }}>Automated pastoral follow-up messages sent to new converts and first-timers.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {followUpSchedule.map((stage, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:22, height:22, borderRadius:'50%', background:'var(--brand)', color:'white', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
              <input className="input" value={stage} onChange={e=>setFollowUpSchedule(prev=>prev.map((s,j)=>j===i?e.target.value:s))} style={{ flex:1 }}/>
              {followUpSchedule.length > 1 && (
                <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setFollowUpSchedule(prev=>prev.filter((_,j)=>j!==i))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-sm" style={{ alignSelf:'flex-start', marginTop:4 }} onClick={()=>setFollowUpSchedule(prev=>[...prev,''])}>+ Add stage</button>
        </div>
      </div>

      <button className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14, fontWeight:700 }} onClick={save}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
        Save settings
      </button>
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState<'users'|'branches'|'departments'|'qr'|'general'>('users')
  const [users, setUsers] = useState(INITIAL_USERS)
  const [depts, setDepts] = useState(DEPARTMENTS)
  const [branchList, setBranchList] = useState(branches)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddDept, setShowAddDept] = useState(false)
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [userFilter, setUserFilter] = useState('all')
  const [qrBranch, setQrBranch] = useState('lekki')
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)
  const [branchDeleteConfirm, setBranchDeleteConfirm] = useState<string|null>(null)

  const [userForm, setUserForm] = useState({ name:'', email:'', role:'member', branch:'lekki', dept:'ushering' })
  const [deptForm, setDeptForm] = useState({ name:'', icon:'📋', color:'#7C3AED', head:'' })
  const [branchForm, setBranchForm] = useState({ name:'', location:'', country:'NG', pastor:'' })

  const currentUser = { role:'senior_pastor' } // In production: from auth context

  const filteredUsers = userFilter === 'all' ? users : userFilter === 'pending' ? users.filter(u=>u.status==='pending') : users.filter(u=>u.role===userFilter)

  const addUser = (e: React.FormEvent) => {
    e.preventDefault()
    setUsers(prev => [...prev, { id:`u${Date.now()}`, ...userForm, status:'pending', joined: new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'}) }])
    setUserForm({ name:'', email:'', role:'member', branch:'lekki', dept:'ushering' }); setShowAddUser(false)
  }

  const approveUser = (id: string) => setUsers(prev => prev.map(u => u.id===id ? {...u,status:'active'} : u))
  const deleteUser  = (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); setDeleteConfirm(null) }

  const addDept = (e: React.FormEvent) => {
    e.preventDefault()
    setDepts(prev => [...prev, { id:`d${Date.now()}`, name:deptForm.name, color:deptForm.color, icon:deptForm.icon, head:deptForm.head }])
    setDeptForm({ name:'', icon:'📋', color:'#7C3AED', head:'' }); setShowAddDept(false)
  }

  const addBranch = (e: React.FormEvent) => {
    e.preventDefault()
    setBranchList(prev => [...prev, { id:`br${Date.now()}`, name:branchForm.name, short:branchForm.name.split(' ')[0], location:branchForm.location, country:branchForm.country as any, type:'branch', pastor:branchForm.pastor, members:0, attendance:0, services:1, color:'#7C3AED', founded:new Date().getFullYear() }])
    setBranchForm({ name:'', location:'', country:'NG', pastor:'' }); setShowAddBranch(false)
  }

  const deleteBranch = (id: string) => {
    if (currentUser.role !== 'senior_pastor') return alert('Only the Super Admin can delete a branch.')
    setBranchList(prev => prev.filter(b => b.id !== id)); setBranchDeleteConfirm(null)
  }

  const qrUrl = `https://my-harvesters.vercel.app/signup?branch=${qrBranch}&ref=${Date.now().toString(36)}`

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontWeight:800, fontSize:17, fontFamily:'var(--font-display)', color:'var(--t-1)', letterSpacing:'-0.02em', marginBottom:3 }}>Platform Settings</h2>
        <p style={{ fontSize:12.5, color:'var(--t-3)' }}>Manage users, branches, departments, and platform configuration</p>
      </div>

      {/* Main tabs */}
      <div className="tabs" style={{ marginBottom:20 }}>
        {([['users','👥 Users'],['branches','🏛 Branches'],['departments','📂 Departments'],['qr','🔳 QR Signup'],['general','⚙️ General']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--t-3)', fontWeight:600, marginRight:2 }}>Filter:</span>
              {[['all','All'],['pending','Pending'],['senior_pastor','Senior Pastor'],['branch_pastor','Branch Pastor'],['unit_head','Unit Head'],['member','Member']].map(([k,l]) => {
                const pCount = k==='pending' ? users.filter(u=>u.status==='pending').length : 0
                const isActive = userFilter===k
                return (
                  <button key={k} onClick={()=>setUserFilter(k)} style={{ padding:'4px 12px', borderRadius:100, fontSize:11.5, fontWeight:isActive?700:500, cursor:'pointer', border:`1px solid ${isActive?'var(--brand)':'var(--border-md)'}`, background:isActive?'var(--brand)':'var(--s-2)', color:isActive?'white':'var(--t-2)', transition:'all .12s', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:5 }}>
                    {l}{pCount>0&&<span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(255,255,255,0.3)', fontSize:9.5, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{pCount}</span>}
                  </button>
                )
              })}
            </div>
            <button className="btn btn-brand btn-sm" onClick={()=>setShowAddUser(v=>!v)}>+ Add user</button>
          </div>

          {showAddUser && (
            <div className="card card-p" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Add new user</div>
              <form onSubmit={addUser}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Full name</label><input className="input" value={userForm.name} onChange={e=>setUserForm(f=>({...f,name:e.target.value}))} placeholder="Full name" required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Email</label><input className="input" type="email" value={userForm.email} onChange={e=>setUserForm(f=>({...f,email:e.target.value}))} placeholder="email@hicc.org" required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Role</label><select className="input" value={userForm.role} onChange={e=>setUserForm(f=>({...f,role:e.target.value}))}>{Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Branch</label><select className="input" value={userForm.branch} onChange={e=>setUserForm(f=>({...f,branch:e.target.value}))}>{branchList.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Department / Unit</label><select className="input" value={userForm.dept} onChange={e=>setUserForm(f=>({...f,dept:e.target.value}))}>{depts.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}</select></div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" className="btn btn-brand btn-sm">Create user</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowAddUser(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {deleteConfirm && (
            <div style={{ padding:'14px 18px', background:'var(--red-lt)', borderRadius:'var(--r)', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize:13, color:'var(--red)', fontWeight:600 }}>Delete this user permanently?</span>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-danger btn-sm" onClick={()=>deleteUser(deleteConfirm)}>Yes, delete</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="card" style={{ overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', background:'linear-gradient(90deg, rgba(27,67,50,0.05) 0%, transparent 100%)', borderBottom:'1px solid var(--border-md)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-display)', color:'var(--t-1)' }}>
                {filteredUsers.length} {userFilter==='all'?'total users':userFilter==='pending'?'pending approval':userFilter.replace('_',' ')+'s'}
              </span>
              <span style={{ fontSize:11, color:'var(--t-3)' }}>{users.filter(u=>u.status==='active').length} active · {users.filter(u=>u.status==='pending').length} pending</span>
            </div>
            <table className="tbl">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight:700 }}>{u.name}</td>
                    <td style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>{u.email}</td>
                    <td><span style={{ background:`${ROLE_COLORS[u.role]||'var(--brand)'}20`, color:ROLE_COLORS[u.role]||'var(--brand)', padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:600 }}>{ROLE_LABELS[u.role]||u.role}</span></td>
                    <td style={{ fontSize:12 }}>{branchList.find(b=>b.id===u.branch)?.name||u.branch}</td>
                    <td style={{ fontSize:12 }}>{depts.find(d=>d.id===u.dept)?.name||u.dept}</td>
                    <td><span className={`chip chip-${u.status==='active'?'green':'amber'}`}>{u.status==='active'?'Active':'Pending'}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {u.status === 'pending' && <button className="btn btn-sm" style={{ background:'var(--green-lt)', color:'var(--green)', border:'1px solid rgba(16,185,129,0.3)', fontSize:11 }} onClick={()=>approveUser(u.id)}>Approve</button>}
                        <button className="btn btn-sm btn-danger" style={{ fontSize:11 }} onClick={()=>setDeleteConfirm(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BRANCHES ── */}
      {tab === 'branches' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:12.5, color:'var(--t-2)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="13" height="13" style={{ marginRight:5, verticalAlign:'middle' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Only the <strong style={{ color:'var(--t-1)' }}>Super Admin</strong> can delete branches.
            </div>
            <button className="btn btn-brand btn-sm" onClick={()=>setShowAddBranch(v=>!v)}>+ Add branch</button>
          </div>

          {showAddBranch && (
            <div className="card card-p" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Add new branch</div>
              <form onSubmit={addBranch}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Branch name</label><input className="input" value={branchForm.name} onChange={e=>setBranchForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Surulere Campus" required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Location</label><input className="input" value={branchForm.location} onChange={e=>setBranchForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Surulere, Lagos" required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Country</label><select className="input" value={branchForm.country} onChange={e=>setBranchForm(f=>({...f,country:e.target.value}))}><option value="NG">Nigeria</option><option value="UK">United Kingdom</option><option value="US">United States</option><option value="GH">Ghana</option><option value="CA">Canada</option></select></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Assigned pastor</label><input className="input" value={branchForm.pastor} onChange={e=>setBranchForm(f=>({...f,pastor:e.target.value}))} placeholder="TBA"/></div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" className="btn btn-brand btn-sm">Create branch</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowAddBranch(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {branchDeleteConfirm && (
            <div style={{ padding:'14px 18px', background:'var(--red-lt)', borderRadius:'var(--r)', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize:13, color:'var(--red)', fontWeight:600 }}>Permanently delete "{branchList.find(b=>b.id===branchDeleteConfirm)?.name}"? This cannot be undone.</span>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-danger btn-sm" onClick={()=>deleteBranch(branchDeleteConfirm)}>Yes, delete</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setBranchDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {branchList.map(b => (
              <div key={b.id} className="card" style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width:12, height:12, borderRadius:'50%', background:b.color, boxShadow:`0 0 8px ${b.color}` }}/>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{b.name}</div>
                      <div style={{ fontSize:11.5, color:'var(--t-2)', marginTop:1 }}>{b.location}</div>
                    </div>
                  </div>
                  <span className="chip chip-gray">{b.country}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'var(--t-2)', marginBottom:12 }}>
                  <span>{b.members.toLocaleString()} members</span>
                  <span>{b.pastor}</span>
                </div>
                {currentUser.role === 'senior_pastor' ? (
                  <button className="btn btn-danger btn-sm" style={{ width:'100%', justifyContent:'center', fontSize:11.5 }} onClick={()=>setBranchDeleteConfirm(b.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    Delete branch
                  </button>
                ) : (
                  <div style={{ fontSize:11, color:'var(--t-3)', textAlign:'center' }}>Super admin required to delete</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DEPARTMENTS ── */}
      {tab === 'departments' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, color:'var(--t-2)' }}>Service units and departments. Users select their department when signing up.</div>
            <button className="btn btn-brand btn-sm" onClick={()=>setShowAddDept(v=>!v)}>+ Add department</button>
          </div>

          {showAddDept && (
            <div className="card card-p" style={{ marginBottom:16, maxWidth:480 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Create service unit / department</div>
              <form onSubmit={addDept}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Department name</label><input className="input" value={deptForm.name} onChange={e=>setDeptForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Social Media" required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Icon (emoji)</label><input className="input" value={deptForm.icon} onChange={e=>setDeptForm(f=>({...f,icon:e.target.value}))} placeholder="📱"/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Colour (hex)</label><div style={{ display:'flex', gap:8, alignItems:'center' }}><input className="input" value={deptForm.color} onChange={e=>setDeptForm(f=>({...f,color:e.target.value}))} placeholder="#7C3AED"/><div style={{ width:32, height:32, borderRadius:6, background:deptForm.color, border:'1px solid var(--border)', flexShrink:0 }}/></div></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Head</label><input className="input" value={deptForm.head} onChange={e=>setDeptForm(f=>({...f,head:e.target.value}))} placeholder="Name of dept head"/></div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" className="btn btn-brand btn-sm">Create department</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowAddDept(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
            {depts.map(d => (
              <div key={d.id} className="card" style={{ padding:'14px 16px', borderLeft:`3px solid ${d.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ fontSize:22 }}>{d.icon}</span>
                    <div style={{ fontWeight:700, fontSize:13.5, marginTop:6 }}>{d.name}</div>
                    <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:2 }}>{d.head}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setDepts(prev=>prev.filter(x=>x.id!==d.id))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QR SIGNUP ── */}
      {tab === 'qr' && (
        <div>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>QR Code Signup</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:18, lineHeight:1.65, maxWidth:520 }}>
            Print this QR code and place it at the entrance of each branch. Members and new converts scan it to register, selecting their name, phone, department, and unit. Data flows directly into the platform.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:640 }}>
            <div className="card card-p">
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Select branch</div>
              {branchList.map(b => (
                <div key={b.id} onClick={()=>setQrBranch(b.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'0.5px solid var(--border)', cursor:'pointer' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${qrBranch===b.id?b.color:'var(--border-md)'}`, background: qrBranch===b.id?b.color:'transparent', transition:'all .15s', flexShrink:0 }}/>
                  <span style={{ fontSize:13, fontWeight: qrBranch===b.id?700:400, color: qrBranch===b.id?'var(--t-1)':'var(--t-2)' }}>{b.name}</span>
                </div>
              ))}
            </div>

            <div className="card card-p" style={{ textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>{branchList.find(b=>b.id===qrBranch)?.name}</div>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                <QRCodeWidget value={qrUrl} size={160}/>
              </div>
              <div style={{ fontSize:10.5, color:'var(--t-3)', marginBottom:14, wordBreak:'break-all', fontFamily:'var(--font-mono)' }}>{qrUrl}</div>
              <div style={{ display:'flex', gap:8, flexDirection:'column' }}>
                <button className="btn btn-brand btn-sm" style={{ justifyContent:'center' }} onClick={()=>window.print()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Print QR code
                </button>
                <button className="btn btn-sm" style={{ justifyContent:'center' }} onClick={()=>navigator.clipboard.writeText(qrUrl)}>Copy signup link</button>
              </div>
            </div>
          </div>

          <div style={{ marginTop:20, padding:'14px 18px', background:'var(--s-3)', borderRadius:'var(--r-lg)', border:'0.5px solid var(--border)', maxWidth:640 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>What members fill in when they scan:</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {['Full name','Phone number','Email (optional)','Branch (pre-filled)','Department / Unit','Whether they are a first-timer'].map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--t-2)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── GENERAL ── */}
      {tab === 'general' && (
        <GeneralSettings/>
      )}
    </div>
  )
}
