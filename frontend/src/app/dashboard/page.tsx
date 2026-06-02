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
type AudienceGroup = {
  id: string; name: string; color: string; type: 'preset'|'custom'
  branches: string[]; depts: string[]; roles: string[]; count: number
}

const PRESET_AUDIENCES: AudienceGroup[] = [
  { id:'all',        name:'Everyone',       color:'#1B4332', type:'preset', branches:['all'],     depts:['all'], roles:['all'],                            count:83400 },
  { id:'leadership', name:'Leadership',     color:'#C9A84C', type:'preset', branches:['all'],     depts:['all'], roles:['senior_pastor','pastor','admin'],  count:24    },
  { id:'pastors',    name:'All Pastors',    color:'#6B46C1', type:'preset', branches:['all'],     depts:['all'], roles:['senior_pastor','pastor'],          count:18    },
  { id:'unit_heads', name:'Unit Heads',     color:'#0D9488', type:'preset', branches:['all'],     depts:['all'], roles:['unit_head'],                      count:86    },
  { id:'workers',    name:'All Workers',    color:'#2B6CB0', type:'preset', branches:['all'],     depts:['all'], roles:['worker'],                         count:1240  },
  { id:'lekki',      name:'Lekki HQ',       color:'#1B4332', type:'preset', branches:['lekki'],   depts:['all'], roles:['all'],                            count:18200 },
  { id:'london',     name:'London UK',      color:'#3B82F6', type:'preset', branches:['london'],  depts:['all'], roles:['all'],                            count:6200  },
  { id:'houston',    name:'Houston USA',    color:'#14B8A6', type:'preset', branches:['houston'], depts:['all'], roles:['all'],                            count:4100  },
]

const BRANCH_NAMES_MAP: Record<string,string> = { lekki:'Lekki HQ',gbagada:'Gbagada',ikeja:'Ikeja',anthony:'Anthony Village',abuja:'Abuja',portharcourt:'Port Harcourt',ibadan:'Ibadan',london:'London UK',houston:'Houston USA' }
const BROADCAST_DEPTS = [['ushering','Ushering'],['worship','Worship'],['media','Media'],['kids','KidsHouse'],['protocol','Protocol'],['welfare','Welfare'],['outreach','Outreach'],['prayer','Prayer'],['security','Security'],['drama','Drama'],['IT','IT'],['admin','Admin']]
const BROADCAST_ROLES = [['senior_pastor','Senior Pastor'],['pastor','Branch Pastor'],['admin','Admin'],['unit_head','Unit Head'],['worker','Worker']]

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'compose'|'audience'|'confirm'|'sent'>('compose')
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState<'platform'|'whatsapp'|'sms'|'all'>('platform')
  const [selected, setSelected] = useState<AudienceGroup[]>([])
  const [customGroups, setCustomGroups] = useState<AudienceGroup[]>(() => {
    try { return JSON.parse(localStorage.getItem('hicc_custom_audiences')||'[]') } catch { return [] }
  })
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroup, setNewGroup] = useState({ name:'', branches:[] as string[], depts:[] as string[], roles:[] as string[] })
  const [sending, setSending] = useState(false)

  const toggleAudience = (g: AudienceGroup) =>
    setSelected(prev => prev.find(a=>a.id===g.id) ? prev.filter(a=>a.id!==g.id) : [...prev, g])

  const totalReach = selected.reduce((a,g)=>a+g.count,0)

  const saveGroup = (e: React.FormEvent) => {
    e.preventDefault()
    const g: AudienceGroup = {
      id:`cg_${Date.now()}`, name:newGroup.name, color:'#1B4332', type:'custom',
      branches:newGroup.branches, depts:newGroup.depts, roles:newGroup.roles, count:0,
    }
    const updated = [...customGroups, g]
    setCustomGroups(updated)
    localStorage.setItem('hicc_custom_audiences', JSON.stringify(updated))
    setSelected(prev=>[...prev,g])
    setShowNewGroup(false)
    setNewGroup({ name:'', branches:[], depts:[], roles:[] })
  }

  const deleteGroup = (id: string) => {
    const updated = customGroups.filter(g=>g.id!==id)
    setCustomGroups(updated)
    localStorage.setItem('hicc_custom_audiences', JSON.stringify(updated))
    setSelected(prev=>prev.filter(a=>a.id!==id))
  }

  const send = async () => {
    setSending(true)
    if (channel==='whatsapp'||channel==='all') {
      const names = selected.map(a=>a.name).join(', ')
      window.open(`https://wa.me/?text=${encodeURIComponent(`📣 HARVESTERS WORKFORCE COMMUNITY

${message}

To: ${names}
— Leadership`)}`, '_blank', 'noopener')
    }
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && key) {
        await createClient(url,key).from('announcements').insert({
          title: title||'Broadcast', body: message,
          scope: selected.some(a=>a.id==='all')?'all':'branch',
        })
      }
    } catch {}
    setSending(false); setStep('sent')
    setTimeout(()=>onClose(), 2800)
  }

  const ChipToggle = ({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) => (
    <button type="button" onClick={onClick} style={{padding:'4px 10px',borderRadius:100,border:`1px solid ${active?'var(--brand)':'var(--border-md)'}`,background:active?'var(--brand-soft)':'transparent',fontSize:11.5,fontWeight:active?700:400,color:active?'var(--brand)':'var(--t-2)',cursor:'pointer',transition:'all .1s'}}>{label}</button>
  )

  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(5px)',padding:16}} onClick={onClose}>
      <div style={{background:'var(--s-2)',borderRadius:20,width:'100%',maxWidth:560,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,0.35)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1B4332,#0A2B1A)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="16" height="16"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:'white',fontFamily:'var(--font-display)'}}>Broadcast message</div>
              <div style={{fontSize:10.5,color:'rgba(255,255,255,0.5)',marginTop:1}}>
                {step==='sent'?'Sent ✓':step==='confirm'?'Step 3: Review & send':step==='audience'?'Step 2: Select audience':'Step 1: Compose'}
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {step!=='sent' && (
              <div style={{display:'flex',gap:3}}>
                {['compose','audience','confirm'].map((s,i)=>(
                  <div key={s} style={{width:18,height:3,borderRadius:2,background:['compose','audience','confirm'].indexOf(step)>=i?'#C9A84C':'rgba(255,255,255,0.2)',transition:'background .2s'}}/>
                ))}
              </div>
            )}
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:7,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'white'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{padding:'18px 20px',overflowY:'auto',flex:1}}>

          {/* SENT */}
          {step==='sent' && (
            <div style={{textAlign:'center',padding:'2.5rem 1rem'}}>
              <div style={{fontSize:52,marginBottom:12}}>{'\u2705'}</div>
              <div style={{fontWeight:800,fontSize:17,color:'var(--brand)',fontFamily:'var(--font-display)',marginBottom:8}}>Broadcast sent!</div>
              <div style={{fontSize:13,color:'var(--t-2)',lineHeight:1.7}}>
                Saved to platform for <strong>{selected.map(a=>a.name).join(', ')}</strong>.
                {(channel==='whatsapp'||channel==='all')&&' WhatsApp opened for dispatch.'}
              </div>
            </div>
          )}

          {/* STEP 1: COMPOSE */}
          {step==='compose' && (
            <div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:700,color:'var(--t-3)',display:'block',marginBottom:5,letterSpacing:'.06em',textTransform:'uppercase'}}>Title (optional)</label>
                <input className="input" placeholder="e.g. Sunday Service Update" value={title} onChange={e=>setTitle(e.target.value)} style={{marginBottom:10}}/>
                <label style={{fontSize:11,fontWeight:700,color:'var(--t-3)',display:'block',marginBottom:5,letterSpacing:'.06em',textTransform:'uppercase'}}>Message *</label>
                <textarea className="input" rows={5} placeholder="Type your broadcast message…" value={message} onChange={e=>setMessage(e.target.value.slice(0,2000))} style={{resize:'vertical'}}/>
                <div style={{fontSize:11,color:'var(--t-3)',marginTop:4,textAlign:'right'}}>{message.length}/2000</div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'var(--t-3)',display:'block',marginBottom:8,letterSpacing:'.06em',textTransform:'uppercase'}}>Deliver via</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {([['platform','📱','Platform','Visible on app feed'],['whatsapp','💬','WhatsApp','Opens WhatsApp'],['sms','📟','SMS','Via gateway'],['all','🔔','All channels','Platform + WA + SMS']] as const).map(([v,icon,l,desc])=>(
                    <button key={v} type="button" onClick={()=>setChannel(v)} style={{padding:'9px 12px',borderRadius:9,border:`2px solid ${channel===v?'var(--brand)':'var(--border-md)'}`,background:channel===v?'var(--brand-soft)':'var(--s-1)',cursor:'pointer',textAlign:'left'}}>
                      <div style={{fontSize:15,marginBottom:2}}>{icon}</div>
                      <div style={{fontSize:12,fontWeight:700,color:channel===v?'var(--brand)':'var(--t-1)'}}>{l}</div>
                      <div style={{fontSize:10.5,color:'var(--t-3)',marginTop:1}}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={()=>message.trim()&&setStep('audience')} disabled={!message.trim()} className="btn btn-brand" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:13.5,opacity:message.trim()?1:0.5}}>
                Next: Choose audience →
              </button>
            </div>
          )}

          {/* STEP 2: AUDIENCE */}
          {step==='audience' && (
            <div>
              <div style={{fontWeight:700,fontSize:13.5,marginBottom:4}}>Select audience groups</div>
              <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:14,lineHeight:1.6}}>Choose one or more groups. Create custom groups by combining specific branches, departments, and roles.</div>

              <div style={{fontSize:10.5,fontWeight:700,color:'var(--t-3)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Preset groups</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:14}}>
                {PRESET_AUDIENCES.map(g=>{
                  const on = !!selected.find(a=>a.id===g.id)
                  return (
                    <button key={g.id} type="button" onClick={()=>toggleAudience(g)} style={{padding:'9px 12px',borderRadius:9,border:`2px solid ${on?g.color:'var(--border-md)'}`,background:on?`${g.color}10`:'var(--s-1)',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:8,transition:'all .12s'}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:on?g.color:'var(--s-4)',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:on?g.color:'var(--t-1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{g.name}</div>
                        <div style={{fontSize:10.5,color:'var(--t-3)'}}>{g.count.toLocaleString()}</div>
                      </div>
                      {on&&<svg viewBox="0 0 24 24" fill="none" stroke={g.color} strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  )
                })}
              </div>

              {customGroups.length>0&&(
                <>
                  <div style={{fontSize:10.5,fontWeight:700,color:'var(--t-3)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Your custom groups</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
                    {customGroups.map(g=>{
                      const on = !!selected.find(a=>a.id===g.id)
                      return (
                        <div key={g.id} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:9,border:`2px solid ${on?'var(--brand)':'var(--border-md)'}`,background:on?'var(--brand-soft)':'var(--s-1)'}}>
                          <button type="button" onClick={()=>toggleAudience(g)} style={{flex:1,background:'none',border:'none',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:8}}>
                            <div style={{width:8,height:8,borderRadius:'50%',background:on?'var(--brand)':'var(--s-4)',flexShrink:0}}/>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:on?'var(--brand)':'var(--t-1)'}}>{g.name}</div>
                              <div style={{fontSize:10.5,color:'var(--t-3)'}}>{g.branches.length?g.branches.map(b=>BRANCH_NAMES_MAP[b]||b).join(', '):'All branches'} · {g.roles.length?g.roles.join(', '):'All roles'}</div>
                            </div>
                          </button>
                          <button type="button" onClick={()=>deleteGroup(g.id)} style={{background:'var(--red-lt)',border:'none',borderRadius:6,width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="11" height="11"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {!showNewGroup ? (
                <button type="button" onClick={()=>setShowNewGroup(true)} className="btn btn-sm" style={{width:'100%',justifyContent:'center',marginBottom:14,borderStyle:'dashed'}}>+ Create custom audience group</button>
              ) : (
                <form onSubmit={saveGroup} style={{background:'var(--s-3)',borderRadius:10,padding:'14px 16px',marginBottom:12,border:'1px solid var(--border-md)'}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>New custom group</div>
                  <input className="input" placeholder="Group name e.g. Lagos Worship Leaders" value={newGroup.name} onChange={e=>setNewGroup(f=>({...f,name:e.target.value}))} style={{marginBottom:10}} required/>
                  <div style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',marginBottom:5}}>Branches (empty = all)</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
                    {Object.entries(BRANCH_NAMES_MAP).map(([id,name])=><ChipToggle key={id} label={name} active={newGroup.branches.includes(id)} onClick={()=>setNewGroup(f=>({...f,branches:f.branches.includes(id)?f.branches.filter(x=>x!==id):[...f.branches,id]}))}/>)}
                  </div>
                  <div style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',marginBottom:5}}>Departments (empty = all)</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
                    {BROADCAST_DEPTS.map(([id,name])=><ChipToggle key={id} label={name} active={newGroup.depts.includes(id)} onClick={()=>setNewGroup(f=>({...f,depts:f.depts.includes(id)?f.depts.filter(x=>x!==id):[...f.depts,id]}))}/>)}
                  </div>
                  <div style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',marginBottom:5}}>Roles (empty = all)</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
                    {BROADCAST_ROLES.map(([id,name])=><ChipToggle key={id} label={name} active={newGroup.roles.includes(id)} onClick={()=>setNewGroup(f=>({...f,roles:f.roles.includes(id)?f.roles.filter(x=>x!==id):[...f.roles,id]}))}/>)}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button type="submit" className="btn btn-brand btn-sm" style={{flex:1,justifyContent:'center'}} disabled={!newGroup.name.trim()}>Save group</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowNewGroup(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {selected.length>0&&(
                <div style={{padding:'9px 12px',background:'var(--brand-soft)',border:'1px solid var(--border-md)',borderRadius:9,marginBottom:12,fontSize:12.5}}>
                  <span style={{fontWeight:700,color:'var(--brand)'}}>Selected: </span>
                  <span style={{color:'var(--t-2)'}}>{selected.map(a=>a.name).join(' + ')}</span>
                  <span style={{color:'var(--t-3)',marginLeft:6}}>· ~{totalReach.toLocaleString()}</span>
                </div>
              )}

              <div style={{display:'flex',gap:8}}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setStep('compose')} style={{flexShrink:0}}>← Back</button>
                <button type="button" onClick={()=>selected.length>0&&setStep('confirm')} disabled={selected.length===0} className="btn btn-brand" style={{flex:1,justifyContent:'center',opacity:selected.length>0?1:0.5}}>
                  Review & send →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM */}
          {step==='confirm' && (
            <div>
              <div style={{fontWeight:700,fontSize:13.5,marginBottom:14}}>Confirm broadcast</div>
              <div className="card card-p" style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t-3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:5}}>Message</div>
                {title&&<div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{title}</div>}
                <div style={{fontSize:13,color:'var(--t-2)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{message}</div>
              </div>
              <div className="card card-p" style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t-3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8}}>Audience</div>
                {selected.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:a.color,flexShrink:0}}/>
                    <span style={{fontSize:12.5,fontWeight:600,flex:1}}>{a.name}</span>
                    <span style={{fontSize:11.5,color:'var(--t-3)'}}>~{a.count.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',fontSize:12.5}}>
                  <span style={{color:'var(--t-2)'}}>Est. total reach</span>
                  <span style={{fontWeight:800,color:'var(--brand)'}}>{totalReach.toLocaleString()}</span>
                </div>
              </div>
              <div className="card card-p" style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t-3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:5}}>Channel</div>
                <div style={{fontSize:13,fontWeight:600}}>{channel==='platform'?'📱 Platform':channel==='whatsapp'?'💬 WhatsApp':channel==='sms'?'📟 SMS':'🔔 All channels'}</div>
                {(channel!=='platform')&&<div style={{fontSize:11.5,color:'#92610A',marginTop:6,padding:'5px 9px',background:'rgba(245,158,11,0.08)',borderRadius:6}}>⚠ External gateway not configured — saved to platform regardless.</div>}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setStep('audience')} style={{flexShrink:0}}>← Back</button>
                <button type="button" onClick={send} disabled={sending} className="btn btn-brand" style={{flex:1,justifyContent:'center',padding:'11px',fontSize:13,fontWeight:700}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                  {sending?'Sending…':`Send to ${selected.map(a=>a.name).join(' + ')}`}
                </button>
              </div>
            </div>
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
        document.cookie='hicc_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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
  const [memberSearch, setMemberSearch] = useState('')

  useEffect(() => {
    const handler = (e: Event) => {
      const { page: p, search } = (e as CustomEvent).detail || {}
      if (p) setPage(p)
      if (search) setMemberSearch(search)
    }
    window.addEventListener('hicc-navigate', handler)
    return () => window.removeEventListener('hicc-navigate', handler)
  }, [])
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
              <div style={{fontSize:13,fontWeight:800,fontFamily:'var(--font-display)',color:'white',letterSpacing:'-0.01em',lineHeight:1.2}}>Harvesters International Christian Centre</div>
              <div style={{fontSize:9.5,color:'var(--gold)',letterSpacing:'0.06em',fontWeight:600,textTransform:'uppercase'}}>Workforce Community</div>
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
          <button onClick={async()=>{
            if (!window.confirm('Sign out of the Workforce Community?')) return
            document.cookie='hicc_session=; path=/; max-age=0'
            sessionStorage.clear()
            const sUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
            const sKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            if(sUrl&&sKey){try{const{createClient}=await import('@supabase/supabase-js');await createClient(sUrl,sKey).auth.signOut()}catch{}}
            window.location.href='/login'
          }} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.35)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',padding:0}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
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
            {/* Global search */}
            <div style={{position:'relative',display:'flex',alignItems:'center'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="13" height="13" style={{position:'absolute',left:10,pointerEvents:'none'}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                className="input"
                placeholder="Search members, prayers, souls…"
                style={{paddingLeft:30,fontSize:12,height:32,width:220,borderRadius:'var(--r)'}}
                onKeyDown={(e:React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (!val) return
                    // Navigate to members with search pre-filled
                    window.dispatchEvent(new CustomEvent('hicc-navigate', { detail:{ page:'members', search:val } }))
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
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
          {Page ? <Page onNavigate={setPage} memberSearch={page==='members'?memberSearch:''} onMemberSearchConsumed={()=>setMemberSearch('')}/> : (
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
