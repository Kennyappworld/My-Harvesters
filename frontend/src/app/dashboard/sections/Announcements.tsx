'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { announcements, branches, DEPARTMENTS } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  : null


function SmsConfig() {
  const [apiKey, setApiKey] = React.useState(() => { try { return localStorage.getItem('hicc_termii_key') || '' } catch { return '' } })
  const [senderId, setSenderId] = React.useState(() => { try { return localStorage.getItem('hicc_termii_sender') || '' } catch { return '' } })
  const [saved, setSaved] = React.useState(false)
  const save = () => {
    localStorage.setItem('hicc_termii_key', apiKey)
    localStorage.setItem('hicc_termii_sender', senderId)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }
  return (
    <div style={{marginTop:20,padding:'14px 18px',background:'var(--s-3)',borderRadius:'var(--r-lg)',border:'0.5px solid var(--border)',maxWidth:640}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>SMS delivery — Termii</div>
      <div style={{fontSize:12,color:'var(--t-2)',lineHeight:1.7,marginBottom:12}}>Members without WhatsApp receive SMS as fallback. Enter your Termii credentials below.</div>
      {saved && <div style={{padding:'6px 10px',background:'var(--green-lt)',borderRadius:6,fontSize:12,color:'var(--green)',fontWeight:600,marginBottom:10}}>✓ Config saved</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div>
          <label style={{fontSize:11,fontWeight:600,color:'var(--t-3)',display:'block',marginBottom:5}}>Termii API key</label>
          <input className="input" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="TLxxxxxxxxxxxxxx" style={{fontSize:12,fontFamily:'var(--font-mono)'}}/>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:600,color:'var(--t-3)',display:'block',marginBottom:5}}>Sender ID</label>
          <input className="input" value={senderId} onChange={e=>setSenderId(e.target.value)} placeholder="HARVESTERS" style={{fontSize:12}}/>
        </div>
      </div>
      <button className="btn btn-sm btn-brand" style={{marginTop:12}} onClick={save}>Save SMS config</button>
    </div>
  )
}

export default function Announcements() {
  const [items, setItems] = useState(announcements)
  const [tab, setTab] = useState<'feed'|'compose'|'whatsapp'>('feed')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({title:'',body:'',scope:'all',targetBranch:'all',targetDept:'all',channel:'platform'})
  const [saved, setSaved] = useState(false)
  const [waNumbers, setWaNumbers] = useState<Record<string,string>>(() => hydrate('hicc_wa_numbers' as any, {}))

  const filtered = filter==='all'?items:filter==='pending'?items.filter(a=>a.status==='pending'):items.filter(a=>a.scope===filter)

  const publish = (id:string) => setItems(prev=>prev.map(a=>a.id===id?{...a,status:'published'}:a))
  const deleteAnn = (id:string) => setItems(prev=>prev.filter(a=>a.id!==id))

  const submit = (e:React.FormEvent) => {
    e.preventDefault()
    const newAnn = {
      id:`ann${Date.now()}`,title:form.title,from:'You',to:form.scope==='all'?'All branches':form.targetBranch==='all'?'All branches':branches.find(b=>b.id===form.targetBranch)?.name||'',
      date:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
      scope:form.scope as any,reached:0,read:0,status:'published',body:form.body
    }
    setItems(prev=>[newAnn,...prev])
    setSaved(true); setTimeout(()=>{setSaved(false);setTab('feed');setForm({title:'',body:'',scope:'all',targetBranch:'all',targetDept:'all',channel:'platform'})},2000)
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:'var(--font-display)'}}>Announcements</div>
          <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>Broadcast to all, a branch, or a department · read-receipt tracking</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={()=>setTab('compose')}>+ New announcement</button>
      </div>

      <div className="tabs" style={{marginBottom:16}}>
        {([['feed','All announcements'],['compose','Compose'],['whatsapp','WhatsApp setup']] as const).map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── FEED ── */}
      {tab==='feed' && (
        <>
          <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
            {[['all','All'],['pending','Pending '],['all','All branches'],['branch','Branch'],['unit','Department']].filter((v,i,a)=>a.findIndex(x=>x[0]===v[0])===i).map(([k,l])=>(
              <button key={k+l} className={`btn btn-sm ${filter===k?'btn-brand':''}`} style={{fontSize:11}} onClick={()=>setFilter(k)}>{l}{k==='pending'?`(${items.filter(a=>a.status==='pending').length})`:''}</button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map(a=>(
              <div key={a.id} className="card" style={{padding:'16px 20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{a.title}</div>
                    <div style={{fontSize:11.5,color:'var(--t-3)',marginTop:2}}>From: {a.from} · To: {a.to} · {a.date}</div>
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <span className={`chip chip-${a.status==='published'?'green':'amber'}`}>{a.status}</span>
                    <span className={`chip chip-${a.scope==='all'?'purple':'blue'}`}>{a.scope==='all'?'All branches':a.scope}</span>
                  </div>
                </div>
                <div style={{fontSize:13,color:'var(--t-2)',lineHeight:1.7,marginBottom:12}}>{a.body}</div>
                {a.reached>0 && (
                  <div style={{display:'flex',gap:16,marginBottom:12}}>
                    <div style={{fontSize:12}}>📨 Reached: <strong style={{color:'var(--t-1)'}}>{a.reached.toLocaleString()}</strong></div>
                    <div style={{fontSize:12}}>👁 Read: <strong style={{color:'var(--green)'}}>{a.read.toLocaleString()}</strong></div>
                    <div style={{fontSize:12}}>📊 Rate: <strong style={{color:'var(--brand)'}}>{a.reached>0?Math.round((a.read/a.reached)*100):0}%</strong></div>
                  </div>
                )}
                <div style={{display:'flex',gap:8}}>
                  {a.status==='pending' && <button className="btn btn-sm" style={{background:'var(--green-lt)',color:'var(--green)',border:'1px solid rgba(16,185,129,0.3)'}} onClick={()=>publish(a.id)}>Approve & publish</button>}
                  <button className="btn btn-sm btn-danger" onClick={()=>deleteAnn(a.id)}>Delete</button>
                </div>
              </div>
            ))}
            {filtered.length===0 && <div style={{textAlign:'center',padding:'3rem',color:'var(--t-3)',fontSize:13}}>No announcements here.</div>}
          </div>
        </>
      )}

      {/* ── COMPOSE ── */}
      {tab==='compose' && (
        <div className="card card-p" style={{maxWidth:580}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Compose announcement</div>
          <div style={{fontSize:12.5,color:'var(--t-2)',marginBottom:16,lineHeight:1.65}}>Target a specific audience — all branches, a single branch, or a department. Send via platform, WhatsApp, or SMS.</div>
          {saved && <div style={{padding:'10px 14px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:12.5,color:'var(--green)',marginBottom:16,fontWeight:600}}>✓ Announcement published.</div>}
          <form onSubmit={submit}>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Title *</label>
              <input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Announcement title" required/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Message *</label>
              <textarea className="input" rows={4} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder="Write your announcement…" required style={{resize:'vertical'}}/>
            </div>

            {/* Audience targeting */}
            <div style={{background:'var(--s-3)',borderRadius:'var(--r)',padding:'14px 16px',marginBottom:12,border:'0.5px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:12,color:'var(--t-1)'}}>🎯 Target audience</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Level</label>
                  <select className="input" value={form.scope} onChange={e=>setForm(f=>({...f,scope:e.target.value}))}>
                    <option value="all">🌍 All branches (Central)</option>
                    <option value="branch">🏛 Specific branch</option>
                    <option value="unit">👥 Specific department</option>
                  </select>
                </div>
                {form.scope==='branch' && (
                  <div>
                    <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Branch</label>
                    <select className="input" value={form.targetBranch} onChange={e=>setForm(f=>({...f,targetBranch:e.target.value}))}>
                      <option value="all">All branches</option>
                      {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                {form.scope==='unit' && (
                  <div>
                    <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Department</label>
                    <select className="input" value={form.targetDept} onChange={e=>setForm(f=>({...f,targetDept:e.target.value}))}>
                      <option value="all">All departments</option>
                      {DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery channel */}
            <div style={{background:'var(--s-3)',borderRadius:'var(--r)',padding:'14px 16px',marginBottom:16,border:'0.5px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:12,color:'var(--t-1)'}}>📣 Delivery channel</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[['platform','📱 Platform'],['whatsapp','💬 WhatsApp'],['sms','📟 SMS'],['all_channels','🔔 All channels']].map(([v,l])=>(
                  <button key={v} type="button" onClick={()=>setForm(f=>({...f,channel:v}))} className="btn btn-sm" style={{background:form.channel===v?'var(--grad-brand)':'transparent',color:form.channel===v?'white':'var(--t-2)',border:`1px solid ${form.channel===v?'var(--brand)':'var(--border-md)'}`,fontSize:12}}>
                    {l}
                  </button>
                ))}
              </div>
              {(form.channel==='whatsapp'||form.channel==='all_channels') && (
                <div style={{marginTop:10,padding:'8px 12px',background:'rgba(37,211,102,0.1)',borderRadius:8,fontSize:12,color:'#25D366',border:'1px solid rgba(37,211,102,0.3)'}}>
                  💬 Will send via WhatsApp Business to configured numbers. Set up numbers in the WhatsApp tab.
                </div>
              )}
            </div>

            {(form.channel==='whatsapp'||form.channel==='sms'||form.channel==='all_channels') && (
              <div style={{padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:'var(--r)',marginBottom:14,fontSize:12.5,color:'#92610A',lineHeight:1.65}}>
                ⚠ <strong>WhatsApp/SMS gateway not yet connected.</strong> The announcement will be saved to the platform feed. To enable real WhatsApp delivery, connect your WhatsApp Business API credentials in Settings → Integrations.
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-brand" style={{flex:1,justifyContent:'center',padding:'10px'}}>
                {form.channel==='platform'?'Publish to platform feed':'Save & queue for delivery'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={()=>setTab('feed')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── WHATSAPP SETUP ── */}
      {tab==='whatsapp' && (
        <div>
          <div style={{background:'rgba(37,211,102,0.08)',border:'1px solid rgba(37,211,102,0.25)',borderRadius:'var(--r-lg)',padding:'14px 18px',marginBottom:16,display:'flex',gap:12,alignItems:'flex-start'}}>
            <span style={{fontSize:28}}>💬</span>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:'#25D366',marginBottom:4}}>WhatsApp Business Integration</div>
              <div style={{fontSize:12.5,color:'var(--t-2)',lineHeight:1.65}}>
                Each campus uses its own WhatsApp Business number. Announcements sent via WhatsApp will be dispatched to members through their campus number. Enter the WhatsApp Business number for each branch below. In production, connect via the <strong style={{color:'var(--t-1)'}}>WhatsApp Business API (Meta)</strong> or <strong style={{color:'var(--t-1)'}}>Termii / Infobip</strong> as the gateway.
              </div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
            {branches.map(b=>(
              <div key={b.id} className="card" style={{padding:'14px 18px',borderLeft:`3px solid ${b.color}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{width:10,height:10,borderRadius:'50%',background:b.color,boxShadow:`0 0 6px ${b.color}`}}/>
                  <div style={{fontWeight:700,fontSize:13}}>{b.name}</div>
                  <span className="chip chip-gray" style={{marginLeft:'auto',fontSize:10}}>{b.country}</span>
                </div>
                <label style={{fontSize:11,fontWeight:600,color:'var(--t-3)',display:'block',marginBottom:5,letterSpacing:'0.05em',textTransform:'uppercase'}}>WhatsApp Business number</label>
                <div style={{display:'flex',gap:8}}>
                  <input className="input" value={waNumbers[b.id]||''} onChange={e=>setWaNumbers(prev=>({...prev,[b.id]:e.target.value}))} placeholder={b.country==='NG'?'+234 800 000 0000':b.country==='UK'?'+44 700 000 0000':'+1 000 000 0000'} style={{fontSize:12,fontFamily:'var(--font-mono)'}}/>
                  <button onClick={async () => {
                    persist('hicc_wa_numbers' as any, waNumbers)
                    if (supabase) {
                      await supabase.from('announcements').upsert({
                        id: `wa_number_${b.id}`,
                        title: `WhatsApp number: ${b.name}`,
                        body: waNumbers[b.id] || '',
                        scope: 'admin',
                        branch_id: b.id,
                      })
                    }
                  }} className="btn btn-sm" style={{flexShrink:0,background:waNumbers[b.id]?'var(--green-lt)':'var(--s-3)',color:waNumbers[b.id]?'var(--green)':'var(--t-3)',border:`1px solid ${waNumbers[b.id]?'rgba(16,185,129,0.3)':'var(--border)'}`,fontSize:11}}>
                    {waNumbers[b.id]?'✓ Saved':'Save'}
                  </button>
                </div>
                {waNumbers[b.id] && (
                  <div style={{marginTop:8,display:'flex',gap:6}}>
                    <a href={`https://wa.me/${waNumbers[b.id].replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{fontSize:11,background:'rgba(37,211,102,0.12)',color:'#25D366',border:'1px solid rgba(37,211,102,0.3)'}}>
                      💬 Test on WhatsApp
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          <SmsConfig />
        </div>
      )}
    </div>
  )
}
