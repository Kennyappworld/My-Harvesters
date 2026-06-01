'use client'
import { useState, useEffect } from 'react'
import { persist, hydrate } from '@/lib/store'

type DevotionalEntry = {
  id: string
  date: string          // YYYY-MM-DD
  title: string
  scripture: string
  scriptureRef: string
  teaching: string
  prayer: string
  declaration: string
  author: string
  createdAt: string
}

type DevotionalPlan = {
  id: string
  title: string
  month: string         // e.g. "June 2026"
  entries: DevotionalEntry[]
  publishedBy: string
  publishedAt: string
}

// Sample plan so the section is never empty
const SAMPLE_PLAN: DevotionalPlan = {
  id: 'plan_jun2026',
  title: 'Walking in Dominion',
  month: 'June 2026',
  publishedBy: 'Pastor Bolaji Idowu',
  publishedAt: new Date().toISOString(),
  entries: [
    {
      id: 'd1', date: '2026-06-01',
      title: 'The God of New Beginnings',
      scripture: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
      scriptureRef: '2 Corinthians 5:17',
      teaching: 'Every day you step into is an invitation to become more of who God created you to be. The God who spoke light into darkness speaks life into every situation you face today. You are not defined by your past — you are shaped by His promises.',
      prayer: 'Lord, thank You for the gift of this new day. Help me to walk in the fullness of who You have called me to be. Let every step I take today glorify Your name. Amen.',
      declaration: 'I am a new creation. Old things have passed away. I walk in fresh grace today.',
      author: 'Pastor Bolaji Idowu',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'd2', date: '2026-06-02',
      title: 'Rooted and Built Up',
      scripture: 'So then, just as you received Christ Jesus as Lord, continue to live your lives in him, rooted and built up in him.',
      scriptureRef: 'Colossians 2:6–7',
      teaching: 'A tree with deep roots cannot be uprooted by any storm. God is calling you to go deeper — in prayer, in the Word, in community. The depth of your roots determines the height of your fruit. Today, invest in your spiritual foundation.',
      prayer: 'Father, let my roots go deep into Your Word. Build me up in faith. Let my life bear lasting fruit for Your Kingdom. Amen.',
      declaration: 'I am rooted in Christ. I am built up in faith. I overflow with thankfulness.',
      author: 'Pastor Bolaji Idowu',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'd3', date: '2026-06-03',
      title: 'Strength for the Journey',
      scripture: 'I can do all this through him who gives me strength.',
      scriptureRef: 'Philippians 4:13',
      teaching: 'The promise is not that the road will be easy — it is that you will not walk it alone. Christ who lives in you is stronger than every challenge before you. Lean not on your own understanding today but trust the One who holds all things together.',
      prayer: 'Lord Jesus, be my strength today. Where I am weak, be my power. Where I am uncertain, be my guide. I lean on You completely. Amen.',
      declaration: 'Christ is my strength. I can do all things through Him. I will not be moved.',
      author: 'Pastor Bolaji Idowu',
      createdAt: new Date().toISOString(),
    },
  ]
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

// Upload / edit modal for admins
function UploadModal({ plan, onSave, onClose }: { plan: DevotionalPlan | null; onSave: (p: DevotionalPlan) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'plan'|'entry'|'list'>('plan')
  const [title, setTitle] = useState(plan?.title || '')
  const [month, setMonth] = useState(plan?.month || 'June 2026')
  const [entries, setEntries] = useState<DevotionalEntry[]>(plan?.entries || [])
  const [editing, setEditing] = useState<DevotionalEntry | null>(null)
  const [form, setForm] = useState({ date:'', title:'', scripture:'', scriptureRef:'', teaching:'', prayer:'', declaration:'' })

  const saveEntry = () => {
    if (!form.date || !form.title || !form.scripture) return
    const entry: DevotionalEntry = {
      id: editing?.id || `d${Date.now()}`,
      ...form,
      author: 'Admin',
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => editing ? prev.map(e => e.id === editing.id ? entry : e) : [...prev, entry].sort((a,b)=>a.date.localeCompare(b.date)))
    setEditing(null)
    setForm({ date:'', title:'', scripture:'', scriptureRef:'', teaching:'', prayer:'', declaration:'' })
  }

  const editEntry = (e: DevotionalEntry) => {
    setEditing(e)
    setForm({ date:e.date, title:e.title, scripture:e.scripture, scriptureRef:e.scriptureRef, teaching:e.teaching, prayer:e.prayer, declaration:e.declaration })
    setTab('entry')
  }

  const savePlan = () => {
    if (!title || entries.length === 0) return
    onSave({
      id: plan?.id || `plan_${Date.now()}`,
      title, month, entries,
      publishedBy: 'Admin',
      publishedAt: new Date().toISOString(),
    })
  }

  const inputStyle = { width:'100%', padding:'9px 12px', border:'1.5px solid var(--border-md)', borderRadius:10, fontSize:13, background:'var(--s-1)', color:'var(--t-1)', fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box' as const, marginBottom:10 }
  const taStyle = { ...inputStyle, resize:'vertical' as const, minHeight:72 }
  const labelStyle = { fontSize:11, fontWeight:700, color:'var(--t-2)', display:'block', marginBottom:4, textTransform:'uppercase' as const, letterSpacing:'.05em' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', padding:16 }} onClick={onClose}>
      <div style={{ background:'var(--s-2)', borderRadius:20, width:'100%', maxWidth:580, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 64px rgba(13,31,22,0.3)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'var(--grad-brand)', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800, fontSize:15, color:'white', fontFamily:'var(--font-display)' }}>Devotional Plan Manager</div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding:20 }}>
          <div className="tabs" style={{ marginBottom:18 }}>
            <button className={`tab ${tab==='plan'?'active':''}`} onClick={() => setTab('plan')}>Plan details</button>
            <button className={`tab ${tab==='entry'?'active':''}`} onClick={() => setTab('entry')}>{editing ? 'Edit entry' : 'Add entry'}</button>
            <button className={`tab ${tab==='list'?'active':''}`} onClick={() => setTab('list' as any)}>All entries ({entries.length})</button>
          </div>

          {tab === 'plan' && (
            <div>
              <label style={labelStyle}>Plan title</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Walking in Dominion"/>
              <label style={labelStyle}>Month</label>
              <input style={inputStyle} value={month} onChange={e => setMonth(e.target.value)} placeholder="e.g. July 2026"/>
              <div style={{ background:'var(--s-3)', borderRadius:10, padding:'12px 14px', fontSize:12.5, color:'var(--t-2)', marginBottom:16, lineHeight:1.6 }}>
                <strong style={{ color:'var(--brand)' }}>How it works:</strong> Add daily entries with a date, scripture, teaching, prayer and declaration. Workers see today's entry automatically when they open the Devotional section. Entries for future dates are locked until that day arrives.
              </div>
              <button className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'11px' }} onClick={savePlan} disabled={!title || entries.length === 0}>
                Publish plan ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
              </button>
            </div>
          )}

          {tab === 'entry' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:0 }}>
                <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></div>
                <div><label style={labelStyle}>Title</label><input style={inputStyle} value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Today's topic"/></div>
              </div>
              <label style={labelStyle}>Scripture text</label>
              <textarea style={taStyle} value={form.scripture} onChange={e => setForm(f=>({...f,scripture:e.target.value}))} placeholder="The verse text..."/>
              <label style={labelStyle}>Scripture reference</label>
              <input style={inputStyle} value={form.scriptureRef} onChange={e => setForm(f=>({...f,scriptureRef:e.target.value}))} placeholder="e.g. John 3:16"/>
              <label style={labelStyle}>Teaching / reflection</label>
              <textarea style={{ ...taStyle, minHeight:100 }} value={form.teaching} onChange={e => setForm(f=>({...f,teaching:e.target.value}))} placeholder="The day's teaching..."/>
              <label style={labelStyle}>Prayer</label>
              <textarea style={taStyle} value={form.prayer} onChange={e => setForm(f=>({...f,prayer:e.target.value}))} placeholder="Prayer for the day..."/>
              <label style={labelStyle}>Daily declaration</label>
              <input style={inputStyle} value={form.declaration} onChange={e => setForm(f=>({...f,declaration:e.target.value}))} placeholder="I am... I have... I will..."/>
              <button className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'11px' }} onClick={saveEntry} disabled={!form.date || !form.title || !form.scripture}>
                {editing ? 'Update entry' : 'Add entry'}
              </button>
              {editing && <button className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent:'center', marginTop:8 }} onClick={() => { setEditing(null); setForm({ date:'', title:'', scripture:'', scriptureRef:'', teaching:'', prayer:'', declaration:'' }) }}>Cancel edit</button>}
            </div>
          )}

          {(tab as any) === 'list' && (
            <div>
              {entries.length === 0 && <div style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)', fontSize:13 }}>No entries yet — go to "Add entry" to start.</div>}
              {entries.map(e => (
                <div key={e.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', border:'1px solid var(--border)', borderRadius:10, marginBottom:8, background:'var(--s-1)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--t-1)' }}>{e.title}</div>
                    <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:2 }}>{formatDate(e.date)} · {e.scriptureRef}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => editEntry(e)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))} style={{ color:'var(--red)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Devotional() {
  const [plans, setPlans] = useState<DevotionalPlan[]>(() => hydrate('hicc_devotional_plans', [SAMPLE_PLAN]))
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isAdmin] = useState(true) // In production: derive from session role

  const activePlan = plans[0] || null
  const today = getTodayStr()

  const allEntries = activePlan?.entries
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date)) || []

  const todayEntry = allEntries.find(e => e.date === today)
  const selectedEntry = allEntries.find(e => e.date === selectedDate)

  const savePlan = (plan: DevotionalPlan) => {
    const next = [plan, ...plans.filter(p => p.id !== plan.id)]
    setPlans(next)
    persist('hicc_devotional_plans', next)
    setShowUpload(false)
  }

  const toggleExpanded = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div>
      {showUpload && <UploadModal plan={activePlan} onSave={savePlan} onClose={() => setShowUpload(false)}/>}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>
            {activePlan ? activePlan.month : 'No plan published'}
          </div>
          <div style={{ fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--t-1)' }}>
            {activePlan?.title || 'Daily Devotional'}
          </div>
          {activePlan && <div style={{ fontSize:12, color:'var(--t-3)', marginTop:3 }}>Published by {activePlan.publishedBy}</div>}
        </div>
        {isAdmin && (
          <button className="btn btn-brand btn-sm" onClick={() => setShowUpload(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {activePlan ? 'Manage plan' : 'Upload plan'}
          </button>
        )}
      </div>

      {/* Today's entry — hero card */}
      {todayEntry ? (
        <div style={{ background:'linear-gradient(135deg, var(--brand) 0%, var(--brand-md) 100%)', borderRadius:20, padding:'22px 24px', marginBottom:20, position:'relative', overflow:'hidden', boxShadow:'var(--sh-brand)' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'3px 10px', fontSize:10, fontWeight:700, color:'white', letterSpacing:'.06em', textTransform:'uppercase' }}>Today</span>
              <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)' }}>{formatDate(today)}</span>
            </div>
            <div style={{ fontSize:19, fontWeight:800, color:'white', fontFamily:'var(--font-display)', marginBottom:14, lineHeight:1.3 }}>{todayEntry.title}</div>
            <div style={{ background:'rgba(255,255,255,0.1)', borderLeft:'3px solid rgba(255,255,255,0.5)', borderRadius:'0 10px 10px 0', padding:'12px 16px', marginBottom:16 }}>
              <p style={{ fontSize:13.5, fontStyle:'italic', color:'rgba(255,255,255,0.9)', lineHeight:1.75, marginBottom:6 }}>"{todayEntry.scripture}"</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:700, letterSpacing:'.06em' }}>{todayEntry.scriptureRef}</p>
            </div>
            <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.85)', lineHeight:1.75, marginBottom:16 }}>{todayEntry.teaching}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>🙏 Prayer</div>
                <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.8)', lineHeight:1.65 }}>{todayEntry.prayer}</p>
              </div>
              <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>✊ Declaration</div>
                <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.9)', lineHeight:1.65, fontWeight:600 }}>{todayEntry.declaration}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card card-p" style={{ marginBottom:20, textAlign:'center', padding:'2.5rem' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📖</div>
          <div style={{ fontWeight:700, fontSize:15, color:'var(--t-1)', marginBottom:6 }}>No devotional for today</div>
          <div style={{ fontSize:13, color:'var(--t-3)', marginBottom:16 }}>
            {activePlan ? "Today's entry hasn't been added to the current plan yet." : "No devotional plan has been published yet."}
          </div>
          {isAdmin && <button className="btn btn-brand btn-sm" onClick={() => setShowUpload(true)}>Upload a plan</button>}
        </div>
      )}

      {/* Monthly calendar strip */}
      {allEntries.length > 0 && (
        <div className="card" style={{ marginBottom:20, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:13, color:'var(--t-1)' }}>{activePlan?.month} — Full plan</div>
            <div style={{ fontSize:11.5, color:'var(--t-3)' }}>{allEntries.length} entries</div>
          </div>
          <div style={{ padding:'12px 16px', display:'flex', gap:6, flexWrap:'wrap' }}>
            {allEntries.map(e => {
              const isPast = e.date < today
              const isToday = e.date === today
              const isFuture = e.date > today
              const isSelected = e.date === selectedDate
              return (
                <button key={e.id} onClick={() => setSelectedDate(e.date)}
                  style={{ width:38, height:38, borderRadius:10, border:`1.5px solid ${isSelected?'var(--brand)':isToday?'var(--gold)':'var(--border)'}`, background:isSelected?'var(--brand)':isToday?'rgba(201,168,76,0.12)':'transparent', color:isSelected?'white':isToday?'var(--gold)':isFuture?'var(--t-3)':'var(--t-1)', fontSize:12, fontWeight:isToday||isSelected?700:400, cursor:'pointer', opacity:isFuture?0.5:1, transition:'all .12s', fontFamily:'var(--font-body)' }}>
                  {new Date(e.date + 'T12:00:00').getDate()}
                </button>
              )
            })}
          </div>
          {/* Selected entry preview */}
          {selectedEntry && selectedEntry.date !== today && (
            <div style={{ borderTop:'1px solid var(--border)', padding:'14px 16px', background:selectedEntry.date > today ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
              {selectedEntry.date > today ? (
                <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--t-3)', fontSize:13 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span><strong style={{ color:'var(--t-2)' }}>{selectedEntry.title}</strong> — unlocks on {formatDate(selectedEntry.date)}</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--t-1)', marginBottom:4 }}>{selectedEntry.title}</div>
                  <div style={{ fontSize:12, color:'var(--t-3)', marginBottom:10 }}>{formatDate(selectedEntry.date)} · {selectedEntry.scriptureRef}</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleExpanded(selectedEntry.id)}>
                    {expanded === selectedEntry.id ? 'Collapse' : 'Read full entry'}
                  </button>
                  {expanded === selectedEntry.id && (
                    <div style={{ marginTop:12 }}>
                      <p style={{ fontSize:13, fontStyle:'italic', color:'var(--t-2)', lineHeight:1.7, marginBottom:10, borderLeft:'3px solid var(--gold)', paddingLeft:12 }}>"{selectedEntry.scripture}"<br/><span style={{ fontSize:11, fontWeight:700, color:'var(--gold)' }}>{selectedEntry.scriptureRef}</span></p>
                      <p style={{ fontSize:13, color:'var(--t-1)', lineHeight:1.75, marginBottom:10 }}>{selectedEntry.teaching}</p>
                      <p style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.65 }}><strong>Prayer:</strong> {selectedEntry.prayer}</p>
                      <p style={{ fontSize:12.5, color:'var(--brand)', fontWeight:700, marginTop:8 }}>✊ {selectedEntry.declaration}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
