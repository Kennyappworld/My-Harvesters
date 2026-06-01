'use client'
import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { weeklyAttendance, memberGrowthMonthly, retentionCohorts, retentionMonthly, branches, SERVICE_RECORDS } from '@/lib/data'

function CT({ active, payload, label }: any) {
  if (!active||!payload?.length) return null
  return <div style={{ background:'var(--dark-2)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 14px',fontSize:12,boxShadow:'var(--sh-lg)',color:'white' }}>
    <div style={{ fontWeight:700,marginBottom:6,color:'var(--t-1)' }}>{label}</div>
    {payload.map((p:any)=><div key={p.dataKey} style={{ color:p.color,marginBottom:2 }}>{p.name}: <strong>{typeof p.value==='number'&&p.value>100?p.value.toLocaleString():p.value}</strong></div>)}
  </div>
}

function NewMembersModal({ onClose }: { onClose:()=>void }) {
  const [selectedBranch, setSelectedBranch] = useState<string|null>(null)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const branchTotals = branches.map(b => ({
    ...b,
    records: SERVICE_RECORDS.filter(r => r.branchId === b.id),
    total: SERVICE_RECORDS.filter(r => r.branchId === b.id).reduce((a,r) => a + r.newMembers.length, 0),
  })).filter(b => b.total > 0)

  const grandTotal = SERVICE_RECORDS.reduce((a,r) => a + r.newMembers.length, 0)

  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)',padding:16 }} onClick={onClose}>
      <div style={{ background:'var(--s-2)',border:'1px solid var(--border-md)',borderRadius:'var(--r-2xl)',width:'100%',maxWidth:820,maxHeight:'88vh',overflow:'auto',boxShadow:'0 24px 64px rgba(13,31,22,0.28)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 24px',borderBottom:'0.5px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'linear-gradient(90deg,#EBE9DF,#F4F2EA)',zIndex:1 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:800,fontFamily:'var(--font-display)' }}>New Members — May 2026</div>
            <div style={{ fontSize:12,color:'var(--t-2)',marginTop:2 }}>Recorded by branch at each service · {grandTotal} total this week</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div style={{ padding:24 }}>
          {!selectedBranch ? (
            <>
              <div style={{ marginBottom:16,fontSize:12.5,color:'var(--t-2)' }}>Click a branch to see per-service breakdown and registered names.</div>
              {branchTotals.map(b => (
                <div key={b.id} className="card card-hover" style={{ padding:'14px 18px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer' }} onClick={()=>setSelectedBranch(b.id)}>
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <span style={{ width:12,height:12,borderRadius:'50%',background:b.color,boxShadow:`0 0 8px ${b.color}` }}/>
                    <div>
                      <div style={{ fontWeight:700,fontSize:14 }}>{b.name}</div>
                      <div style={{ fontSize:12,color:'var(--t-2)',marginTop:2 }}>{b.records.length} service{b.records.length!==1?'s':''} recorded</div>
                    </div>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ fontSize:28,fontWeight:800,fontFamily:'var(--font-display)',color:b.color }}>{b.total}</div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              ))}
              {branchTotals.length === 0 && <div style={{ textAlign:'center',padding:'2rem',color:'var(--t-3)' }}>No new members recorded this week yet.</div>}
            </>
          ) : !selectedRecord ? (
            <>
              <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={()=>setSelectedBranch(null)}>← All branches</button>
              <div style={{ fontWeight:700,fontSize:15,marginBottom:12 }}>{branches.find(b=>b.id===selectedBranch)?.name} — Services this week</div>
              {SERVICE_RECORDS.filter(r=>r.branchId===selectedBranch).map(r => (
                <div key={r.id} className="card card-hover" style={{ padding:'14px 18px',marginBottom:10,cursor:'pointer' }} onClick={()=>setSelectedRecord(r)}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{r.service}</div>
                      <div style={{ fontSize:12,color:'var(--t-2)',marginTop:2 }}>{r.date}</div>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <span style={{ fontSize:22,fontWeight:800,color:'var(--brand)',fontFamily:'var(--font-display)' }}>{r.newMembers.length}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={()=>setSelectedRecord(null)}>← {selectedRecord.service}</button>
              <div style={{ fontWeight:700,fontSize:15,marginBottom:4 }}>{selectedRecord.branchName} · {selectedRecord.service}</div>
              <div style={{ fontSize:12,color:'var(--t-2)',marginBottom:16 }}>{selectedRecord.date} · {selectedRecord.newMembers.length} new members registered</div>
              <table className="tbl">
                <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Dept. interest</th><th>Referred by</th><th>First timer</th></tr></thead>
                <tbody>
                  {selectedRecord.newMembers.map((m:any) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight:600 }}>{m.name}</td>
                      <td style={{ fontFamily:'var(--font-mono)',fontSize:12 }}>{m.phone}</td>
                      <td style={{ fontSize:12,color:'var(--t-2)' }}>{m.email||'—'}</td>
                      <td><span className="chip chip-purple">{m.dept||'—'}</span></td>
                      <td style={{ fontSize:12,color:'var(--t-2)' }}>{m.referredBy||'—'}</td>
                      <td><span className={`chip ${m.firstTimer?'chip-green':'chip-gray'}`}>{m.firstTimer?'Yes':'No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Overview({ onNavigate }: { onNavigate:(p:string)=>void }) {
  const [showNewMembers, setShowNewMembers] = useState(false)
  const quiet = retentionCohorts.reduce((a,b)=>a+b.goneQuiet,0)
  const avgR  = retentionMonthly[4].avg.toFixed(1)
  const totalNewThisWeek = SERVICE_RECORDS.reduce((a,r)=>a+r.newMembers.length,0)

  return (
    <div>
      {showNewMembers && <NewMembersModal onClose={()=>setShowNewMembers(false)}/>}

      {/* Mission statement — editorial, cinematic */}
      <div style={{ marginBottom:18, position:'relative', overflow:'hidden', borderRadius:'var(--r-xl)', background:'linear-gradient(135deg, var(--brand) 0%, #0A2B1A 100%)', padding:'20px 24px 18px', boxShadow:'0 4px 24px rgba(13,31,22,0.18)' }}>
        {/* Subtle cross watermark */}
        <div style={{ position:'absolute', right:-10, top:-10, opacity:0.06, pointerEvents:'none' }}>
          <svg viewBox="0 0 80 80" width="80" height="80" fill="white"><rect x="36" y="4" width="8" height="72"/><rect x="4" y="32" width="72" height="8"/></svg>
        </div>
        {/* Gold top rule */}
        <div style={{ width:32, height:3, background:'var(--gold)', borderRadius:2, marginBottom:12 }}/>
        <p style={{ fontSize:10, fontWeight:700, color:'rgba(201,168,76,0.85)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8, fontFamily:'var(--font-body)' }}>Our Mission</p>
        <p style={{ fontSize:14.5, fontWeight:600, color:'white', fontFamily:'var(--font-display)', lineHeight:1.7, letterSpacing:'-0.01em', maxWidth:820 }}>
          We are changing lives by pioneering thriving churches in key global cities — bringing hope, connecting people to God, influencing culture, and leading every member to become a fully devoted follower of Christ.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:14 }}>
        {[
          { l:'Total members',       v:'83,400',          sub:'↑ 12% this quarter', up:true,  click:'members'  },
          { l:'Weekly attendance',   v:'71,200',          sub:'↑ 5% vs last month', up:true,  click:'attendance'},
          { l:'Active branches',     v:'9',               sub:'NG · UK · USA'                                  },
          { l:'New this week',       v:String(totalNewThisWeek), sub:'Click for breakdown →', up:true, clickFn:()=>setShowNewMembers(true) },
          { l:'New members (May)',   v:'1,810',           sub:'↑ 8% vs April →',   up:true,  click:'growth'   },
          { l:'Avg retention',       v:`${avgR}%`,        sub:'↑ 1.1pts →',         up:true,  click:'growth'   },
        ].map(m=>(
          <div key={m.l} className={`metric-tile${m.up?' metric-tile-accent':''} ${(m.click||m.clickFn)?'card-hover':''}`}
            style={{ cursor:(m.click||m.clickFn)?'pointer':undefined }}
            onClick={()=>{ if((m as any).clickFn)(m as any).clickFn(); else if(m.click)onNavigate(m.click) }}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.4rem' }}>{m.v}</div>
            <div className={`metric-sub ${m.up?'up':'flat'}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      <div onClick={()=>onNavigate('growth')} style={{ padding:'11px 16px',background:'rgba(239,68,68,0.12)',borderRadius:'var(--r)',fontSize:13,color:'var(--red)',marginBottom:14,display:'flex',alignItems:'center',gap:10,cursor:'pointer',border:'1px solid rgba(239,68,68,0.25)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" style={{ flexShrink:0 }}><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
        <span><strong>{quiet.toLocaleString()} members gone quiet</strong> across all branches (60+ days inactive). Open Growth &amp; Retention for heatmap and outreach planning.</span>
      </div>

      <div className="two-col" style={{ marginBottom:14 }}>
        <div className="card card-p">
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center' }}>
            <div className="heading">Attendance trend</div>
            <span style={{ fontSize:10.5,color:'var(--green)',fontWeight:600 }}>↑ top 2 branches</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={weeklyAttendance} margin={{top:5,right:0,left:-30,bottom:0}}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/></linearGradient>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--teal)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--teal)" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="week" tick={{fontSize:9.5,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9.5,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Area type="monotone" dataKey="lekki"   name="Lekki HQ" stroke="var(--brand)" strokeWidth={2}   fill="url(#ag1)" dot={false}/>
              <Area type="monotone" dataKey="gbagada" name="Gbagada"   stroke="var(--teal)"  strokeWidth={1.5} fill="url(#ag2)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card card-p">
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center' }}>
            <div className="heading">New member trend</div>
            <button className="btn btn-sm" onClick={()=>onNavigate('growth')}>Full analytics →</button>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={memberGrowthMonthly} margin={{top:5,right:0,left:-30,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:9.5,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9.5,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Line type="monotone" dataKey="total" name="Total new members" stroke="var(--brand)" strokeWidth={2.5} dot={{r:4,fill:'var(--brand)',strokeWidth:0}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom:14 }}>
        <div className="card card-p" style={{ cursor:'pointer' }} onClick={()=>onNavigate('soultracker')}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center' }}>
            <div className="heading">New soul tracker</div>
            <button className="btn btn-sm">View all →</button>
          </div>
          {[{ l:'Recorded this month',v:'46',sub:'All branches',c:'var(--brand)'},{ l:'Awaiting wk 2 follow-up',v:'12',sub:'Action needed',c:'var(--red)'},{ l:'Follow-up complete',v:'8',sub:'Full journey done',c:'var(--green)'}].map(r=>(
            <div key={r.l} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'0.5px solid var(--border)' }}>
              <div><div style={{ fontSize:12.5,fontWeight:500 }}>{r.l}</div><div style={{ fontSize:11,color:'var(--t-3)',marginTop:1 }}>{r.sub}</div></div>
              <div style={{ fontSize:18,fontWeight:800,fontFamily:'var(--font-display)',color:r.c }}>{r.v}</div>
            </div>
          ))}
        </div>
        <div className="card card-p">
          <div className="heading" style={{ marginBottom:12 }}>Alerts</div>
          {[
            { c:'var(--red)',    t:'Ikeja — pastor appointment pending',   s:'Awaiting HQ confirmation'      },
            { c:'var(--amber)',  t:'Abuja — June event not yet approved',  s:'Submitted 3 days ago'          },
            { c:'var(--green)',  t:'HSAP Q2 — 340 new applicants',         s:'Skill Acquisition open'        },
            { c:'var(--purple)', t:'London — monthly report submitted',    s:'Ready for review'              },
            { c:'var(--brand)',  t:'46 new souls recorded this month',     s:'12 awaiting wk 2 follow-up'    },
          ].map((a,i)=>(
            <div key={i} style={{ display:'flex',gap:10,padding:'7px 0',borderBottom:'0.5px solid var(--border)' }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:a.c,marginTop:4,flexShrink:0,boxShadow:`0 0 6px ${a.c}` }}/>
              <div><div style={{ fontSize:12.5,fontWeight:500 }}>{a.t}</div><div style={{ fontSize:11,color:'var(--t-3)',marginTop:1 }}>{a.s}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Branch snapshot */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'13px 18px', background:'linear-gradient(90deg, rgba(27,67,50,0.05) 0%, transparent 100%)', borderBottom:'1px solid var(--border-md)', display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div className="heading">Branch snapshot</div>
          <button className="btn btn-brand btn-sm" onClick={()=>onNavigate('settings')}>+ Add branch</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Branch</th><th>Members</th><th>Attendance</th><th>3m retention</th><th>Country</th><th>Status</th></tr></thead>
          <tbody>
            {branches.map(b=>{
              const coh = retentionCohorts.find(r=>r.id===b.id)
              const ret = coh?.r3m||0
              const rCol = ret>=88?'var(--green)':ret>=80?'var(--amber)':'var(--red)'
              return (
                <tr key={b.id} style={{ cursor:'pointer' }} onClick={()=>onNavigate('members')}>
                  <td><div style={{ display:'flex',alignItems:'center',gap:9 }}><span style={{ width:9,height:9,borderRadius:'50%',background:b.color,display:'inline-block',boxShadow:`0 0 8px ${b.color}` }}/><strong>{b.name}</strong></div></td>
                  <td style={{ fontFamily:'var(--font-mono)' }}>{b.members.toLocaleString()}</td>
                  <td>{b.attendance}%</td>
                  <td><span style={{ fontSize:13,fontWeight:700,color:rCol,fontFamily:'var(--font-mono)' }}>{ret}%</span></td>
                  <td><span className="chip chip-gray">{b.country}</span></td>
                  <td><span className={`chip chip-${b.type==='review'?'amber':b.type==='international'?'purple':'green'}`}>{b.type==='hq'?'HQ':b.type==='review'?'Review':b.type==='international'?'Intl':'Active'}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
