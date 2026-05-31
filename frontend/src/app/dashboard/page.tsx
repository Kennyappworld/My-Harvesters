'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

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

function L() {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--t-3)',gap:8,fontSize:13}}>
    <svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    Loading…
  </div>
}

const NAV = [
  { section:'Main', items:[
    { key:'overview',      label:'Dashboard',          icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { key:'growth',        label:'Growth & retention', icon:'M18 20V10M12 20V4M6 20v-6', badge:'↑', bc:'nb-green' },
    { key:'chat',          label:'Community chat',     icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', badge:7 },
    { key:'prayer',        label:'Prayer wall',        icon:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', badge:12, bc:'nb-brand' },
    { key:'testimony',     label:'Testimonies',        icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', badge:4, bc:'nb-green' },
    { key:'announcements', label:'Announcements',      icon:'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', badge:4 },
    { key:'meetings',      label:'Meetings',           icon:'M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z' },
    { key:'events',        label:'Events',             icon:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', badge:2, bc:'nb-brand' },
  ]},
  { section:'People', items:[
    { key:'members',      label:'Members',             icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
    { key:'soultracker',  label:'New soul tracker',    icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', badge:'New', bc:'nb-green' },
    { key:'memberverif',  label:'Member verification', icon:'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3' },
    { key:'passport',     label:'Growth passport',     icon:'M9 11l3 3L22 4' },
    { key:'volunteer',    label:'Workforce',           icon:'M9 11l3 3L22 4' },
  ]},
  { section:'Operations', items:[
    { key:'attendance',   label:'Attendance',          icon:'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
    { key:'reports',      label:'Reports',             icon:'M18 20V10M12 20V4M6 20v-6', badge:3 },
  ]},
  { section:'Admin', items:[
    { key:'settings',     label:'Settings',            icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  ]},
]

const TITLES: Record<string,string[]> = {
  overview:     ['Dashboard',           'Harvesters International Christian Centre'],
  growth:       ['Growth & Retention',  'Member trends · Retention heatmaps · Funnel · Churn'],
  chat:         ['Community Chat',      'Unit · Peer · Leadership — tiered by role'],
  prayer:       ['Prayer Wall',         'Unit → Branch → Global elevation'],
  testimony:    ['Testimonies',         'Cross-branch celebrations'],
  announcements:['Announcements',       'Targeted broadcasts · WhatsApp · SMS · read receipts'],
  meetings:     ['Meetings',            'Google Meet · Instant · Schedule · Summaries'],
  events:       ['Events',              'Create · Approve · Manage registrations'],
  members:      ['Members',             'Directory · Profiles · Growth Passport · Birthday tracker'],
  soultracker:  ['New Soul Tracker',    'Capture · Automated follow-up at 2w, 4w, 3m, 4m'],
  memberverif:  ['Member Verification', '6-month threshold · Referral links · Commitment rating'],
  passport:     ['Growth Passport',     'Spiritual health and milestone tracking'],
  volunteer:    ['Workforce Scheduler', 'Serving slots · Sign-up · Capacity'],
  attendance:   ['Attendance',          'Per-service · Per-department · Member breakdown'],
  reports:      ['Reports',             'Monthly branch reports · Export'],
  settings:     ['Settings',            'Users · Branches · Departments · QR signup'],
}

const PAGES: Record<string,any> = {
  overview:Overview, growth:Growth, chat:Chat, prayer:Prayer,
  testimony:Testimony, announcements:Announcements, meetings:Meetings,
  events:Events, members:Members, soultracker:SoulTracker,
  memberverif:MemberVerif, volunteer:Volunteer, attendance:Attendance,
  reports:Reports, settings:Settings,
}

export default function Dashboard() {
  const [page, setPage] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [title, sub] = TITLES[page] || ['Page','']
  const Page = PAGES[page]

  function SidebarInner() {
    return (
      <>
        <div style={{padding:'14px 14px 10px',borderBottom:'0.5px solid var(--border)'}}>
          <div style={{width:32,height:32,background:'var(--grad-brand)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8,boxShadow:'var(--sh-brand)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div style={{fontSize:13,fontWeight:800,fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>Harvesters HICC</div>
          <div style={{fontSize:10,color:'var(--t-3)',marginTop:1}}>Leadership Portal</div>
        </div>
        <div style={{padding:'8px 8px',flex:1,overflowY:'auto'}}>
          {NAV.map(sec=>(
            <div key={sec.section}>
              <div style={{fontSize:9,color:'var(--t-3)',padding:'10px 8px 3px',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:600}}>{sec.section}</div>
              {sec.items.map((item:any)=>(
                <div key={item.key} className={`nav-link ${page===item.key?'active':''}`} onClick={()=>{setPage(item.key);setMobileOpen(false)}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d={item.icon}/></svg>
                  {item.label}
                  {item.badge && <span className={`nav-badge ${item.bc||'nb-red'}`}>{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:'10px 12px',borderTop:'0.5px solid var(--border)'}}>
          <div style={{fontSize:9.5,color:'var(--t-3)',marginBottom:1}}>Signed in as</div>
          <div style={{fontSize:12,fontWeight:700}}>Pastor Bolaji Idowu</div>
          <div style={{fontSize:11,color:'var(--t-2)'}}>Senior Pastor · All branches</div>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:5,marginTop:8,fontSize:11,color:'var(--t-3)',textDecoration:'none'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </Link>
        </div>
      </>
    )
  }

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--navy)'}}>
      <aside className="sidebar" style={{display:'flex'}}><SidebarInner/></aside>
      {mobileOpen && (
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex'}}>
          <div style={{width:216,background:'var(--navy-2)',display:'flex',flexDirection:'column',borderRight:'0.5px solid var(--border)'}}><SidebarInner/></div>
          <div style={{flex:1,background:'rgba(0,0,0,0.6)'}} onClick={()=>setMobileOpen(false)}/>
        </div>
      )}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        <div className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="btn btn-ghost btn-icon" onClick={()=>setMobileOpen(true)} style={{display:'none'}} id="mob-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <div style={{fontSize:14.5,fontWeight:700,letterSpacing:'-0.01em',fontFamily:'var(--font-display)'}}>{title}</div>
              <div style={{fontSize:11,color:'var(--t-3)',marginTop:1}}>{sub}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:7,alignItems:'center'}}>
            <button className="btn btn-ghost btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button className="btn btn-brand btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
              Broadcast
            </button>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px'}}>
          {Page ? <Page onNavigate={setPage}/> : <div style={{textAlign:'center',padding:'3rem',color:'var(--t-3)'}}><div style={{fontSize:32,marginBottom:12}}>🔧</div><div style={{fontWeight:600,textTransform:'capitalize',marginBottom:6}}>{page}</div><div style={{fontSize:13}}>Coming soon.</div></div>}
        </div>
      </div>
      <style>{`@media (max-width:768px){aside{display:none !important}#mob-btn{display:flex !important}}`}</style>
    </div>
  )
}
