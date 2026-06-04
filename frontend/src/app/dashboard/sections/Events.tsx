'use client'
import { useState, useEffect } from 'react'
import { branches, DEPARTMENTS } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  : null

const SAMPLE_EVENTS = [
  { id:'e1', title:'Sunday Communion Service', branch:'All branches', branchId:'all', date:'Jun 1 2026', time:'8:00 AM', type:'Service', status:'approved', registrations:0, capacity:0, organiser:'Senior Pastor', desc:'Special communion service across all campuses. Members encouraged to come fasting.' },
  { id:'e2', title:'HSAP Q2 Graduation', branch:'Lekki HQ', branchId:'lekki', date:'Jun 28 2026', time:'10:00 AM', type:'Programme', status:'approved', registrations:234, capacity:400, organiser:'HSAP Coordinator', desc:'Skill Acquisition Programme Q2 graduates celebration.' },
  { id:'e3', title:'Youth Conference 2026', branch:'All branches', branchId:'all', date:'Jul 14 2026', time:'9:00 AM', type:'Conference', status:'pending', registrations:0, capacity:2000, organiser:'Youth Dept', desc:'Annual youth conference. Theme: Champions Arise.' },
  { id:'e4', title:'Abuja Praise Night', branch:'Abuja', branchId:'abuja', date:'Jun 14 2026', time:'6:00 PM', type:'Praise Night', status:'pending', registrations:0, capacity:500, organiser:'Abuja Admin', desc:'A night of praise and worship.' },
]

const TYPE_COL: Record<string,string> = { Service:'#1B4332', Programme:'#10B981', Conference:'#F59E0B', 'Praise Night':'#C9A84C', Seminar:'#3B82F6' }

export default function Events() {
  const { user } = useSession()

  // Load events from Supabase on mount
  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
        if (data && data.length > 0) {
          const mapped = data.map((e:any) => ({
            id: e.id, title: e.title, branch: branches.find(b=>b.id===e.branch_id)?.name||e.branch_id,
            branchId: e.branch_id, date: e.event_date, time: e.event_time,
            type: e.type, status: e.status, registrations: 0,
            capacity: e.capacity||0, organiser: e.organiser||'', desc: e.description||'',
          }))
          setEvents(mapped)
          persist('hicc_events' as any, mapped)
        }
      } catch {}
    }
    load()
  }, [])
  const [events, setEvents] = useState(() => hydrate('hicc_events' as any, SAMPLE_EVENTS))
  const [tab, setTab] = useState<'all'|'create'>('all')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title:'', type:'Service', branch:'all', date:'', time:'09:00', capacity:'', desc:'', organiser:'' })
  const [saved, setSaved] = useState(false)

  const filtered = filter==='all'?events:filter==='pending'?events.filter(e=>e.status==='pending'):events.filter(e=>e.status==='approved')

  const approve = (id:string) => setEvents(prev=>prev.map(e=>e.id===id?{...e,status:'approved'}:e))
  const deleteEv = (id:string) => setEvents(prev=>prev.filter(e=>e.id!==id))

  const create = (e:React.FormEvent) => {
    e.preventDefault()
    const br = form.branch==='all'?'All branches':branches.find(b=>b.id===form.branch)?.name||''
    setEvents(prev=>[...prev,{ id:`ev${Date.now()}`,title:form.title,branch:br,branchId:form.branch,date:form.date,time:form.time,type:form.type,status:'pending',registrations:0,capacity:Number(form.capacity)||0,organiser:form.organiser,desc:form.desc }])
    setSaved(true); setTimeout(()=>{setSaved(false);setTab('all');setForm({title:'',type:'Service',branch:'all',date:'',time:'09:00',capacity:'',desc:'',organiser:''})},2000)
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:'var(--font-display)'}}>Events</div>
          <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>Church-wide and branch events · approvals · registration</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={()=>setTab('create')}>+ Create event</button>
      </div>

      <div className="tabs" style={{marginBottom:16}}>
        {([['all','All events'],['create','Create event']] as const).map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==='all' && (
        <>
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {[['all','All'],['pending','Pending approval'],['approved','Approved']].map(([k,l])=>(
              <button key={k} className={`btn btn-sm ${filter===k?'btn-brand':''}`} style={{fontSize:11}} onClick={()=>setFilter(k)}>{l}</button>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {filtered.map(ev=>(
              <div key={ev.id} className="card" style={{padding:'16px 18px',borderTop:`3px solid ${TYPE_COL[ev.type]||'var(--brand)'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <span style={{background:`${TYPE_COL[ev.type]||'var(--brand)'}20`,color:TYPE_COL[ev.type]||'var(--brand)',padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600}}>{ev.type}</span>
                  <span className={`chip chip-${ev.status==='approved'?'green':'amber'}`}>{ev.status}</span>
                </div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{ev.title}</div>
                <div style={{fontSize:12,color:'var(--t-3)',marginBottom:6}}>{ev.branch}</div>
                <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:10}}>📅 {ev.date} at {ev.time}</div>
                {ev.desc && <div style={{fontSize:12.5,color:'var(--t-2)',lineHeight:1.6,marginBottom:10}}>{ev.desc}</div>}
                {ev.capacity>0 && (
                  <div style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:4}}>
                      <span style={{color:'var(--t-3)'}}>Registrations</span>
                      <span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{ev.registrations}/{ev.capacity}</span>
                    </div>
                    <div style={{height:4,background:'var(--s-4)',borderRadius:100,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'var(--brand)',borderRadius:100,width:`${ev.capacity>0?(ev.registrations/ev.capacity)*100:0}%`}}/>
                    </div>
                  </div>
                )}
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  {ev.status==='pending' && <button className="btn btn-sm" style={{background:'var(--green-lt)',color:'var(--green)',border:'1px solid rgba(16,185,129,0.3)',flex:1,justifyContent:'center'}} onClick={()=>approve(ev.id)}>Approve</button>}
                  <button className="btn btn-sm btn-danger" onClick={()=>deleteEv(ev.id)}>Delete</button>
                </div>
              </div>
            ))}
            {filtered.length===0 && <div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',color:'var(--t-3)',fontSize:13}}>No events here.</div>}
          </div>
        </>
      )}

      {tab==='create' && (
        <div className="card card-p" style={{maxWidth:560}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Create new event</div>
          <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:16}}>New events go to pending approval before publishing.</div>
          {saved && <div style={{padding:'10px 14px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:12.5,color:'var(--green)',marginBottom:16,fontWeight:600}}>✓ Event created — pending approval.</div>}
          <form onSubmit={create}>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Event title *</label>
              <input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Youth Conference 2026" required/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Type</label>
                <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {['Service','Programme','Conference','Praise Night','Seminar','Retreat','Outreach'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Branch</label>
                <select className="input" value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                  <option value="all">All branches</option>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Date *</label>
                <input className="input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/>
              </div>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Time</label>
                <input className="input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Capacity (0 = unlimited)</label>
                <input className="input" type="number" value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:e.target.value}))} placeholder="0"/>
              </div>
              <div>
                <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Organiser</label>
                <input className="input" value={form.organiser} onChange={e=>setForm(f=>({...f,organiser:e.target.value}))} placeholder="Name or department"/>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Description</label>
              <textarea className="input" rows={3} value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Event details…" style={{resize:'vertical'}}/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-brand" style={{flex:1,justifyContent:'center',padding:'10px'}}>Submit for approval</button>
              <button type="button" className="btn btn-ghost" onClick={()=>setTab('all')}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
