'use client'
import { useState, useEffect } from 'react'
import { branches } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

// Job status options — designed for the Kingdom community context
const JOB_STATUSES = [
  { value: 'kingdom',  label: 'Open to Kingdom opportunities', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  { value: 'passive',  label: 'Passively exploring',           color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { value: 'connect',  label: 'Open to connect',               color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { value: 'none',     label: 'Not showing status',            color: 'var(--t-3)', bg: 'transparent' },
]

const INDUSTRIES = ['Technology','Finance & Banking','Healthcare','Education','Legal','Engineering','Media & Creative','Real Estate','Business & Consulting','Government','Non-profit','Hospitality','Other']
const PASSION_AREAS = ['Leadership & Mentoring','Tech for Good','Financial Literacy','Creative Arts','Education & Training','Healthcare Outreach','Community Development','Entrepreneurship','Youth Empowerment','Women in Ministry']

type Profile = {
  id: string; name: string; branch: string; email: string; phone?: string
  profession: string; industry: string; company: string; bio: string
  passions: string[]; skills: string[]; linkedin: string
  jobStatus: string; showPhone: boolean; showEmail: boolean
  avatar?: string; joinedYear: string
}

type Opportunity = {
  id: string; title: string; company: string; industry: string
  location: string; locType: 'remote'|'hybrid'|'onsite'
  description: string; contact: string; postedBy: string
  branchId: string; branchName: string; postedAt: string
  verified: boolean
}

// Sample profiles to populate on first load
const SAMPLE_PROFILES: Profile[] = [
  { id:'p1', name:'Segun Adeyemi', branch:'lekki', email:'segun@hicc.org', phone:'+234 810 111 2222', profession:'Software Engineer', industry:'Technology', company:'Flutterwave', bio:'Building payment infrastructure for Africa. Passionate about tech-enabled church growth.', passions:['Tech for Good','Youth Empowerment'], skills:['React','Node.js','Python','AWS'], linkedin:'linkedin.com/in/segun', jobStatus:'connect', showPhone:false, showEmail:true, joinedYear:'2022' },
  { id:'p2', name:'Tolu Mensah', branch:'lekki', email:'tolu@hicc.org', profession:'Investment Banker', industry:'Finance & Banking', company:'Stanbic IBTC', bio:'15 years in capital markets. Happy to mentor young professionals in finance.', passions:['Financial Literacy','Leadership & Mentoring'], skills:['Financial Modelling','M&A','Excel'], linkedin:'', jobStatus:'connect', showPhone:false, showEmail:true, joinedYear:'2020' },
  { id:'p3', name:'Ngozi Kalu', branch:'lekki', email:'ngozi@hicc.org', profession:'Medical Doctor', industry:'Healthcare', company:'Lagos University Teaching Hospital', bio:'Paediatrician. Interested in community health outreach.', passions:['Healthcare Outreach','Community Development'], skills:['Paediatrics','Research','Public Health'], linkedin:'', jobStatus:'none', showPhone:false, showEmail:false, joinedYear:'2021' },
  { id:'p4', name:'Pastor Kanmi Adeyemi', branch:'ikeja', email:'kanmi@hicc.org', profession:'Pastor & Life Coach', industry:'Education', company:'Harvesters International', bio:'Passionate about developing leaders and helping professionals find purpose.', passions:['Leadership & Mentoring','Youth Empowerment'], skills:['Coaching','Leadership','Public Speaking'], linkedin:'', jobStatus:'connect', showPhone:false, showEmail:true, joinedYear:'2019' },
  { id:'p5', name:'Emeka Obi', branch:'lekki', email:'emeka@hicc.org', profession:'Architect', industry:'Real Estate', company:'Studio Emeka', bio:'Award-winning architect. Looking for Kingdom-aligned real estate projects.', passions:['Community Development','Creative Arts'], skills:['AutoCAD','Revit','Project Management'], linkedin:'linkedin.com/in/emeka', jobStatus:'kingdom', showPhone:false, showEmail:true, joinedYear:'2023' },
]

const SAMPLE_OPPORTUNITIES: Opportunity[] = [
  { id:'o1', title:'Senior Frontend Developer', company:'Covenant Capital', industry:'Technology', location:'Lagos, Nigeria', locType:'hybrid', description:'Looking for a senior React developer to join our fintech team. Kingdom-minded professional preferred. Competitive salary + equity.', contact:'careers@covenantcap.com', postedBy:'Segun Adeyemi', branchId:'lekki', branchName:'Lekki HQ', postedAt:'2026-06-01', verified:true },
  { id:'o2', title:'Finance Manager', company:'Kingdom Impact Foundation', industry:'Non-profit', location:'Remote', locType:'remote', description:'NGO seeking an experienced finance manager to oversee grant management and financial reporting. Part-time available.', contact:'hr@kif.org', postedBy:'Tolu Mensah', branchId:'lekki', branchName:'Lekki HQ', postedAt:'2026-05-28', verified:true },
]

function StatusBadge({ status }: { status: string }) {
  const s = JOB_STATUSES.find(j => j.value === status)
  if (!s || s.value === 'none') return null
  return (
    <span style={{ fontSize:10.5, fontWeight:600, color:s.color, background:s.bg, padding:'2px 9px', borderRadius:100, border:`1px solid ${s.color}30`, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

function ProfileCard({ profile, phoneVisible, onView }: { profile:Profile; phoneVisible:boolean; onView:(p:Profile)=>void }) {
  const initials = profile.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const branch = branches.find(b=>b.id===profile.branch)
  return (
    <div onClick={() => onView(profile)} className="card" style={{ padding:'16px', cursor:'pointer', transition:'all .15s', border:'0.5px solid var(--border)' }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--brand)')}
      onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
        {profile.avatar
          ? <img src={profile.avatar} style={{ width:44,height:44,borderRadius:12,objectFit:'cover',flexShrink:0 }}/>
          : <div style={{ width:44,height:44,borderRadius:12,background:'var(--brand-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'var(--brand)',flexShrink:0 }}>{initials}</div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13.5, color:'var(--t-1)', marginBottom:2 }}>{profile.name}</div>
          <div style={{ fontSize:12, color:'var(--t-2)', marginBottom:3 }}>{profile.profession} {profile.company && <span style={{ color:'var(--t-3)' }}>· {profile.company}</span>}</div>
          <div style={{ fontSize:11, color:'var(--t-3)' }}>{branch?.name || profile.branch}</div>
        </div>
      </div>
      {profile.jobStatus !== 'none' && <div style={{ marginBottom:8 }}><StatusBadge status={profile.jobStatus}/></div>}
      {profile.bio && <p style={{ fontSize:12, color:'var(--t-2)', lineHeight:1.6, marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{profile.bio}</p>}
      {profile.passions.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {profile.passions.slice(0,2).map(p => (
            <span key={p} style={{ fontSize:10.5, background:'var(--s-3)', color:'var(--t-2)', padding:'2px 8px', borderRadius:100 }}>{p}</span>
          ))}
          {profile.passions.length > 2 && <span style={{ fontSize:10.5, color:'var(--t-3)' }}>+{profile.passions.length-2}</span>}
        </div>
      )}
    </div>
  )
}

function ProfileDetail({ profile, phoneVisible, onBack }: { profile:Profile; phoneVisible:boolean; onBack:()=>void }) {
  const branch = branches.find(b=>b.id===profile.branch)
  const status = JOB_STATUSES.find(j=>j.value===profile.jobStatus)
  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom:16 }} onClick={onBack}>← Directory</button>
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16 }}>
        {/* Left card */}
        <div className="card card-p" style={{ textAlign:'center' }}>
          <div style={{ width:72,height:72,borderRadius:18,background:'var(--brand-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'var(--brand)',margin:'0 auto 12px' }}>
            {profile.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{ fontWeight:800,fontSize:17,fontFamily:'var(--font-display)',marginBottom:4 }}>{profile.name}</div>
          <div style={{ fontSize:13,color:'var(--t-2)',marginBottom:2 }}>{profile.profession}</div>
          {profile.company && <div style={{ fontSize:12,color:'var(--t-3)',marginBottom:8 }}>{profile.company}</div>}
          <div style={{ fontSize:11.5,color:'var(--t-3)',marginBottom:10 }}>{branch?.name}</div>
          {profile.jobStatus !== 'none' && <div style={{ marginBottom:14 }}><StatusBadge status={profile.jobStatus}/></div>}
          {/* Contact */}
          <div style={{ borderTop:'0.5px solid var(--border)',paddingTop:12,display:'flex',flexDirection:'column',gap:8 }}>
            {profile.showEmail && profile.email && (
              <a href={`mailto:${profile.email}`} style={{ fontSize:12,color:'var(--brand)',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {profile.email}
              </a>
            )}
            {phoneVisible && profile.showPhone && profile.phone && (
              <a href={`tel:${profile.phone}`} style={{ fontSize:12,color:'var(--brand)',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.99-2H6.6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {profile.phone}
              </a>
            )}
            {profile.linkedin && (
              <a href={`https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:'#0077b5',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                LinkedIn profile
              </a>
            )}
          </div>
        </div>
        {/* Right content */}
        <div>
          {profile.bio && (
            <div className="card card-p" style={{ marginBottom:12 }}>
              <div style={{ fontWeight:700,fontSize:13,marginBottom:8 }}>About</div>
              <p style={{ fontSize:13.5,color:'var(--t-1)',lineHeight:1.75 }}>{profile.bio}</p>
            </div>
          )}
          {profile.skills.length > 0 && (
            <div className="card card-p" style={{ marginBottom:12 }}>
              <div style={{ fontWeight:700,fontSize:13,marginBottom:10 }}>Skills</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
                {profile.skills.map(s => (
                  <span key={s} style={{ fontSize:12,background:'var(--brand-soft)',color:'var(--brand)',padding:'4px 12px',borderRadius:100,fontWeight:600 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {profile.passions.length > 0 && (
            <div className="card card-p">
              <div style={{ fontWeight:700,fontSize:13,marginBottom:10 }}>Passion areas</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
                {profile.passions.map(p => (
                  <span key={p} style={{ fontSize:12,background:'rgba(201,168,76,0.12)',color:'var(--gold)',padding:'4px 12px',borderRadius:100,fontWeight:600,border:'1px solid rgba(201,168,76,0.2)' }}>{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Network() {
  const { user } = useSession()
  const [tab, setTab] = useState<'directory'|'opportunities'|'profile'>('directory')
  const [profiles, setProfiles] = useState<Profile[]>(() => hydrate('hicc_network_profiles' as any, SAMPLE_PROFILES))
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => hydrate('hicc_network_opps' as any, SAMPLE_OPPORTUNITIES))
  const [viewProfile, setViewProfile] = useState<Profile|null>(null)
  const [phoneVisible] = useState(() => { try { return JSON.parse(localStorage.getItem('hicc_phone_visible')||'false') } catch { return false } })

  // Filters — directory
  const [search, setSearch] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('all')
  const [filterBranch, setFilterBranch] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Opportunity form
  const [showOppForm, setShowOppForm] = useState(false)
  const [oppForm, setOppForm] = useState({ title:'', company:'', industry:'Technology', location:'', locType:'hybrid' as const, description:'', contact:'' })
  const [oppSaved, setOppSaved] = useState(false)

  // My profile form
  const myProfile = profiles.find(p => p.email === user?.email) || null
  const [profForm, setProfForm] = useState({
    profession: myProfile?.profession || '',
    industry: myProfile?.industry || INDUSTRIES[0],
    company: myProfile?.company || '',
    bio: myProfile?.bio || '',
    passions: myProfile?.passions || [] as string[],
    skills: myProfile?.skills.join(', ') || '',
    linkedin: myProfile?.linkedin || '',
    jobStatus: myProfile?.jobStatus || 'none',
    showPhone: myProfile?.showPhone || false,
    showEmail: myProfile?.showEmail || true,
  })
  const [profSaved, setProfSaved] = useState(false)

  const saveProfile = async () => {
    const updated: Profile = {
      id: myProfile?.id || `p${Date.now()}`,
      name: user?.name || 'Worker',
      branch: user?.branch_id || 'lekki',
      email: user?.email || '',
      phone: '', // Loaded from workers table
      ...profForm,
      skills: profForm.skills.split(',').map(s=>s.trim()).filter(Boolean),
      joinedYear: myProfile?.joinedYear || new Date().getFullYear().toString(),
    }
    const next = myProfile
      ? profiles.map(p => p.id===updated.id ? updated : p)
      : [...profiles, updated]
    setProfiles(next)
    persist('hicc_network_profiles' as any, next)
    // Sync to Supabase workers metadata
    if (supabase && user?.id) {
      await supabase.from('workers').update({
        department: profForm.profession, // Reuse dept field for profession
      }).eq('id', user.id)
    }
    setProfSaved(true)
    setTimeout(() => setProfSaved(false), 2500)
  }

  const postOpportunity = (e: React.FormEvent) => {
    e.preventDefault()
    const opp: Opportunity = {
      id: `o${Date.now()}`,
      ...oppForm,
      postedBy: user?.name || 'Worker',
      branchId: user?.branch_id || 'lekki',
      branchName: branches.find(b=>b.id===user?.branch_id)?.name || 'Lekki HQ',
      postedAt: new Date().toISOString().split('T')[0],
      verified: true,
    }
    const next = [opp, ...opportunities]
    setOpportunities(next)
    persist('hicc_network_opps' as any, next)
    setOppForm({ title:'', company:'', industry:'Technology', location:'', locType:'hybrid', description:'', contact:'' })
    setShowOppForm(false)
    setOppSaved(true)
    setTimeout(() => setOppSaved(false), 3000)
  }

  const filteredProfiles = profiles.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.profession.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q) || p.skills.some(s=>s.toLowerCase().includes(q))
    const matchI = filterIndustry==='all' || p.industry===filterIndustry
    const matchB = filterBranch==='all' || p.branch===filterBranch
    const matchS = filterStatus==='all' || p.jobStatus===filterStatus
    return matchQ && matchI && matchB && matchS
  })

  const locIcon = (t:string) => t==='remote'?'🌐':t==='hybrid'?'🔀':'🏢'

  if (viewProfile) return <ProfileDetail profile={viewProfile} phoneVisible={phoneVisible} onBack={() => setViewProfile(null)}/>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontWeight:800,fontSize:18,fontFamily:'var(--font-display)',color:'var(--t-1)',marginBottom:4 }}>Kingdom Professional Network</div>
        <p style={{ fontSize:13,color:'var(--t-2)',lineHeight:1.6 }}>Connect with professionals in the Harvesters community. Discover talent, share opportunities, and build Kingdom relationships across all branches.</p>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10,marginBottom:20 }}>
        {[
          { label:'Professionals', value:profiles.length },
          { label:'Open to connect', value:profiles.filter(p=>p.jobStatus!=='none').length },
          { label:'Opportunities', value:opportunities.length },
          { label:'Industries', value:profiles.map(p=>p.industry).filter((v,i,a)=>a.indexOf(v)===i).length },
        ].map(s => (
          <div key={s.label} className="card card-p" style={{ padding:'12px 14px' }}>
            <div style={{ fontSize:22,fontWeight:800,fontFamily:'var(--font-display)',color:'var(--t-1)',letterSpacing:'-0.02em' }}>{s.value}</div>
            <div style={{ fontSize:11,color:'var(--t-3)',marginTop:3,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:18 }}>
        <button className={`tab ${tab==='directory'?'active':''}`} onClick={()=>setTab('directory')}>Directory ({profiles.length})</button>
        <button className={`tab ${tab==='opportunities'?'active':''}`} onClick={()=>setTab('opportunities')}>Opportunities ({opportunities.length})</button>
        <button className={`tab ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>{myProfile ? 'My profile ✓' : 'My profile'}</button>
      </div>

      {/* ── DIRECTORY ── */}
      {tab==='directory' && (
        <>
          <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
            <input className="input" placeholder="Search by name, role, skill…" value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1,minWidth:160 }}/>
            <select className="input" value={filterIndustry} onChange={e=>setFilterIndustry(e.target.value)} style={{ width:160 }}>
              <option value="all">All industries</option>
              {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
            </select>
            <select className="input" value={filterBranch} onChange={e=>setFilterBranch(e.target.value)} style={{ width:150 }}>
              <option value="all">All branches</option>
              {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="input" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ width:160 }}>
              <option value="all">All statuses</option>
              {JOB_STATUSES.filter(s=>s.value!=='none').map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {filteredProfiles.length === 0 && (
            <div style={{ textAlign:'center',padding:'3rem',color:'var(--t-3)',fontSize:13 }}>No profiles match your search. <button className="btn-link" onClick={()=>setTab('profile')} style={{ color:'var(--brand)',background:'none',border:'none',cursor:'pointer',fontSize:13 }}>Add yours →</button></div>
          )}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12 }}>
            {filteredProfiles.map(p => <ProfileCard key={p.id} profile={p} phoneVisible={phoneVisible} onView={setViewProfile}/>)}
          </div>
        </>
      )}

      {/* ── OPPORTUNITIES ── */}
      {tab==='opportunities' && (
        <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
            <div style={{ fontSize:13,color:'var(--t-2)' }}>Verified openings posted by Harvesters workers</div>
            <button className="btn btn-brand btn-sm" onClick={()=>setShowOppForm(v=>!v)}>+ Post opportunity</button>
          </div>

          {oppSaved && <div style={{ padding:'10px 16px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:13,color:'var(--green)',marginBottom:14,fontWeight:600 }}>✓ Opportunity posted to the community</div>}

          {showOppForm && (
            <div className="card card-p" style={{ marginBottom:18,border:'1px solid var(--border-md)' }}>
              <div style={{ fontWeight:700,fontSize:14,marginBottom:14 }}>Post a Kingdom opportunity</div>
              <form onSubmit={postOpportunity}>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Job title *</label><input className="input" value={oppForm.title} onChange={e=>setOppForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Frontend Developer" required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Organisation *</label><input className="input" value={oppForm.company} onChange={e=>setOppForm(f=>({...f,company:e.target.value}))} placeholder="Company name" required/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Industry</label><select className="input" value={oppForm.industry} onChange={e=>setOppForm(f=>({...f,industry:e.target.value}))}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Work type</label>
                    <select className="input" value={oppForm.locType} onChange={e=>setOppForm(f=>({...f,locType:e.target.value as any}))}>
                      <option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option>
                    </select></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Location</label><input className="input" value={oppForm.location} onChange={e=>setOppForm(f=>({...f,location:e.target.value}))} placeholder="Lagos, Nigeria"/></div>
                  <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Contact / How to apply *</label><input className="input" value={oppForm.contact} onChange={e=>setOppForm(f=>({...f,contact:e.target.value}))} placeholder="email@company.com" required/></div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Description *</label>
                  <textarea className="input" rows={4} value={oppForm.description} onChange={e=>setOppForm(f=>({...f,description:e.target.value}))} placeholder="Describe the role, responsibilities, and what you're looking for…" style={{ resize:'vertical' }} required/>
                </div>
                <div style={{ display:'flex',gap:10 }}>
                  <button type="submit" className="btn btn-brand btn-sm">Post to community</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowOppForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {opportunities.length===0 && <div style={{ textAlign:'center',padding:'3rem',color:'var(--t-3)',fontSize:13 }}>No opportunities posted yet. Be the first to share one.</div>}
            {opportunities.map(opp => (
              <div key={opp.id} className="card card-p">
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10 }}>
                  <div>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                      <div style={{ fontWeight:700,fontSize:15,fontFamily:'var(--font-display)',color:'var(--t-1)' }}>{opp.title}</div>
                      {opp.verified && <span style={{ fontSize:10,background:'var(--brand-soft)',color:'var(--brand)',padding:'2px 8px',borderRadius:100,fontWeight:600 }}>✓ Verified</span>}
                    </div>
                    <div style={{ fontSize:13,color:'var(--t-2)',marginBottom:4 }}>{opp.company} · {opp.industry}</div>
                    <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
                      <span style={{ fontSize:12,color:'var(--t-3)' }}>{locIcon(opp.locType)} {opp.locType.charAt(0).toUpperCase()+opp.locType.slice(1)}</span>
                      {opp.location && <span style={{ fontSize:12,color:'var(--t-3)' }}>📍 {opp.location}</span>}
                      <span style={{ fontSize:12,color:'var(--t-3)' }}>🏢 {opp.branchName}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <div style={{ fontSize:11,color:'var(--t-3)',marginBottom:6 }}>{new Date(opp.postedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                    <a href={`mailto:${opp.contact}`} className="btn btn-brand btn-sm" style={{ fontSize:11 }}>Apply</a>
                  </div>
                </div>
                <p style={{ fontSize:13,color:'var(--t-1)',lineHeight:1.7,marginBottom:10 }}>{opp.description}</p>
                <div style={{ fontSize:11.5,color:'var(--t-3)',borderTop:'0.5px solid var(--border)',paddingTop:10 }}>
                  Posted by <strong style={{ color:'var(--t-2)' }}>{opp.postedBy}</strong> · {opp.branchName}
                  {opp.contact && <span> · Contact: <a href={`mailto:${opp.contact}`} style={{ color:'var(--brand)' }}>{opp.contact}</a></span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MY PROFILE ── */}
      {tab==='profile' && (
        <div style={{ maxWidth:580 }}>
          <div style={{ marginBottom:16,padding:'12px 16px',background:'var(--s-3)',borderRadius:12,fontSize:13,color:'var(--t-2)',lineHeight:1.6,borderLeft:'3px solid var(--brand)' }}>
            <strong style={{ color:'var(--t-1)' }}>Your professional profile is 100% optional.</strong> Only what you choose to share is visible to other workers. You control whether your email, phone, and connection status are shown.
          </div>

          {profSaved && <div style={{ padding:'10px 16px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:13,color:'var(--green)',marginBottom:14,fontWeight:600 }}>✓ Profile saved — visible in the directory</div>}

          <div className="card card-p" style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700,fontSize:13.5,marginBottom:14 }}>Professional details</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
              <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Profession / Job title</label><input className="input" value={profForm.profession} onChange={e=>setProfForm(f=>({...f,profession:e.target.value}))} placeholder="e.g. Software Engineer"/></div>
              <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Industry</label><select className="input" value={profForm.industry} onChange={e=>setProfForm(f=>({...f,industry:e.target.value}))}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
              <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Organisation / Company</label><input className="input" value={profForm.company} onChange={e=>setProfForm(f=>({...f,company:e.target.value}))} placeholder="Optional"/></div>
              <div><label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>LinkedIn URL</label><input className="input" value={profForm.linkedin} onChange={e=>setProfForm(f=>({...f,linkedin:e.target.value}))} placeholder="linkedin.com/in/yourname"/></div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Short bio</label>
              <textarea className="input" rows={3} value={profForm.bio} onChange={e=>setProfForm(f=>({...f,bio:e.target.value}))} placeholder="A few sentences about yourself, your work, and what you're passionate about…" style={{ resize:'vertical' }}/>
            </div>
            <div>
              <label style={{ fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5 }}>Skills <span style={{ color:'var(--t-3)',fontWeight:400 }}>(comma-separated)</span></label>
              <input className="input" value={profForm.skills} onChange={e=>setProfForm(f=>({...f,skills:e.target.value}))} placeholder="e.g. React, Python, Financial Modelling, Public Speaking"/>
            </div>
          </div>

          <div className="card card-p" style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700,fontSize:13.5,marginBottom:12 }}>Passion areas</div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
              {PASSION_AREAS.map(p => {
                const active = profForm.passions.includes(p)
                return (
                  <button key={p} type="button" onClick={() => setProfForm(f=>({ ...f, passions: active?f.passions.filter(x=>x!==p):[...f.passions,p] }))}
                    style={{ fontSize:12,padding:'6px 13px',borderRadius:100,border:`1.5px solid ${active?'var(--gold)':'var(--border)'}`,background:active?'rgba(201,168,76,0.12)':'transparent',color:active?'var(--gold)':'var(--t-2)',cursor:'pointer',fontWeight:active?600:400,transition:'all .12s',fontFamily:'var(--font-body)' }}>
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card card-p" style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700,fontSize:13.5,marginBottom:4 }}>Connection status</div>
            <div style={{ fontSize:12.5,color:'var(--t-3)',marginBottom:12 }}>Let others know if you're open to professional connections</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {JOB_STATUSES.map(s => (
                <label key={s.value} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1.5px solid ${profForm.jobStatus===s.value?s.color:'var(--border)'}`,background:profForm.jobStatus===s.value?s.bg:'transparent',cursor:'pointer',transition:'all .12s' }}>
                  <input type="radio" name="jobStatus" value={s.value} checked={profForm.jobStatus===s.value} onChange={()=>setProfForm(f=>({...f,jobStatus:s.value}))} style={{ accentColor:s.color }}/>
                  <span style={{ fontSize:13,color:'var(--t-1)',fontWeight:profForm.jobStatus===s.value?600:400 }}>{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card card-p" style={{ marginBottom:18 }}>
            <div style={{ fontWeight:700,fontSize:13.5,marginBottom:12 }}>Privacy controls</div>
            {[
              { key:'showEmail', label:'Show my email address to other workers', value:profForm.showEmail },
              { key:'showPhone', label:'Show my phone number to other workers (also requires admin phone visibility setting)', value:profForm.showPhone },
            ].map(item => (
              <label key={item.key} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'0.5px solid var(--border)',cursor:'pointer' }}>
                <div onClick={()=>setProfForm(f=>({...f,[item.key]:!f[item.key as keyof typeof f]}))}
                  style={{ width:36,height:20,borderRadius:10,background:item.value?'var(--brand)':'var(--s-4)',position:'relative',transition:'background .15s',flexShrink:0,cursor:'pointer' }}>
                  <div style={{ position:'absolute',top:2,left:item.value?18:2,width:16,height:16,borderRadius:'50%',background:'white',transition:'left .15s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
                <span style={{ fontSize:13,color:'var(--t-1)' }}>{item.label}</span>
              </label>
            ))}
          </div>

          <button className="btn btn-brand" style={{ width:'100%',justifyContent:'center',padding:'12px',fontSize:14,fontWeight:700 }} onClick={saveProfile}>
            Save profile to directory
          </button>
        </div>
      )}
    </div>
  )
}
