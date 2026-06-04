'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  : null
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { memberGrowthMonthly, retentionMonthly, retentionCohorts, firstTimerFunnel, churnReasons, branches, BRANCH_COLORS } from '@/lib/data'

const SHORT: Record<string,string> = Object.fromEntries(branches.map(b=>[b.id,b.short]))

function CT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--s-3)',border:'0.5px solid var(--border-md)',borderRadius:10,padding:'10px 14px',fontSize:12,boxShadow:'var(--sh-md)',fontFamily:'var(--font-body)' }}>
      <div style={{ fontWeight:600,marginBottom:6,color:'var(--t-1)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color:p.color,marginBottom:2 }}>
          {p.name}: <strong>{typeof p.value==='number'&&p.value>100?p.value.toLocaleString():`${p.value}`}</strong>
        </div>
      ))}
    </div>
  )
}

function HC({ v }: { v: number }) {
  const t = Math.max(0,Math.min(1,(v-55)/40))
  const r = Math.round(239*(1-t)+34*t), g=Math.round(68*(1-t)+197*t), b=Math.round(68*(1-t)+94*t)
  const txt = t>0.5?'#4ADE80':t>0.25?'#FCD34D':'#F87171'
  return <div style={{ background:`rgb(${r},${g},${b})18`,color:txt,border:`1px solid rgb(${r},${g},${b})35`,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:7,fontSize:11.5,fontWeight:700,minWidth:52,padding:'4px 6px',fontFamily:'var(--font-mono)' }}>{v}%</div>
}

const TABS = [
  { k:'growth',    l:'New members'     },
  { k:'retention', l:'Retention'       },
  { k:'funnel',    l:'First-timer funnel'},
  { k:'cohorts',   l:'Cohort analysis' },
  { k:'churn',     l:'Churn insights'  },
]

export default function Growth({ onNavigate }: { onNavigate: (p:string)=>void }) {
  const [liveWorkerCount, setLiveWorkerCount] = useState<number|null>(null)
  const [liveSoulCount, setLiveSoulCount] = useState<number|null>(null)

  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const [{ count: w }, { count: s }] = await Promise.all([
          supabase.from('workers').select('*', { count:'exact', head:true }),
          supabase.from('soul_records').select('*', { count:'exact', head:true }),
        ])
        setLiveWorkerCount(w || 0)
        setLiveSoulCount(s || 0)
      } catch {}
    }
    load()
  }, [])
  const [tab, setTab] = useState('growth')
  const [sel, setSel] = useState(['lekki','gbagada','ikeja','london','houston'])
  const [fw, setFw] = useState(7)

  const f = firstTimerFunnel[fw]
  const may = memberGrowthMonthly[4], apr = memberGrowthMonthly[3]
  // Override KPI tiles with live Supabase counts when available
  const displayWorkers = liveWorkerCount !== null ? liveWorkerCount : (memberGrowthMonthly.reduce((a:any,b:any)=>a+b.total,0))
  const displaySouls = liveSoulCount !== null ? liveSoulCount : 0
  const gPct = (((may.total-apr.total)/apr.total)*100).toFixed(1)
  const avgR = retentionMonthly[4].avg.toFixed(1)
  const conv = ((f.becameMember/f.firstTimers)*100).toFixed(1)
  const totalRisk = retentionCohorts.reduce((a,b)=>a+b.atRisk,0)
  const totalQ    = retentionCohorts.reduce((a,b)=>a+b.goneQuiet,0)

  const tog = (k:string) => setSel(p=>p.includes(k)?p.length>1?p.filter(x=>x!==k):p:[...p,k])

  const funnelSteps = [
    { label:'First-time visitors', val:f.firstTimers,   color:'var(--brand)' },
    { label:'Returned week 2',     val:f.returnedWk2,   color:'#60A5FA' },
    { label:'Joined small group',  val:f.joinedGroup,   color:'var(--accent)' },
    { label:'Became full member',  val:f.becameMember,  color:'var(--green)' },
  ]

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:16 }}>
        {[
          { l:'New members (May)',  v:may.total.toLocaleString(),    sub:`↑ ${gPct}% vs Apr`,  up:true },
          { l:'Avg retention',      v:`${avgR}%`,                    sub:'↑ 1.1pts vs Apr',    up:true },
          { l:'Visitor conversion', v:`${conv}%`,                    sub:'Visitor → member',   up:true },
          { l:'At-risk members',    v:totalRisk.toLocaleString(),    sub:'Engagement falling', warn:true },
          { l:'Gone quiet (60d+)',  v:totalQ.toLocaleString(),       sub:'Need outreach',      danger:true },
          { l:'Jan–May total',      v:memberGrowthMonthly.reduce((a:any,b:any)=>a+b.total,0).toLocaleString(), sub:'All branches', up:true },
          ...(liveWorkerCount!==null?[{ l:'Workers in DB',  v:liveWorkerCount.toLocaleString(), sub:'Live from Supabase', up:true }]:[]),
          ...(liveSoulCount!==null?[{ l:'Souls recorded', v:liveSoulCount.toLocaleString(), sub:'Total new converts', up:true }]:[]),
        ].map(m=>(
          <div key={m.l} className={`metric-tile${m.up?' metric-tile-accent':m.danger?' metric-tile-red':m.warn?' metric-tile-accent':''}`}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.4rem',color:m.danger?'var(--red)':m.warn?'var(--amber)':undefined }}>{m.v}</div>
            <div className={`metric-sub ${m.up?'up':m.danger?'down':'flat'}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Branch filter */}
      <div className="card card-sm" style={{ marginBottom:14 }}>
        <div style={{ fontSize:10,fontWeight:500,color:'var(--t-3)',marginBottom:8,letterSpacing:'.07em',textTransform:'uppercase' }}>Filter branches</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
          {branches.map(b=>(
            <button key={b.id} onClick={()=>tog(b.id)} style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 11px',borderRadius:100,fontSize:11.5,cursor:'pointer',fontFamily:'var(--font-body)',border:`1.5px solid ${sel.includes(b.id)?b.color:'var(--border-md)'}`,background:sel.includes(b.id)?`${b.color}18`:'transparent',color:sel.includes(b.id)?b.color:'var(--t-2)',fontWeight:sel.includes(b.id)?600:400,transition:'all .15s' }}>
              <span style={{ width:7,height:7,borderRadius:'50%',background:b.color,boxShadow:sel.includes(b.id)?`0 0 6px ${b.color}80`:undefined }}/>
              {b.short}
            </button>
          ))}
          <button onClick={()=>setSel(branches.map(b=>b.id))} className="btn btn-sm btn-ghost" style={{ borderRadius:100,fontSize:11 }}>All</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {TABS.map(t=><button key={t.k} className={`tab${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>{t.l}</button>)}
      </div>

      {/* ── NEW MEMBERS ─────────────────────────────────────────── */}
      {tab==='growth' && (
        <>
          <div className="card card-p" style={{ marginBottom:14 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div>
                <div className="heading">Monthly new members — by branch</div>
                <div style={{ fontSize:11,color:'var(--t-3)',marginTop:2 }}>Jan – May 2026 · stacked by branch</div>
              </div>
              <span className="chip chip-green">↑ 30.5% Jan→May</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={memberGrowthMonthly} margin={{top:5,right:10,left:0,bottom:0}} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:11}}/>
                {sel.map((k,i)=><Bar key={k} dataKey={k} name={SHORT[k]||k} fill={BRANCH_COLORS[k]||'#888'} stackId="a" radius={i===sel.length-1?[3,3,0,0]:[0,0,0,0]}/>)}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="two-col" style={{ marginBottom:14 }}>
            <div className="card card-p">
              <div className="heading" style={{ marginBottom:12 }}>All-branch total trend</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={memberGrowthMonthly} margin={{top:5,right:0,left:-25,bottom:0}}>
                  <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--brand)" stopOpacity={0.25}/><stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Area type="monotone" dataKey="total" name="Total new members" stroke="var(--brand)" strokeWidth={2.5} fill="url(#ag)" dot={{r:4,fill:'var(--brand)',strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card card-p">
              <div className="heading" style={{ marginBottom:12 }}>New members by branch (May)</div>
              {branches.slice().sort((a,b)=>((memberGrowthMonthly[4] as any)[b.id]||0)-((memberGrowthMonthly[4] as any)[a.id]||0)).slice(0,8).map(br=>{
                const v=(memberGrowthMonthly[4] as any)[br.id]||0, mx=(memberGrowthMonthly[4] as any)['lekki']
                return (
                  <div key={br.id} style={{ display:'flex',alignItems:'center',gap:9,padding:'6px 0',borderBottom:'0.5px solid var(--border)' }}>
                    <div style={{ width:60,fontSize:11.5,color:'var(--t-2)',flexShrink:0 }}>{br.short}</div>
                    <div style={{ flex:1,height:5,background:'var(--s-4)',borderRadius:100,overflow:'hidden' }}>
                      <div style={{ height:'100%',borderRadius:100,background:br.color,width:`${(v/mx)*100}%`,boxShadow:`0 0 8px ${br.color}60`,transition:'width .7s ease' }}/>
                    </div>
                    <div style={{ width:30,fontSize:12.5,fontWeight:600,textAlign:'right',fontFamily:'var(--font-mono)' }}>{v}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── RETENTION ───────────────────────────────────────────── */}
      {tab==='retention' && (
        <>
          <div className="card card-p" style={{ marginBottom:14 }}>
            <div className="heading" style={{ marginBottom:4 }}>Monthly retention rate by branch</div>
            <div style={{ fontSize:11,color:'var(--t-3)',marginBottom:14 }}>Rolling 90-day cohort retention %</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={retentionMonthly} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                <YAxis domain={[60,100]} tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`${v}%`}/>
                <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:11}}/>
                {sel.map(k=><Line key={k} type="monotone" dataKey={k} name={SHORT[k]||k} stroke={BRANCH_COLORS[k]||'#888'} strokeWidth={2} dot={{r:3}}/>)}
                <Line type="monotone" dataKey="avg" name="Avg (all)" stroke="var(--t-3)" strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card card-p" style={{ marginBottom:14 }}>
            <div className="heading" style={{ marginBottom:4 }}>Retention heatmap — branch × time horizon</div>
            <div style={{ fontSize:11,color:'var(--t-3)',marginBottom:14 }}>
              <span style={{ color:'var(--green)' }}>■ </span>Green ≥85% · <span style={{ color:'var(--amber)' }}>■ </span>Amber 75–84% · <span style={{ color:'var(--red)' }}>■ </span>Red below 75%
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="tbl">
                <thead><tr><th>Branch</th><th>3-month</th><th>6-month</th><th>12-month</th><th>At-risk</th><th>Gone quiet</th><th>Action</th></tr></thead>
                <tbody>
                  {retentionCohorts.map(r=>(
                    <tr key={r.id}>
                      <td style={{ fontWeight:600,display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ width:8,height:8,borderRadius:'50%',background:`var(--c-${r.id})`,display:'inline-block',boxShadow:`0 0 6px var(--c-${r.id})` }}/>
                        {r.branch}
                      </td>
                      <td><HC v={r.r3m}/></td><td><HC v={r.r6m}/></td><td><HC v={r.r12m}/></td>
                      <td><span style={{ color:'var(--amber)',fontWeight:600,fontFamily:'var(--font-mono)' }}>{r.atRisk.toLocaleString()}</span></td>
                      <td><span style={{ color:'var(--red)',fontWeight:600,fontFamily:'var(--font-mono)' }}>{r.goneQuiet.toLocaleString()}</span></td>
                      <td><button className="btn btn-sm">Draft outreach</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── FUNNEL ──────────────────────────────────────────────── */}
      {tab==='funnel' && (
        <>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap' }}>
            <span style={{ fontSize:12,color:'var(--t-2)' }}>Select Sunday:</span>
            {firstTimerFunnel.map((d,i)=><button key={i} className={`btn btn-sm ${fw===i?'btn-brand':''}`} onClick={()=>setFw(i)}>{d.week}</button>)}
          </div>
          <div className="two-col" style={{ marginBottom:14 }}>
            <div className="card card-p">
              <div className="heading" style={{ marginBottom:4 }}>First-timer funnel — {f.week}</div>
              <div style={{ fontSize:11,color:'var(--t-3)',marginBottom:16 }}>Visitor → member conversion journey</div>
              {funnelSteps.map((s,i,arr)=>(
                <div key={s.label} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'0.5px solid var(--border)' }}>
                  <div style={{ width:130,fontSize:12,color:'var(--t-2)',flexShrink:0 }}>{s.label}</div>
                  <div style={{ flex:1,height:8,background:'var(--s-4)',borderRadius:100,overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:100,background:s.color,width:`${(s.val/arr[0].val)*100}%`,boxShadow:`0 0 10px ${s.color}60`,transition:'width .7s ease' }}/>
                  </div>
                  <div style={{ width:44,fontSize:12.5,fontWeight:600,textAlign:'right',fontFamily:'var(--font-mono)' }}>{s.val.toLocaleString()}</div>
                  <div style={{ width:40,fontSize:10.5,color:'var(--t-3)',textAlign:'right',fontFamily:'var(--font-mono)' }}>{i===0?'100%':`${Math.round((s.val/arr[0].val)*100)}%`}</div>
                </div>
              ))}
              <div style={{ marginTop:14,padding:'12px 14px',background:'var(--s-3)',borderRadius:'var(--r)',fontSize:12.5,color:'var(--t-2)',lineHeight:1.65,border:'0.5px solid var(--border)' }}>
                <strong style={{ color:'var(--t-1)' }}>Key insight: </strong>
                {`${Math.round((f.returnedWk2/f.firstTimers)*100)}% of visitors returned week 2. Of those, ${Math.round((f.joinedGroup/f.returnedWk2)*100)}% joined a small group — the strongest predictor of full membership.`}
              </div>
            </div>
            <div className="card card-p">
              <div className="heading" style={{ marginBottom:12 }}>Weekly funnel trend — 8 Sundays</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={firstTimerFunnel} margin={{top:5,right:5,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="week" tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Line type="monotone" dataKey="firstTimers"   name="First timers"    stroke="var(--brand)"  strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="returnedWk2"   name="Returned wk 2"   stroke="var(--blue)"   strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="joinedGroup"   name="Joined group"    stroke="var(--purple)" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="becameMember"  name="Became member"   stroke="var(--green)"  strokeWidth={2.5} dot={{r:3.5,fill:'var(--green)',strokeWidth:0}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── COHORTS ─────────────────────────────────────────────── */}
      {tab==='cohorts' && (
        <>
          <div className="card card-p" style={{ marginBottom:14 }}>
            <div className="heading" style={{ marginBottom:4 }}>Branch retention — 3m vs 6m vs 12m</div>
            <div style={{ fontSize:11,color:'var(--t-3)',marginBottom:12 }}>Retention depth across all branches</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={retentionCohorts} margin={{top:5,right:10,left:-10,bottom:0}} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="branch" tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                <YAxis domain={[50,100]} tick={{fontSize:10,fill:'var(--t-3)'}} tickFormatter={(v:number)=>`${v}%`} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="r3m"  name="3-month %"  fill="var(--brand)"  radius={[3,3,0,0]}/>
                <Bar dataKey="r6m"  name="6-month %"  fill="var(--accent)" radius={[3,3,0,0]}/>
                <Bar dataKey="r12m" name="12-month %" fill="var(--blue)"   radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="two-col">
            <div className="card card-p">
              <div className="heading" style={{ marginBottom:12 }}>12-month retention ranking</div>
              {[...retentionCohorts].sort((a,b)=>b.r12m-a.r12m).map((r,i)=>(
                <div key={r.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'0.5px solid var(--border)' }}>
                  <div style={{ width:24,fontSize:11,color:'var(--t-3)',fontWeight:500,fontFamily:'var(--font-mono)' }}>#{i+1}</div>
                  <div style={{ flex:1,fontSize:12.5 }}>{r.branch}</div>
                  <HC v={r.r12m}/>
                </div>
              ))}
            </div>
            <div className="card card-p">
              <div className="heading" style={{ marginBottom:12 }}>Risk dashboard</div>
              {retentionCohorts.map(r=>(
                <div key={r.id} style={{ padding:'7px 0',borderBottom:'0.5px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontSize:12.5 }}>{r.branch}</span>
                  <div style={{ display:'flex',gap:10 }}>
                    <span style={{ fontSize:11.5,color:'var(--amber)',fontWeight:600,fontFamily:'var(--font-mono)' }}>{r.atRisk.toLocaleString()}</span>
                    <span style={{ fontSize:11.5,color:'var(--red)',fontWeight:600,fontFamily:'var(--font-mono)' }}>{r.goneQuiet.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14,padding:'12px 14px',background:'var(--red-lt)',borderRadius:'var(--r)',border:'0.5px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--red)',marginBottom:5 }}>{totalQ.toLocaleString()} members gone quiet</div>
                <div style={{ fontSize:12,color:'var(--t-2)',lineHeight:1.6 }}>Inactive 60+ days across all branches. Pastoral outreach recommended immediately.</div>
                <button className="btn btn-danger btn-sm" style={{ marginTop:10,width:'100%',justifyContent:'center' }}>Create re-engagement plan →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── CHURN ───────────────────────────────────────────────── */}
      {tab==='churn' && (
        <div className="two-col">
          <div className="card card-p">
            <div className="heading" style={{ marginBottom:4 }}>Why members leave</div>
            <div style={{ fontSize:11,color:'var(--t-3)',marginBottom:12 }}>Exit survey data · all branches</div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={churnReasons} cx="50%" cy="50%" outerRadius={88} dataKey="pct" nameKey="reason" label={({pct}:any)=>`${pct}%`} labelLine fontSize={11}>
                  {churnReasons.map((r,i)=><Cell key={i} fill={r.color}/>)}
                </Pie>
                <Tooltip formatter={(v:any)=>`${v}%`}/><Legend wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card card-p">
            <div className="heading" style={{ marginBottom:14 }}>Recommended interventions</div>
            {[
              { r:'No small group (19%)',          a:'Auto-assign first-timers to a small group within 2 weeks.',              p:'High',   c:'var(--brand)'  },
              { r:'Joined another church (22%)',   a:'Strengthen discipleship depth and community belonging programmes.',      p:'High',   c:'var(--accent)' },
              { r:'Irregular → lapse (16%)',       a:'Trigger pastoral check-in after 3 consecutive missed Sundays.',         p:'Medium', c:'var(--amber)'  },
              { r:'Relocated (28%)',               a:'Create seamless transfer process to nearest HICC branch.',              p:'Medium', c:'var(--blue)'   },
              { r:'Life circumstances (10%)',      a:'Pastoral care outreach via unit leader within 14 days.',                p:'Low',    c:'var(--purple)' },
            ].map(item=>(
              <div key={item.r} style={{ padding:'10px 12px',background:'var(--s-3)',borderRadius:'var(--r)',borderLeft:`3px solid ${item.c}`,marginBottom:8,border:`0.5px solid var(--border)`,borderLeftWidth:3 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                  <span style={{ fontSize:12.5,fontWeight:600 }}>{item.r}</span>
                  <span style={{ fontSize:10,padding:'2px 7px',borderRadius:6,fontWeight:600,background:item.p==='High'?'var(--red-lt)':item.p==='Medium'?'var(--amber-lt)':'var(--s-4)',color:item.p==='High'?'var(--red)':item.p==='Medium'?'var(--amber)':'var(--t-3)' }}>{item.p}</span>
                </div>
                <div style={{ fontSize:12,color:'var(--t-2)',lineHeight:1.55 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
