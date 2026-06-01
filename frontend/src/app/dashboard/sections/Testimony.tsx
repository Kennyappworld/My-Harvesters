'use client'
import { useState } from 'react'
import { testimonies } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'

const CATS = ['All','Healing','Finance','Salvation','Breakthrough','Marriage','Career']
const CAT_COL: Record<string,string> = {
  Healing:'#10B981', Finance:'#F59E0B', Salvation:'#1B4332',
  Breakthrough:'#2B6CB0', Marriage:'#C9A84C', Career:'#14B8A6',
}

export default function Testimony() {
  const [items, setItems] = useState(() => hydrate('hicc_testimonies', testimonies.map(t=>({...t, hasCelebrated:false}))))
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', category:'Breakthrough', text:'' })
  const [saved, setSaved] = useState(false)

  const filtered = filter==='All' ? items : items.filter(t=>t.category===filter)

  const celebrate = (id:string) => {
    setItems(prev=>prev.map(t=>t.id===id?{...t,celebrating:t.hasCelebrated?t.celebrating-1:t.celebrating+1,hasCelebrated:!t.hasCelebrated}:t))
  }

  const submit = (e:React.FormEvent) => {
    e.preventDefault()
    setItems(prev=>[{id:`t${Date.now()}`,author:'You',branch:'Lekki HQ',initials:'BI',av:'brand',role:'Senior Pastor',date:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}),category:form.category,text:form.text,celebrating:0,comments:0,hasCelebrated:false},...prev])
    setSaved(true); setTimeout(()=>{setSaved(false);setShowForm(false);setForm({title:'',category:'Breakthrough',text:''})},2000)
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:'var(--font-display)'}}>Testimonies</div>
          <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>Cross-branch celebrations · {items.length} shared</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={()=>setShowForm(v=>!v)}>+ Share testimony</button>
      </div>

      <div className="tabs" style={{marginBottom:16}}>
        {CATS.map(c=><button key={c} className={`tab ${filter===c?'active':''}`} onClick={()=>setFilter(c)}>{c}</button>)}
      </div>

      {showForm && (
        <div className="card card-p" style={{marginBottom:16,maxWidth:560}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Share your testimony</div>
          {saved && <div style={{padding:'8px 12px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:12.5,color:'var(--green)',marginBottom:12,fontWeight:600}}>✓ Testimony shared — God be praised!</div>}
          <form onSubmit={submit}>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Category</label>
              <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {CATS.slice(1).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Your testimony *</label>
              <textarea className="input" rows={4} placeholder="Share what God has done…" value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} required style={{resize:'vertical'}}/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-brand btn-sm">Share testimony</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {filtered.map(t=>(
          <div key={t.id} className="card" style={{padding:'18px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div className={`av av-md av-${t.av}`}>{t.initials}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>{t.author}</div>
                  <div style={{fontSize:11,color:'var(--t-3)',marginTop:1}}>{t.branch} · {t.role} · {t.date}</div>
                </div>
              </div>
              <span style={{background:`${CAT_COL[t.category]||'var(--brand)'}20`,color:CAT_COL[t.category]||'var(--brand)',border:`1px solid ${CAT_COL[t.category]||'var(--brand)'}40`,padding:'2px 10px',borderRadius:100,fontSize:11,fontWeight:600}}>{t.category}</span>
            </div>
            <div style={{fontSize:13.5,color:'var(--t-1)',lineHeight:1.75,marginBottom:14,paddingLeft:46}}>{t.text}</div>
            <div style={{display:'flex',gap:12,alignItems:'center',paddingLeft:46}}>
              <button onClick={()=>celebrate(t.id)} className="btn btn-sm" style={{background:t.hasCelebrated?'rgba(245,158,11,0.15)':'transparent',border:`1px solid ${t.hasCelebrated?'var(--gold)':'var(--border-md)'}`,color:t.hasCelebrated?'var(--gold)':'var(--t-2)',gap:5}}>
                ⭐ {t.celebrating} celebrating
              </button>
              <span style={{fontSize:11.5,color:'var(--t-3)'}}>{t.comments} comments</span>
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{textAlign:'center',padding:'3rem',color:'var(--t-3)',fontSize:13}}>No testimonies in this category yet.</div>}
      </div>
    </div>
  )
}
