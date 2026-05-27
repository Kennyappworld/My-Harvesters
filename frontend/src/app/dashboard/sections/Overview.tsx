'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { branches, memberGrowthMonthly, retentionMonthly, givingMonthly, weeklyAttendance, totalMembers, totalAttendance, totalGivingNGN } from '@/lib/data'

const fmt = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n)

export default function Overview({ onNavigate }: { onNavigate: (s: string) => void }) {
  const kpis = [
    { label:'Total Members',     value: totalMembers.toLocaleString(),    sub:'+1,810 this month', color:'var(--brand)',  icon:'👥', nav:'members'    },
    { label:'Weekly Attendance', value: totalAttendance.toLocaleString(), sub:'+3.1% vs last week', color:'var(--accent)', icon:'✓', nav:'attendance'  },
    { label:'Monthly Giving',    value:`₦${fmt(totalGivingNGN)}`,         sub:'+8.4% vs last month', color:'var(--green)', icon:'₦', nav:'giving'      },
    { label:'Avg Retention',     value:'84.3%',                           sub:'+1.1pp this month', color:'var(--purple)', icon:'🔄', nav:'growth'      },
    { label:'New Members (May)', value:'1,810',                           sub:'All branches combined',color:'var(--blue)', icon:'⬆', nav:'growth'      },
    { label:'Gone Quiet',        value:'4,840',                           sub:'Need outreach', color:'var(--red)',   icon:'⚠',  nav:'growth'      },
  ]

  const combinedGrowth = memberGrowthMonthly.map(m => ({ month: m.month, total: m.total }))

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Bento */}
      <div className="bento bento-3" style={{ gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} className={`kpi-card fade-up stagger-${i+1}`}
            onClick={() => onNavigate(k.nav)}
            style={{ cursor:'pointer' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-heading)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k.label}</div>
              <span style={{ fontSize:20 }}>{k.icon}</span>
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:700, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:12, color:'var(--t-3)', marginTop:8 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Growth trend */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div className="section-title" style={{ fontSize:15 }}>All-Branch Growth Trend</div>
              <div className="section-sub">New members per month — all branches combined</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('growth')}>Full analytics →</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={combinedGrowth}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
              <YAxis stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={40} />
              <Tooltip contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--t-1)', fontFamily:'var(--font-mono)', fontSize:12 }} />
              <Area type="monotone" dataKey="total" stroke="var(--brand)" fill="url(#grad1)" strokeWidth={2.5} dot={{ fill:'var(--brand)', r:3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly giving */}
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <div className="section-title" style={{ fontSize:15 }}>Giving Trend</div>
            <div className="section-sub">Total ₦M monthly</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={givingMonthly}>
              <XAxis dataKey="month" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
              <YAxis stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={30} />
              <Tooltip contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--t-1)', fontFamily:'var(--font-mono)', fontSize:12 }} formatter={(v: number) => [`₦${v}M`, '']} />
              <Bar dataKey="tithes" stackId="a" fill="#3B82F6" radius={[0,0,0,0]} />
              <Bar dataKey="offerings" stackId="a" fill="#0FB8A4" />
              <Bar dataKey="special" stackId="a" fill="var(--brand)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branches table */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <div className="section-title" style={{ fontSize:15 }}>Branch Performance</div>
            <div className="section-sub">All 9 branches — live snapshot</div>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-body)', fontSize:13.5 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Branch','Pastor','Members','Attendance','Giving','Type','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'var(--t-3)', fontFamily:'var(--font-heading)', fontSize:11.5, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((b,i) => (
                <tr key={b.id} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s', cursor:'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background='var(--s-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                >
                  <td style={{ padding:'12px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:3, height:20, borderRadius:2, background:b.color, flexShrink:0 }} />
                      <div>
                        <div style={{ fontWeight:600, color:'var(--t-1)' }}>{b.name}</div>
                        <div style={{ fontSize:11.5, color:'var(--t-3)' }}>{b.location}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px', color:'var(--t-2)', whiteSpace:'nowrap' }}>{b.pastor}</td>
                  <td style={{ padding:'12px' }}><span style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--t-1)' }}>{b.members.toLocaleString()}</span></td>
                  <td style={{ padding:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress-bar" style={{ width:60 }}>
                        <div className="progress-fill" style={{ width:`${b.attendance}%`, background: b.attendance >= 85 ? 'var(--green)' : b.attendance >= 75 ? 'var(--amber)' : 'var(--red)' }} />
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t-2)' }}>{b.attendance}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px', fontFamily:'var(--font-mono)', color:'var(--t-2)', fontSize:12 }}>
                    {b.givingNGN ? `₦${(b.givingNGN/1000000).toFixed(1)}M` : b.givingGBP ? `£${b.givingGBP.toLocaleString()}` : `$${b.givingUSD?.toLocaleString()}`}
                  </td>
                  <td style={{ padding:'12px' }}>
                    <span className={`badge ${b.type==='hq' ? 'badge-amber' : b.type==='international' ? 'badge-blue' : 'badge-teal'}`}>
                      {b.type==='hq' ? 'HQ' : b.type==='international' ? 'Intl' : 'Branch'}
                    </span>
                  </td>
                  <td style={{ padding:'12px' }}>
                    <span className={`badge ${b.attendance >= 80 ? 'badge-green' : 'badge-amber'}`}>
                      {b.attendance >= 80 ? '● Active' : '◎ Watch'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row — alerts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="card" style={{ background:'var(--red-lt)', border:'1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--red)', marginBottom:8 }}>⚠ Members Needing Outreach</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:700, color:'var(--red)' }}>4,840</div>
          <div style={{ fontSize:13, color:'var(--t-2)', margin:'8px 0 14px' }}>Gone quiet 60+ days — distributed across 9 branches</div>
          <button className="btn btn-danger btn-sm" onClick={() => onNavigate('growth')}>View retention analytics →</button>
        </div>
        <div className="card" style={{ background:'var(--amber-lt)', border:'1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--brand)', marginBottom:8 }}>📋 Pending Approvals</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:700, color:'var(--brand)' }}>3</div>
          <div style={{ fontSize:13, color:'var(--t-2)', margin:'8px 0 14px' }}>Events and announcements awaiting senior pastor review</div>
          <button className="btn btn-sm" style={{ background:'var(--brand-lt)', color:'var(--brand)', border:'1px solid rgba(245,158,11,0.3)' }} onClick={() => onNavigate('events')}>Review queue →</button>
        </div>
      </div>
    </div>
  )
}
