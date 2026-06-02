'use client'
import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null
import { getOrgSettings, saveOrgSettings } from '@/lib/orgSettings'
import { notify } from '@/lib/toast'
import { branches, DEPARTMENTS } from '@/lib/data'
import { QRCodeSVG } from 'qrcode.react'

const INITIAL_USERS: any[] = []

const ROLE_LABELS: Record<string,string> = { senior_pastor:'Senior Pastor', branch_pastor:'Branch Pastor', unit_head:'Unit Head', member:'Member' }
const ROLE_COLORS: Record<string,string> = { senior_pastor:'var(--brand)', branch_pastor:'var(--purple)', unit_head:'var(--teal)', member:'var(--green)' }

function QRCodeWidget({ value, size=160 }: { value:string; size?:number }) {
  return (
    <div style={{ background:'white', padding:12, borderRadius:12, display:'inline-block', boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
      <QRCodeSVG value={value} size={size} fgColor="#1a1040" bgColor="#ffffff" level="M" />
    </div>
  )
}


// ── Scripture Manager ────────────────────────────────────────────────────────
function ScriptureManager() {
  const [customScriptures, setCustomScriptures] = useState<{verse:string;ref:string}[]>([])
  const [hasCustom, setHasCustom] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parseError, setParseError] = useState('')
  const [saved, setSavedSc] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hicc_custom_scriptures')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomScriptures(parsed)
          setHasCustom(true)
        }
      }
    } catch {}
  }, [])

  const parseTxt = (text: string) => {
    const entries: {verse:string;ref:string}[] = []
    const blocks = text.split(/\n{2,}/)
    for (const block of blocks) {
      const lines = block.split('\n').map((l: string) => l.trim()).filter(Boolean)
      if (lines.length >= 2) {
        const ref = lines[lines.length - 1]
        const verse = lines.slice(0, lines.length - 1).join(' ')
        if (verse.length > 10 && ref.length > 3) entries.push({ verse, ref })
      } else if (lines.length === 1 && lines[0].includes('|')) {
        const [verse, ref] = lines[0].split('|').map((s: string) => s.trim())
        if (verse && ref) entries.push({ verse, ref })
      }
    }
    return entries
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setUploading(true)
    try {
      const text = await file.text()
      const entries = parseTxt(text)
      if (entries.length < 1) {
        setParseError('Could not parse any scriptures. See the format guide below.')
        setUploading(false)
        return
      }
      setCustomScriptures(entries)
      setHasCustom(true)
    } catch {
      setParseError('Failed to read file. Please upload a plain .txt file.')
    }
    setUploading(false)
  }

  const save = () => {
    localStorage.setItem('hicc_custom_scriptures', JSON.stringify(customScriptures))
    setSavedSc(true)
    setTimeout(() => setSavedSc(false), 2500)
  }

  const reset = () => {
    localStorage.removeItem('hicc_custom_scriptures')
    setCustomScriptures([])
    setHasCustom(false)
  }

  return (
    <div className="card card-p" style={{ marginBottom: 12 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:4 }}>
        <div>
          <h3 style={{ fontFamily:"var(--font-display)", fontSize:13.5, fontWeight:700, marginBottom:2 }}>Scripture splash pool</h3>
          <p style={{ fontSize:12.5, color:"var(--t-2)" }}>
            {hasCustom
              ? <><strong style={{ color:"var(--green)" }}>Custom pool active</strong> &mdash; {customScriptures.length} scriptures loaded</>
              : "Using default pool of 80 faith-building scriptures. Upload a custom list to override."}
          </p>
        </div>
        {hasCustom && (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:1, background:"var(--green-lt)", color:"var(--green)", padding:"3px 8px", borderRadius:20, flexShrink:0, marginLeft:8 }}>CUSTOM</span>
        )}
      </div>

      <div style={{ marginTop:14, display:"flex", gap:8, flexWrap:"wrap" }}>
        <button className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {uploading ? "Reading..." : "Upload scripture list (.txt)"}
        </button>
        {hasCustom && (
          <>
            <button className="btn btn-sm" onClick={save} style={{ display:"flex", alignItems:"center", gap:6, background:"var(--green)", color:"white" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
              {saved ? "Saved!" : "Save custom pool"}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={reset} style={{ fontSize:11.5, color:"var(--red)" }}>Reset to defaults</button>
          </>
        )}
        <input ref={fileRef} type="file" accept=".txt,text/plain" style={{ display:"none" }} onChange={handleFileUpload} />
      </div>

      {parseError && (
        <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(220,50,50,0.08)", border:"1px solid rgba(220,50,50,0.2)", borderRadius:"var(--r)", fontSize:12, color:"#d93535" }}>
          {parseError}
        </div>
      )}

      {hasCustom && customScriptures.length > 0 && (
        <div style={{ marginTop:12, maxHeight:180, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
          {customScriptures.slice(0,5).map((s,i) => (
            <div key={i} style={{ padding:"8px 10px", background:"var(--s-3)", borderRadius:8, borderLeft:"3px solid var(--brand)" }}>
              <p style={{ fontSize:11.5, color:"var(--t-1)", lineHeight:1.6, margin:0 }}>&ldquo;{s.verse.slice(0,100)}{s.verse.length>100?"...":""}&rdquo;</p>
              <p style={{ fontSize:10.5, color:"var(--t-3)", margin:"4px 0 0", fontStyle:"italic" }}>{s.ref}</p>
            </div>
          ))}
          {customScriptures.length > 5 && (
            <p style={{ fontSize:11, color:"var(--t-3)", textAlign:"center", marginTop:4 }}>+ {customScriptures.length - 5} more scriptures</p>
          )}
        </div>
      )}

      <div style={{ marginTop:14, padding:"10px 12px", background:"var(--s-3)", borderRadius:8, border:"1px solid var(--border)" }}>
        <p style={{ fontSize:11.5, fontWeight:600, color:"var(--t-2)", marginBottom:6 }}>File format guide</p>
        <p style={{ fontSize:11, color:"var(--t-3)", lineHeight:1.7, margin:0 }}>
          Option A &mdash; separate each verse with a blank line; put the reference on the last line:<br/>
          <code style={{ background:"rgba(255,255,255,0.05)", padding:"0 4px", borderRadius:4 }}>For God so loved the world... [newline] John 3:16 (NIV)</code><br/><br/>
          Option B &mdash; verse and reference on one line separated by a pipe character:<br/>
          <code style={{ background:"rgba(255,255,255,0.05)", padding:"0 4px", borderRadius:4 }}>For God so loved the world... | John 3:16 (NIV)</code>
        </p>
      </div>
    </div>
  )
}

// ── General Settings — fully editable ──────────────────────────────────────
function GeneralSettings() {
  const [platformName, setPlatformName] = useState('Harvesters International Christian Centre Workforce Community')
  const [followUpSchedule, setFollowUpSchedule] = useState(['2 weeks','4 weeks','3 months','4 months'])
  const [sessionTimeout, setSessionTimeout] = useState('15')
  const [allowSelfRegister, setAllowSelfRegister] = useState(true)
  const [requireApproval, setRequireApproval] = useState(true)
  const [saved, setSaved] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [poweredByText, setPoweredByText] = useState('Powered by Anchorsuites Technologies Ltd')
  const [poweredByUrl, setPoweredByUrl]   = useState('https://anchorsuites.com')
  const [poweredByVisible, setPoweredByVisible] = useState(true)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const s = getOrgSettings()
    setLogoUrl(s.logoUrl || '')
    setPoweredByText(s.poweredByText)
    setPoweredByUrl(s.poweredByUrl)
    setPoweredByVisible(s.poweredByVisible)
  }, [])

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { notify.error('Logo must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const [phoneVisible, setPhoneVisible] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hicc_phone_visible')||'false') } catch { return false }
  })

  const save = () => {
    saveOrgSettings({ logoUrl, poweredByText, poweredByUrl, poweredByVisible })
    localStorage.setItem('hicc_phone_visible', JSON.stringify(phoneVisible))
    setSaved(true)
    setTimeout(()=>setSaved(false), 2500)
  }

  return (
    <div style={{ maxWidth:540 }}>
      {saved && (
        <div style={{ background:'var(--green-lt)', border:'1px solid rgba(27,158,90,0.3)', borderRadius:'var(--r)', padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--green)', fontWeight:600 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
          Settings saved
        </div>
      )}

      {/* ── Logo upload ── */}
      <div className="card card-p" style={{ marginBottom:12 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Church logo</h3>
        <p style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16 }}>Upload your church logo. It will appear in the navigation bar and landing page.</p>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
          <div style={{ width:72, height:72, borderRadius:16, border:'2px dashed var(--border-md)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--s-3)', overflow:'hidden', flexShrink:0 }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo preview" style={{ width:72, height:72, objectFit:'cover', borderRadius:14 }}/>
              : <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="1.5" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            }
          </div>
          <div>
            <button className="btn btn-sm" onClick={()=>logoInputRef.current?.click()} style={{ marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload logo
            </button>
            {logoUrl && <button className="btn btn-sm btn-danger" onClick={()=>setLogoUrl('')} style={{ fontSize:11 }}>Remove</button>}
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display:'none' }} onChange={handleLogoUpload}/>
            <p style={{ fontSize:11, color:'var(--t-3)', marginTop:6 }}>PNG, JPG, SVG · max 2MB · square recommended</p>
          </div>
        </div>
        <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Platform name</label>
        <input className="input" value={platformName} onChange={e=>setPlatformName(e.target.value)} placeholder="Platform name" style={{ marginBottom:12 }}/>
        <div className="stat-row"><span style={{ fontSize:12.5, color:'var(--t-2)' }}>Version</span><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t-1)', fontWeight:600 }}>v7.0</span></div>
        <div className="stat-row"><span style={{ fontSize:12.5, color:'var(--t-2)' }}>Backend</span><span style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>● Railway · Online</span></div>
        <div className="stat-row"><span style={{ fontSize:12.5, color:'var(--t-2)' }}>Frontend</span><span style={{ fontSize:12, color:'var(--t-1)', fontWeight:600 }}>Vercel · my-harvesters.vercel.app</span></div>
      </div>

      {/* ── Powered by ── */}
      <div className="card card-p" style={{ marginBottom:12 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Powered-by attribution</h3>
        <p style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16 }}>Shown at the bottom of every page. Super admin can edit or hide this.</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>Show attribution</div>
            <div style={{ fontSize:11.5, color:'var(--t-3)' }}>Display the powered-by line at the bottom</div>
          </div>
          <button onClick={()=>setPoweredByVisible(v=>!v)} style={{ width:44, height:24, borderRadius:100, border:'none', cursor:'pointer', background:poweredByVisible?'var(--brand)':'var(--s-4)', transition:'background .2s', position:'relative', flexShrink:0 }}>
            <span style={{ position:'absolute', top:2, left:poweredByVisible?22:2, width:20, height:20, borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left .2s' }}/>
          </button>
        </div>
        {poweredByVisible && (
          <>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Attribution text</label>
            <input className="input" value={poweredByText} onChange={e=>setPoweredByText(e.target.value)} placeholder="Powered by..." style={{ marginBottom:10 }}/>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Link URL (optional)</label>
            <input className="input" value={poweredByUrl} onChange={e=>setPoweredByUrl(e.target.value)} placeholder="https://..."/>
            <div style={{ marginTop:12, padding:'10px 14px', background:'var(--s-3)', borderRadius:'var(--r)', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-dk)" strokeWidth="1.8" width="11" height="11"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="21"/><path d="M5 15a7 7 0 0 0 14 0"/></svg>
              <span style={{ fontSize:11, color:'var(--t-3)' }}>Preview: </span>
              <span style={{ fontSize:11, color:'var(--t-2)', fontStyle:'italic' }}>{poweredByText}</span>
            </div>
          </>
        )}
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

      {/* ── Phone visibility ── */}
      <div className="card card-p" style={{ marginBottom:12 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Phone number visibility</h3>
        <p style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:14 }}>Controls whether phone numbers are visible in the Kingdom Network directory. Individual members can also opt out on their own profile.</p>
        <label style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
          <div onClick={()=>setPhoneVisible((v:boolean)=>!v)} style={{ width:40,height:22,borderRadius:11,background:phoneVisible?'var(--brand)':'var(--s-4)',position:'relative',transition:'background .15s',flexShrink:0,cursor:'pointer' }}>
            <div style={{ position:'absolute',top:3,left:phoneVisible?21:3,width:16,height:16,borderRadius:'50%',background:'white',transition:'left .15s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
          </div>
          <span style={{ fontSize:13,color:'var(--t-1)',fontWeight:500 }}>{phoneVisible?'Phone numbers visible to all workers':'Phone numbers hidden (members can share individually)'}</span>
        </label>
      </div>

      {/* ── Scripture splash management ── */}
      <ScriptureManager />

      <button className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14, fontWeight:700 }} onClick={save}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
        Save settings
      </button>
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState<'users'|'branches'|'departments'|'qr'|'general'>('users')
  const [users, setUsers] = useState<any[]>(INITIAL_USERS)
  const [usersLoading, setUsersLoading] = useState(false)

  // Load real workers from Supabase
  useEffect(() => {
    if (!supabase) return
    setUsersLoading(true)
    const loadUsers = async () => {
      try {
        const { data } = await supabase.from('workers').select('*').order('created_at', { ascending: false })
        if (data && data.length > 0) {
          const mapped = data.map((w:any) => ({
            id: w.id, name: w.full_name, email: w.email,
            role: w.role || 'worker', branch: w.branch_id,
            dept: w.department || 'general', status: 'active',
            joined: new Date(w.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'}),
          }))
          setUsers(mapped)
        }
      } catch {}
      setUsersLoading(false)
    }
    loadUsers()
  }, [])
  const [depts, setDepts] = useState(DEPARTMENTS)
  const [branchList, setBranchList] = useState(branches)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddDept, setShowAddDept] = useState(false)
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [userFilter, setUserFilter] = useState('all')
  const [qrBranch, setQrBranch] = useState('lekki')
  const [qrDept,   setQrDept]   = useState('')
  const [qrMode,   setQrMode]   = useState<'branch'|'dept'|'combined'>('branch')
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)
  const [credModal, setCredModal] = useState<{user:any; tempPass:string; sent:boolean}|null>(null)
  const [branchDeleteConfirm, setBranchDeleteConfirm] = useState<string|null>(null)

  const [userForm, setUserForm] = useState({ name:'', email:'', role:'member', branch:'lekki', dept:'ushering' })
  const [deptForm, setDeptForm] = useState({ name:'', icon:'📋', color:'#1B4332', head:'' })
  const [branchForm, setBranchForm] = useState({ name:'', location:'', country:'NG', pastor:'' })

  const currentUser = { role:'senior_pastor' } // In production: from auth context

  const filteredUsers = userFilter === 'all' ? users : userFilter === 'pending' ? users.filter(u=>u.status==='pending') : users.filter(u=>u.role===userFilter)

  const addUser = (e: React.FormEvent) => {
    e.preventDefault()
    setUsers(prev => [...prev, { id:`u${Date.now()}`, ...userForm, status:'pending', joined: new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'}) }])
    setUserForm({ name:'', email:'', role:'member', branch:'lekki', dept:'ushering' }); setShowAddUser(false)
  }

  const genTempPass = () => {
    const adj = ['Grace','Faith','Hope','Light','Joy','Peace','Love','Worthy']
    const num = Math.floor(Math.random()*900)+100
    return adj[Math.floor(Math.random()*adj.length)] + num + '!'
  }

  const approveUser = async (id: string) => {
    const u = users.find(x=>x.id===id)
    if (!u) return
    const tempPass = genTempPass()
    // Mark active in local state
    setUsers(prev => prev.map(x => x.id===id ? {...x, status:'active'} : x))
    if (supabase) {
      // Update worker record
      await supabase.from('workers').update({ status:'active', role:'worker' }).eq('id', id).then(()=>{})
      // If they have an email, create their Supabase auth account
      if (u.email) {
        try {
          await supabase.auth.admin?.createUser({
            email: u.email,
            password: tempPass,
            email_confirm: true,
            user_metadata: { full_name: u.name, branch_id: u.branch, department: u.dept, role: 'worker' }
          })
        } catch {}
      }
    }
    // Show credential modal with temp password
    setCredModal({ user: u, tempPass, sent: false })
  }
  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id))
    setDeleteConfirm(null)
    if (supabase) await supabase.from('workers').delete().eq('id', id)
  }

  const addDept = (e: React.FormEvent) => {
    e.preventDefault()
    setDepts(prev => [...prev, { id:`d${Date.now()}`, name:deptForm.name, color:deptForm.color, icon:deptForm.icon, head:deptForm.head }])
    setDeptForm({ name:'', icon:'📋', color:'#1B4332', head:'' }); setShowAddDept(false)
  }

  const addBranch = (e: React.FormEvent) => {
    e.preventDefault()
    setBranchList(prev => [...prev, { id:`br${Date.now()}`, name:branchForm.name, short:branchForm.name.split(' ')[0], location:branchForm.location, country:branchForm.country as any, type:'branch', pastor:branchForm.pastor, members:0, attendance:0, services:1, color:'#1B4332', founded:new Date().getFullYear() }])
    setBranchForm({ name:'', location:'', country:'NG', pastor:'' }); setShowAddBranch(false)
  }

  const deleteBranch = (id: string) => {
    if (currentUser.role !== 'senior_pastor') { notify.error('Only the Super Admin can delete a branch.'); return }
    setBranchList(prev => prev.filter(b => b.id !== id)); setBranchDeleteConfirm(null)
  }

  const BASE = 'https://my-harvesters.vercel.app/signup'
  const qrUrl = qrMode === 'branch'
    ? `${BASE}?branch=${qrBranch}`
    : qrMode === 'dept'
    ? `${BASE}?dept=${qrDept}`
    : `${BASE}?branch=${qrBranch}&dept=${qrDept}`

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
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Colour (hex)</label><div style={{ display:'flex', gap:8, alignItems:'center' }}><input className="input" value={deptForm.color} onChange={e=>setDeptForm(f=>({...f,color:e.target.value}))} placeholder="#1B4332"/><div style={{ width:32, height:32, borderRadius:6, background:deptForm.color, border:'1px solid var(--border)', flexShrink:0 }}/></div></div>
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
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:18, lineHeight:1.65, maxWidth:580 }}>
            Generate a QR code for any branch, department, or a specific branch+department combination. Members and new converts scan it to self-register — their branch and unit are pre-filled automatically.
          </div>

          {/* Mode selector */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {([['branch','🏛 By Branch'],['dept','📂 By Department'],['combined','🎯 Branch + Department']] as const).map(([k,l]) => (
              <button key={k} className={`btn btn-sm ${qrMode===k?'btn-brand':''}`} onClick={()=>setQrMode(k)}>{l}</button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'minmax(200px,1fr) minmax(200px,1fr)', gap:16, maxWidth:700 }}>

            {/* LEFT — selector */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {/* Branch selector — shown for branch and combined modes */}
              {(qrMode==='branch' || qrMode==='combined') && (
                <div className="card card-p">
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Select branch</div>
                  {branchList.map(b => (
                    <div key={b.id} onClick={()=>setQrBranch(b.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--border)', cursor:'pointer' }}>
                      <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${qrBranch===b.id?b.color:'var(--border-md)'}`, background:qrBranch===b.id?b.color:'transparent', transition:'all .15s', flexShrink:0 }}/>
                      <span style={{ fontSize:12.5, fontWeight:qrBranch===b.id?700:400, color:qrBranch===b.id?'var(--t-1)':'var(--t-2)' }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dept selector — shown for dept and combined modes */}
              {(qrMode==='dept' || qrMode==='combined') && (
                <div className="card card-p">
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Select department</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {DEPARTMENTS.map(d => (
                      <div key={d.id} onClick={()=>setQrDept(d.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:'var(--r)', cursor:'pointer', background:qrDept===d.id?'var(--brand-lt)':'transparent', border:`1px solid ${qrDept===d.id?'var(--brand)':'transparent'}`, transition:'all .12s' }}>
                        <span style={{ fontSize:15 }}>{d.icon}</span>
                        <span style={{ fontSize:12.5, fontWeight:qrDept===d.id?700:400, color:qrDept===d.id?'var(--brand)':'var(--t-2)' }}>{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — QR display */}
            <div className="card card-p" style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
              {/* Label */}
              <div style={{ marginBottom:14, textAlign:'center' }}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:3 }}>
                  {qrMode==='branch' && (branchList.find(b=>b.id===qrBranch)?.name || 'Branch')}
                  {qrMode==='dept'   && (DEPARTMENTS.find(d=>d.id===qrDept)?.icon + ' ' + (DEPARTMENTS.find(d=>d.id===qrDept)?.name || 'Select a department'))}
                  {qrMode==='combined' && (branchList.find(b=>b.id===qrBranch)?.name + ' · ' + (DEPARTMENTS.find(d=>d.id===qrDept)?.name || 'Select department'))}
                </div>
                <div style={{ fontSize:11, color:'var(--t-3)' }}>
                  {qrMode==='branch' && 'Scan to join this branch — pick your unit on form'}
                  {qrMode==='dept'   && 'Scan to join this department — pick your branch on form'}
                  {qrMode==='combined' && 'Scan to join this exact branch & department'}
                </div>
              </div>

              {/* QR Code */}
              {(qrMode==='branch' || (qrMode==='dept' && qrDept) || (qrMode==='combined' && qrDept)) ? (
                <>
                  <div style={{ padding:12, background:'white', borderRadius:12, marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>
                    <QRCodeWidget value={qrUrl} size={180}/>
                  </div>
                  <div style={{ fontSize:10, color:'var(--t-3)', marginBottom:14, wordBreak:'break-all', fontFamily:'var(--font-mono)', textAlign:'left', maxWidth:220 }}>{qrUrl}</div>
                  <div style={{ display:'flex', gap:8, flexDirection:'column', width:'100%' }}>
                    <button className="btn btn-brand btn-sm" style={{ justifyContent:'center' }} onClick={()=>{
                      const win = window.open('','_blank','width=600,height=700')
                      if(!win) return
                      const brName = branchList.find(b=>b.id===qrBranch)?.name || ''
                      const dptName = DEPARTMENTS.find(d=>d.id===qrDept)?.name || ''
                      const title = qrMode==='branch' ? brName : qrMode==='dept' ? dptName : `${brName} · ${dptName}`
                      win.document.write(`<!DOCTYPE html><html><head><title>QR — ${title}</title>
                      <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:Arial,sans-serif}
                      .card{text-align:center;padding:40px;max-width:380px;border:1px solid #eee;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
                      h2{color:#1B3A2A;font-size:22px;margin:0 0 4px}p{color:#666;font-size:13px;margin:0 0 24px}
                      .url{font-size:10px;color:#aaa;word-break:break-all;margin-top:20px;font-family:monospace}
                      .badge{display:inline-block;background:#1B3A2A;color:#C9A84C;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 14px;border-radius:100px;margin-bottom:16px}
                      @media print{.no-print{display:none}body{min-height:unset}}</style></head>
                      <body><div class="card">
                      <div class="badge">Harvesters International Christian Centre</div>
                      <h2>${title}</h2>
                      <p>Scan to register as a worker in this ${qrMode==='branch'?'branch':qrMode==='dept'?'department':'branch & department'}</p>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}" width="220" height="220" style="border-radius:8px"/>
                      <div class="url">${qrUrl}</div>
                      <p class="no-print" style="margin-top:20px"><button onclick="window.print()" style="padding:10px 24px;background:#1B3A2A;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">Print / Save as PDF</button></p>
                      </div></body></html>`)
                      win.document.close()
                    }}>
                      🖨 Print / Save PDF
                    </button>
                    <button className="btn btn-sm" style={{ justifyContent:'center' }} onClick={()=>navigator.clipboard.writeText(qrUrl).then(()=>notify.success('Link copied!'))}>
                      📋 Copy signup link
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ padding:'2rem', color:'var(--t-3)', fontSize:13 }}>
                  {qrMode==='dept' ? 'Select a department to generate QR' : 'Select a branch and department'}
                </div>
              )}
            </div>
          </div>

          {/* Print all QRs for a branch */}
          {qrMode==='combined' && qrDept && (
            <div style={{ marginTop:20, padding:'16px 20px', background:'var(--s-3)', borderRadius:'var(--r-lg)', border:'0.5px solid var(--border)', maxWidth:700 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>📄 Print all departments for {branchList.find(b=>b.id===qrBranch)?.name}</div>
              <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:12 }}>Generate a full print sheet with one QR per department for this branch — print and post at each unit's station.</div>
              <button className="btn btn-brand btn-sm" onClick={()=>{
                const brName = branchList.find(b=>b.id===qrBranch)?.name || ''
                const win = window.open('','_blank','width=900,height=800')
                if(!win) return
                const cards = DEPARTMENTS.map(d => {
                  const url = `https://my-harvesters.vercel.app/signup?branch=${qrBranch}&dept=${d.id}`
                  return `<div class="qr-card">
                    <div class="badge">${d.icon} ${d.name}</div>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}" width="160" height="160"/>
                    <div class="sub">${brName}</div>
                    <div class="url">${url}</div>
                  </div>`
                }).join('')
                win.document.write(`<!DOCTYPE html><html><head><title>QR Sheet — ${brName}</title>
                <style>
                  body{font-family:Arial,sans-serif;background:#fff;padding:24px;color:#1a1a1a}
                  h1{text-align:center;color:#1B3A2A;font-size:18px;margin:0 0 4px}
                  .sub-hdr{text-align:center;font-size:12px;color:#888;margin-bottom:24px}
                  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
                  .qr-card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center}
                  .badge{font-size:13px;font-weight:700;color:#1B3A2A;margin-bottom:10px}
                  .sub{font-size:11px;color:#888;margin-top:8px}
                  .url{font-size:9px;color:#bbb;word-break:break-all;margin-top:4px;font-family:monospace}
                  @media print{@page{margin:12mm}button{display:none}}
                </style></head><body>
                <h1>Harvesters International Christian Centre</h1>
                <div class="sub-hdr">${brName} — Department QR Signup Codes</div>
                <div class="grid">${cards}</div>
                <p style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 24px;background:#1B3A2A;color:#fff;border:none;border-radius:8px;cursor:pointer">Print Sheet</button></p>
                </body></html>`)
                win.document.close()
              }}>
                Print all {DEPARTMENTS.length} department QRs for this branch
              </button>
            </div>
          )}

          {/* What members fill in */}
          <div style={{ marginTop:16, padding:'14px 18px', background:'var(--s-3)', borderRadius:'var(--r-lg)', border:'0.5px solid var(--border)', maxWidth:700 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>What members fill in when they scan</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {[
                ['Full name','always required'],
                ['Phone number','always required'],
                ['Email','optional'],
                ['Branch','pre-filled if branch QR'],
                ['Department / Unit','pre-filled if dept QR'],
                ['First timer?','yes / no toggle'],
              ].map(([f,n]) => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--t-2)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                  <span><strong>{f}</strong> <span style={{color:'var(--t-3)',fontSize:11}}>— {n}</span></span>
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

      {/* ── CREDENTIAL MODAL ── */}
      {credModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}>
          <div className="card card-p" style={{ maxWidth:420, width:'100%', position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16 }}>{credModal.sent ? '✅ Credentials issued' : '🔑 Issue login credentials'}</div>
                <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>for {credModal.user.name}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setCredModal(null)}>✕</button>
            </div>

            {!credModal.sent ? (
              <>
                <div style={{ padding:'14px 16px', background:'var(--s-3)', borderRadius:'var(--r)', marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--t-3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Temporary password</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color:'var(--brand)', letterSpacing:'0.05em', marginBottom:8 }}>{credModal.tempPass}</div>
                  <div style={{ fontSize:12, color:'var(--t-3)' }}>They must change this on first login</div>
                </div>

                {credModal.user.email ? (
                  <>
                    <div style={{ padding:'10px 14px', background:'rgba(27,158,90,0.08)', border:'1px solid rgba(27,158,90,0.2)', borderRadius:'var(--r)', marginBottom:14, fontSize:12.5, color:'var(--t-2)' }}>
                      ✉ An account has been created. Share the password below with <strong>{credModal.user.name}</strong> via WhatsApp or in person.
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', marginBottom:6 }}>Message to share:</div>
                      <textarea
                        readOnly
                        className="input"
                        rows={5}
                        style={{ fontFamily:'var(--font-mono)', fontSize:12, resize:'none' }}
                        value={`Hi ${credModal.user.name},

Your Harvesters Workforce Community account is ready.

Login: ${credModal.user.email}
Password: ${credModal.tempPass}

Visit: https://my-harvesters.vercel.app/login

Please change your password after first login.`}
                      />
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-brand" style={{ flex:1, justifyContent:'center' }} onClick={()=>{
                        const msg = `Hi ${credModal.user.name},

Your Harvesters Workforce Community account is ready.

Login: ${credModal.user.email}
Password: ${credModal.tempPass}

Visit: https://my-harvesters.vercel.app/login

Please change your password after first login.`
                        const wa = `https://wa.me/${credModal.user.phone?.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`
                        window.open(wa,'_blank','noopener')
                        setCredModal(c=>c?{...c,sent:true}:null)
                      }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                        Send via WhatsApp
                      </button>
                      <button className="btn btn-sm" onClick={()=>{
                        navigator.clipboard.writeText(credModal.tempPass)
                        notify.success('Password copied')
                      }}>Copy password</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ padding:'10px 14px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'var(--r)', marginBottom:14, fontSize:12.5, color:'var(--t-2)' }}>
                      ⚠ No email on file. Share this temporary password with <strong>{credModal.user.name}</strong> in person or via WhatsApp. They can use their phone number as their login username if email auth is enabled later.
                    </div>
                    <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                      <button className="btn btn-brand" style={{ flex:1, justifyContent:'center' }} onClick={()=>{
                        const msg = `Hi ${credModal.user.name},

Your Harvesters Workforce Community account is ready.

Temporary password: ${credModal.tempPass}

Visit: https://my-harvesters.vercel.app/login

Contact your branch admin for your login email.`
                        const wa = `https://wa.me/${credModal.user.phone?.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`
                        window.open(wa,'_blank','noopener')
                        setCredModal(c=>c?{...c,sent:true}:null)
                      }}>
                        Send via WhatsApp
                      </button>
                      <button className="btn btn-sm" onClick={()=>{
                        navigator.clipboard.writeText(credModal.tempPass)
                        notify.success('Password copied')
                      }}>Copy</button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'1rem 0' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>Credentials sent to {credModal.user.name}</div>
                <div style={{ fontSize:13, color:'var(--t-2)', marginBottom:20 }}>They can now log in with their temporary password and will be prompted to change it.</div>
                <button className="btn btn-brand btn-sm" onClick={()=>setCredModal(null)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
