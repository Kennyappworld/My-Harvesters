'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { memberGrowthMonthly, retentionMonthly, branches, retentionCohorts } from '@/lib/data'
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

/* ── Animated counter ─────────────────────────────────────────────────── */
function Counter({ end, suffix='', prefix='', decimals=0 }: { end:number; suffix?:string; prefix?:string; decimals?:number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const t0 = performance.now()
        const dur = 2200
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1)
          const ease = 1 - Math.pow(1 - p, 4)
          setVal(parseFloat((ease * end).toFixed(decimals)))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) ob.observe(ref.current)
    return () => ob.disconnect()
  }, [end, decimals])
  return <span ref={ref}>{prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()}{suffix}</span>
}

/* ── Mini sparkline ────────────────────────────────────────────────────── */
function Spark({ data, color }: { data: number[]; color: string }) {
  const d = data.map((v,i) => ({i,v}))
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={d} margin={{ top:2,right:0,left:0,bottom:0 }}>
        <defs><linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.3}/>
          <stop offset="95%" stopColor={color} stopOpacity={0}/>
        </linearGradient></defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg${color.replace('#','')})`} dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── Heat cell ─────────────────────────────────────────────────────────── */
function HeatMini({ v }: { v: number }) {
  const t = Math.max(0, Math.min(1, (v - 55) / 40))
  const r = Math.round(239 * (1-t) + 34 * t)
  const g = Math.round(68  * (1-t) + 197 * t)
  const b = Math.round(68  * (1-t) + 94  * t)
  return (
    <span style={{ background: `rgb(${r},${g},${b})20`, color: `rgb(${r},${g},${b})`, border: `1px solid rgb(${r},${g},${b})30`, padding:'1px 7px', borderRadius:6, fontSize:11, fontWeight:600, fontFamily:'var(--font-mono)' }}>
      {v}%
    </span>
  )
}

const ic = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d={d}/></svg>
)

export default function Landing() {
  const totalQuiet = retentionCohorts.reduce((a,b) => a+b.goneQuiet, 0)
  const trendData = memberGrowthMonthly.map(d => ({ m: d.month, v: d.total }))

  return (
    <div style={{ background:'var(--s-1)', minHeight:'100vh', color:'var(--t-1)' }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="glass" style={{ position:'sticky',top:0,zIndex:50,borderBottom:'0.5px solid var(--border)',padding:'0 1.5rem' }}>
        <div style={{ maxWidth:1120,margin:'0 auto',height:56,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:32,height:32,background:'var(--brand)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sh-brand)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-inv)" strokeWidth="2" width="17" height="17"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <div style={{ fontSize:13,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-0.02em' }}>Harvesters HICC</div>
              <div style={{ fontSize:10,color:'var(--t-3)' }}>Leadership Platform</div>
            </div>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/dashboard" className="btn btn-brand btn-sm">Open dashboard</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="hero-bg" style={{ padding:'5rem 1.5rem 4rem' }}>
        <div className="hero-grid"/>
        <div style={{ maxWidth:1120,margin:'0 auto',position:'relative' }}>

          {/* Headline */}
          <div style={{ textAlign:'center',marginBottom:'3.5rem' }}>
            <div className="chip chip-amber" style={{ display:'inline-flex',marginBottom:'1.25rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              9 branches · 83,400 members
            </div>
            <h1 className="display-xl" style={{ marginBottom:'1.25rem' }}>
              Complete visibility<br/>
              <span style={{ background:'var(--grad-brand)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
                across every branch.
              </span>
            </h1>
            <p style={{ fontSize:18,color:'var(--t-2)',maxWidth:520,margin:'0 auto 2rem',lineHeight:1.65 }}>
              Track member growth, monitor retention heatmaps, and give leadership the data they need — in real time, across all nine campuses.
            </p>
            <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
              <Link href="/dashboard" className="btn btn-brand btn-lg">
                {ic('M13 17l5-5-5-5M6 17l5-5-5-5')} Open leadership portal
              </Link>
              <Link href="/login" className="btn btn-lg">Sign in to your branch</Link>
            </div>
          </div>

          {/* Hero bento preview */}
          <div className="bento" style={{ maxWidth:960,margin:'0 auto' }}>

            {/* Big stat tiles */}
            {[
              { label:'Total members',    end:83400, suffix:'',  sparkData:[72000,74000,77000,80000,83400], color:'#3B82F6', up:true  },
              { label:'New members (May)',end:1810,  suffix:'',  sparkData:[1387,1313,1558,1676,1810],      color:'#F59E0B', up:true  },
              { label:'Avg retention',    end:84.3,  suffix:'%', sparkData:[80.7,81.1,82.6,83.2,84.3],     color:'#14B8A6', up:true, decimals:1 },
              { label:'Gone quiet (60d+)',end:totalQuiet, suffix:'', sparkData:[5200,5000,4900,4870,totalQuiet], color:'#EF4444', up:false },
            ].map(s => (
              <div key={s.label} className="col-3 metric-tile" style={{ padding:'16px 18px' }}>
                <div className="metric-label">{s.label}</div>
                <div className="metric-value" style={{ fontSize:'1.75rem', color: s.up ? undefined : 'var(--red)' }}>
                  <Counter end={s.end} suffix={s.suffix} decimals={s.decimals||0}/>
                </div>
                <Spark data={s.sparkData} color={s.color}/>
                <div className={`metric-sub ${s.up?'up':'down'}`}>{s.up?'↑':'↓'} trending</div>
              </div>
            ))}

            {/* Growth area chart */}
            <div className="col-8 card card-p" style={{ padding:18 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
                <div>
                  <div className="heading">New member growth — all branches</div>
                  <div style={{ fontSize:11,color:'var(--t-3)',marginTop:2 }}>Jan – May 2026 · total intake per month</div>
                </div>
                <span className="chip chip-green">↑ 30.5% Jan→May</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={trendData} margin={{top:5,right:0,left:-30,bottom:0}}>
                  <defs><linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient></defs>
                  <XAxis dataKey="m" tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'var(--s-3)',border:'0.5px solid var(--border-md)',borderRadius:8,fontSize:12,fontFamily:'var(--font-body)'}}/>
                  <Area type="monotone" dataKey="v" name="Total new members" stroke="#F59E0B" strokeWidth={2.5} fill="url(#heroGrad)" dot={{r:3.5,fill:'#F59E0B',strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Retention heatmap mini */}
            <div className="col-4 card card-p">
              <div className="heading" style={{ marginBottom:4 }}>Retention heatmap</div>
              <div style={{ fontSize:11,color:'var(--t-3)',marginBottom:12 }}>12-month cohort by branch</div>
              {retentionCohorts.slice(0,7).map(r => (
                <div key={r.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'0.5px solid var(--border)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                    <span style={{ width:7,height:7,borderRadius:'50%',background:`var(--c-${r.id})`,display:'inline-block' }}/>
                    <span style={{ fontSize:12 }}>{r.branch.replace(' HQ','')}</span>
                  </div>
                  <HeatMini v={r.r12m}/>
                </div>
              ))}
            </div>

            {/* Branch grid */}
            <div className="col-12 card card-p">
              <div className="heading" style={{ marginBottom:12 }}>All 9 branches</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {branches.map(b => (
                  <div key={b.id} className="branch-dot">
                    <span style={{ width:8,height:8,borderRadius:'50%',background:b.color,display:'inline-block',boxShadow:`0 0 8px ${b.color}60` }}/>
                    <span style={{ fontSize:12,fontWeight:500 }}>{b.name}</span>
                    <span style={{ fontSize:11,color:'var(--t-3)',fontFamily:'var(--font-mono)' }}>{(b.members/1000).toFixed(1)}K</span>
                    <span className={`chip chip-${b.country==='NG'?'amber':b.country==='UK'?'purple':'teal'}`} style={{ fontSize:9 }}>{b.country}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ──────────────────────────────────────────── */}
      <section style={{ background:'var(--s-2)',borderTop:'0.5px solid var(--border)',borderBottom:'0.5px solid var(--border)',padding:'2.5rem 1.5rem' }}>
        <div style={{ maxWidth:1120,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:24 }}>
          {[
            { label:'Total members',        end:83400,  suffix:''  },
            { label:'Active branches',       end:9,      suffix:''  },
            { label:'Weekly attendance',     end:71200,  suffix:''  },
            { label:'Monthly giving (₦M)',  end:142,    suffix:'M' },
            { label:'Small groups',          end:412,    suffix:''  },
            { label:'Workforce volunteers',  end:3200,   suffix:'+' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div className="display-md" style={{ fontFamily:'var(--font-display)',background:'var(--grad-brand)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
                <Counter end={s.end} suffix={s.suffix}/>
              </div>
              <div style={{ fontSize:11,color:'var(--t-3)',marginTop:6,letterSpacing:'.05em',textTransform:'uppercase',fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section style={{ padding:'4.5rem 1.5rem' }}>
        <div style={{ maxWidth:1120,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <div className="subheading" style={{ marginBottom:8 }}>Platform capabilities</div>
            <h2 className="display-lg">Everything leadership needs</h2>
          </div>
          <div className="bento stagger">
            {[
              { cols:'col-4', title:'Growth & Retention Analytics', icon:'M18 20V10M12 20V4M6 20v-6', desc:'Real-time member trends, 3/6/12-month retention heatmaps per branch, first-timer funnel, and churn analysis — the centrepiece of the platform.', accent:'brand' },
              { cols:'col-4', title:'Tiered Community Chat',        icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', desc:'Unit chats, peer cross-branch channels (same dept, all branches), leadership councils — scoped by role.', accent:'accent' },
              { cols:'col-4', title:'Prayer Wall + Elevation',      icon:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', desc:'Scoped prayer requests, unit → branch → global elevation, interceding counts, pastoral responses.', accent:'purple' },
              { cols:'col-4', title:'Growth Passport',              icon:'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3', desc:'Per-member spiritual health profile: growth track, giving faithfulness, serving history, prayer activity, milestone badges.', accent:'green' },
              { cols:'col-4', title:'Workforce Scheduler',          icon:'M9 11l3 3L22 4', desc:'Serving slots per branch, sign-up management, capacity tracking, full serve history for every volunteer.', accent:'teal' },
              { cols:'col-4', title:'Announcements + Read Receipts',icon:'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', desc:'Broadcast to all or specific branches. Know exactly how many members have read each message.', accent:'blue' },
            ].map(f => (
              <div key={f.title} className={`${f.cols} card card-hover`} style={{ padding:22 }}>
                <div style={{ width:40,height:40,borderRadius:10,background:`var(--${f.accent==='brand'?'amber-lt':f.accent==='accent'?'accent-lt':'blue-lt'})`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={`var(--${f.accent==='brand'?'brand':f.accent==='accent'?'accent':'blue'})`} strokeWidth="2" width="20" height="20"><path d={f.icon}/></svg>
                </div>
                <div className="heading" style={{ marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:12.5,color:'var(--t-2)',lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY STRIP ──────────────────────────────────────── */}
      <section style={{ background:'var(--s-2)',borderTop:'0.5px solid var(--border)',borderBottom:'0.5px solid var(--border)',padding:'3rem 1.5rem' }}>
        <div style={{ maxWidth:1120,margin:'0 auto',display:'flex',gap:48,alignItems:'center',flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 300px' }}>
            <div className="subheading" style={{ marginBottom:8 }}>Enterprise security</div>
            <h2 className="display-md" style={{ marginBottom:12 }}>Built secure from day one</h2>
            <p style={{ fontSize:13.5,color:'var(--t-2)',lineHeight:1.7 }}>Your congregation's data is protected with OWASP Top 10 2025 compliance — every endpoint, every role, every session.</p>
          </div>
          <div style={{ flex:'1 1 420px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {['JWT + Refresh token rotation','OWASP Top 10 2025 compliant','Rate limiting (global + auth)','Zod input validation','Role-based access control','Security headers (CSP, HSTS)'].map(s => (
              <div key={s} className="card card-sm" style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:24,height:24,borderRadius:6,background:'var(--green-lt)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize:12.5,fontWeight:500 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding:'5rem 1.5rem',textAlign:'center' }}>
        <div style={{ maxWidth:520,margin:'0 auto' }}>
          <h2 className="display-lg" style={{ marginBottom:14 }}>Lead with clarity.</h2>
          <p style={{ fontSize:16,color:'var(--t-2)',marginBottom:'2rem' }}>Every branch. Every member. Every trend. One dashboard for Harvesters HICC.</p>
          <Link href="/dashboard" className="btn btn-brand btn-lg">Open leadership portal →</Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ borderTop:'0.5px solid var(--border)',padding:'1.5rem',textAlign:'center' }}>
        <p style={{ fontSize:11.5,color:'var(--t-3)' }}>© 2026 Harvesters International Christian Centre · Leadership Platform v3.0 · Private & confidential</p>
      </footer>
    </div>
  )
}
