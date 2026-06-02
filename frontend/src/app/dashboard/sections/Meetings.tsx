'use client'
import { notify } from '@/lib/toast'
import { useState, useEffect, useRef } from 'react'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

type Attendant = { name: string; role: string; email: string; phone: string; present: boolean }
type Meeting = {
  id: string; title: string; type: string; date: string; time: string
  duration: number; status: 'upcoming'|'completed'; summary: string
  agenda: string; attendants: Attendant[]; createdAt: string; meetLink: string
}

const SAMPLE_ATTENDANTS: Attendant[] = [
  { name:'Pastor Bolaji Idowu',   role:'Senior Pastor',       email:'bolaji@hicc.org',   phone:'+234 810 000 0001', present:true },
  { name:'Pastor Emeka Okafor',   role:'Gbagada Pastor',      email:'emeka@hicc.org',    phone:'+234 803 000 0002', present:true },
  { name:'Pastor Taiwo Adeyemi',  role:'Ikeja Pastor',        email:'taiwo@hicc.org',    phone:'+234 706 000 0003', present:true },
  { name:'Pastor Ngozi Eze',      role:'Anthony Pastor',      email:'ngozi@hicc.org',    phone:'+234 813 000 0004', present:false },
  { name:'Pastor David Obi',      role:'Abuja Pastor',        email:'david@hicc.org',    phone:'+234 802 000 0005', present:true },
  { name:'Pastor Funke Bello',    role:'Port Harcourt Pastor',email:'funke@hicc.org',    phone:'+234 809 000 0006', present:true },
  { name:'Pastor Chidi Nwachukwu',role:'Ibadan Pastor',       email:'chidi@hicc.org',    phone:'+234 816 000 0007', present:true },
  { name:'Pastor James Mensah',   role:'London Pastor',       email:'james@hicc.org',    phone:'+44 798 000 0008',  present:true },
  { name:'Pastor Grace Adesanya', role:'Houston Pastor',      email:'grace@hicc.org',    phone:'+1 713 000 0009',   present:false },
]

const SAMPLE_MEETINGS: Meeting[] = [
  {
    id:'mt1', title:'Senior Pastors Council', type:'Leadership',
    date: new Date(Date.now() - 2*24*60*60*1000).toISOString().slice(0,10),
    time:'9:00 AM', duration:60, status:'completed',
    agenda:'1. Communion logistics for all campuses\n2. Ikeja pastor appointment\n3. London Q2 report',
    summary:'Communion logistics confirmed for all campuses. Ikeja pastor appointment target date set for July. London Q2 report reviewed — 14% growth noted.',
    attendants: SAMPLE_ATTENDANTS.map(a=>({...a})),
    createdAt: new Date(Date.now() - 4*24*60*60*1000).toISOString(),
    meetLink:'',
  },
  {
    id:'mt2', title:'KidsHouse Leaders (All)', type:'Peer',
    date: new Date(Date.now() - 5*24*60*60*1000).toISOString().slice(0,10),
    time:'10:00 AM', duration:45, status:'completed',
    agenda:'1. New curriculum review\n2. Summer camp dates\n3. Volunteer onboarding',
    summary:'New curriculum from Open Doors adopted. Summer camp dates confirmed for Gbagada. Volunteer onboarding plan approved.',
    attendants:[
      { name:'Sis Tosin Obi',      role:'KidsHouse Head',      email:'tosin@hicc.org',    phone:'+234 813 000 1234', present:true },
      { name:'Blessing Okafor',    role:'KidsHouse Gbagada',   email:'blessing@hicc.org', phone:'+234 906 000 5678', present:true },
      { name:'Peace Nwosu',        role:'KidsHouse Ikeja',     email:'peace@hicc.org',    phone:'+234 811 000 9012', present:false },
      { name:'Favour Adeyemi',     role:'KidsHouse Abuja',     email:'favour@hicc.org',   phone:'+234 812 000 3456', present:true },
    ],
    createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
    meetLink:'',
  },
  {
    id:'mt3', title:'Worship Leads Sync', type:'Peer',
    date: new Date(Date.now() + 6*24*60*60*1000).toISOString().slice(0,10),
    time:'4:00 PM', duration:30, status:'upcoming',
    agenda:'1. June song selections\n2. New team members\n3. Equipment needs',
    summary:'', attendants:[
      { name:'Minister Tolu Mensah',role:'Worship Lead HQ',    email:'tolu@hicc.org',     phone:'+234 805 000 0011', present:false },
      { name:'Seun Adesanya',       role:'Worship Lead Gbagada',email:'seun@hicc.org',    phone:'+234 817 000 0012', present:false },
      { name:'Kemi Brown',          role:'Worship Lead Ikeja', email:'kemi@hicc.org',     phone:'+234 908 000 0013', present:false },
    ],
    createdAt: new Date().toISOString(), meetLink:'',
  },
  {
    id:'mt4', title:'Branch Pastors Forum', type:'Leadership',
    date: new Date(Date.now() + 8*24*60*60*1000).toISOString().slice(0,10),
    time:'11:00 AM', duration:60, status:'upcoming',
    agenda:'1. June targets review\n2. Soul tracker updates\n3. Prayer calendar',
    summary:'', attendants: SAMPLE_ATTENDANTS.map(a=>({...a, present:false})),
    createdAt: new Date().toISOString(), meetLink:'',
  },
]

const TYPE_COL: Record<string,string> = { Leadership:'var(--brand)', Peer:'var(--teal)', Discipleship:'var(--purple)', Pastoral:'var(--red)' }
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

function daysUntilExpiry(createdAt: string) {
  const created = new Date(createdAt).getTime()
  const expiry = created + ONE_MONTH_MS
  return Math.ceil((expiry - Date.now()) / (24*60*60*1000))
}

function buildPdfHtml(m: Meeting): string {
  const present = m.attendants.filter(a=>a.present)
  const absent  = m.attendants.filter(a=>!a.present)
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Meeting Minutes — ${m.title}</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#1a1a1a;font-size:13px}
  .hdr{background:#1B3A2A;color:#fff;padding:24px 32px;margin:-32px -32px 28px}
  .hdr h1{margin:0 0 4px;font-size:20px}
  .hdr p{margin:0;opacity:.7;font-size:12px}
  .gold{color:#C9A84C}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#888;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px}
  .meta{display:flex;gap:32px;margin-bottom:20px;flex-wrap:wrap}
  .meta div{font-size:12px}
  .meta strong{display:block;color:#555;font-size:11px;text-transform:uppercase;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#f5f5f5;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;color:#888}
  td{padding:8px 10px;border-bottom:1px solid #f0f0f0}
  .present{color:#16a34a;font-weight:700}
  .absent{color:#dc2626}
  .summary-box{background:#f9f9f9;border-left:4px solid #1B3A2A;padding:14px 18px;border-radius:4px;line-height:1.7}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center}
</style></head><body>
<div class="hdr">
  <h1>Meeting Minutes</h1>
  <p>HARVESTERS INTERNATIONAL CHRISTIAN CENTRE — Workforce Community</p>
</div>
<h1 style="font-size:22px;margin:0 0 8px">${m.title}</h1>
<span style="background:#1B3A2A20;color:#1B3A2A;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700">${m.type}</span>
<div class="meta" style="margin-top:16px">
  <div><strong>Date</strong>${m.date}</div>
  <div><strong>Time</strong>${m.time}</div>
  <div><strong>Duration</strong>${m.duration} minutes</div>
  <div><strong>Present</strong>${present.length} of ${m.attendants.length}</div>
  <div><strong>Status</strong>${m.status.toUpperCase()}</div>
</div>
${m.agenda ? `<h2>Agenda</h2><div style="white-space:pre-line;line-height:1.8">${m.agenda}</div>` : ''}
${m.summary ? `<h2>Summary / Minutes</h2><div class="summary-box">${m.summary}</div>` : ''}
<h2>Attendants (${m.attendants.length})</h2>
<table>
  <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Attendance</th></tr></thead>
  <tbody>
    ${m.attendants.map((a,i)=>`<tr>
      <td>${i+1}</td><td><strong>${a.name}</strong></td><td>${a.role}</td>
      <td>${a.email}</td><td>${a.phone}</td>
      <td class="${a.present?'present':'absent'}">${a.present?'✓ Present':'✗ Absent'}</td>
    </tr>`).join('')}
  </tbody>
</table>
${absent.length>0 ? `<p style="font-size:12px;color:#888;margin-top:8px">Absent: ${absent.map(a=>a.name).join(', ')}</p>` : ''}
<div class="footer">
  Generated by Harvesters Workforce Community · ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
  · Records kept for 30 days · Download PDF to archive permanently
</div>
</body></html>`
}

export default function Meetings() {
  const { user } = useSession()
  const [meetings, setMeetings] = useState<Meeting[]>(() => hydrate('hicc_meetings_v2' as any, SAMPLE_MEETINGS))
  const [tab, setTab] = useState<'meetings'|'instant'|'schedule'|'summaries'>('meetings')
  const [selected, setSelected] = useState<Meeting|null>(null)
  const [editingAttendants, setEditingAttendants] = useState(false)
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [form, setForm] = useState({ title:'', type:'Leadership', date:'', time:'10:00', duration:'60', agenda:'', meetLink:'', attendants:'' })
  const [scheduled, setScheduled] = useState(false)
  const [instantLink, setInstantLink] = useState<string|null>(null)
  const [emailStatus, setEmailStatus] = useState<string|null>(null)

  // Load from Supabase
  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const { data } = await supabase.from('meetings').select('*').order('meeting_date', { ascending: true })
        if (data && data.length > 0) {
          const mapped: Meeting[] = data.map((m:any) => ({
            id: m.id, title: m.title, type: m.type,
            date: m.meeting_date, time: m.meeting_time || '',
            duration: m.duration_mins||60, status: m.status||'upcoming',
            summary: m.summary||'', agenda: m.agenda||'',
            attendants: m.attendants ? JSON.parse(m.attendants) : [],
            createdAt: m.created_at || new Date().toISOString(),
            meetLink: m.meet_link||'',
          }))
          setMeetings(mapped)
          persist('hicc_meetings_v2' as any, mapped)
        }
      } catch {}
    }
    load()
  }, [])

  // Prune meetings older than 30 days (keep archived ones)
  useEffect(() => {
    const now = Date.now()
    setMeetings(prev => {
      const pruned = prev.filter(m => {
        const age = now - new Date(m.createdAt).getTime()
        return age < ONE_MONTH_MS
      })
      if (pruned.length !== prev.length) persist('hicc_meetings_v2' as any, pruned)
      return pruned
    })
  }, [])

  const save = (updated: Meeting[]) => { setMeetings(updated); persist('hicc_meetings_v2' as any, updated) }

  const markAttendance = (mtgId: string, idx: number, present: boolean) => {
    const updated = meetings.map(m => m.id===mtgId ? { ...m, attendants: m.attendants.map((a,i)=>i===idx?{...a,present}:a) } : m)
    save(updated)
    if (selected?.id===mtgId) setSelected(updated.find(m=>m.id===mtgId)||null)
  }

  const saveSummary = (mtgId: string) => {
    const updated = meetings.map(m => m.id===mtgId ? { ...m, summary:summaryDraft, status:'completed' as const } : m)
    save(updated)
    setSelected(updated.find(m=>m.id===mtgId)||null)
    setEditingSummary(false)
    notify.success?.('Summary saved')
  }

  const scheduleNew = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAttendants: Attendant[] = form.attendants.trim()
      ? form.attendants.split('\n').filter(Boolean).map(line => {
          const [name='',role='',email='',phone=''] = line.split(',').map(s=>s.trim())
          return { name, role, email, phone, present:false }
        })
      : []
    const newMtg: Meeting = {
      id: `mt${Date.now()}`, title: form.title, type: form.type,
      date: form.date, time: form.time, duration: Number(form.duration),
      status:'upcoming', summary:'', agenda: form.agenda,
      attendants: parsedAttendants, meetLink: form.meetLink,
      createdAt: new Date().toISOString(),
    }
    const updated = [...meetings, newMtg]
    save(updated)
    if (supabase && user?.id) {
      try {
        await supabase.from('meetings').insert({
          title: newMtg.title, type: newMtg.type,
          meeting_date: newMtg.date, meeting_time: newMtg.time,
          duration_mins: newMtg.duration, agenda: newMtg.agenda,
          meet_link: newMtg.meetLink, status: 'upcoming',
          attendants: JSON.stringify(newMtg.attendants),
          created_by: user.id,
        })
      } catch {}
    }
    setScheduled(true)
    setTimeout(()=>{ setScheduled(false); setTab('meetings'); setForm({title:'',type:'Leadership',date:'',time:'10:00',duration:'60',agenda:'',meetLink:'',attendants:''}) }, 2000)
  }

  const downloadPdf = (m: Meeting) => {
    const html = buildPdfHtml(m)
    const blob = new Blob([html], { type:'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Meeting_Minutes_${m.title.replace(/\s+/g,'_')}_${m.date}.html`
    a.click()
    URL.revokeObjectURL(url)
    notify.success?.('Minutes downloaded')
  }

  const printMinutes = (m: Meeting) => {
    const html = buildPdfHtml(m)
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 500)
  }

  const emailMinutes = (m: Meeting) => {
    const present = m.attendants.filter(a=>a.present)
    const emails = m.attendants.filter(a=>a.email).map(a=>a.email).join(',')
    if (!emails) { setEmailStatus('No email addresses on file for this meeting.'); return }
    const body = encodeURIComponent(
      `Dear Team,\n\nPlease find below the minutes for: ${m.title}\nDate: ${m.date} at ${m.time}\nAttended: ${present.length}/${m.attendants.length}\n\nAGENDA:\n${m.agenda}\n\nSUMMARY:\n${m.summary || '(No summary added yet)'}\n\nATTENDANCE:\n${m.attendants.map(a=>`${a.present?'✓':'✗'} ${a.name} — ${a.role}`).join('\n')}\n\n— Harvesters Workforce Community`
    )
    const subject = encodeURIComponent(`Meeting Minutes: ${m.title} — ${m.date}`)
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`)
    setEmailStatus(`Email client opened with ${m.attendants.filter(a=>a.email).length} recipients.`)
    setTimeout(()=>setEmailStatus(null), 4000)
  }

  const upcoming  = meetings.filter(m => m.status==='upcoming')
  const completed = meetings.filter(m => m.status==='completed')
  const expiring  = meetings.filter(m => daysUntilExpiry(m.createdAt) <= 5 && daysUntilExpiry(m.createdAt) > 0)

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:'var(--font-display)'}}>Meetings</div>
          <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>Google Meet · Attendant records · Minutes · 30-day archive</div>
        </div>
        <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="btn btn-brand btn-sm" style={{textDecoration:'none'}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z"/></svg>
          Start Google Meet
        </a>
      </div>

      {/* Expiry warning */}
      {expiring.length > 0 && (
        <div style={{padding:'12px 16px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'var(--r)',marginBottom:14,display:'flex',gap:10,alignItems:'flex-start'}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" width="16" height="16" style={{flexShrink:0,marginTop:2}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
          <div style={{fontSize:12.5,color:'var(--t-1)'}}>
            <strong>⚠ Expiring soon:</strong> {expiring.map(m=>`"${m.title}" (${daysUntilExpiry(m.createdAt)} days left)`).join(' · ')} — download PDF or email participants to keep a permanent record.
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10,marginBottom:16}}>
        {[{l:'This month',v:meetings.length},{l:'Completed',v:completed.length},{l:'Upcoming',v:upcoming.length},{l:'Avg attendance',v: completed.length ? Math.round(completed.reduce((a,m)=>a+(m.attendants.filter(x=>x.present).length/(m.attendants.length||1)),0)/completed.length*100)+'%' : '—'}].map(m=>(
          <div key={m.l} className="metric-tile metric-tile-accent"><div className="metric-label">{m.l}</div><div className="metric-value" style={{fontSize:'1.5rem'}}>{m.v}</div></div>
        ))}
      </div>

      <div className="tabs" style={{marginBottom:16}}>
        {([['meetings','All meetings'],['instant','Start / Join'],['schedule','Schedule new'],['summaries','Summaries']] as const).map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>{setTab(k);setSelected(null)}}>{l}</button>
        ))}
      </div>

      {/* ── DETAIL VIEW ── */}
      {selected && (
        <div>
          <button className="btn btn-ghost btn-sm" style={{marginBottom:14}} onClick={()=>setSelected(null)}>← Back</button>
          <div className="card card-p" style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
              <div>
                <div style={{fontWeight:800,fontSize:17}}>{selected.title}</div>
                <div style={{fontSize:12,color:'var(--t-2)',marginTop:3}}>{selected.date} at {selected.time} · {selected.duration} min</div>
                <span style={{background:`${TYPE_COL[selected.type]||'var(--brand)'}15`,color:TYPE_COL[selected.type]||'var(--brand)',padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:600,marginTop:8,display:'inline-block'}}>{selected.type}</span>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="btn btn-sm" onClick={()=>downloadPdf(selected)}>⬇ Download PDF</button>
                <button className="btn btn-sm" onClick={()=>printMinutes(selected)}>🖨 Print</button>
                <button className="btn btn-sm" onClick={()=>emailMinutes(selected)}>✉ Email participants</button>
                {selected.meetLink && <a href={selected.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-brand" style={{textDecoration:'none'}}>Join Meet</a>}
              </div>
            </div>
            {emailStatus && <div style={{marginTop:12,padding:'8px 12px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:12.5,color:'var(--green)',fontWeight:600}}>{emailStatus}</div>}
            <div style={{marginTop:8,fontSize:11.5,color:'var(--t-3)'}}>
              Record expires in {daysUntilExpiry(selected.createdAt)} days — download PDF to keep permanently.
            </div>
          </div>

          {/* Agenda */}
          {selected.agenda && (
            <div className="card card-p" style={{marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Agenda</div>
              <div style={{fontSize:13,color:'var(--t-2)',whiteSpace:'pre-line',lineHeight:1.8}}>{selected.agenda}</div>
            </div>
          )}

          {/* Summary */}
          <div className="card card-p" style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:editingSummary?12:0}}>
              <div style={{fontWeight:700,fontSize:13}}>Summary / Minutes</div>
              <button className="btn btn-sm" onClick={()=>{ setSummaryDraft(selected.summary); setEditingSummary(!editingSummary) }}>
                {editingSummary ? 'Cancel' : selected.summary ? '✏ Edit' : '+ Add summary'}
              </button>
            </div>
            {editingSummary ? (
              <div>
                <textarea className="input" rows={5} value={summaryDraft} onChange={e=>setSummaryDraft(e.target.value)} placeholder="Type meeting minutes and key decisions…" style={{resize:'vertical',marginBottom:10}}/>
                <button className="btn btn-brand btn-sm" onClick={()=>saveSummary(selected.id)}>Save summary</button>
              </div>
            ) : selected.summary ? (
              <div style={{padding:'12px 14px',background:'var(--s-3)',borderRadius:8,fontSize:13,color:'var(--t-2)',lineHeight:1.75,borderLeft:`3px solid ${TYPE_COL[selected.type]||'var(--teal)'}`}}>{selected.summary}</div>
            ) : (
              <div style={{fontSize:13,color:'var(--t-3)',fontStyle:'italic',marginTop:6}}>No summary yet — click "+ Add summary" to record the minutes.</div>
            )}
          </div>

          {/* Attendants */}
          <div className="card card-p">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Attendants ({selected.attendants.length})</div>
                <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>
                  {selected.attendants.filter(a=>a.present).length} present · {selected.attendants.filter(a=>!a.present).length} absent
                </div>
              </div>
              {selected.status==='upcoming' && (
                <button className="btn btn-sm" onClick={()=>setEditingAttendants(!editingAttendants)}>
                  {editingAttendants ? 'Done marking' : '✓ Mark attendance'}
                </button>
              )}
            </div>
            <table className="tbl">
              <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
              <tbody>
                {selected.attendants.map((a,i) => (
                  <tr key={i}>
                    <td style={{fontSize:11,color:'var(--t-3)'}}>{i+1}</td>
                    <td style={{fontWeight:600}}>{a.name}</td>
                    <td style={{fontSize:12,color:'var(--t-2)'}}>{a.role}</td>
                    <td style={{fontSize:11.5,fontFamily:'var(--font-mono)',color:'var(--t-3)'}}>{a.email||'—'}</td>
                    <td style={{fontSize:11.5,fontFamily:'var(--font-mono)',color:'var(--t-3)'}}>{a.phone||'—'}</td>
                    <td>
                      {editingAttendants ? (
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-sm" style={{background:a.present?'var(--green-lt)':'var(--s-3)',color:a.present?'var(--green)':'var(--t-3)',border:`1px solid ${a.present?'rgba(16,185,129,0.3)':'var(--border)'}`,fontSize:11,padding:'3px 8px'}} onClick={()=>markAttendance(selected.id,i,true)}>✓</button>
                          <button className="btn btn-sm" style={{background:!a.present?'rgba(239,68,68,0.1)':'var(--s-3)',color:!a.present?'#EF4444':'var(--t-3)',border:`1px solid ${!a.present?'rgba(239,68,68,0.3)':'var(--border)'}`,fontSize:11,padding:'3px 8px'}} onClick={()=>markAttendance(selected.id,i,false)}>✗</button>
                        </div>
                      ) : (
                        <span style={{fontWeight:700,fontSize:12,color:a.present?'var(--green)':'#EF4444'}}>{a.present?'✓ Present':'✗ Absent'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ALL MEETINGS ── */}
      {!selected && tab==='meetings' && (
        <>
          {upcoming.length>0 && (
            <>
              <div style={{fontSize:10.5,fontWeight:700,color:'var(--t-3)',marginBottom:10,letterSpacing:'0.06em',textTransform:'uppercase'}}>Upcoming</div>
              {upcoming.map(m=>(
                <div key={m.id} className="card card-hover" style={{padding:'14px 18px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,cursor:'pointer'}} onClick={()=>setSelected(m)}>
                  <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${TYPE_COL[m.type]||'var(--brand)'}15`,border:`1px solid ${TYPE_COL[m.type]||'var(--brand)'}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={TYPE_COL[m.type]||'var(--brand)'} strokeWidth="2" width="18" height="18"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
                    </div>
                    <div>
                      <div style={{fontSize:13.5,fontWeight:700}}>{m.title}</div>
                      <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>{m.date} at {m.time} · {m.duration} min · {m.attendants.length} invitees</div>
                      <span style={{background:`${TYPE_COL[m.type]||'var(--brand)'}15`,color:TYPE_COL[m.type]||'var(--brand)',padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,marginTop:5,display:'inline-block'}}>{m.type}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:11,color:'var(--t-3)'}}>Expires in {daysUntilExpiry(m.createdAt)}d</span>
                    <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="btn btn-brand btn-sm" style={{textDecoration:'none'}} onClick={e=>e.stopPropagation()}>Start Meet →</a>
                  </div>
                </div>
              ))}
            </>
          )}
          <div style={{fontSize:10.5,fontWeight:700,color:'var(--t-3)',marginBottom:10,marginTop:8,letterSpacing:'0.06em',textTransform:'uppercase'}}>Completed</div>
          {completed.length===0 && <div style={{fontSize:13,color:'var(--t-3)',textAlign:'center',padding:'2rem'}}>No completed meetings yet.</div>}
          {completed.map(m=>(
            <div key={m.id} className="card card-hover" style={{padding:'14px 18px',marginBottom:10,cursor:'pointer'}} onClick={()=>setSelected(m)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:700}}>{m.title}</div>
                  <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>
                    {m.date} · {m.duration} min · {m.attendants.filter(a=>a.present).length}/{m.attendants.length} attended
                  </div>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:11,color: daysUntilExpiry(m.createdAt)<=5 ? '#F59E0B' : 'var(--t-3)'}}>
                    {daysUntilExpiry(m.createdAt)<=5 ? `⚠ ${daysUntilExpiry(m.createdAt)}d left` : `${daysUntilExpiry(m.createdAt)}d left`}
                  </span>
                  <button className="btn btn-sm" onClick={e=>{e.stopPropagation();downloadPdf(m)}}>⬇ PDF</button>
                  <button className="btn btn-sm" onClick={e=>{e.stopPropagation();emailMinutes(m)}}>✉</button>
                </div>
              </div>
              {m.summary && <div style={{marginTop:10,padding:'10px 12px',background:'var(--s-3)',borderRadius:8,fontSize:12.5,color:'var(--t-2)',lineHeight:1.65,borderLeft:`3px solid ${TYPE_COL[m.type]||'var(--teal)'}`}}>{m.summary.slice(0,180)}{m.summary.length>180?'…':''}</div>}
              <div style={{marginTop:8,display:'flex',gap:6,alignItems:'center'}}>
                {m.attendants.filter(a=>a.present).slice(0,5).map((a,i)=>(
                  <div key={i} title={a.name} style={{width:24,height:24,borderRadius:'50%',background:'var(--brand)',color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--s-1)'}}>
                    {a.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                ))}
                {m.attendants.filter(a=>a.present).length>5 && <span style={{fontSize:11,color:'var(--t-3)'}}>+{m.attendants.filter(a=>a.present).length-5} more</span>}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── START / JOIN ── */}
      {!selected && tab==='instant' && (
        <div className="card card-p" style={{maxWidth:520}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Start or join a meeting</div>
          <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:20,lineHeight:1.65}}>
            Click below to start a new meeting on Google Meet. Google generates the real link — copy it from your browser and share with participants.
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="btn btn-brand" style={{justifyContent:'center',padding:'13px',fontSize:15,fontWeight:700,textDecoration:'none'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z"/></svg>
              Start new Google Meet
            </a>
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
          </div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {!selected && tab==='schedule' && (
        <div className="card card-p" style={{maxWidth:600}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Schedule a meeting</div>
          <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:18}}>Add title, date, attendants, and agenda. Records are kept for 30 days — download PDF to archive.</div>
          {scheduled && <div style={{padding:'10px 14px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:12.5,color:'var(--green)',marginBottom:16,fontWeight:600}}>✓ Meeting scheduled successfully.</div>}
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
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Google Meet link (optional)</label>
              <input className="input" placeholder="Paste meet.google.com/xxx-yyyy-zzz link after creating it" value={form.meetLink} onChange={e=>setForm(f=>({...f,meetLink:e.target.value}))}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Agenda</label>
              <textarea className="input" rows={3} value={form.agenda} onChange={e=>setForm(f=>({...f,agenda:e.target.value}))} placeholder="1. Topic one&#10;2. Topic two…" style={{resize:'vertical'}}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Attendants — one per line: Name, Role, Email, Phone</label>
              <textarea className="input" rows={5} value={form.attendants} onChange={e=>setForm(f=>({...f,attendants:e.target.value}))} placeholder="Pastor Bolaji Idowu, Senior Pastor, bolaji@hicc.org, +234810000001&#10;Pastor Emeka Okafor, Gbagada Pastor, emeka@hicc.org, +234803000002" style={{resize:'vertical',fontFamily:'var(--font-mono)',fontSize:11.5}}/>
              <div style={{fontSize:11,color:'var(--t-3)',marginTop:4}}>Format: Name, Role, Email, Phone — one attendant per line</div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-brand" style={{flex:1,justifyContent:'center',padding:'10px'}}>Save meeting</button>
              <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{textDecoration:'none',alignSelf:'center'}}>Open Meet now</a>
            </div>
          </form>
        </div>
      )}

      {/* ── SUMMARIES ── */}
      {!selected && tab==='summaries' && (
        <div>
          {completed.filter(m=>m.summary).length===0 && <div style={{fontSize:13,color:'var(--t-3)',textAlign:'center',padding:'2rem'}}>No summaries yet. Open a completed meeting and add one.</div>}
          {completed.filter(m=>m.summary).map(m=>(
            <div key={m.id} className="card card-hover" style={{padding:'16px 18px',marginBottom:10,cursor:'pointer'}} onClick={()=>setSelected(m)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8,gap:8}}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:700}}>{m.title}</div>
                  <div style={{fontSize:11.5,color:'var(--t-3)',marginTop:2}}>{m.date} · {m.attendants.filter(a=>a.present).length}/{m.attendants.length} attended · {daysUntilExpiry(m.createdAt)}d until auto-delete</div>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button className="btn btn-sm" onClick={e=>{e.stopPropagation();downloadPdf(m)}}>⬇ PDF</button>
                  <button className="btn btn-sm" onClick={e=>{e.stopPropagation();emailMinutes(m)}}>✉ Email</button>
                  <span style={{background:`${TYPE_COL[m.type]||'var(--brand)'}15`,color:TYPE_COL[m.type]||'var(--brand)',padding:'3px 8px',borderRadius:100,fontSize:11,fontWeight:600,alignSelf:'flex-start'}}>{m.type}</span>
                </div>
              </div>
              <div style={{fontSize:12.5,color:'var(--t-2)',lineHeight:1.7}}>{m.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
