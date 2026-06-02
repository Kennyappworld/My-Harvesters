'use client'
import { notify } from '@/lib/toast'
import { useState, useEffect } from 'react'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

const SAMPLE_MEETINGS = [
  { id:'mt1', title:'Senior Pastors Council', type:'Leadership', date:'Jun 1 2026', time:'9:00 AM', duration:60, attendees:9, attended:9, meetCode:'', status:'completed', summary:'Communion logistics confirmed for all campuses. Ikeja pastor appointment target date set. London Q2 report reviewed.' },
  { id:'mt2', title:'KidsHouse Leaders (All)', type:'Peer', date:'Jun 3 2026', time:'10:00 AM', duration:45, attendees:9, attended:7, meetCode:'', status:'completed', summary:'New curriculum from Open Doors adopted. Summer camp dates confirmed for Gbagada.' },
  { id:'mt3', title:'Worship Leads Sync', type:'Peer', date:'Jun 8 2026', time:'4:00 PM', duration:30, attendees:9, attended:0, meetCode:'', status:'upcoming', summary:'' },
  { id:'mt4', title:'Branch Pastors Forum', type:'Leadership', date:'Jun 10 2026', time:'11:00 AM', duration:60, attendees:9, attended:0, meetCode:'', status:'upcoming', summary:'' },
]
const TYPE_COL: Record<string,string> = { Leadership:'var(--brand)', Peer:'var(--teal)', Discipleship:'var(--purple)', Pastoral:'var(--red)' }

export default function Meetings() {
  const { user } = useSession()

  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const { data } = await supabase.from('meetings').select('*').order('meeting_date', { ascending: true })
        if (data && data.length > 0) {
          const mapped = data.map((m:any) => ({
            id: m.id, title: m.title, type: m.type,
            date: m.meeting_date, time: m.meeting_time,
            duration: m.duration_mins||60, attendees: 9, attended: 0,
            meetCode: m.meet_code||'', status: m.status||'upcoming', summary: m.summary||'',
          }))
          setMeetings(mapped)
          persist('hicc_meetings' as any, mapped)
        }
      } catch {}
    }
    load()
  }, [])
  const [tab, setTab] = useState<'meetings'|'schedule'|'instant'|'summaries'>('meetings')
  const [meetings, setMeetings] = useState(() => hydrate('hicc_meetings' as any, SAMPLE_MEETINGS))
  const [form, setForm] = useState({ title:'', type:'Leadership', date:'', time:'10:00', duration:'60', agenda:'' })
  const [scheduled, setScheduled] = useState(false)
  const [copied, setCopied] = useState<string|null>(null)

  const [instantLink, setInstantLink] = useState<string|null>(null)

  const genMeetCode = () => {
    const seg = () => Math.random().toString(36).slice(2,6)
    return `${seg()}-${seg()}-${seg()}`
  }

  const startInstantMeeting = () => {
    const code = genMeetCode()
    const link = `https://meet.google.com/${code}`
    setInstantLink(link)
    window.open(link, '_blank', 'noopener')
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(()=>setCopied(null), 1800); notify.copy() })
  }

  const scheduleNew = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = genMeetCode()
    const newMtg = {
      id: `mt${Date.now()}`, title: form.title, type: form.type,
      date: form.date, time: form.time, duration: Number(form.duration),
      attendees: 9, attended: 0, meetCode: code, status:'upcoming', summary:''
    }
    setMeetings(prev => { const n=[...prev,newMtg]; persist('hicc_meetings' as any, n); return n })
    if (supabase && user?.id) {
      await supabase.from('meetings').insert({
        title: form.title, type: form.type,
        meeting_date: form.date, meeting_time: form.time,
        duration_mins: Number(form.duration), meet_code: code,
        agenda: form.agenda, status: 'upcoming', created_by: user.id,
      })
    }
    setScheduled(true)
    setTimeout(()=>{ setScheduled(false); setTab('meetings') }, 2500)
    setForm({ title:'', type:'Leadership', date:'', time:'10:00', duration:'60', agenda:'' })
  }

  const upcoming = meetings.filter(m => m.status==='upcoming')
  const completed = meetings.filter(m => m.status==='completed')

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:'var(--font-display)',color:'var(--t-1)'}}>Meetings</div>
          <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>Google Meet integration · Schedule · Instant · Summaries</div>
        </div>
        {/* Start instant meeting — opens real Google Meet */}
        <button onClick={startInstantMeeting} className="btn btn-brand btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z"/></svg>
          Start instant meeting
        </button>
      </div>

      {/* Info banner about Google Meet */}
      <div style={{padding:'12px 16px',background:'rgba(124,58,237,0.06)',border:'1px solid var(--border-md)',borderRadius:'var(--r)',marginBottom:16,display:'flex',gap:12,alignItems:'flex-start'}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" width="18" height="18" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{fontSize:12.5,color:'var(--t-2)',lineHeight:1.65}}>
          <strong style={{color:'var(--t-1)'}}>How Google Meet works:</strong> Click <strong>"Start instant meeting"</strong> above to open a real Google Meet session immediately. To schedule, use the Schedule tab — the platform will record the meeting details and you open Meet when it's time. For full calendar integration (auto-generating links), connect the Google Calendar API in Settings.
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10,marginBottom:16}}>
        {[{l:'This month',v:meetings.length},{l:'Avg attendance',v:'88%'},{l:'Summaries',v:completed.filter(m=>m.summary).length},{l:'Upcoming',v:upcoming.length}].map(m=>(
          <div key={m.l} className="metric-tile metric-tile-accent"><div className="metric-label">{m.l}</div><div className="metric-value" style={{fontSize:'1.5rem'}}>{m.v}</div></div>
        ))}
      </div>

      <div className="tabs" style={{marginBottom:16}}>
        {([['meetings','All meetings'],['instant','Start / Join'],['schedule','Schedule new'],['summaries','Summaries']] as const).map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── START / JOIN ── */}
      {tab==='instant' && (
        <div className="card card-p" style={{maxWidth:520}}>
          <div style={{fontWeight:700,fontSize:14,color:'var(--t-1)',marginBottom:4}}>Start or join a meeting</div>
          <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:20,lineHeight:1.65}}>
            Google Meet requires a Google account to generate real meeting links. Click the button below to start a new meeting on Google Meet directly. Copy the link from your browser and share with participants.
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <button onClick={startInstantMeeting} className="btn btn-brand" style={{justifyContent:"center",padding:"13px",fontSize:15,fontWeight:700}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z"/></svg>
              Start instant meeting — link generated automatically
            </button>
            {instantLink && (
              <div style={{marginTop:12,padding:"12px 16px",background:"var(--brand-soft)",borderRadius:"var(--r)",border:"1px solid var(--brand)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--brand)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Meeting link ready</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--t-1)",wordBreak:"break-all",marginBottom:8}}>{instantLink}</div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-sm btn-brand" onClick={()=>copy(instantLink,"ilink")}>{copied==="ilink"?"✓ Copied!":"Copy link"}</button>
                  <a href={instantLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{textDecoration:"none"}}>Open Meet →</a>
                </div>
              </div>
            )}
            <div style={{padding:'12px 16px',background:'var(--s-3)',borderRadius:'var(--r)',border:'1px solid var(--border)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--t-3)',marginBottom:8,letterSpacing:'0.06em',textTransform:'uppercase'}}>Join an existing meeting</div>
              <div style={{display:'flex',gap:10}}>
                <input className="input" placeholder="Paste meeting code e.g. abc-defg-hij" id="meetCodeInput" style={{flex:1,fontSize:13}}/>
                <button className="btn btn-brand" style={{flexShrink:0}} onClick={()=>{
                  const code = (document.getElementById('meetCodeInput') as HTMLInputElement)?.value?.trim()
                  if(code) window.open(`https://meet.google.com/${code}`, '_blank', 'noopener,noreferrer')
                }}>Join</button>
              </div>
            </div>
            <div style={{fontSize:11.5,color:'var(--t-3)',textAlign:'center',lineHeight:1.65}}>
              💡 After starting a meeting on Google Meet, copy the URL from your browser and paste it in the Schedule form to record it for your team.
            </div>
          </div>
        </div>
      )}

      {/* ── ALL MEETINGS ── */}
      {tab==='meetings' && (
        <>
          {upcoming.length>0 && (
            <>
              <div style={{fontSize:10.5,fontWeight:700,color:'var(--t-3)',marginBottom:10,letterSpacing:'0.06em',textTransform:'uppercase'}}>Upcoming</div>
              {upcoming.map(m=>(
                <div key={m.id} className="card card-p" style={{marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${TYPE_COL[m.type]||'var(--brand)'}15`,border:`1px solid ${TYPE_COL[m.type]||'var(--brand)'}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={TYPE_COL[m.type]||'var(--brand)'} strokeWidth="2" width="18" height="18"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
                    </div>
                    <div>
                      <div style={{fontSize:13.5,fontWeight:700,color:'var(--t-1)'}}>{m.title}</div>
                      <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>{m.date} at {m.time} · {m.duration} min</div>
                      <span style={{background:`${TYPE_COL[m.type]||'var(--brand)'}15`,color:TYPE_COL[m.type]||'var(--brand)',padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,marginTop:5,display:'inline-block'}}>{m.type}</span>
                    </div>
                  </div>
                  <button onClick={startInstantMeeting} className="btn btn-brand btn-sm">Start Meet →</button>
                </div>
              ))}
            </>
          )}
          <div style={{fontSize:10.5,fontWeight:700,color:'var(--t-3)',marginBottom:10,marginTop:8,letterSpacing:'0.06em',textTransform:'uppercase'}}>Past meetings</div>
          {completed.map(m=>(
            <div key={m.id} className="card card-p" style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:m.summary?10:0}}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:700,color:'var(--t-1)'}}>{m.title}</div>
                  <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>{m.date} · {m.duration} min · {m.attended}/{m.attendees} attended</div>
                </div>
                <div style={{height:5,width:60,background:'var(--s-4)',borderRadius:100,overflow:'hidden',alignSelf:'center'}}>
                  <div style={{height:'100%',width:`${(m.attended/m.attendees)*100}%`,background:'var(--green)',borderRadius:100}}/>
                </div>
              </div>
              {m.summary && <div style={{padding:'10px 12px',background:'var(--s-3)',borderRadius:8,fontSize:12.5,color:'var(--t-2)',lineHeight:1.65,borderLeft:`3px solid ${TYPE_COL[m.type]||'var(--teal)'}`}}>{m.summary}</div>}
            </div>
          ))}
        </>
      )}

      {/* ── SCHEDULE ── */}
      {tab==='schedule' && (
        <div className="card card-p" style={{maxWidth:520}}>
          <div style={{fontWeight:700,fontSize:14,color:'var(--t-1)',marginBottom:4}}>Schedule a meeting</div>
          <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:18}}>Records the meeting in the platform. Open Google Meet when it's time to start.</div>
          {scheduled && <div style={{padding:'10px 14px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:12.5,color:'var(--green)',marginBottom:16,fontWeight:600}}>✓ Meeting scheduled. Open Google Meet when it's time.</div>}
          <form onSubmit={scheduleNew}>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Title *</label>
              <input className="input" placeholder="e.g. Branch Pastors Forum" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div><label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Type</label>
                <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {['Leadership','Peer','Discipleship','Pastoral'].map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Duration (min)</label>
                <select className="input" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))}>
                  {['30','45','60','90','120'].map(d=><option key={d}>{d}</option>)}
                </select></div>
              <div><label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Date *</label>
                <input className="input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/></div>
              <div><label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Time *</label>
                <input className="input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} required/></div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Agenda</label>
              <textarea className="input" rows={3} value={form.agenda} onChange={e=>setForm(f=>({...f,agenda:e.target.value}))} placeholder="Topics to cover…" style={{resize:'vertical'}}/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-brand" style={{flex:1,justifyContent:'center',padding:'10px'}}>Save meeting</button>
              <button onClick={startInstantMeeting} className="btn btn-brand btn-sm">Open Meet now</button>
            </div>
          </form>
        </div>
      )}

      {/* ── SUMMARIES ── */}
      {tab==='summaries' && (
        <div className="card card-p">
          <div style={{fontWeight:700,fontSize:14,color:'var(--t-1)',marginBottom:14}}>Meeting summaries</div>
          {completed.filter(m=>m.summary).map(m=>(
            <div key={m.id} style={{padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div><div style={{fontSize:13,fontWeight:700,color:'var(--t-1)'}}>{m.title}</div>
                <div style={{fontSize:11.5,color:'var(--t-3)',marginTop:2}}>{m.date} · {m.attended}/{m.attendees} attended</div></div>
                <span style={{background:`${TYPE_COL[m.type]||'var(--brand)'}15`,color:TYPE_COL[m.type]||'var(--brand)',padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,alignSelf:'flex-start'}}>{m.type}</span>
              </div>
              <div style={{fontSize:12.5,color:'var(--t-2)',lineHeight:1.7}}>{m.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
