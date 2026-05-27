'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

function useCounter(target: number, duration = 2000) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(ease * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])
  return { val, ref }
}

function Stat({ n, label, prefix = '', suffix = '' }: { n: number; label: string; prefix?: string; suffix?: string }) {
  const { val, ref } = useCounter(n)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--brand)', lineHeight: 1 }}>
        {prefix}{val.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--t-3)', marginTop: 6, fontFamily: 'var(--font-heading)' }}>{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const features = [
    { icon: '📊', title: 'Growth & Retention Analytics', desc: '5-tab analytics centrepiece: new member trends, retention heatmaps, first-timer funnels, cohort analysis, and churn insights across all 9 branches.' },
    { icon: '💬', title: 'Tiered Community Chat', desc: 'Unit members chat within their group. Unit heads connect peer-to-peer across branches. Leadership has their own council channel. Communication that mirrors church structure.' },
    { icon: '🙏', title: 'Prayer Wall', desc: 'Members post requests to their unit. Unit heads elevate to branch wall. Branch pastors elevate to global. Privacy respected, intercession maximised.' },
    { icon: '🎉', title: 'Testimony Feed', desc: 'Scoped, celebratory, and shareable. Leadership can feature testimonies to broadcast across all campuses — building culture through shared victories.' },
    { icon: '🌱', title: 'Spiritual Growth Passport', desc: 'Every member\'s journey tracked: Growth Track stage, giving faithfulness, serving record, prayer activity, and milestone badges. Leaders see who\'s thriving and who\'s gone quiet.' },
    { icon: '📅', title: 'Volunteer Scheduler', desc: 'Unit heads post serving slots with capacity. Members sign up. Leaders see filled vs. open slots. Tied to attendance so you always know who showed up to serve.' },
    { icon: '🔔', title: 'Announcements with Read Receipts', desc: 'Every broadcast shows exactly how many members received and read it. Real accountability for pastoral communication.' },
    { icon: '💰', title: 'Multi-Currency Giving Analytics', desc: 'Tithes, offerings, and special seeds across ₦, £, and $ — by branch, by month, with trend lines and breakdowns.' },
  ]

  return (
    <div style={{ background: 'var(--s-1)', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: 'var(--sh-brand)',
          }}>✦</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: 'var(--t-1)', lineHeight: 1 }}>HICC</div>
            <div style={{ fontSize: 10, color: 'var(--t-3)', fontFamily: 'var(--font-mono)', lineHeight: 1, marginTop: 2 }}>LEADERSHIP PLATFORM</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/login" className="btn btn-brand btn-sm">Access dashboard →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        paddingTop: 100, paddingBottom: 80,
        background: 'var(--grad-hero)',
        position: 'relative',
      }}>
        {/* Decorative orbs */}
        <div style={{ position:'absolute', top:'15%', right:'8%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'20%', left:'5%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(15,184,164,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* Left — copy */}
            <div className="fade-up">
              <div className="badge badge-amber" style={{ marginBottom: 20 }}>
                ✦ 9 Branches · 83,400 Members · 3 Continents
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 58px)',
                fontWeight: 800, lineHeight: 1.12, color: 'var(--t-1)', marginBottom: 20,
              }}>
                One Platform.<br/>
                <span style={{ color: 'var(--brand)' }}>Every Branch.</span><br/>
                Every Soul.
              </h1>
              <p style={{ fontSize: 17, color: 'var(--t-2)', lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>
                The complete leadership operations platform for Harvesters International Christian Centre — growth analytics, tiered communication, pastoral care, and spiritual community in one unified dashboard.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/login" className="btn btn-brand btn-lg">Access dashboard →</Link>
                <a href="#features" className="btn btn-ghost btn-lg">See features</a>
              </div>
            </div>

            {/* Right — dashboard preview card */}
            <div className="fade-up stagger-2">
              <div className="glass" style={{ padding: 24, boxShadow: 'var(--sh-lg)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#EF4444' }} />
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#F59E0B' }} />
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#22C55E' }} />
                  <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t-3)' }}>HICC · Live Dashboard</span>
                </div>
                {/* Mini bento grid preview */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
                  {[
                    { label:'Total Members', val:'83,400', color:'var(--brand)', up:'+5.2%' },
                    { label:'Weekly Attend.', val:'71,200', color:'var(--accent)', up:'+3.1%' },
                    { label:'Retention Avg', val:'84.3%', color:'var(--green)', up:'+1.1pp' },
                  ].map((k,i) => (
                    <div key={i} style={{ background:'var(--s-3)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:10, color:'var(--t-3)', fontFamily:'var(--font-heading)', marginBottom:4 }}>{k.label}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:700, color:k.color }}>{k.val}</div>
                      <div style={{ fontSize:10, color:'var(--green)', marginTop:2 }}>↑ {k.up}</div>
                    </div>
                  ))}
                </div>
                {/* Fake bar chart */}
                <div style={{ background:'var(--s-3)', borderRadius:8, padding:14, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-heading)', marginBottom:10 }}>New Members — May 2026</div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:60 }}>
                    {[310,245,190,148,162,112,58,98,91].map((v,i) => {
                      const colors = ['#3B82F6','#0FB8A4','#F59E0B','#A855F7','#EF4444','#EC4899','#F97316','#6366F1','#22C55E']
                      return <div key={i} style={{ flex:1, background:colors[i], borderRadius:'3px 3px 0 0', height:`${(v/394)*100}%`, opacity:0.85, transition:'height 0.5s ease' }} />
                    })}
                  </div>
                </div>
                <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Lekki','Gbagada','Ikeja','Anthony','Abuja','PH','Ibadan','London','Houston'].map((b,i) => {
                    const colors = ['#3B82F6','#0FB8A4','#F59E0B','#A855F7','#EF4444','#EC4899','#F97316','#6366F1','#22C55E']
                    return <span key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--t-3)' }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:colors[i] }} />{b}
                    </span>
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="fade-up stagger-4" style={{ marginTop: 64 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0, background: 'var(--s-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', overflow: 'hidden',
            }}>
              {[
                { n:83400, label:'Total Members', suffix:'' },
                { n:71200, label:'Weekly Attendance', suffix:'' },
                { n:9, label:'Global Branches', suffix:'' },
                { n:142, label:'Monthly Giving (₦M)', prefix:'₦', suffix:'M' },
              ].map((s,i) => (
                <div key={i} style={{ padding: '28px 24px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
                  <Stat n={s.n} label={s.label} prefix={s.prefix||''} suffix={s.suffix} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '100px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="badge badge-teal" style={{ marginBottom: 16 }}>Platform Features</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--t-1)', marginBottom: 16 }}>
            Everything leadership needs
          </h2>
          <p style={{ color: 'var(--t-2)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            Built specifically for Harvesters — combining the authority chain, peer community, and individual spiritual journey in one platform.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {features.map((f,i) => (
            <div key={i} className="card fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--t-1)', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--t-2)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 600, margin: '0 auto', padding: '60px 40px',
          background: 'var(--grad-card), var(--s-2)', border: '1px solid var(--border-md)',
          borderRadius: 'var(--r-2xl)', boxShadow: 'var(--sh-lg)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, color: 'var(--t-1)', marginBottom: 14 }}>
            Ready to lead with clarity?
          </h2>
          <p style={{ color: 'var(--t-2)', fontSize: 15.5, marginBottom: 28, lineHeight: 1.7 }}>
            Access real-time visibility across all branches, members, and ministries — from one unified platform.
          </p>
          <Link href="/login" className="btn btn-brand btn-lg">Sign in to dashboard →</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--t-3)' }}>
          © 2026 Harvesters International Christian Centre · Internal use only
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-3)' }}>v4.0</div>
      </footer>
    </div>
  )
}
