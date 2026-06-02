'use client'
import { useState, useEffect } from 'react'
import { branches } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { useSession, hasRole } from '@/lib/useSession'
import { notify } from '@/lib/toast'
import { createClient } from '@supabase/supabase-js'
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

type GivingRecord = {
  id: string
  type: 'tithe' | 'offering' | 'seed' | 'special' | 'building'
  amount: number
  currency: 'NGN' | 'GBP' | 'USD'
  branch: string
  branchId: string
  date: string
  service: string
  recordedBy: string
  note: string
}

const CURRENCY_SYMBOL: Record<string, string> = { NGN: '₦', GBP: '£', USD: '$' }
const CURRENCY_RATE_TO_NGN: Record<string, number> = { NGN: 1, GBP: 2000, USD: 1600 }
const TYPE_COLOR: Record<string, string> = {
  tithe:    '#1B4332',
  offering: '#C9A84C',
  seed:     '#0D9488',
  special:  '#7C3AED',
  building: '#C05621',
}

// Realistic sample data
const SAMPLE_RECORDS: GivingRecord[] = [
  { id:'g1', type:'tithe',    amount:4850000, currency:'NGN', branch:'Lekki HQ',      branchId:'lekki',        date:'2026-06-01', service:'1st Service (8AM)',  recordedBy:'Finance Team', note:'' },
  { id:'g2', type:'offering', amount:1230000, currency:'NGN', branch:'Lekki HQ',      branchId:'lekki',        date:'2026-06-01', service:'2nd Service (10AM)', recordedBy:'Finance Team', note:'' },
  { id:'g3', type:'tithe',    amount:3210000, currency:'NGN', branch:'Gbagada',        branchId:'gbagada',      date:'2026-06-01', service:'1st Service (8AM)',  recordedBy:'Finance Team', note:'' },
  { id:'g4', type:'tithe',    amount:2680000, currency:'NGN', branch:'Ikeja',          branchId:'ikeja',        date:'2026-06-01', service:'Single Service',     recordedBy:'Finance Team', note:'' },
  { id:'g5', type:'seed',     amount:580000,  currency:'NGN', branch:'Abuja',          branchId:'abuja',        date:'2026-06-01', service:'Single Service',     recordedBy:'Finance Team', note:'Prophetic Seed Sunday' },
  { id:'g6', type:'tithe',    amount:4200,    currency:'GBP', branch:'London UK',      branchId:'london',       date:'2026-06-01', service:'Single Service',     recordedBy:'UK Finance',   note:'' },
  { id:'g7', type:'tithe',    amount:3100,    currency:'USD', branch:'Houston USA',    branchId:'houston',      date:'2026-06-01', service:'Single Service',     recordedBy:'US Finance',   note:'' },
  { id:'g8', type:'offering', amount:980000,  currency:'NGN', branch:'Anthony Village',branchId:'anthony',     date:'2026-05-25', service:'1st Service (8AM)',  recordedBy:'Finance Team', note:'' },
  { id:'g9', type:'building', amount:1500000, currency:'NGN', branch:'Lekki HQ',      branchId:'lekki',        date:'2026-05-25', service:'2nd Service (10AM)', recordedBy:'Finance Team', note:'Building Fund Drive' },
  { id:'g10',type:'tithe',    amount:760000,  currency:'NGN', branch:'Ibadan',         branchId:'ibadan',       date:'2026-05-25', service:'Single Service',     recordedBy:'Finance Team', note:'' },
]

const MONTHLY_TREND = [
  { month:'Jan', NGN:28400000, GBP:18200, USD:12400 },
  { month:'Feb', NGN:26100000, GBP:16800, USD:11200 },
  { month:'Mar', NGN:31200000, GBP:19400, USD:13100 },
  { month:'Apr', NGN:29700000, GBP:18900, USD:12800 },
  { month:'May', NGN:34500000, GBP:21200, USD:14600 },
  { month:'Jun', NGN:22800000, GBP:14100, USD:9600  },
]

const BRANCH_TOTALS = [
  { name:'Lekki HQ',       NGN:9750000 },
  { name:'Gbagada',        NGN:7200000 },
  { name:'Ikeja',          NGN:5800000 },
  { name:'Anthony',        NGN:3900000 },
  { name:'Abuja',          NGN:3400000 },
  { name:'Port Harcourt',  NGN:2600000 },
  { name:'Ibadan',         NGN:1500000 },
  { name:'London (₦eq.)',  NGN:8400000 },
  { name:'Houston (₦eq.)', NGN:4960000 },
]

function fmt(n: number, curr = 'NGN') {
  const sym = CURRENCY_SYMBOL[curr] || '₦'
  if (n >= 1_000_000) return `${sym}${(n/1_000_000).toFixed(2)}m`
  if (n >= 1_000) return `${sym}${(n/1_000).toFixed(1)}k`
  return `${sym}${n.toLocaleString()}`
}

export default function Giving() {
  const { user } = useSession()
  const isAdmin = hasRole(user?.role as any || 'worker', 'senior_pastor')
  const [records, setRecords] = useState<GivingRecord[]>(() => hydrate('hicc_giving' as any, SAMPLE_RECORDS))
  const [tab, setTab] = useState<'overview'|'records'|'log'>('overview')
  const [filterBranch, setFilterBranch] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterCurr, setFilterCurr] = useState('all')
  const [form, setForm] = useState({ type:'tithe', amount:'', currency:'NGN', branch: user?.branch_id || 'lekki', service:'1st Service (8AM)', note:'' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currView, setCurrView] = useState<'NGN'|'GBP'|'USD'>('NGN')

  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const { data } = await supabase.from('giving_records').select('*').order('created_at', { ascending: false }).limit(200)
        if (data && data.length > 0) {
          const mapped = data.map((r:any) => ({
            id: r.id, type: r.giving_type, amount: r.amount, currency: r.currency || 'NGN',
            branch: branches.find(b=>b.id===r.branch_id)?.name || r.branch_id,
            branchId: r.branch_id, date: r.service_date, service: r.service,
            recordedBy: r.recorded_by || 'Finance Team', note: r.note || '',
          }))
          setRecords(mapped)
          persist('hicc_giving' as any, mapped)
        }
      } catch {}
    }
    load()
  }, [])

  const logGiving = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const br = branches.find(b => b.id === form.branch)
    const newRecord: GivingRecord = {
      id: `g${Date.now()}`,
      type: form.type as any,
      amount: Number(form.amount.replace(/,/g,'')),
      currency: form.currency as any,
      branch: br?.name || form.branch,
      branchId: form.branch,
      date: new Date().toISOString().slice(0,10),
      service: form.service,
      recordedBy: user?.name || 'Staff',
      note: form.note,
    }
    setRecords(prev => [newRecord, ...prev])
    persist('hicc_giving' as any, [newRecord, ...records])
    if (supabase) {
      try {
        await supabase.from('giving_records').insert({
          giving_type: newRecord.type,
          amount: newRecord.amount,
          currency: newRecord.currency,
          branch_id: newRecord.branchId,
          service_date: newRecord.date,
          service: newRecord.service,
          recorded_by: newRecord.recordedBy,
          note: newRecord.note,
        })
      } catch {}
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setTab('records'); setForm(f=>({...f,amount:'',note:''})) }, 2000)
  }

  const filtered = records
    .filter(r => filterBranch === 'all' || r.branchId === filterBranch)
    .filter(r => filterType === 'all' || r.type === filterType)
    .filter(r => filterCurr === 'all' || r.currency === filterCurr)

  const totalNGN = filtered.reduce((a,r) => a + r.amount * (CURRENCY_RATE_TO_NGN[r.currency] || 1), 0)
  const thisSundayRecords = records.filter(r => r.date === '2026-06-01')
  const thisSundayNGN = thisSundayRecords.reduce((a,r) => a + r.amount * (CURRENCY_RATE_TO_NGN[r.currency] || 1), 0)
  const lastSundayNGN = records.filter(r=>r.date==='2026-05-25').reduce((a,r) => a + r.amount * (CURRENCY_RATE_TO_NGN[r.currency] || 1), 0)
  const growth = lastSundayNGN > 0 ? ((thisSundayNGN - lastSundayNGN)/lastSundayNGN*100).toFixed(1) : '0'

  const byType = ['tithe','offering','seed','special','building'].map(t => ({
    type: t,
    total: filtered.filter(r=>r.type===t).reduce((a,r)=>a+r.amount*(CURRENCY_RATE_TO_NGN[r.currency]||1),0)
  }))

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Giving & Tithes</div>
          <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>Multi-currency · Multi-branch · Service breakdown</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={()=>setTab('log')}>+ Log giving</button>
      </div>

      {/* Currency toggle */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {(['NGN','GBP','USD'] as const).map(c => (
          <button key={c} className={`btn btn-sm ${currView===c?'btn-brand':''}`} style={{ fontSize:11 }} onClick={()=>setCurrView(c)}>
            {CURRENCY_SYMBOL[c]} {c}
          </button>
        ))}
      </div>

      {/* KPI tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { l:'This Sunday',   v: fmt(thisSundayNGN), s: `${growth}% vs last wk`, pos: Number(growth)>0 },
          { l:'This month',    v: fmt(MONTHLY_TREND[5].NGN), s:'June 2026 (running)' },
          { l:'UK (June)',     v: `£${(MONTHLY_TREND[5].GBP/1000).toFixed(1)}k`, s:'London campus' },
          { l:'US (June)',     v: `$${(MONTHLY_TREND[5].USD/1000).toFixed(1)}k`, s:'Houston campus' },
          { l:'YTD (₦ equiv.)',v: fmt(MONTHLY_TREND.reduce((a,m)=>a+m.NGN,0)), s:'All branches combined' },
        ].map(m => (
          <div key={m.l} className="metric-tile metric-tile-accent">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.4rem' }}>{m.v}</div>
            {m.s && <div style={{ fontSize:11, color: m.pos ? 'var(--green)' : 'var(--t-3)', marginTop:2 }}>{m.s}</div>}
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom:16 }}>
        {([['overview','Overview & Trends'],['records','All Records'],['log','Log Giving']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          {/* Monthly trend chart */}
          <div className="card card-p" style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>Monthly giving trend — {currView === 'NGN' ? 'Nigeria (₦)' : currView === 'GBP' ? 'UK (£)' : 'USA ($)'}</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MONTHLY_TREND}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--t-3)' }} axisLine={false} tickLine={false}/>
                <Tooltip
                  contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
                  formatter={(v:any) => [fmt(Number(v), currView), currView]}
                />
                <Area type="monotone" dataKey={currView} stroke="var(--brand)" strokeWidth={2} fill="url(#gv)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {/* By type */}
            <div className="card card-p">
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>By giving type (₦ equiv.)</div>
              {byType.filter(t=>t.total>0).sort((a,b)=>b.total-a.total).map(t => (
                <div key={t.type} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{t.type}</span>
                    <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--brand)' }}>{fmt(t.total)}</span>
                  </div>
                  <div style={{ height:5, background:'var(--s-4)', borderRadius:100, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:100, background: TYPE_COLOR[t.type] || 'var(--brand)', width:`${byType[0].total>0?(t.total/byType[0].total*100):0}%`, transition:'width .4s' }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* By branch */}
            <div className="card card-p">
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>By branch (₦ equiv.)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={BRANCH_TOTALS} layout="vertical" margin={{ left:0, right:20, top:0, bottom:0 }}>
                  <XAxis type="number" tick={{ fontSize:10, fill:'var(--t-3)' }} tickFormatter={v=>fmt(v)} axisLine={false} tickLine={false}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:'var(--t-2)' }} width={80} axisLine={false} tickLine={false}/>
                  <Tooltip
                    contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
                    formatter={(v:any) => [fmt(Number(v)), 'Total']}
                  />
                  <Bar dataKey="NGN" fill="var(--brand)" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* This Sunday breakdown */}
          <div className="card card-p">
            <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>This Sunday — 1 June 2026</div>
            <table className="tbl">
              <thead><tr><th>Branch</th><th>Type</th><th>Service</th><th>Amount</th><th>Currency</th></tr></thead>
              <tbody>
                {thisSundayRecords.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:600 }}>{r.branch}</td>
                    <td><span style={{ background:`${TYPE_COLOR[r.type]}20`, color:TYPE_COLOR[r.type], padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:600, textTransform:'capitalize' }}>{r.type}</span></td>
                    <td style={{ fontSize:12 }}>{r.service}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)' }}>{CURRENCY_SYMBOL[r.currency]}{r.amount.toLocaleString()}</td>
                    <td><span className="chip chip-green">{r.currency}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:12, padding:'10px 14px', background:'var(--brand-lt)', borderRadius:'var(--r)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:13 }}>Total this Sunday (₦ equivalent)</span>
              <span style={{ fontSize:22, fontWeight:900, fontFamily:'var(--font-display)', color:'var(--brand)' }}>{fmt(thisSundayNGN)}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div>
          {/* Filters */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            <select className="input" style={{ width:'auto',fontSize:12,padding:'6px 10px' }} value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="input" style={{ width:'auto',fontSize:12,padding:'6px 10px' }} value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="all">All types</option>
              {['tithe','offering','seed','special','building'].map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
            <select className="input" style={{ width:'auto',fontSize:12,padding:'6px 10px' }} value={filterCurr} onChange={e=>setFilterCurr(e.target.value)}>
              <option value="all">All currencies</option>
              {['NGN','GBP','USD'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="card card-p">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{filtered.length} records</div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--brand)' }}>Total: {fmt(totalNGN)} <span style={{ fontSize:11, fontWeight:400, color:'var(--t-3)' }}>(₦ equiv.)</span></div>
            </div>
            <table className="tbl">
              <thead><tr><th>Date</th><th>Branch</th><th>Service</th><th>Type</th><th>Amount</th><th>Logged by</th></tr></thead>
              <tbody>
                {filtered.slice(0,50).map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:11.5 }}>{r.date}</td>
                    <td style={{ fontWeight:600 }}>{r.branch}</td>
                    <td style={{ fontSize:12, color:'var(--t-2)' }}>{r.service}</td>
                    <td><span style={{ background:`${TYPE_COLOR[r.type]}20`, color:TYPE_COLOR[r.type], padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:600, textTransform:'capitalize' }}>{r.type}</span></td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)' }}>{CURRENCY_SYMBOL[r.currency]}{r.amount.toLocaleString()}</td>
                    <td style={{ fontSize:11.5, color:'var(--t-3)' }}>{r.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && <div style={{ textAlign:'center', fontSize:12, color:'var(--t-3)', marginTop:10 }}>Showing 50 of {filtered.length}</div>}
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="card card-p" style={{ maxWidth:520 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Log giving record</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16 }}>Enter amounts exactly as counted. Multi-currency supported.</div>
          {saved && <div style={{ padding:'10px 14px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--green)', marginBottom:16, fontWeight:600 }}>✓ Giving record logged successfully.</div>}
          <form onSubmit={logGiving}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Type *</label>
                <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {['tithe','offering','seed','special','building'].map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Currency *</label>
                <select className="input" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                  <option value="NGN">₦ NGN — Naira</option>
                  <option value="GBP">£ GBP — Pounds</option>
                  <option value="USD">$ USD — Dollars</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Amount *</label>
                <input className="input" type="number" min="0" step="any" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="e.g. 850000" required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Branch *</label>
                <select className="input" value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Service</label>
                <select className="input" value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))}>
                  {['1st Service (8AM)','2nd Service (10AM)','3rd Service (12PM)','Single Service (9AM)','Evening Service (6PM)'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Note (optional)</label>
                <input className="input" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="e.g. Building fund special offering"/>
              </div>
            </div>
            {form.amount && (
              <div style={{ padding:'10px 14px', background:'var(--brand-lt)', borderRadius:'var(--r)', fontSize:12.5, marginBottom:14 }}>
                You are logging: <strong>{CURRENCY_SYMBOL[form.currency]}{Number(form.amount).toLocaleString()}</strong> {form.currency} · {form.type} · {branches.find(b=>b.id===form.branch)?.name}
                {form.currency !== 'NGN' && <span style={{ color:'var(--t-3)', marginLeft:8 }}>(≈ {fmt(Number(form.amount)*CURRENCY_RATE_TO_NGN[form.currency])} NGN equiv.)</span>}
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="btn btn-brand" style={{ flex:1, justifyContent:'center', padding:'10px' }} disabled={saving}>
                {saving ? 'Saving…' : 'Log record'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={()=>setTab('overview')}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
