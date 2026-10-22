'use client'
/**
 * GlobalSearch — Spotlight-style cross-section search with date range
 *
 * Features:
 *  - Cmd/Ctrl+K to open, Escape to close
 *  - Searches: members, announcements, events, prayer requests, soul records
 *  - Optional from/to date range filter
 *  - Navigate to result section on click
 *  - Keyboard navigation (↑ / ↓ / Enter)
 *  - Recent searches remembered in sessionStorage (no PII — just query strings)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!)
  : null

type Result = {
  id:      string
  type:    'member' | 'announcement' | 'event' | 'prayer' | 'soul'
  title:   string
  sub:     string
  date?:   string
  section: string
}

type Props = {
  onNavigate: (section: string, extra?: any) => void
}

const TYPE_ICONS: Record<string, string> = {
  member: '👤', announcement: '📢', event: '🗓️', prayer: '🙏', soul: '✨',
}
const TYPE_LABELS: Record<string, string> = {
  member: 'Member', announcement: 'Announcement', event: 'Event', prayer: 'Prayer request', soul: 'Soul record',
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background:'rgba(201,168,76,0.25)', color:'#c9a84c', borderRadius:3, padding:'0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const RECENT_KEY = 'sanctuaryhq_recent_searches'
function getRecent(): string[] {
  try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecent(q: string) {
  try {
    const prev = getRecent().filter(r => r !== q)
    sessionStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)))
  } catch {}
}

export default function GlobalSearch({ onNavigate }: Props) {
  const [open,     setOpen]     = useState(false)
  const [query,    setQuery]    = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [results,  setResults]  = useState<Result[]>([])
  const [loading,  setLoading]  = useState(false)
  const [cursor,   setCursor]   = useState(0)
  const [recent,   setRecent]   = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setRecent(getRecent())
      setQuery('')
      setResults([])
    }
  }, [open])

  // Debounced search
  const runSearch = useCallback(async (q: string, from: string, to: string) => {
    if (!q.trim() && !from && !to) { setResults([]); return }
    setLoading(true)
    const res: Result[] = []

    if (!supabase) {
      // No DB — search is unavailable; show friendly message
      setResults([{ id:'no-db', type:'announcement', title:'Supabase not connected', sub:'Connect Supabase to enable live search', section:'Settings' }])
      setLoading(false)
      return
    }

    const searchQ = q.trim()

    await Promise.all([
      // Members
      (async () => {
        let q2 = supabase.from('workers').select('id, full_name, phone, email, created_at, branch_id').limit(6)
        if (searchQ) q2 = q2.or(`full_name.ilike.%${searchQ}%,email.ilike.%${searchQ}%,phone.ilike.%${searchQ}%`)
        if (from)    q2 = q2.gte('created_at', from)
        if (to)      q2 = q2.lte('created_at', to + 'T23:59:59')
        const { data } = await q2
        data?.forEach((w: any) => res.push({
          id: w.id, type: 'member',
          title: w.full_name || 'Unknown',
          sub: `${w.phone || w.email || '—'} · ${w.branch_id || '—'}`,
          date: w.created_at?.slice(0,10),
          section: 'Members',
        }))
      })(),

      // Announcements
      (async () => {
        let q2 = supabase.from('announcements').select('id, title, body, created_at').limit(5)
        if (searchQ) q2 = q2.or(`title.ilike.%${searchQ}%,body.ilike.%${searchQ}%`)
        if (from)    q2 = q2.gte('created_at', from)
        if (to)      q2 = q2.lte('created_at', to + 'T23:59:59')
        q2 = q2.order('created_at', { ascending: false })
        const { data } = await q2
        data?.forEach((a: any) => res.push({
          id: a.id, type: 'announcement',
          title: a.title || 'Announcement',
          sub: (a.body || '').slice(0, 80),
          date: a.created_at?.slice(0,10),
          section: 'Announcements',
        }))
      })(),

      // Events
      (async () => {
        let q2 = supabase.from('events').select('id, title, location, date').limit(5)
        if (searchQ) q2 = q2.or(`title.ilike.%${searchQ}%,location.ilike.%${searchQ}%`)
        if (from)    q2 = q2.gte('date', from)
        if (to)      q2 = q2.lte('date', to)
        q2 = q2.order('date', { ascending: false })
        const { data } = await q2
        data?.forEach((ev: any) => res.push({
          id: ev.id, type: 'event',
          title: ev.title || 'Event',
          sub: ev.location || '—',
          date: ev.date,
          section: 'Events',
        }))
      })(),

      // Soul records
      (async () => {
        if (!searchQ) return
        const { data } = await supabase.from('soul_records')
          .select('id, name, phone, created_at, decision_type')
          .or(`name.ilike.%${searchQ}%,phone.ilike.%${searchQ}%`)
          .limit(5)
        data?.forEach((s: any) => res.push({
          id: s.id, type: 'soul',
          title: s.name || 'Soul record',
          sub: `${s.decision_type || 'Decision'} · ${s.phone || '—'}`,
          date: s.created_at?.slice(0,10),
          section: 'SoulTracker',
        }))
      })(),
    ])

    setResults(res)
    setCursor(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runSearch(query, fromDate, toDate), 300)
    return () => clearTimeout(timerRef.current)
  }, [query, fromDate, toDate, runSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c+1, results.length-1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c-1, 0)) }
    if (e.key === 'Enter' && results[cursor]) { handleSelect(results[cursor]) }
  }

  const handleSelect = (r: Result) => {
    if (query.trim()) saveRecent(query.trim())
    setOpen(false)
    // Navigate + optionally pre-fill search
    onNavigate(r.section, r.type === 'member' ? { memberSearch: r.title } : undefined)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      title="Global search (⌘K)"
      style={{
        display:'flex', alignItems:'center', gap:8,
        height:36, padding:'0 14px', borderRadius:9,
        background:'var(--s-3)', border:'1px solid var(--border)',
        color:'var(--t-2)', cursor:'pointer', fontSize:13,
        transition:'all .15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(201,168,76,0.35)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border)' }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <span>Search…</span>
      <kbd style={{
        fontSize:10, padding:'1px 5px', borderRadius:4,
        background:'var(--s-4)', border:'1px solid var(--border)',
        color:'var(--t-3)', fontFamily:'var(--font-mono)',
      }}>⌘K</kbd>
    </button>
  )

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'10vh', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ width:'min(620px, 94vw)', maxHeight:'72vh', display:'flex', flexDirection:'column', borderRadius:16, background:'var(--s-2)', border:'1px solid var(--border-md)', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search members, events, announcements…"
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:15, color:'var(--t-1)', fontFamily:'var(--font-body)' }}
          />
          {loading && <svg style={{animation:'spin .75s linear infinite',flexShrink:0}} viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="16" height="16"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
          <kbd onClick={() => setOpen(false)} style={{ fontSize:10, padding:'2px 6px', borderRadius:5, background:'var(--s-4)', border:'1px solid var(--border)', color:'var(--t-3)', cursor:'pointer', fontFamily:'var(--font-mono)' }}>ESC</kbd>
        </div>

        {/* Date range row */}
        <div style={{ display:'flex', gap:8, padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--s-3)', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--t-3)', whiteSpace:'nowrap' }}>Date range:</span>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}
            style={{ flex:1, height:30, padding:'0 8px', background:'var(--s-4)', border:'1px solid var(--border)', borderRadius:7, color:'var(--t-1)', fontSize:12, outline:'none' }}/>
          <span style={{ fontSize:11, color:'var(--t-3)' }}>to</span>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}
            style={{ flex:1, height:30, padding:'0 8px', background:'var(--s-4)', border:'1px solid var(--border)', borderRadius:7, color:'var(--t-1)', fontSize:12, outline:'none' }}/>
          {(fromDate||toDate) && (
            <button onClick={()=>{setFromDate('');setToDate('')}} style={{ background:'none', border:'none', color:'var(--t-3)', cursor:'pointer', fontSize:13, padding:'0 4px' }}>✕</button>
          )}
        </div>

        {/* Results */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {/* Recent searches (when no query) */}
          {!query.trim() && !fromDate && !toDate && recent.length > 0 && (
            <div style={{ padding:'10px 16px 6px' }}>
              <div style={{ fontSize:10.5, color:'var(--t-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Recent searches</div>
              {recent.map(r => (
                <button key={r} onClick={() => setQuery(r)}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', borderRadius:9, background:'none', border:'none', cursor:'pointer', color:'var(--t-2)', fontSize:13, textAlign:'left' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--s-3)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='none')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && results.length === 0 && (query.trim() || fromDate || toDate) && (
            <div style={{ padding:'32px', textAlign:'center', color:'var(--t-3)', fontSize:13 }}>
              No results for "<strong style={{color:'var(--t-2)'}}>{query}</strong>"
              {(fromDate || toDate) && <span> in the selected date range</span>}
            </div>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <div style={{ padding:'8px' }}>
              {results.map((r, i) => (
                <button
                  key={r.id + i}
                  onClick={() => handleSelect(r)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, width:'100%', padding:'10px 12px',
                    borderRadius:10, background: cursor===i ? 'var(--s-3)' : 'none',
                    border: cursor===i ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                    cursor:'pointer', textAlign:'left',
                    transition:'background .1s',
                  }}
                  onMouseEnter={() => setCursor(i)}
                >
                  <span style={{ fontSize:18, width:28, textAlign:'center', flexShrink:0 }}>{TYPE_ICONS[r.type]}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:600, color:'var(--t-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {highlight(r.title, query)}
                    </div>
                    <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {r.sub}
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ fontSize:10.5, padding:'2px 7px', borderRadius:5, background:'var(--s-4)', color:'var(--t-3)', border:'1px solid var(--border)', marginBottom:3 }}>{TYPE_LABELS[r.type]}</div>
                    {r.date && <div style={{ fontSize:10, color:'var(--t-3)' }}>{r.date}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding:'8px 16px', borderTop:'1px solid var(--border)', background:'var(--s-3)', display:'flex', gap:16, fontSize:10.5, color:'var(--t-3)' }}>
          <span><kbd style={{padding:'1px 4px',borderRadius:3,background:'var(--s-4)',border:'1px solid var(--border)',fontFamily:'monospace'}}>↑↓</kbd> Navigate</span>
          <span><kbd style={{padding:'1px 4px',borderRadius:3,background:'var(--s-4)',border:'1px solid var(--border)',fontFamily:'monospace'}}>↵</kbd> Open</span>
          <span><kbd style={{padding:'1px 4px',borderRadius:3,background:'var(--s-4)',border:'1px solid var(--border)',fontFamily:'monospace'}}>ESC</kbd> Close</span>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
