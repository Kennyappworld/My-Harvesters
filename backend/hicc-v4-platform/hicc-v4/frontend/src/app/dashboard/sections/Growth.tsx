'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import { branches, memberGrowthMonthly, retentionMonthly, retentionCohorts, firstTimerFunnel, churnReasons } from '@/lib/data'

const TABS = ['New Members','Retention','First-Timer Funnel','Cohort Analysis','Churn Insights']

const BRANCH_KEYS = ['lekki','gbagada','ikeja','anthony','abuja','portharcourt','ibadan','london','houston']

function heatClass(v: number) {
  if (v >= 88) return 'heat-excellent'
  if (v >= 80) return 'heat-good'
  if (v >= 75) return 'heat-ok'
  if (v >= 68) return 'heat-warn'
  return 'heat-risk'
}

function TooltipStyle() {
  return { background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--t-1)', fontFamily:'var(--font-mono)', fontSize:12 }
}

export default function Growth() {
  const [tab, setTab] = useState(0)
  const [funnelWeek, setFunnelWeek] = useState(7)

  const fw = firstTimerFunnel[funnelWeek]
  const funnelSteps = fw ? [
    { label:'First-time visitors', value: fw.firstTimers, pct: 100 },
    { label:'Returned week 2',     value: fw.returnedWk2, pct: Math.round(fw.returnedWk2/fw.firstTimers*100) },
    { label:'Joined small group',  value: fw.joinedGroup, pct: Math.round(fw.joinedGroup/fw.firstTimers*100) },
    { label:'Became full member',  value: fw.becameMember, pct: Math.round(fw.becameMember/fw.firstTimers*100) },
  ] : []

  const totalGoneQuiet = retentionCohorts.reduce((s,c) => s + c.goneQuiet, 0)
  const totalAtRisk    = retentionCohorts.reduce((s,c) => s + c.atRisk, 0)

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="section-title">Growth & Retention Analytics</h1>
          <p className="section-sub">Deep visibility across all 9 branches — new members, retention trends, first-timer conversion, cohort analysis, and churn</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div className="badge badge-amber">Total at risk: {totalAtRisk.toLocaleString()}</div>
          <div className="badge badge-red">Gone quiet: {totalGoneQuiet.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ overflowX:'auto' }}>
        {TABS.map((t,i) => <button key={i} className={`tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {/* ─── Tab 0: New Members ─── */}
      {tab === 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Stacked bar by branch */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>New Members by Branch — Jan to May 2026</div>
              <div className="section-sub">Stacked by branch; showing month-by-month growth across the network</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={memberGrowthMonthly}>
                <XAxis dataKey="month" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
                <YAxis stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={40} />
                <Tooltip contentStyle={TooltipStyle()} />
                <Legend wrapperStyle={{ fontSize:12, fontFamily:'var(--font-heading)' }} />
                {BRANCH_KEYS.map((k,i) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={branches.find(b=>b.id===k)?.color||'#666'} name={branches.find(b=>b.id===k)?.short||k}
                    radius={i===BRANCH_KEYS.length-1 ? [3,3,0,0] : [0,0,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* All-branch trend */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>All-Branch Growth Trend</div>
              <div className="section-sub">Total new members across the network — showing upward trajectory</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={memberGrowthMonthly}>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
                <YAxis stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={40} />
                <Tooltip contentStyle={TooltipStyle()} />
                <Area type="monotone" dataKey="total" stroke="var(--brand)" fill="url(#g2)" strokeWidth={2.5} dot={{ fill:'var(--brand)', r:4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* May ranking */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>May 2026 — Branch Ranking</div>
              <div className="section-sub">New members by branch this month</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {BRANCH_KEYS
                .map(k => ({ key:k, val:(memberGrowthMonthly[4] as unknown as Record<string,number>)[k], branch:branches.find(b=>b.id===k)! }))
                .sort((a,b) => b.val - a.val)
                .map(({ key, val, branch }, i) => (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t-3)', width:16, textAlign:'right' }}>#{i+1}</div>
                    <div style={{ fontFamily:'var(--font-heading)', fontWeight:500, color:'var(--t-2)', width:90, fontSize:13 }}>{branch.short}</div>
                    <div style={{ flex:1, background:'var(--s-3)', borderRadius:4, height:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:branch.color, borderRadius:4, width:`${(val/394)*100}%`, transition:'width 0.6s ease' }} />
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--t-1)', fontSize:14, width:36, textAlign:'right' }}>{val}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 1: Retention ─── */}
      {tab === 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>Rolling 90-Day Retention by Branch</div>
              <div className="section-sub">% of members who remained active in the 90-day window</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={retentionMonthly}>
                <XAxis dataKey="month" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
                <YAxis domain={[60,100]} stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={35} />
                <Tooltip contentStyle={TooltipStyle()} formatter={(v: number) => [`${v}%`, '']} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                {BRANCH_KEYS.map(k => (
                  <Line key={k} type="monotone" dataKey={k} stroke={branches.find(b=>b.id===k)?.color||'#666'}
                    strokeWidth={1.8} dot={{ r:3 }} name={branches.find(b=>b.id===k)?.short||k} />
                ))}
                <Line dataKey="avg" stroke="var(--t-3)" strokeDasharray="5 3" strokeWidth={1.5} dot={false} name="Network avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>Retention Cohort Heatmap</div>
              <div className="section-sub">3-month, 6-month, and 12-month retention per branch — green = strong, red = at risk</div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Branch','3-Month','6-Month','12-Month','At Risk','Gone Quiet','Action'].map(h => (
                      <th key={h} style={{ padding:'8px 14px', textAlign:'left', color:'var(--t-3)', fontFamily:'var(--font-heading)', fontSize:11.5, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {retentionCohorts.map((c,i) => (
                    <tr key={c.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'12px 14px', fontFamily:'var(--font-heading)', fontWeight:600, color:'var(--t-1)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:3, height:18, borderRadius:2, background:branches.find(b=>b.id===c.id)?.color||'#666' }} />
                          {c.branch}
                        </div>
                      </td>
                      {[c.r3m, c.r6m, c.r12m].map((v,j) => (
                        <td key={j} style={{ padding:'12px 14px' }}>
                          <span className={`badge ${heatClass(v)}`} style={{ fontFamily:'var(--font-mono)' }}>{v}%</span>
                        </td>
                      ))}
                      <td style={{ padding:'12px 14px', fontFamily:'var(--font-mono)', color:'var(--amber)' }}>{c.atRisk.toLocaleString()}</td>
                      <td style={{ padding:'12px 14px', fontFamily:'var(--font-mono)', color:'var(--red)' }}>{c.goneQuiet.toLocaleString()}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => alert(`Draft outreach for ${c.branch} — connect to AI to generate personalised message`)}>
                          Draft outreach
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 2: First-Timer Funnel ─── */}
      {tab === 2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div className="section-title" style={{ fontSize:15 }}>First-Timer Conversion Funnel</div>
                <div className="section-sub">Visitor → retained member pathway by Sunday</div>
              </div>
              <select
                className="input" style={{ width:'auto', padding:'7px 12px', fontSize:13 }}
                value={funnelWeek}
                onChange={e => setFunnelWeek(Number(e.target.value))}
              >
                {firstTimerFunnel.map((f,i) => <option key={i} value={i}>Sunday {f.week}</option>)}
              </select>
            </div>
            {/* Funnel bars */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {funnelSteps.map((s,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, alignItems:'center' }}>
                    <div style={{ fontFamily:'var(--font-heading)', fontWeight:500, color:'var(--t-2)', fontSize:13 }}>
                      <span style={{ marginRight:10, color:'var(--t-3)', fontFamily:'var(--font-mono)', fontSize:11 }}>0{i+1}</span>
                      {s.label}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--t-1)', fontSize:16 }}>{s.value.toLocaleString()}</span>
                      <span className={`badge ${s.pct===100?'badge-blue':s.pct>=50?'badge-green':s.pct>=25?'badge-amber':'badge-red'}`}>{s.pct}%</span>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ height:10 }}>
                    <div className="progress-fill" style={{
                      width:`${s.pct}%`,
                      background: s.pct===100 ? 'var(--blue)' : s.pct>=50 ? 'var(--green)' : s.pct>=25 ? 'var(--amber)' : 'var(--red)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20, padding:'14px 16px', background:'var(--accent-lt)', borderRadius:8, border:'1px solid rgba(15,184,164,0.2)' }}>
              <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--accent)', marginBottom:4 }}>Key insight</div>
              <div style={{ fontSize:13.5, color:'var(--t-2)', lineHeight:1.6 }}>
                Small group connection is the single strongest predictor of long-term retention. Members who join a small group in their first 30 days are 4× more likely to remain active at 12 months.
              </div>
            </div>
          </div>
          {/* Trend of first-timers */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>First-Timer Trend — Last 8 Sundays</div>
              <div className="section-sub">Weekly visitor volume and member conversion</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={firstTimerFunnel}>
                <XAxis dataKey="week" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
                <YAxis stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={40} />
                <Tooltip contentStyle={TooltipStyle()} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="firstTimers" name="First-timers" fill="var(--blue)" opacity={0.5} radius={[3,3,0,0]} />
                <Bar dataKey="returnedWk2" name="Returned" fill="var(--green)" opacity={0.7} radius={[3,3,0,0]} />
                <Bar dataKey="becameMember" name="Became member" fill="var(--brand)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Tab 3: Cohort Analysis ─── */}
      {tab === 3 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>Cohort Retention Comparison</div>
              <div className="section-sub">3m vs 6m vs 12m retention per branch — which campuses retain long-term?</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={retentionCohorts}>
                <XAxis dataKey="branch" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:10 }} />
                <YAxis domain={[50,100]} stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={35} />
                <Tooltip contentStyle={TooltipStyle()} formatter={(v: number) => [`${v}%`, '']} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="r3m"  name="3-month"  fill="var(--green)"  radius={[2,2,0,0]} />
                <Bar dataKey="r6m"  name="6-month"  fill="var(--accent)" radius={[2,2,0,0]} />
                <Bar dataKey="r12m" name="12-month" fill="var(--blue)"   radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 12-month ranking */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div className="section-title" style={{ fontSize:15 }}>12-Month Retention Ranking</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[...retentionCohorts].sort((a,b) => b.r12m - a.r12m).map((c,i) => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t-3)', width:20 }}>#{i+1}</div>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:13, width:120, color:'var(--t-2)' }}>{c.branch}</div>
                  <div style={{ flex:1, background:'var(--s-3)', borderRadius:4, height:10, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:branches.find(b=>b.id===c.id)?.color||'#666', borderRadius:4, width:`${c.r12m}%`, transition:'width 0.6s' }} />
                  </div>
                  <span className={`badge ${heatClass(c.r12m)}`} style={{ fontFamily:'var(--font-mono)', minWidth:45, justifyContent:'center' }}>{c.r12m}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk dashboard */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="card" style={{ background:'var(--red-lt)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--red)', marginBottom:6 }}>Gone Quiet — Network Total</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:36, fontWeight:700, color:'var(--red)' }}>4,840</div>
              <div style={{ fontSize:13, color:'var(--t-2)', marginTop:8 }}>60+ days inactive. Distributed across all branches.</div>
            </div>
            <div className="card" style={{ background:'var(--amber-lt)', border:'1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--brand)', marginBottom:6 }}>At Risk — Network Total</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:36, fontWeight:700, color:'var(--brand)' }}>2,450</div>
              <div style={{ fontSize:13, color:'var(--t-2)', marginTop:8 }}>Irregular attendance pattern — early intervention window.</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 4: Churn Insights ─── */}
      {tab === 4 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="card">
              <div style={{ marginBottom:16 }}>
                <div className="section-title" style={{ fontSize:15 }}>Why Members Leave</div>
                <div className="section-sub">Exit survey data across all branches</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={churnReasons} dataKey="pct" nameKey="reason" cx="50%" cy="50%" outerRadius={100} label={({ reason, pct }) => `${pct}%`} labelLine={false}>
                    {churnReasons.map((r,i) => <Cell key={i} fill={r.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TooltipStyle()} formatter={(v: number) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div style={{ marginBottom:16 }}>
                <div className="section-title" style={{ fontSize:15 }}>Intervention Priorities</div>
                <div className="section-sub">Actionable re-engagement strategies per churn driver</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { reason:'No small group connection', priority:'High', action:'Assign newcomers to a small group within 2 weeks of joining', color:'var(--red)' },
                  { reason:'Irregular → lapse',         priority:'High', action:'Automated 3-touch pastoral care sequence at 4, 8, and 12 weeks inactive', color:'var(--red)' },
                  { reason:'Joined another church',     priority:'Medium', action:'Exit interview to identify service gaps — competitive awareness', color:'var(--amber)' },
                  { reason:'Relocated',                 priority:'Low', action:'Branch transfer pathway — connect to nearest HICC campus', color:'var(--green)' },
                  { reason:'Life circumstances',        priority:'Medium', action:'Pastoral care team proactive check-ins for members experiencing hardship', color:'var(--amber)' },
                ].map((item,i) => (
                  <div key={i} style={{ padding:'12px 14px', background:'var(--s-3)', borderRadius:8, border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ fontFamily:'var(--font-heading)', fontWeight:600, color:'var(--t-1)', fontSize:13 }}>{item.reason}</div>
                      <span className={`badge ${item.priority==='High'?'badge-red':item.priority==='Medium'?'badge-amber':'badge-green'}`}>{item.priority}</span>
                    </div>
                    <div style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.5 }}>{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
