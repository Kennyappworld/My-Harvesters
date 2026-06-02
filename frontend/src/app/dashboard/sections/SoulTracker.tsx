'use client'
import { useState, useEffect } from 'react'
import { branches } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

const FOLLOW_UP_SCHEDULE = [
  { interval: '2 weeks',  label: 'Wk 2',  message: 'Personalised welcome + branch info', status: 'sent' },
  { interval: '4 weeks',  label: 'Wk 4',  message: 'Small group invitation', status: 'sent' },
  { interval: '3 months', label: '3 mo',  message: 'Growth track enrolment nudge', status: 'pending' },
  { interval: '4 months', label: '4 mo',  message: 'Membership verification prompt', status: 'upcoming' },
]

const SAMPLE_SOULS = [
  { id:'s1', name:'Tobi Adeyemo',    branch:'Lekki HQ',   date:'May 25', status:'active',   step:1, phone:'+234 810 000 1234', feedback:true,  prayer:true  },
  { id:'s2', name:'Ngozi Eze',       branch:'Gbagada',    date:'May 25', status:'active',   step:1, phone:'+234 803 000 5678', feedback:false, prayer:true  },
  { id:'s3', name:'Emeka Okafor',    branch:'Ikeja',      date:'May 18', status:'wk2sent',  step:2, phone:'+234 706 000 9012', feedback:true,  prayer:false },
  { id:'s4', name:'Aisha Bello',     branch:'Abuja',      date:'May 11', status:'wk4sent',  step:3, phone:'+234 813 000 3456', feedback:true,  prayer:true  },
  { id:'s5', name:'Chisom Nwachukwu',branch:'London UK',  date:'Apr 27', status:'3mosent',  step:4, phone:'+44 798 000 7890',  feedback:true,  prayer:false },
  { id:'s6', name:'Oluwaseun Adewale',branch:'Lekki HQ',  date:'Apr 20', status:'complete', step:4, phone:'+234 809 000 2345', feedback:true,  prayer:true  },
]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Just recorded', color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  wk2sent:  { label: 'Wk 2 contacted', color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  wk4sent:  { label: 'Wk 4 contacted', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  '3mosent':{ label: '3 mo contacted', color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  complete: { label: 'Journey complete',color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

export default function SoulTracker({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user } = useSession()
  const [tab, setTab] = useState<'tracker'|'capture'|'schedule'>('tracker')
  const [souls, setSouls] = useState(() => hydrate('hicc_souls' as any, SAMPLE_SOULS))

  // Load real souls from Supabase on mount
  useEffect(() => {
    if (!supabase) return
    const loadSouls = async () => {
      try {
        const { data } = await supabase.from('soul_records').select('*').order('created_at', { ascending: false }).limit(100)
        if (data && data.length > 0) {
          const mapped = data.map((s:any) => ({
            id: s.id, name: `${s.first_name} ${s.last_name}`,
            branch: branches.find(b=>b.id===s.branch_id)?.name || s.branch_id,
            date: new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
            status: s.follow_up_stage===1?'active':s.follow_up_stage===2?'wk2sent':s.follow_up_stage===3?'wk4sent':'complete',
            step: s.follow_up_stage, phone: s.phone||'—', feedback: false, prayer: false,
          }))
          setSouls(mapped)  // No PII cache — load fresh each session
        }
      } catch {}
    }
    loadSouls()
  }, [])
  const [filterBranch, setFilterBranch] = useState('All')
  const [form, setForm] = useState({ name:'', phone:'', email:'', branch:'Lekki HQ', date: new Date().toISOString().slice(0,10), notes:'' })
  const [saved, setSaved] = useState(false)

  const filtered = filterBranch === 'All' ? souls : souls.filter(s => s.branch === filterBranch)

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameParts = form.name.trim().split(' ')
    const first = nameParts[0]; const last = nameParts.slice(1).join(' ') || '—'
    const newSoul = { id:`s${Date.now()}`, name:form.name, branch:form.branch, date:form.date, status:'active', step:1, phone:form.phone, feedback:false, prayer:false }
    setSouls((prev:any[]) => { const n=[newSoul,...prev]; persist('hicc_souls' as any, n); return n })
    if (supabase && user?.id) {
      await supabase.from('soul_records').insert({
        first_name: first, last_name: last, phone: form.phone, email: form.email,
        branch_id: branches.find(b=>b.name===form.branch)?.id || 'lekki',
        led_by: user.id, service_date: form.date, follow_up_stage: 1, notes: form.notes,
      })
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setTab('tracker') }, 2000)
    setForm({ name:'', phone:'', email:'', branch:'Lekki HQ', date:new Date().toISOString().slice(0,10), notes:'' })
  }

  // Campus totals
  const campusTotals = branches.map(b => ({
    ...b,
    total: souls.filter(s => s.branch === b.name).length,
    thisWeek: souls.filter(s => s.branch === b.name && s.status === 'active').length,
  })).filter(b => b.total > 0)

  return (
    <div>
      {/* Vision banner */}
      <div style={{ background:'var(--s-2)', border:'0.5px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:16, borderLeft:'3px solid var(--brand)' }}>
        <div style={{ fontSize:10.5, color:'var(--brand)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>Platform vision</div>
        <div style={{ fontSize:13, color:'var(--t-2)', lineHeight:1.65 }}>
          Make new converts feel welcomed and properly engaged. Every soul recorded. Every follow-up automated. No one falls through the cracks.
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { l:'Recorded this month', v: souls.length, sub:'All branches' },
          { l:'Awaiting wk 2 contact', v: souls.filter(s=>s.status==='active').length, sub:'New this week', warn:true },
          { l:'Follow-up complete', v: souls.filter(s=>s.status==='complete').length, sub:'Full journey done' },
          { l:'Branches reporting', v: campusTotals.length, sub:'Out of 9' },
        ].map(m => (
          <div key={m.l} className="metric-tile" style={{ borderTop:`2px solid ${m.warn?'var(--red)':'var(--brand)'}` }}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.5rem', color: m.warn && m.v > 0 ? 'var(--red)' : undefined }}>{m.v}</div>
            <div className="metric-sub flat">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {([['tracker','Soul tracker'],['capture','Record new soul'],['schedule','Follow-up schedule']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── TRACKER ── */}
      {tab === 'tracker' && (
        <>
          {/* Campus breakdown */}
          <div className="card card-p" style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Campus new soul tracker</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
              {['All', ...branches.map(b=>b.name)].slice(0,10).map(b => (
                <button key={b} onClick={()=>setFilterBranch(b)} className={`btn btn-sm ${filterBranch===b?'btn-brand':''}`} style={{ fontSize:11 }}>{b==='All'?'All branches':b.replace(' HQ','')}</button>
              ))}
            </div>

            {campusTotals.length > 0 && filterBranch === 'All' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8, marginBottom:16 }}>
                {campusTotals.map(b => (
                  <div key={b.id} style={{ background:'var(--s-3)', borderRadius:8, padding:'10px 12px', borderLeft:`3px solid ${b.color}` }}>
                    <div style={{ fontSize:11, color:'var(--t-2)', marginBottom:4 }}>{b.name}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:'var(--t-1)', fontFamily:'var(--font-mono)' }}>{b.total}</div>
                    <div style={{ fontSize:10, color:'var(--t-3)', marginTop:2 }}>{b.thisWeek} new this week</div>
                  </div>
                ))}
              </div>
            )}

            <table className="tbl">
              <thead><tr><th>Name</th><th>Branch</th><th>Date recorded</th><th>Journey stage</th><th>Feedback</th><th>Prayer req.</th></tr></thead>
              <tbody>
                {filtered.map(soul => {
                  const st = STATUS_LABELS[soul.status] || STATUS_LABELS.active
                  return (
                    <tr key={soul.id}>
                      <td style={{ fontWeight:600 }}>{soul.name}</td>
                      <td style={{ fontSize:12 }}>{soul.branch}</td>
                      <td style={{ fontSize:12, color:'var(--t-2)' }}>{soul.date}</td>
                      <td>
                        <span style={{ background:st.bg, color:st.color, padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:500 }}>{st.label}</span>
                      </td>
                      <td>
                        <span style={{ color:soul.feedback?'var(--green)':'var(--t-3)', fontSize:13 }}>{soul.feedback?'✓ Received':'—'}</span>
                      </td>
                      <td>
                        <span style={{ color:soul.prayer?'var(--brand)':'var(--t-3)', fontSize:13 }}>{soul.prayer?'✓ Submitted':'—'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CAPTURE ── */}
      {tab === 'capture' && (
        <div className="card card-p" style={{ maxWidth:520 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Record a new soul</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:20 }}>Details are captured and automated follow-up messages begin immediately.</div>

          {saved && (
            <div style={{ padding:'10px 14px', background:'rgba(34,197,94,0.12)', border:'0.5px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:13, color:'var(--green)', marginBottom:16, fontWeight:500 }}>
              ✓ Soul recorded. Automated follow-up sequence started.
            </div>
          )}

          <form onSubmit={handleCapture}>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Full name *</label>
              <input className="input" placeholder="First and last name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Phone number *</label>
                <input className="input" placeholder="+234 800 000 0000" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Email (optional)</label>
                <input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Campus *</label>
                <select className="input" value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                  {branches.map(b => <option key={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Date of first visit *</label>
                <input className="input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/>
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Notes (optional)</label>
              <textarea className="input" rows={2} placeholder="How they heard about HICC, any specific prayer needs…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ resize:'vertical' }}/>
            </div>
            <button type="submit" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'10px' }}>
              Record soul + start follow-up
            </button>
          </form>
        </div>
      )}

      {/* ── FOLLOW-UP SCHEDULE ── */}
      {tab === 'schedule' && (
        <div className="card card-p">
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Automated follow-up schedule</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:20, lineHeight:1.65 }}>
            Every new soul recorded triggers this automated message sequence. Messages are personalised with the person's name and the branch they visited. Each message includes a link for feedback and a prayer request.
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FOLLOW_UP_SCHEDULE.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'14px 16px', background:'var(--s-3)', borderRadius:10, border:'0.5px solid var(--border)' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:700, color:'var(--s-1)', fontFamily:'var(--font-mono)' }}>
                  {step.label}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>At {step.interval}</div>
                  <div style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.6 }}>{step.message}</div>
                  <div style={{ marginTop:8, fontSize:11, color:'var(--t-3)' }}>
                    ✉ Personalised with name + branch · 🔗 Feedback link · 🙏 Prayer request link
                  </div>
                </div>
                <span style={{ fontSize:10.5, padding:'2px 8px', borderRadius:100, fontWeight:500, background: step.status==='sent'?'rgba(34,197,94,0.12)':step.status==='pending'?'rgba(245,158,11,0.12)':'var(--s-2)', color:step.status==='sent'?'var(--green)':step.status==='pending'?'var(--brand)':'var(--t-3)' }}>
                  {step.status === 'sent' ? 'Active' : step.status === 'pending' ? 'Pending setup' : 'Upcoming'}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(245,158,11,0.06)', border:'0.5px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
            <div style={{ fontSize:12.5, color:'var(--brand)', fontWeight:600, marginBottom:4 }}>How messages are sent</div>
            <div style={{ fontSize:12, color:'var(--t-2)', lineHeight:1.65 }}>
              Messages are dispatched automatically by the backend scheduler. In production, connect to WhatsApp Business API or SMS gateway (Termii / Infobip) for delivery. Email fallback is always included.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
