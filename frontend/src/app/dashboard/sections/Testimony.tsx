'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@/lib/useSession'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  : null

const CATS = ['Healing','Provision','Breakthrough','Salvation','Restoration','Family','Career','General']

const SAMPLES = [
  { id:'s1', author_name:'Sister Grace', category:'Healing', body:'After three months of illness the doctors said was incurable, God healed me completely. My last test came back clear. To God be the glory!', branch_id:'lekki', created_at: new Date(Date.now()-86400000*2).toISOString() },
  { id:'s2', author_name:'Brother Emmanuel', category:'Provision', body:'I was about to lose my home. I prayed and three days later I received an unexpected settlement from a case I had forgotten about. God is faithful!', branch_id:'ikeja', created_at: new Date(Date.now()-86400000*5).toISOString() },
  { id:'s3', author_name:'Deaconess Folake', category:'Career', body:'After 18 months of job searching, I received two offers in the same week — both better than what I had before. His timing is perfect.', branch_id:'lekki', created_at: new Date(Date.now()-86400000*7).toISOString() },
]

export default function Testimony() {
  const { user } = useSession()
  const [items, setItems] = useState<any[]>(SAMPLES)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', category: 'General' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!supabase) return
    setLoading(true)
    supabase
      .from('testimonies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setItems(data)
        setLoading(false)
      }, () => setLoading(false))
  }, [])

  // Real-time — new testimonies appear instantly
  useEffect(() => {
    if (!supabase) return
    const sub = supabase
      .channel('testimony_rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'testimonies' }, payload => {
        setItems(prev => [payload.new as any, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text.trim()) return
    const name = user?.name || 'Anonymous'
    const newItem = { id: Date.now().toString(), author_name: name, category: form.category, body: form.text, branch_id: user?.branch_id || 'lekki', created_at: new Date().toISOString() }
    setItems(prev => [newItem, ...prev])
    setSaved(true); setTimeout(() => setSaved(false), 3000)
    setForm({ text: '', category: 'General' }); setShowForm(false)
    if (supabase && user?.id) {
      await supabase.from('testimonies').insert({ author_id: user.id, author_name: name, branch_id: user.branch_id || 'lekki', category: form.category, body: form.text })
    }
  }

  const filtered = filter === 'All' ? items : items.filter((i: any) => i.category === filter)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:4 }}>Testimonies</h2>
          <div style={{ fontSize:12, color:'var(--t-2)' }}>
            Declare what God has done · {items.length} testimonies
            {supabase && <span style={{ marginLeft:8, color:'#22c55e', fontWeight:600 }}>● Live</span>}
          </div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancel' : '+ Share testimony'}</button>
      </div>

      {saved && <div style={{ padding:'10px 14px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:13, color:'var(--green)', marginBottom:16, fontWeight:600 }}>✓ Testimony shared! Praise God!</div>}

      {showForm && (
        <form onSubmit={submit} className="card card-p" style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Share what God has done</div>
          <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ marginBottom:10 }}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea className="input" rows={5} placeholder="Tell us what God did…" value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} style={{ resize:'vertical', marginBottom:10 }}/>
          <button type="submit" className="btn btn-brand btn-sm">Share testimony</button>
        </form>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {['All', ...CATS].map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`btn btn-sm ${filter===c?'btn-brand':'btn-ghost'}`}>{c}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)', fontSize:13 }}>Loading testimonies…</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map((t: any) => (
          <div key={t.id} className="card card-p" style={{ borderLeft:'3px solid var(--brand)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="av av-md av-brand">{(t.author_name||'A').slice(0,2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{t.author_name || 'Anonymous'}</div>
                  <div style={{ fontSize:11, color:'var(--t-3)' }}>{t.branch_id} · {new Date(t.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, background:'var(--green-lt)', color:'var(--green)' }}>{t.category}</span>
            </div>
            <p style={{ fontSize:13.5, color:'var(--t-1)', lineHeight:1.75 }}>{t.body}</p>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>No testimonies in this category yet. Be the first to share!</div>}
      </div>
    </div>
  )
}
