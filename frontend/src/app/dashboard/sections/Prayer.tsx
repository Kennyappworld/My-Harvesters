'use client'
import { useState, useEffect } from 'react'
import { prayerRequests } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@/lib/useSession'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

export default function Prayer() {
  const { user } = useSession()
  const [requests, setRequests] = useState(() => hydrate('hicc_prayer_requests', prayerRequests.map(r => ({ ...r, isInterceding: false }))))
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', scope: 'unit' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load from Supabase on mount
  useEffect(() => {
    if (!supabase) return
    setLoading(true)
    supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped = data.map((r: any) => ({
            id: r.id,
            text: r.body,
            author: r.author_name || 'Anonymous',
            branch: r.branch_id || 'lekki',
            branchId: r.branch_id || 'lekki',
            initials: (r.author_name || 'A').slice(0, 2).toUpperCase(),
            av: 'brand',
            time: new Date(r.created_at).toLocaleDateString(),
            scope: r.branch_id === 'all' ? 'global' : r.elevated ? 'branch' : 'unit',
            elevated: !!r.elevated,
            interceding: 0,
            responses: 0,
            isInterceding: false,
          }))
          setRequests(mapped)
        }
        setLoading(false)
      }, () => setLoading(false))
  }, [])

  // Real-time subscription for new prayer requests
  useEffect(() => {
    if (!supabase) return
    const sub = supabase
      .channel('prayer_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prayer_requests' }, payload => {
        const r = payload.new as any
        setRequests((prev: any[]) => [{
          id: r.id, text: r.body, author: r.author_name || 'Anonymous',
          branch: r.branch_id || 'lekki', branchId: r.branch_id || 'lekki',
          initials: (r.author_name || 'A').slice(0, 2).toUpperCase(),
          av: 'brand', time: 'just now',
          scope: r.elevated ? 'branch' : 'unit',
          elevated: !!r.elevated, responses: 0,
          interceding: 0, isInterceding: false,
        }, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  const toggle = (id: string) =>
    setRequests((prev: any[]) => { const n = prev.map(r => r.id === id ? { ...r, interceding: r.isInterceding ? r.interceding - 1 : r.interceding + 1, isInterceding: !r.isInterceding } : r); persist('hicc_prayer_requests', n); return n })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text.trim()) return
    const name = user?.name || 'Anonymous'
    const newReq = {
      id: Date.now().toString(), text: form.text, author: name,
      initials: name.slice(0, 2).toUpperCase(), av: 'brand', time: 'just now',
      scope: form.scope as any, interceding: 0, isInterceding: false,
    }
    setRequests((prev: any[]) => [newReq, ...prev])
    setSaved(true); setTimeout(() => setSaved(false), 3000)
    setForm({ text: '', scope: 'unit' }); setShowForm(false)

    if (supabase && user?.id) {
      await supabase.from('prayer_requests').insert({
        author_id: user.id, author_name: name,
        branch_id: user.branch_id || 'lekki',
        body: form.text, elevated: form.scope === 'branch' || form.scope === 'global',
      })
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter((r: any) => r.scope === filter)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:4 }}>Prayer Wall</h2>
          <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>
            Unit → Branch → Global elevation · {requests.length} active requests
            {supabase && <span style={{ marginLeft:8, color:'#22c55e', fontWeight:600 }}>● Live</span>}
          </div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Post request'}
        </button>
      </div>

      {saved && <div style={{ padding:'10px 14px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:13, color:'var(--green)', marginBottom:16, fontWeight:600 }}>✓ Prayer request posted to the wall.</div>}

      {showForm && (
        <form onSubmit={submit} className="card card-p" style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Post a prayer request</div>
          <textarea className="input" rows={3} placeholder="Share your prayer request…" value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} style={{ resize:'vertical', marginBottom:10 }}/>
          <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between' }}>
            <select className="select" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} style={{ flex:1 }}>
              <option value="unit">My Unit</option>
              <option value="branch">Branch</option>
              <option value="global">Global (all branches)</option>
            </select>
            <button type="submit" className="btn btn-brand btn-sm" style={{ flexShrink:0 }}>Post request</button>
          </div>
        </form>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {['all','unit','branch','global'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter===f?'btn-brand':'btn-ghost'}`} style={{ textTransform:'capitalize' }}>{f === 'all' ? 'All requests' : f}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)', fontSize:13 }}>Loading prayer requests…</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map((r: any) => (
          <div key={r.id} className="card card-p" style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <div className={`av av-md av-${r.av}`}>{r.initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:13 }}>{r.author}</span>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'var(--s-3)', color:'var(--t-2)', textTransform:'capitalize' }}>{r.scope}</span>
                  <span style={{ fontSize:11, color:'var(--t-3)' }}>{r.time}</span>
                </div>
              </div>
              <p style={{ fontSize:13, color:'var(--t-1)', lineHeight:1.6, marginBottom:8 }}>{r.text}</p>
              <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <button onClick={() => toggle(r.id)} style={{ fontSize:12, color: r.isInterceding ? 'var(--brand)' : 'var(--t-3)', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight: r.isInterceding ? 700 : 400 }}>
                  🙏 {r.isInterceding ? 'Interceding' : 'Intercede'} {r.interceding > 0 && `· ${r.interceding}`}
                </button>
                {r.elevated && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:100, background:'rgba(201,168,76,0.12)', color:'#92610A', fontWeight:600 }}>⬆ Elevated</span>}
                <button onClick={async () => {
                  if (!supabase) return
                  await supabase.from('prayer_requests').update({ answered: true }).eq('id', r.id)
                  setRequests((prev: any[]) => prev.filter((p:any) => p.id !== r.id))
                }} style={{ fontSize:11, color:'var(--green)', background:'var(--green-lt)', border:'1px solid rgba(27,158,90,0.2)', borderRadius:100, padding:'2px 8px', cursor:'pointer', fontWeight:600 }}>
                  ✓ Answered
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>No prayer requests in this scope yet.</div>}
      </div>
    </div>
  )
}
