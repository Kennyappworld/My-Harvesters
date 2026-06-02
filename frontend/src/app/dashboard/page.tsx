'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, hasRole } from '@/lib/useSession'
import { checkSoulFollowUpReminders, requestNotificationPermission } from '@/lib/notifications'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import PoweredBy from '@/lib/PoweredBy'

const Overview      = dynamic(() => import('./sections/Overview'),          { loading: () => <L/> })
const Growth        = dynamic(() => import('./sections/Growth'),            { loading: () => <L/> })
const Chat          = dynamic(() => import('./sections/Chat'),              { loading: () => <L/> })
const Prayer        = dynamic(() => import('./sections/Prayer'),            { loading: () => <L/> })
const Testimony     = dynamic(() => import('./sections/Testimony'),         { loading: () => <L/> })
const Announcements = dynamic(() => import('./sections/Announcements'),     { loading: () => <L/> })
const Meetings      = dynamic(() => import('./sections/Meetings'),          { loading: () => <L/> })
const Members       = dynamic(() => import('./sections/Members'),           { loading: () => <L/> })
const SoulTracker   = dynamic(() => import('./sections/SoulTracker'),       { loading: () => <L/> })
const MemberVerif   = dynamic(() => import('./sections/MemberVerification'),{ loading: () => <L/> })
const Volunteer     = dynamic(() => import('./sections/Volunteer'),         { loading: () => <L/> })
const Attendance    = dynamic(() => import('./sections/Attendance'),        { loading: () => <L/> })
const Events        = dynamic(() => import('./sections/Events'),            { loading: () => <L/> })
const Reports       = dynamic(() => import('./sections/Reports'),           { loading: () => <L/> })
const Settings      = dynamic(() => import('./sections/Settings'),          { loading: () => <L/> })
const PastoralPulse = dynamic(() => import('./sections/PastoralPulse'),      { loading: () => <L/> })
const MembershipCard= dynamic(() => import('./sections/MembershipCard'),     { loading: () => <L/> })
const BranchDash    = dynamic(() => import('./sections/BranchDashboard'),     { loading: () => <L/> })
const Devotional    = dynamic(() => import('./sections/Devotional'),          { loading: () => <L/> })
const Network       = dynamic(() => import('./sections/Network'),             { loading: () => <L/> })

function L() {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--t-3)',gap:8,fontSize:13}}>
    <svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    Loading…
  </div>
}

// ── Broadcast Modal ──────────────────────────────────────────────────────────
function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ message:'', scope:'all', channel:'platform', branch:'all' })
  const [sent, setSent] = useState(false)
  const BRANCHES = ['All branches','Lekki HQ','Gbagada','Ikeja','Anthony Village','Abuja','Port Harcourt','Ibadan','London UK','Houston USA']

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    // If WhatsApp channel selected, open WhatsApp Web with pre-filled message
    if (form.channel === 'whatsapp' || form.channel === 'all') {
      const text = encodeURIComponent(`📣 HARVESTERS HICC BROADCAST\n\n${form.message}\n\n— HICC Leadership`)
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener')
    }
    setSent(true)
    setTimeout(() => { setSent(false); onClose() }, 2500)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(26,18,69,0.6)',backdropFilter:'blur(4px)',padding:16}} onClick={onClose}>
      <div style={{background:'white',borderRadius:20,width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(124,58,237,0.25)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{background:'var(--grad-brand)',padding:'18px 22px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="18" height="18"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:15,color:'white',fontFamily:'var(--font-display)'}}>Broadcast message</div>
              <div style={{fontSize:11.5,color:'rgba(255,255,255,0.65)'}}>Send to your congregation</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'white'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{padding:'20px 22px'}}>
          {sent ? (
            <div style={{textAlign:'center',padding:'2rem'}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <div style={{fontWeight:800,fontSize:16,color:'var(--brand)',fontFamily:'var(--font-display)',marginBottom:6}}>Broadcast sent!</div>
              <div style={{fontSize:13,color:'var(--t-2)'}}>Your message has been dispatched to the selected audience.</div>
            </div>
          ) : (
            <form onSubmit={send}>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11.5,fontWeight:700,color:'var(--t-2)',display:'block',marginBottom:6,letterSpacing:'0.04em',textTransform:'uppercase'}}>Message *</label>
                <textarea style={{width:'100%',padding:'10px 14px',border:'1.5px solid var(--border-md)',borderRadius:10,fontSize:13.5,background:'var(--s-1)',color:'var(--t-1)',fontFamily:'var(--font-body)',outline:'none',resize:'vertical'}} rows={4} placeholder="Type your broadcast message…" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} required/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                <div>
                  <label style={{fontSize:11.5,fontWeight:700,color:'var(--t-2)',display:'block',marginBottom:6,letterSpacing:'0.04em',textTransform:'uppercase'}}>Audience</label>
                  <select style={{width:'100%',padding:'10px 14px',border:'1.5px solid var(--border-md)',borderRadius:10,fontSize:13,background:'var(--s-1)',color:'var(--t-1)',fontFamily:'var(--font-body)',outline:'none'}} value={form.scope} onChange={e=>setForm(f=>({...f,scope:e.target.value}))}>
                    <option value="all">🌍 All branches</option>
                    <option value="branch">🏛 Specific branch</option>
                    <option value="leadership">👑 Leadership only</option>
                    <option value="workforce">🤝 Workforce only</option>
                  </select>
                </div>
                {form.scope==='branch' && (
                  <div>
                    <label style={{fontSize:11.5,fontWeight:700,color:'var(--t-2)',display:'block',marginBottom:6,letterSpacing:'0.04em',textTransform:'uppercase'}}>Branch</label>
                    <select style={{width:'100%',padding:'10px 14px',border:'1.5px solid var(--border-md)',borderRadius:10,fontSize:13,background:'var(--s-1)',color:'var(--t-1)',fontFamily:'var(--font-body)',outline:'none'}} value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                      {BRANCHES.map(b=><option key={b}>{b}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{marginBottom:18}}>
                <label style={{fontSize:11.5,fontWeight:700,color:'var(--t-2)',display:'block',marginBottom:8,letterSpacing:'0.04em',textTransform:'uppercase'}}>Send via</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {[['platform','📱 Platform'],['whatsapp','💬 WhatsApp'],['sms','📟 SMS'],['all','🔔 All channels']].map(([v,l])=>(
                    <button key={v} type="button" onClick={()=>setForm(f=>({...f,channel:v}))} style={{padding:'8px 14px',borderRadius:10,border:`1.5px solid ${form.channel===v?'var(--brand)':'var(--border-md)'}`,background:form.channel===v?'var(--brand-soft)':'white',cursor:'pointer',fontSize:12.5,fontWeight:form.channel===v?700:500,color:form.channel===v?'var(--brand)':'var(--t-2)',transition:'all .12s',fontFamily:'var(--font-body)'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" style={{width:'100%',padding:'13px',background:'var(--grad-brand)',color:'white',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-display)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'var(--sh-brand)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                Send broadcast
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}



const NAV = [
  { section:'MAIN', items:[
    { key:'overview',      label:'Dashboard',          icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { key:'branches',       label:'Branch Dashboards',  icon:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
    { key:'growth',        label:'Growth & Retention', icon:'M18 20V10M12 20V4M6 20v-6', badge:'↑', bc:'nb-green' },
    { key:'chat',          label:'Community Chat',     icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', badge:7 },
    { key:'prayer',        label:'Prayer Wall',        icon:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', badge:12, bc:'nb-brand' },
    { key:'testimony',     label:'Testimonies',        icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', badge:4, bc:'nb-green' },
    { key:'announcements', label:'Announcements',      icon:'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', badge:4 },
    { key:'devotional',    label:'Daily Devotional',   icon:'M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z', badge:'New', bc:'nb-green' },
    { key:'pastoral',       label:'Pastoral Pulse',     icon:'M22 12h-4l-3 9L9 3l-3 9H2', badge:'!', bc:'nb-brand', minRole:'pastor' },
    { key:'meetings',      label:'Meetings',           icon:'M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z' },
    { key:'events',        label:'Events',             icon:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', badge:2, bc:'nb-brand' },
  ]},
  { section:'PEOPLE', items:[
    { key:'members',      label:'Members',             icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
    { key:'network',      label:'Kingdom Network',      icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', badge:'New', bc:'nb-green' },
    { key:'soultracker',  label:'Soul Tracker',        icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', badge:'New', bc:'nb-green' },
    { key:'memberverif',  label:'Member Verification', icon:'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3' },
    { key:'volunteer',    label:'Workforce',           icon:'M9 11l3 3L22 4' },
    { key:'membcard',     label:'Membership Cards',    icon:'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z' },
  ]},
  { section:'OPERATIONS', items:[
    { key:'attendance',   label:'Attendance',          icon:'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
    { key:'reports',      label:'Reports',             icon:'M18 20V10M12 20V4M6 20v-6', badge:3, minRole:'unit_head' },
  ]},
  { section:'ADMIN', items:[
    { key:'settings',     label:'Settings',            icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  ]},
]

const TITLES: Record<string,{title:string;sub:string;emoji:string}> = {
  overview:     {title:'Dashboard',          sub:'Harvesters International Christian Centre', emoji:'🏠'},
  branches:     {title:'Branch Dashboards',  sub:'Per-branch workforce · KPIs · Departments', emoji:'🏛'},
  growth:       {title:'Growth & Retention', sub:'Member trends · Retention heatmaps · Funnel · Churn', emoji:'📈'},
  chat:         {title:'Community Chat',     sub:'Unit · Peer · Leadership — tiered by role', emoji:'💬'},
  prayer:       {title:'Prayer Wall',        sub:'Unit → Branch → Global elevation', emoji:'🙏'},
  testimony:    {title:'Testimonies',        sub:'Cross-branch celebrations', emoji:'⭐'},
  announcements:{title:'Announcements',      sub:'Targeted broadcasts · WhatsApp · SMS · Read receipts', emoji:'📣'},
  meetings:     {title:'Meetings',           sub:'Google Meet · Instant · Schedule · Summaries', emoji:'📹'},
  events:       {title:'Events',             sub:'Create · Approve · Manage registrations', emoji:'📅'},
  network:      {title:'Kingdom Network',      sub:'Professional directory · Opportunities · Connections', emoji:'🤝'},
  members:      {title:'Members',            sub:'Directory · Profiles · Growth Passport', emoji:'👥'},
  soultracker:  {title:'Soul Tracker',       sub:'Capture new converts · Automated follow-up', emoji:'🛡'},
  memberverif:  {title:'Member Verification',sub:'6-month threshold · Referral links · Commitment rating', emoji:'✅'},
  volunteer:    {title:'Workforce',          sub:'Serving slots · Sign-up · Capacity management', emoji:'🤝'},
  attendance:   {title:'Attendance',         sub:'Per-service · Per-department · Member names', emoji:'✓'},
  reports:      {title:'Reports',            sub:'Monthly branch reports · Analytics summaries', emoji:'📊'},
  settings:     {title:'Settings',           sub:'Users · Branches · Departments · QR Signup', emoji:'⚙️'},
  membcard:     {title:'Membership Cards',   sub:'Digital ID · QR verification · Print-ready', emoji:'🪪'},
}

const PAGES: Record<string,any> = {
  overview:Overview, growth:Growth, chat:Chat, prayer:Prayer,
  testimony:Testimony, announcements:Announcements, meetings:Meetings,
  events:Events, members:Members, soultracker:SoulTracker,
  memberverif:MemberVerif, volunteer:Volunteer, attendance:Attendance,
  reports:Reports, settings:Settings, pastoral:PastoralPulse, devotional:Devotional, membcard:MembershipCard, branches:BranchDash, network:Network,
}

export default function Dashboard() {
  const { user } = useSession()
  const [page, setPage] = useState('overview')
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // Request notification permission and check soul follow-up reminders
  useEffect(() => {
    if (!user?.id) return
    const setup = async () => {
      const granted = await requestNotificationPermission()
      if (granted) {
        // Check for overdue soul follow-ups once per session
        const lastCheck = sessionStorage.getItem('hicc_followup_check')
        const now = Date.now()
        if (!lastCheck || now - parseInt(lastCheck) > 4 * 60 * 60 * 1000) {
          sessionStorage.setItem('hicc_followup_check', String(now))
          await checkSoulFollowUpReminders(user.id)
        }
      }
    }
    setup()
  }, [user?.id])

  // Session inactivity timeout — 30 minutes
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const TIMEOUT = 30 * 60 * 1000 // 30 minutes
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        sessionStorage.clear()
        window.location.href = '/login?expired=1'
      }, TIMEOUT)
    }
    const events = ['mousedown','keydown','touchstart','scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive:true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [])
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const meta = TITLES[page] || {title:page, sub:'', emoji:'📋'}
  const Page = PAGES[page]
  const [pageKey, setPageKey] = useState(0)
  const prevPage = useRef(page)
  useEffect(() => {
    if (page !== prevPage.current) {
      prevPage.current = page
      setPageKey(k => k+1)
    }
  }, [page])

  function SidebarInner() {
    return (
      <>
        {/* Sidebar header */}
        <div style={{padding:'16px 14px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.15)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:36,height:36,background:'linear-gradient(135deg, var(--brand-md) 0%, var(--brand) 100%)',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 14px rgba(27,67,50,0.6), inset 0 1px 0 rgba(255,255,255,0.15)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="18" height="18"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:800,fontFamily:'var(--font-display)',color:'white',letterSpacing:'-0.01em',lineHeight:1.2}}>Harvesters HICC</div>
              <div style={{fontSize:9.5,color:'var(--gold)',letterSpacing:'0.06em',fontWeight:600,textTransform:'uppercase'}}>Workforce Platform</div>
            </div>
          </div>
        </div>

        <div style={{padding:'10px 10px',flex:1,overflowY:'auto'}}>
          {NAV.map(sec=>(
            <div key={sec.section}>
              <div style={{fontSize:8.5,color:'rgba(201,168,76,0.55)',padding:'14px 12px 5px',letterSpacing:'.12em',textTransform:'uppercase',fontWeight:700,display:'flex',alignItems:'center',gap:8}}><div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,0.06)'}}/>{sec.section}<div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,0.06)'}}/></div>
              {sec.items.filter((item:any) => !item.minRole || !user || hasRole(user.role, item.minRole)).map((item:any)=>(
                <div key={item.key} className={`nav-link ${page===item.key?'active':''}`} onClick={()=>{setPage(item.key);setMobileOpen(false)}}>
                  <span style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:page===item.key?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.06)',transition:'background .12s'}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d={item.icon}/></svg>
                  </span>
                  <span style={{flex:1,fontSize:12.5}}>{item.label}</span>
                  {item.badge && <span className={`nav-badge ${item.bc||'nb-red'}`}>{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* User info — bottom of dark sidebar */}
        <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.08)',background:'rgba(0,0,0,0.15)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,var(--brand-md),var(--brand-lt))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'white',flexShrink:0,boxShadow:'0 2px 8px rgba(27,67,50,0.5)',border:'2px solid rgba(255,255,255,0.15)'}}>{(user?.name||'W').slice(0,2).toUpperCase()}</div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'white'}}>{user?.name || 'Worker'}</div>
              <div style={{fontSize:10.5,color:'rgba(255,255,255,0.45)'}}>{user?.role?.replace(/_/g,' ') || 'worker'} · {user?.branch_id || 'Lekki'}</div>
            </div>
          </div>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.35)',textDecoration:'none'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </Link>
        </div>
        <PoweredBy dark={true}/>
      </>
    )
  }

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--s-1)'}}>
      {showBroadcast && <BroadcastModal onClose={()=>setShowBroadcast(false)}/>}
      {/* Dark sidebar */}
      <aside className="sidebar"><SidebarInner/></aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex'}}>
          <div style={{width:216,background:'var(--dark)',display:'flex',flexDirection:'column'}}><SidebarInner/></div>
          <div style={{flex:1,background:'rgba(0,0,0,0.5)'}} onClick={()=>setMobileOpen(false)}/>
        </div>
      )}

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Topbar — warm, branded */}
        <div className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button className="btn btn-ghost btn-icon" onClick={()=>setMobileOpen(true)} style={{display:'none'}} id="mob-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:38,height:38,borderRadius:12,background:'linear-gradient(135deg,var(--brand) 0%,var(--brand-md) 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,boxShadow:'0 3px 10px rgba(27,67,50,0.25)'}}>{meta.emoji}</div>
              <div>
                <div style={{fontSize:17,fontWeight:800,fontFamily:'var(--font-display)',color:'var(--t-1)',letterSpacing:'-0.025em',lineHeight:1.2}}>{meta.title}</div>
                <div style={{fontSize:10.5,color:'var(--t-3)',marginTop:2,letterSpacing:'0.01em'}}>{meta.sub}</div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="btn btn-ghost btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button className="btn btn-brand btn-sm" onClick={()=>setShowBroadcast(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
              Broadcast
            </button>
          </div>
        </div>

        {/* Light interior content area */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',background:'linear-gradient(160deg, #EDECEA 0%, #F0EFE8 60%, #EAE9E0 100%)'}}>
          {!isOnline && (
            <div style={{background:'rgba(197,48,48,0.08)',border:'1px solid rgba(197,48,48,0.25)',borderRadius:'var(--r)',padding:'8px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8,fontSize:12.5,color:'var(--red)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
              You're offline — showing cached data. Changes will sync when reconnected.
            </div>
          )}
          <div key={pageKey} className="page-enter" style={{minHeight:'100%'}}>
          {Page ? <Page onNavigate={setPage}/> : (
            <div style={{textAlign:'center',padding:'4rem',color:'var(--t-3)'}}>
              <div style={{fontSize:40,marginBottom:16}}>🔧</div>
              <div style={{fontWeight:700,fontSize:16,color:'var(--t-1)',textTransform:'capitalize',marginBottom:8}}>{page}</div>
              <div style={{fontSize:13}}>This section is coming soon.</div>
            </div>
          )}
          </div>
        </div>

        {/* Bottom nav bar — matches guide exactly */}
        <div style={{height:56,background:'var(--dark-2)',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-around',flexShrink:0,boxShadow:'0 -4px 20px rgba(13,31,22,0.25)'}}>
          {[
            {key:'overview',  icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label:'Home'},
            {key:'members',   icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label:'Members'},
            {key:'prayer',    icon:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', label:'Prayer'},
            {key:'chat',      icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label:'Chat'},
            {key:'settings',  icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', label:'Settings'},
          ].map(item=>(
            <button key={item.key} onClick={()=>setPage(item.key)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'6px 12px',border:'none',background:'none',cursor:'pointer',position:'relative',transition:'all .15s'}}>
              <svg viewBox="0 0 24 24" fill={page===item.key?'var(--gold)':'none'} stroke={page===item.key?'var(--gold)':'rgba(255,255,255,0.35)'} strokeWidth="1.8" width="22" height="22"><path d={item.icon}/></svg>
              <span style={{fontSize:10,fontWeight:page===item.key?700:500,color:page===item.key?'var(--gold)':'rgba(255,255,255,0.35)',letterSpacing:'0.02em'}}>{item.label}</span>
              {page===item.key && <div style={{position:'absolute',bottom:-1,left:'50%',transform:'translateX(-50%)',width:20,height:3,background:'var(--gold)',borderRadius:'2px 2px 0 0'}}/>}
            </button>
          ))}
        </div>
      </div>
      <style>{`@media (max-width:768px){aside{display:none !important}#mob-btn{display:flex !important}}`}</style>
    </div>
  )
}
