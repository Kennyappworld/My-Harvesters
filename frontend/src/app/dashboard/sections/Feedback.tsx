'use client'
import { useState } from 'react'

type Channel = 'pulse' | 'pastoral' | 'operations'
type Status = 'open' | 'in_progress' | 'resolved'

interface FeedbackItem {
  id: string
  channel: Channel
  branch: string
  category: string
  message: string
  rating?: number
  anonymous: boolean
  status: Status
  submittedAt: string
  response?: string
}

const BRANCHES = ['Lekki HQ','Gbagada','Ikeja','Anthony Village','Abuja','Port Harcourt','Ibadan','London UK','Houston USA']

const SEED: FeedbackItem[] = [
  { id:'f1', channel:'pulse', branch:'Lekki HQ', category:'Sermon', message:'The sermon on faith was deeply impactful. Would love more practical examples next time.', rating:4, anonymous:true, status:'resolved', submittedAt:'2026-05-25', response:'Thank you — we will incorporate more real-life illustrations going forward.' },
  { id:'f2', channel:'pulse', branch:'Gbagada', category:'Worship', message:'Worship was excellent but sound levels were too loud near the back rows.', rating:3, anonymous:true, status:'in_progress', submittedAt:'2026-05-25' },
  { id:'f3', channel:'pastoral', branch:'Ikeja', category:'Felt unsupported', message:'I reached out to my unit leader three weeks ago about a personal matter and have not heard back.', anonymous:true, status:'open', submittedAt:'2026-05-24' },
  { id:'f4', channel:'operations', branch:'Abuja', category:'Facilities', message:'The children\'s wing air conditioning has been broken for two Sundays. Parents are struggling.', anonymous:false, status:'in_progress', submittedAt:'2026-05-23' },
  { id:'f5', channel:'pulse', branch:'London UK', category:'Welcome', message:'First-timer experience was wonderful. The connect team was incredibly warm.', rating:5, anonymous:true, status:'resolved', submittedAt:'2026-05-18', response:'Praise God! We will share this with the connect team.' },
  { id:'f6', channel:'operations', branch:'Lekki HQ', category:'Communication', message:'Service time changes are not communicated early enough. Found out about last Sunday\'s change only 2 hours before.', anonymous:false, status:'open', submittedAt:'2026-05-22' },
  { id:'f7', channel:'pastoral', branch:'Houston USA', category:'Sensitive matter', message:'Going through a difficult family situation and would appreciate pastoral counselling.', anonymous:true, status:'in_progress', submittedAt:'2026-05-20' },
  { id:'f8', channel:'pulse', branch:'Port Harcourt', category:'Facilities', message:'Parking space is becoming very tight. Need a solution before rainy season.', rating:2, anonymous:true, status:'open', submittedAt:'2026-05-25' },
]

const CHANNEL_META = {
  pulse:      { label:'Service Pulse',    color:'#1D9E75', bg:'rgba(29,158,117,0.1)',  desc:'Weekly service ratings' },
  pastoral:   { label:'Pastoral Care',    color:'#D85A30', bg:'rgba(216,90,48,0.1)',   desc:'Private pastoral concerns' },
  operations: { label:'Operations',       color:'#7F77DD', bg:'rgba(127,119,221,0.1)', desc:'Suggestions & issues' },
}

const STATUS_META = {
  open:        { label:'Open',        color:'#E85D24', bg:'rgba(232,93,36,0.1)'  },
  in_progress: { label:'In progress', color:'#BA7517', bg:'rgba(186,117,23,0.1)' },
  resolved:    { label:'Resolved',    color:'#1D9E75', bg:'rgba(29,158,117,0.1)' },
}

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function Feedback() {
  const [items, setItems] = useState<FeedbackItem[]>(SEED)
  const [activeChannel, setActiveChannel] = useState<Channel | 'all'>('all')
  const [activeStatus, setActiveStatus] = useState<Status | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [formChannel, setFormChannel] = useState<Channel>('pulse')
  const [formBranch, setFormBranch] = useState('Lekki HQ')
  const [formCategory, setFormCategory] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formRating, setFormRating] = useState(5)
  const [formAnon, setFormAnon] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const CATEGORIES: Record<Channel, string[]> = {
    pulse:      ['Sermon','Worship','Facilities','Welcome','General'],
    pastoral:   ['Felt unsupported','Pastoral complaint','Sensitive matter','Counselling request','Other'],
    operations: ['Facilities','Parking','Childcare','Communication','Timing','General suggestion'],
  }

  const filtered = items.filter(i =>
    (activeChannel === 'all' || i.channel === activeChannel) &&
    (activeStatus  === 'all' || i.status  === activeStatus)
  )

  const counts = {
    open:        items.filter(i => i.status === 'open').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    resolved:    items.filter(i => i.status === 'resolved').length,
    pulse:       items.filter(i => i.channel === 'pulse').length,
    pastoral:    items.filter(i => i.channel === 'pastoral').length,
    operations:  items.filter(i => i.channel === 'operations').length,
  }

  const avgRating = (branch?: string) => {
    const rated = items.filter(i => i.channel === 'pulse' && i.rating && (!branch || i.branch === branch))
    if (!rated.length) return 0
    return (rated.reduce((s, i) => s + (i.rating || 0), 0) / rated.length).toFixed(1)
  }

  const handleSubmit = () => {
    if (!formMessage.trim() || !formCategory) return
    const newItem: FeedbackItem = {
      id: 'f' + Date.now(),
      channel: formChannel,
      branch: formBranch,
      category: formCategory,
      message: formMessage,
      rating: formChannel === 'pulse' ? formRating : undefined,
      anonymous: formChannel === 'pastoral' ? true : formAnon,
      status: 'open',
      submittedAt: new Date().toISOString().slice(0, 10),
    }
    setItems(prev => [newItem, ...prev])
    setSubmitted(true)
    setTimeout(() => { setSubmitted(false); setShowForm(false); setFormMessage(''); setFormCategory('') }, 2000)
  }

  const updateStatus = (id: string, status: Status) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const submitResponse = (id: string) => {
    if (!responseText.trim()) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, response: responseText, status: 'resolved' } : i))
    setRespondingId(null)
    setResponseText('')
  }

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="section-title">Feedback</h1>
          <p className="section-sub">Three channels · role-scoped visibility · close the loop</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Submit feedback'}
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10 }}>
        {[
          { label:'Service pulse', val:counts.pulse,       color:'#1D9E75' },
          { label:'Pastoral',      val:counts.pastoral,    color:'#D85A30' },
          { label:'Operations',    val:counts.operations,  color:'#7F77DD' },
          { label:'Open',          val:counts.open,        color:'#E85D24' },
          { label:'In progress',   val:counts.in_progress, color:'#BA7517' },
          { label:'Resolved',      val:counts.resolved,    color:'#1D9E75' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:700, color:k.color }}>{k.val}</div>
            <div style={{ fontSize:11, color:'var(--t-3)', marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Avg rating banner */}
      <div className="card" style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, color:'var(--t-3)', marginBottom:2 }}>Org-wide avg rating</div>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:24, fontWeight:700, color:'#BA7517' }}>{avgRating()} <span style={{ fontSize:14, color:'#BA7517' }}>/ 5.0</span></div>
        </div>
        <div style={{ width:1, height:40, background:'var(--border)' }}/>
        {BRANCHES.slice(0,5).map(b => (
          <div key={b} style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--t-3)' }}>{b.split(' ')[0]}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:600, color:'var(--t-1)' }}>{avgRating(b) || '—'}</div>
          </div>
        ))}
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="card" style={{ border:'1px solid var(--brand)', background:'var(--brand-lt)' }}>
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:14, color:'var(--t-1)', marginBottom:14 }}>New feedback</div>
          {submitted ? (
            <div style={{ color:'#1D9E75', fontWeight:600, fontSize:14, padding:'12px 0' }}>✅ Submitted — thank you!</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Channel */}
              <div style={{ display:'flex', gap:8 }}>
                {(Object.keys(CHANNEL_META) as Channel[]).map(c => (
                  <button key={c} onClick={() => { setFormChannel(c); setFormCategory('') }}
                    style={{ flex:1, padding:'8px 0', borderRadius:'var(--r-sm)', border:`1.5px solid ${formChannel===c ? CHANNEL_META[c].color : 'var(--border)'}`, background: formChannel===c ? CHANNEL_META[c].bg : 'var(--s-3)', color: formChannel===c ? CHANNEL_META[c].color : 'var(--t-2)', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
                    {CHANNEL_META[c].label}
                  </button>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <div style={{ fontSize:11.5, color:'var(--t-3)', marginBottom:4 }}>Branch</div>
                  <select value={formBranch} onChange={e => setFormBranch(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', background:'var(--s-3)', color:'var(--t-1)', fontSize:13 }}>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11.5, color:'var(--t-3)', marginBottom:4 }}>Category</div>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', background:'var(--s-3)', color:'var(--t-1)', fontSize:13 }}>
                    <option value="">Select…</option>
                    {CATEGORIES[formChannel].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {formChannel === 'pulse' && (
                <div>
                  <div style={{ fontSize:11.5, color:'var(--t-3)', marginBottom:6 }}>Rating</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setFormRating(n)}
                        style={{ fontSize:22, background:'none', border:'none', cursor:'pointer', color: n <= formRating ? '#BA7517' : 'var(--border)', transition:'color 0.15s' }}>★</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize:11.5, color:'var(--t-3)', marginBottom:4 }}>Message</div>
                <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={3} placeholder="Share your feedback…"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', background:'var(--s-3)', color:'var(--t-1)', fontSize:13, resize:'vertical', boxSizing:'border-box' }}/>
              </div>
              {formChannel !== 'pastoral' && (
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--t-2)', cursor:'pointer' }}>
                  <input type="checkbox" checked={formAnon} onChange={e => setFormAnon(e.target.checked)} style={{ width:15, height:15 }}/>
                  Submit anonymously
                </label>
              )}
              {formChannel === 'pastoral' && (
                <div style={{ fontSize:12, color:'var(--t-3)', fontStyle:'italic' }}>🔒 Pastoral Care feedback is always anonymous and goes directly to Senior Pastor only.</div>
              )}
              <button className="btn btn-primary btn-sm" onClick={handleSubmit} style={{ alignSelf:'flex-start' }}>Submit feedback</button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {(['all','pulse','pastoral','operations'] as const).map(c => (
          <button key={c} onClick={() => setActiveChannel(c)}
            style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${activeChannel===c ? (c==='all' ? 'var(--brand)' : CHANNEL_META[c]?.color) : 'var(--border)'}`, background: activeChannel===c ? (c==='all' ? 'var(--brand-lt)' : CHANNEL_META[c]?.bg) : 'transparent', color: activeChannel===c ? (c==='all' ? 'var(--brand)' : CHANNEL_META[c]?.color) : 'var(--t-2)', fontSize:12.5, fontWeight:500, cursor:'pointer' }}>
            {c === 'all' ? 'All channels' : CHANNEL_META[c].label}
          </button>
        ))}
        <div style={{ width:1, height:28, background:'var(--border)', alignSelf:'center' }}/>
        {(['all','open','in_progress','resolved'] as const).map(s => (
          <button key={s} onClick={() => setActiveStatus(s)}
            style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${activeStatus===s ? (s==='all'?'var(--border)':STATUS_META[s]?.color) : 'var(--border)'}`, background: activeStatus===s ? (s==='all'?'var(--s-2)':STATUS_META[s]?.bg) : 'transparent', color: activeStatus===s ? (s==='all'?'var(--t-1)':STATUS_META[s]?.color) : 'var(--t-2)', fontSize:12.5, fontWeight:500, cursor:'pointer' }}>
            {s === 'all' ? 'All statuses' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign:'center', color:'var(--t-3)', padding:32 }}>No feedback matches this filter.</div>
        )}
        {filtered.map(item => {
          const ch  = CHANNEL_META[item.channel]
          const st  = STATUS_META[item.status]
          const exp = expandedId === item.id
          return (
            <div key={item.id} className="card" style={{ cursor:'pointer', border: item.channel==='pastoral' ? '1px solid rgba(216,90,48,0.3)' : '1px solid var(--border)' }}
              onClick={() => setExpandedId(exp ? null : item.id)}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:ch.color, marginTop:6, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:ch.color, background:ch.bg, padding:'2px 8px', borderRadius:10 }}>{ch.label}</span>
                    <span style={{ fontSize:12, color:'var(--t-3)' }}>{item.branch}</span>
                    <span style={{ fontSize:12, color:'var(--t-3)' }}>·</span>
                    <span style={{ fontSize:12, color:'var(--t-3)' }}>{item.category}</span>
                    {item.rating && <span style={{ fontSize:12, color:'#BA7517' }}>{stars(item.rating)}</span>}
                    <span style={{ marginLeft:'auto', fontSize:11.5, fontWeight:600, color:st.color, background:st.bg, padding:'2px 8px', borderRadius:10 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize:13.5, color:'var(--t-1)', lineHeight:1.5 }}>
                    {item.anonymous ? '🔒 Anonymous · ' : ''}{item.message}
                  </div>
                  <div style={{ fontSize:11, color:'var(--t-3)', marginTop:4 }}>{item.submittedAt}</div>
                </div>
              </div>

              {exp && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}
                  onClick={e => e.stopPropagation()}>
                  {item.response && (
                    <div style={{ padding:'10px 14px', background:'rgba(29,158,117,0.08)', borderRadius:'var(--r-sm)', marginBottom:12, fontSize:13, color:'var(--t-1)', borderLeft:'3px solid #1D9E75' }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#1D9E75', marginBottom:4 }}>PASTORAL RESPONSE</div>
                      {item.response}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {(['open','in_progress','resolved'] as Status[]).map(s => (
                      <button key={s} onClick={() => updateStatus(item.id, s)}
                        style={{ padding:'5px 12px', borderRadius:'var(--r-sm)', border:`1px solid ${STATUS_META[s].color}`, background: item.status===s ? STATUS_META[s].bg : 'transparent', color:STATUS_META[s].color, fontSize:12, fontWeight:500, cursor:'pointer' }}>
                        {STATUS_META[s].label}
                      </button>
                    ))}
                    {item.channel !== 'pastoral' && (
                      <button onClick={() => setRespondingId(respondingId===item.id ? null : item.id)}
                        style={{ padding:'5px 12px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', background:'var(--s-3)', color:'var(--t-2)', fontSize:12, cursor:'pointer', marginLeft:'auto' }}>
                        {respondingId===item.id ? 'Cancel' : '↩ Respond'}
                      </button>
                    )}
                  </div>
                  {respondingId === item.id && (
                    <div style={{ marginTop:10 }}>
                      <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={2} placeholder="Write a response…"
                        style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', background:'var(--s-3)', color:'var(--t-1)', fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:8 }}/>
                      <button className="btn btn-primary btn-sm" onClick={() => submitResponse(item.id)}>Send response</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
