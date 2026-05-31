'use client'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { weeklyAttendance, memberGrowthMonthly, retentionCohorts, retentionMonthly, branches } from '@/lib/data'

function CT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return <div style={{ background:'var(--s-3)',border:'0.5px solid var(--border-md)',borderRadius:10,padding:'10px 14px',fontSize:12,boxShadow:'var(--sh-md)',fontFamily:'var(--font-body)' }}>
    <div style={{ fontWeight:600,marginBottom:6 }}>{label}</div>
    {payload.map((p:any)=><div key={p.dataKey} style={{ color:p.color,marginBottom:2 }}>{p.name}: <strong>{typeof p.value==='number'&&p.value>100?p.value.toLocaleString():p.value}</strong></div>)}
  </div>
}

export default function Overview({ onNavigate }: { onNavigate:(p:string)=>void }) {
  const quiet = retentionCohorts.reduce((a,b)=>a+b.goneQuiet,0)
  const avgR  = retentionMonthly[4].avg.toFixed(1)

  return (
    <div>
      {/* Vision statement */}
      <div style={{ background:'var(--s-2)',border:'0.5px solid var(--border)',borderRadius:12,padding:'12px 18px',marginBottom:14,borderLeft:'3px solid var(--brand)' }}>
        <div style={{ fontSize:10,color:'var(--brand)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:3 }}>Platform vision</div>
        <div style={{ fontSize:12.5,color:'var(--t-2)',lineHeight:1.65 }}>
          To bond unity among the workforce, grow their spiritual life, and give leadership the right metrics and data for collective Kingdom growth — making every new convert feel welcomed and properly engaged.
        </div>
      </div>

      {/* KPIs — giving removed */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:14 }}>
        {[
          { l:'Total members',      v:'83,400',    sub:'↑ 12% this quarter', up:true  },
          { l:'Weekly attendance',  v:'71,200',    sub:'↑ 5% vs last month', up:true  },
          { l:'Active branches',    v:'9',         sub:'NG · UK · USA'                },
          { l:'New souls (May)',     v:'46',        sub:'Recorded this month', up:true },
          { l:'New members (May)',   v:'1,810',     sub:'↑ 8% vs April →',   up:true, click:true },
          { l:'Avg retention',      v:`${avgR}%`,  sub:'↑ 1.1pts →',         up:true, click:true },
        ].map(m=>(
          <div key={m.l} className={`metric-tile${m.up?' metric-tile-accent':''} ${(m as any).click?'card-hover':''}`} onClick={()=>(m as any).click&&onNavigate('growth')}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.4rem' }}>{m.v}</div>
            <div className={`metric-sub ${m.up?'up':'flat'}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      <div onClick={()=>onNavigate('growth')} style={{ padding:'11px 16px',background:'var(--red-lt)',borderRadius:'var(--r)',fontSize:13,color:'var(--red)',marginBottom:14,display:'flex',alignItems:'center',gap:10,cursor:'pointer',border:'0.5px solid rgba(239,68,68,0.2)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" style={{ flexShrink:0 }}><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
        <span><strong>{quiet.toLocaleString()} members gone quiet</strong> across all branches (60+ days inactive). Open Growth &amp; Retention to view branch-level heatmap and create outreach plans.</span>
      </div>

      <div className="two-col" style={{ marginBottom:14 }}>
        {/* Attendance trend */}
        <div className="card card-p">
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center' }}>
            <div className="heading">Attendance trend</div>
            <span style={{ fontSize:10.5,color:'var(--green)',fontWeight:600 }}>↑ top 2 branches</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={weeklyAttendance} margin={{top:5,right:0,left:-30,bottom:0}}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--brand)" stopOpacity={0.25}/><stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/></linearGradient>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="week" tick={{fontSize:9.5,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9.5,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Area type="monotone" dataKey="lekki"   name="Lekki HQ" stroke="var(--brand)"  strokeWidth={2}   fill="url(#ag1)" dot={false}/>
              <Area type="monotone" dataKey="gbagada" name="Gbagada"   stroke="var(--accent)" strokeWidth={1.5} fill="url(#ag2)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* New member trend — replaces giving chart */}
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
        {/* Soul tracker quick stat */}
        <div className="card card-p" style={{ cursor:'pointer' }} onClick={()=>onNavigate('soultracker')}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center' }}>
            <div className="heading">New soul tracker</div>
            <button className="btn btn-sm">View all →</button>
          </div>
          {[
            { label:'Recorded this month', value:'46', sub:'All branches combined', color:'var(--brand)' },
            { label:'Awaiting wk 2 follow-up', value:'12', sub:'Action needed', color:'var(--red)' },
            { label:'Follow-up complete', value:'8', sub:'Full journey done', color:'var(--green)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'0.5px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:12.5,fontWeight:500 }}>{r.label}</div>
                <div style={{ fontSize:11,color:'var(--t-3)',marginTop:1 }}>{r.sub}</div>
              </div>
              <div style={{ fontSize:18,fontWeight:700,fontFamily:'var(--font-mono)',color:r.color }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div className="card card-p">
          <div className="heading" style={{ marginBottom:12 }}>Alerts</div>
          {[
            { c:'var(--red)',    t:'Ikeja — pastor appointment pending',    s:'Awaiting HQ confirmation'        },
            { c:'var(--amber)',  t:'Abuja — June event not yet approved',   s:'Submitted 3 days ago'            },
            { c:'var(--green)',  t:'HSAP Q2 — 340 new applicants',          s:'Skill Acquisition open'          },
            { c:'var(--purple)', t:'London — monthly report submitted',     s:'Ready for senior pastor review'  },
            { c:'var(--brand)',  t:'46 new souls recorded this month',      s:'12 awaiting wk 2 follow-up'      },
          ].map((a,i)=>(
            <div key={i} style={{ display:'flex',gap:10,padding:'7px 0',borderBottom:'0.5px solid var(--border)' }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:a.c,marginTop:4,flexShrink:0,boxShadow:`0 0 6px ${a.c}` }}/>
              <div>
                <div style={{ fontSize:12.5,fontWeight:500 }}>{a.t}</div>
                <div style={{ fontSize:11,color:'var(--t-3)',marginTop:1 }}>{a.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branch snapshot — giving column removed */}
      <div className="card card-p">
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
          <div className="heading">Branch snapshot</div>
          <button className="btn btn-brand btn-sm">+ Add branch</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Branch</th><th>Members</th><th>Attendance</th><th>3m retention</th><th>Country</th><th>Status</th></tr></thead>
          <tbody>
            {branches.map(b=>{
              const coh = retentionCohorts.find(r=>r.id===b.id)
              const ret = coh?.r3m||0
              const rCol = ret>=88?'var(--green)':ret>=80?'var(--amber)':'var(--red)'
              return (
                <tr key={b.id}>
                  <td><div style={{ display:'flex',alignItems:'center',gap:9 }}><span style={{ width:9,height:9,borderRadius:'50%',background:b.color,display:'inline-block',boxShadow:`0 0 8px ${b.color}80` }}/><strong>{b.name}</strong></div></td>
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
