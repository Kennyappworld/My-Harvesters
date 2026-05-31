'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { memberGrowthMonthly, retentionMonthly, branches, retentionCohorts } from '@/lib/data'
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

function Counter({ end, suffix='', decimals=0 }: { end:number; suffix?:string; decimals?:number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const t0 = performance.now(), dur = 2000
        const tick = (now: number) => {
          const p = Math.min((now-t0)/dur,1)
          const ease = 1 - Math.pow(1-p,4)
          setVal(parseFloat((ease*end).toFixed(decimals)))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold:0.3 })
    if (ref.current) ob.observe(ref.current)
    return () => ob.disconnect()
  }, [end, decimals])
  return <span ref={ref}>{decimals>0?val.toFixed(decimals):Math.round(val).toLocaleString()}{suffix}</span>
}

function Spark({ data, color }: { data:number[]; color:string }) {
  const d = data.map((v,i) => ({i,v}))
  return (
    <ResponsiveContainer width="100%" height={30}>
      <AreaChart data={d} margin={{top:2,right:0,left:0,bottom:0}}>
        <defs><linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
          <stop offset="95%" stopColor={color} stopOpacity={0}/>
        </linearGradient></defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg${color.replace('#','')})`} dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function Landing() {
  const totalQuiet = retentionCohorts.reduce((a,b)=>a+b.goneQuiet,0)
  const trendData  = memberGrowthMonthly.map(d => ({ m:d.month, v:d.total }))

  const features = [
    { icon:'M18 20V10M12 20V4M6 20v-6', title:'Growth & Retention Analytics', desc:'5-tab analytics — new member trends per branch, retention heatmaps, first-timer funnel, cohort analysis and churn insights.', color:'#7C3AED' },
    { icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title:'New Soul Tracker', desc:'Capture every new convert. Automated personalised follow-up at 2 weeks, 4 weeks, 3 months and 4 months with feedback + prayer links.', color:'#10B981' },
    { icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', title:'Tiered Community Chat', desc:'Unit groups, peer cross-branch channels for same-level leaders, and senior leadership councils — each scoped by role.', color:'#3B82F6' },
    { icon:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', title:'Prayer Wall + Elevation', desc:'Members post requests in their unit. Leaders can elevate to the branch wall or global wall — seen by all 83,400 members.', color:'#EC4899' },
    { icon:'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3', title:'Member Verification', desc:'6-month engagement threshold, referral link generation, and a 1–5 commitment rating to give leadership visibility on engagement depth.', color:'#F59E0B' },
    { icon:'M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z', title:'Meetings + Summaries', desc:'Schedule via Google Meet directly from the platform. Summaries with date, duration, and attendance stored automatically.', color:'#14B8A6' },
  ]

  return (
    <div style={{ background:'var(--navy)', color:'var(--t-1)', minHeight:'100vh' }}>

      {/* ── NAV ── */}
      <nav style={{ position:'sticky', top:0, zIndex:50, borderBottom:'0.5px solid var(--border)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', background:'rgba(15,10,46,0.85)', padding:'0 1.5rem' }}>
        <div style={{ maxWidth:1140, margin:'0 auto', height:58, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, background:'var(--grad-brand)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-brand)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, fontFamily:'var(--font-display)', letterSpacing:'-0.02em' }}>HARVESTERS HICC</div>
              <div style={{ fontSize:9.5, color:'var(--t-3)', letterSpacing:'0.08em' }}>LEADERSHIP PLATFORM</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/dashboard" className="btn btn-brand btn-sm">Open dashboard →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-bg" style={{ padding:'5rem 1.5rem 4.5rem' }}>
        <div className="hero-grid"/>
        <div style={{ maxWidth:1140, margin:'0 auto', position:'relative' }}>

          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            {/* Badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--brand-soft)', border:'1px solid var(--border-md)', borderRadius:100, padding:'5px 14px', marginBottom:'1.5rem', fontSize:12, fontWeight:600, color:'#C084FC' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--brand-lt)', display:'inline-block', boxShadow:'0 0 8px var(--brand-lt)' }}/>
              9 branches · 83,400 members · Nigeria · UK · USA
            </div>
            <h1 className="display-xl" style={{ marginBottom:'1.25rem' }}>
              Complete visibility<br/>
              <span style={{ background:'linear-gradient(135deg, #C084FC 0%, #7C3AED 40%, #F59E0B 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                across every campus.
              </span>
            </h1>
            <p style={{ fontSize:18, color:'var(--t-2)', maxWidth:540, margin:'0 auto 2.5rem', lineHeight:1.7 }}>
              Track member growth, monitor retention, engage your workforce — one platform built for Harvesters HICC leadership.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/dashboard" className="btn btn-brand btn-lg">
                Open leadership portal
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/login" className="btn btn-lg">Sign in to your branch</Link>
            </div>
          </div>

          {/* Dashboard preview card */}
          <div style={{ background:'var(--navy-2)', border:'1px solid var(--border-md)', borderRadius:'var(--r-2xl)', padding:'1.5rem', maxWidth:920, margin:'0 auto', boxShadow:'0 20px 60px rgba(124,58,237,0.20), 0 0 0 1px rgba(124,58,237,0.15)' }}>
            {/* 4 stat tiles */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1rem' }}>
              {[
                { l:'Total members',     end:83400, suf:'',  data:[72000,74000,77000,80000,83400], col:'#7C3AED' },
                { l:'New members (May)', end:1810,  suf:'',  data:[1387,1313,1558,1676,1810],      col:'#F59E0B' },
                { l:'Avg retention',     end:84.3,  suf:'%', data:[80.7,81.1,82.6,83.2,84.3],     col:'#10B981', dec:1 },
                { l:'Gone quiet',        end:totalQuiet,suf:'', data:[5200,5000,4900,4870,totalQuiet], col:'#EF4444' },
              ].map(s => (
                <div key={s.l} style={{ background:'var(--navy-3)', borderRadius:'var(--r-lg)', padding:'12px 14px', border:'0.5px solid var(--border)' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--t-3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>{s.l}</div>
                  <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-display)', letterSpacing:'-0.03em', color:s.col, marginBottom:2 }}>
                    <Counter end={s.end} suffix={s.suf} decimals={s.dec||0}/>
                  </div>
                  <Spark data={s.data} color={s.col}/>
                </div>
              ))}
            </div>

            {/* Growth chart */}
            <div style={{ background:'var(--navy-3)', borderRadius:'var(--r-lg)', padding:'14px 16px', marginBottom:'1rem', border:'0.5px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, fontFamily:'var(--font-display)' }}>All-branch new member growth</div>
                <span style={{ fontSize:10.5, background:'var(--green-lt)', color:'var(--green)', padding:'2px 8px', borderRadius:100, fontWeight:700 }}>↑ 30.5% Jan→May</span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={trendData} margin={{top:5,right:0,left:-30,bottom:0}}>
                  <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient></defs>
                  <XAxis dataKey="m" tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'var(--navy-3)',border:'1px solid var(--border-md)',borderRadius:8,fontSize:12}}/>
                  <Area type="monotone" dataKey="v" name="Total new members" stroke="#7C3AED" strokeWidth={2.5} fill="url(#hg)" dot={{r:3.5,fill:'#7C3AED',strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Branch pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {branches.map(b => (
                <div key={b.id} className="branch-dot">
                  <span style={{ width:8,height:8,borderRadius:'50%',background:b.color,boxShadow:`0 0 8px ${b.color}` }}/>
                  <span style={{ fontSize:11.5,fontWeight:600 }}>{b.name}</span>
                  <span style={{ fontSize:10.5,color:'var(--t-3)',fontFamily:'var(--font-mono)' }}>{(b.members/1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{ background:'var(--grad-brand)', padding:'2.5rem 1.5rem' }}>
        <div style={{ maxWidth:1140, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:24 }}>
          {[
            { l:'Total members',      end:83400,  suf:''  },
            { l:'Active branches',    end:9,      suf:''  },
            { l:'Weekly attendance',  end:71200,  suf:''  },
            { l:'New souls this month',end:46,    suf:''  },
            { l:'Small groups',       end:412,    suf:''  },
            { l:'Workforce volunteers',end:3200,  suf:'+' },
          ].map(s => (
            <div key={s.l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:32,fontWeight:800,color:'white',letterSpacing:'-0.04em',lineHeight:1,fontFamily:'var(--font-display)' }}>
                <Counter end={s.end} suffix={s.suf}/>
              </div>
              <div style={{ fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:6,letterSpacing:'0.05em',textTransform:'uppercase',fontWeight:600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:'5rem 1.5rem' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div className="subheading" style={{ marginBottom:10 }}>Platform capabilities</div>
            <h2 className="display-lg">Everything leadership needs</h2>
            <p style={{ fontSize:16, color:'var(--t-2)', maxWidth:480, margin:'12px auto 0', lineHeight:1.7 }}>
              From new convert tracking to cross-branch analytics — all in one place.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14 }} className="stagger">
            {features.map(f => (
              <div key={f.title} className="card card-hover" style={{ padding:22 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:`${f.color}20`,border:`1px solid ${f.color}40`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2" width="22" height="22"><path d={f.icon}/></svg>
                </div>
                <div className="heading" style={{ marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:13,color:'var(--t-2)',lineHeight:1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section style={{ background:'var(--navy-2)', borderTop:'0.5px solid var(--border)', borderBottom:'0.5px solid var(--border)', padding:'3.5rem 1.5rem' }}>
        <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', gap:48, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 300px' }}>
            <div className="subheading" style={{ marginBottom:10 }}>Enterprise-grade security</div>
            <h2 className="display-md" style={{ marginBottom:14 }}>Built secure from day one</h2>
            <p style={{ fontSize:14, color:'var(--t-2)', lineHeight:1.75 }}>
              OWASP Top 10 2025 compliance, JWT with refresh token rotation, role-based access control, and end-to-end input sanitisation on every request.
            </p>
          </div>
          <div style={{ flex:'1 1 420px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {['JWT + Refresh token rotation','OWASP Top 10 2025','Rate limiting (global + auth)','Zod input validation','Role-based access control','Security headers (CSP, HSTS)'].map(s => (
              <div key={s} className="card card-sm" style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:26,height:26,borderRadius:8,background:'var(--green-lt)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize:12.5,fontWeight:500 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'5rem 1.5rem', textAlign:'center' }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <h2 className="display-lg" style={{ marginBottom:14 }}>Lead with clarity.</h2>
          <p style={{ fontSize:16, color:'var(--t-2)', lineHeight:1.7, marginBottom:'2rem' }}>
            Every branch. Every member. Every trend. One dashboard built for Harvesters HICC.
          </p>
          <Link href="/dashboard" className="btn btn-brand btn-lg">
            Open leadership portal
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'0.5px solid var(--border)', padding:'1.5rem', textAlign:'center' }}>
        <p style={{ fontSize:12, color:'var(--t-3)' }}>
          © 2026 Harvesters International Christian Centre · Leadership Platform v5.0 · Confidential · Internal use only
        </p>
      </footer>
    </div>
  )
}
