'use client'
import { useState } from 'react'

const SAMPLE_MEETINGS = [
  { id:'mt1', title:'Senior pastors council', type:'Leadership', date:'Jun 1 2026', time:'9:00 AM', duration:60, platform:'Google Meet', attendees:9, attended:9, summary:'Communion logistics confirmed for all campuses. Ikeja pastor appointment target date set. London branch Q2 report reviewed.', link:'https://meet.google.com/abc-defg-hij', status:'completed' },
  { id:'mt2', title:'KidsHouse leaders (all campuses)', type:'Peer', date:'Jun 3 2026', time:'10:00 AM', duration:45, platform:'Google Meet', attendees:9, attended:7, summary:'New curriculum from Open Doors adopted. Summer camp dates confirmed for Gbagada (Jul 5–7).', link:'https://meet.google.com/klm-nopq-rst', status:'completed' },
  { id:'mt3', title:'Worship leads sync', type:'Peer', date:'Jun 8 2026', time:'4:00 PM', duration:30, platform:'Google Meet', attendees:9, attended:0, summary:'', link:'https://meet.google.com/uvw-xyza-bcd', status:'upcoming' },
  { id:'mt4', title:'Branch pastors forum', type:'Leadership', date:'Jun 10 2026', time:'11:00 AM', duration:60, platform:'Google Meet', attendees:9, attended:0, summary:'', link:'https://meet.google.com/efg-hijk-lmn', status:'upcoming' },
  { id:'mt5', title:'Growth track coordinators', type:'Discipleship', date:'Jun 12 2026', time:'2:00 PM', duration:45, platform:'Google Meet', attendees:9, attended:0, summary:'', link:'https://meet.google.com/opq-rstu-vwx', status:'scheduled' },
]

const TYPE_COLORS: Record<string,string> = {
  Leadership:   'var(--brand)',
  Peer:         'var(--teal)',
  Discipleship: 'var(--purple)',
  Pastoral:     'var(--red)',
}

export default function Meetings({ onNavigate }: { onNavigate: (p:string)=>void }) {
  const [tab, setTab] = useState<'meetings'|'schedule'|'summaries'>('meetings')
  const [form, setForm] = useState({ title:'', type:'Leadership', date:'', time:'10:00', duration:'60', agenda:'' })
  const [scheduled, setScheduled] = useState(false)

  const upcoming = SAMPLE_MEETINGS.filter(m => m.status === 'upcoming' || m.status === 'scheduled')
  const completed = SAMPLE_MEETINGS.filter(m => m.status === 'completed')

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    setScheduled(true)
    setTimeout(() => { setScheduled(false); setTab('meetings') }, 2000)
  }

  return (
    <div>
      {/* Info banner */}
      <div style={{ background:'var(--s-2)', border:'0.5px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:16, borderLeft:'3px solid var(--teal)' }}>
        <div style={{ fontSize:10.5, fontWeight:600, color:'var(--teal)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>Google Meet integration</div>
        <div style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.65 }}>
          Schedule meetings directly from the platform. Google Meet links are auto-generated. After each meeting, summaries with date, duration, and attendance are stored here for all participants and leadership to review.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { l:'Meetings this month', v:SAMPLE_MEETINGS.length },
          { l:'Avg attendance rate', v:'88%' },
          { l:'Summaries recorded', v:completed.length },
          { l:'Upcoming scheduled', v:upcoming.length },
        ].map(m => (
          <div key={m.l} className="metric-tile">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.5rem' }}>{m.v}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom:16 }}>
        {([['meetings','All meetings'],['schedule','Schedule new'],['summaries','Summaries']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── ALL MEETINGS ── */}
      {tab === 'meetings' && (
        <>
          {upcoming.length > 0 && (
            <>
              <div style={{ fontSize:10.5, fontWeight:600, color:'var(--t-2)', marginBottom:10, letterSpacing:'0.04em', textTransform:'uppercase' }}>Upcoming</div>
              {upcoming.map(m => (
                <div key={m.id} className="card card-p" style={{ marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:42, height:42, borderRadius:10, background:`${TYPE_COLORS[m.type]}18`, border:`1px solid ${TYPE_COLORS[m.type]}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={TYPE_COLORS[m.type]} strokeWidth="2" width="20" height="20"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:600 }}>{m.title}</div>
                      <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>{m.date} at {m.time} · {m.duration} min · {m.platform}</div>
                      <div style={{ display:'flex', gap:6, marginTop:6, alignItems:'center' }}>
                        <span style={{ background:`${TYPE_COLORS[m.type]}18`, color:TYPE_COLORS[m.type], padding:'1px 8px', borderRadius:100, fontSize:11, fontWeight:500 }}>{m.type}</span>
                        <span style={{ fontSize:11, color:'var(--t-3)' }}>{m.attendees} invited</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <a href={m.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
                      Join Meet
                    </a>
                    <button className="btn btn-sm">Copy link</button>
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ fontSize:10.5, fontWeight:600, color:'var(--t-2)', marginBottom:10, letterSpacing:'0.04em', textTransform:'uppercase', marginTop:8 }}>Past meetings</div>
          {completed.map(m => (
            <div key={m.id} className="card card-p" style={{ marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:600 }}>{m.title}</div>
                  <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>{m.date} · {m.duration} min · {m.platform}</div>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color: m.attended===m.attendees?'var(--green)':'var(--brand)', fontWeight:600 }}>{m.attended}/{m.attendees} attended</span>
                  <div style={{ width:48, height:4, background:'var(--s-4)', borderRadius:100, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:100, background:'var(--green)', width:`${(m.attended/m.attendees)*100}%` }}/>
                  </div>
                </div>
              </div>
              {m.summary && (
                <div style={{ padding:'10px 12px', background:'var(--s-3)', borderRadius:8, fontSize:12.5, color:'var(--t-2)', lineHeight:1.65, borderLeft:'2px solid var(--teal)' }}>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--teal)', marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>Meeting summary</div>
                  {m.summary}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── SCHEDULE NEW ── */}
      {tab === 'schedule' && (
        <div className="card card-p" style={{ maxWidth:520 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Schedule a meeting</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:18 }}>A Google Meet link will be auto-generated and shared with all invited participants.</div>
          {scheduled && (
            <div style={{ padding:'10px 14px', background:'rgba(20,184,166,0.12)', border:'0.5px solid rgba(20,184,166,0.3)', borderRadius:8, fontSize:13, color:'var(--teal)', marginBottom:16, fontWeight:500 }}>
              ✓ Meeting scheduled. Google Meet link generated and notifications sent.
            </div>
          )}
          <form onSubmit={handleSchedule}>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Meeting title *</label>
              <input className="input" placeholder="e.g. Branch pastors forum" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Meeting type *</label>
                <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {['Leadership','Peer','Discipleship','Pastoral'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Duration (minutes)</label>
                <select className="input" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))}>
                  {['30','45','60','90','120'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Date *</label>
                <input className="input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Time *</label>
                <input className="input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} required/>
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11.5, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:5 }}>Agenda / notes</label>
              <textarea className="input" rows={3} placeholder="Key topics to cover…" value={form.agenda} onChange={e=>setForm(f=>({...f,agenda:e.target.value}))} style={{ resize:'vertical' }}/>
            </div>
            <button type="submit" className="btn btn-sm" style={{ background:'var(--teal)', color:'var(--s-1)', border:'none', width:'100%', justifyContent:'center', padding:'10px', fontWeight:500 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
              Generate Google Meet + notify participants
            </button>
          </form>
        </div>
      )}

      {/* ── SUMMARIES ── */}
      {tab === 'summaries' && (
        <div className="card card-p">
          <div style={{ fontSize:13.5, fontWeight:600, marginBottom:14 }}>Meeting summaries</div>
          {completed.filter(m => m.summary).map(m => (
            <div key={m.id} style={{ padding:'14px 0', borderBottom:'0.5px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{m.title}</div>
                  <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:2 }}>{m.date} · {m.duration} min · {m.attended}/{m.attendees} attendees</div>
                </div>
                <span style={{ background:`${TYPE_COLORS[m.type]}18`, color:TYPE_COLORS[m.type], padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:500 }}>{m.type}</span>
              </div>
              <div style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.7 }}>{m.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
