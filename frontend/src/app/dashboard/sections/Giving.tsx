'use client'
import { useState, useEffect } from 'react'
import { branches } from '@/lib/data'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@/lib/useSession'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

const CURRENCY: Record<string, { symbol: string; code: string; rate: number }> = {
  lekki:        { symbol: '₦', code: 'NGN', rate: 1 },
  gbagada:      { symbol: '₦', code: 'NGN', rate: 1 },
  ikeja:        { symbol: '₦', code: 'NGN', rate: 1 },
  anthony:      { symbol: '₦', code: 'NGN', rate: 1 },
  abuja:        { symbol: '₦', code: 'NGN', rate: 1 },
  portharcourt: { symbol: '₦', code: 'NGN', rate: 1 },
  ibadan:       { symbol: '₦', code: 'NGN', rate: 1 },
  london:       { symbol: '£', code: 'GBP', rate: 2010 },  // 1 GBP ≈ ₦2010
  houston:      { symbol: '$', code: 'USD', rate: 1580 },  // 1 USD ≈ ₦1580
}

const GIVING_TYPES = ['Tithe', 'Offering', 'Seed', 'Special Gift', 'Building Fund', 'Missions', 'Other']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Simulated monthly giving data (per branch, NGN equivalent)
const MONTHLY_GIVING = [
  { month:'Jan', lekki:48200000, gbagada:31400000, ikeja:26100000, anthony:19800000, abuja:22300000, portharcourt:14600000, ibadan:7200000, london:18900000, houston:13200000 },
  { month:'Feb', lekki:51800000, gbagada:34200000, ikeja:27900000, anthony:21300000, abuja:23800000, portharcourt:15900000, ibadan:7800000, london:20400000, houston:14100000 },
  { month:'Mar', lekki:55400000, gbagada:36100000, ikeja:29200000, anthony:22400000, abuja:25100000, portharcourt:16800000, ibadan:8300000, london:21600000, houston:15000000 },
  { month:'Apr', lekki:52100000, gbagada:33600000, ikeja:28400000, anthony:21100000, abuja:24200000, portharcourt:15400000, ibadan:7900000, london:20100000, houston:14500000 },
  { month:'May', lekki:58700000, gbagada:38200000, ikeja:31800000, anthony:23900000, abuja:27400000, portharcourt:17900000, ibadan:8900000, london:23100000, houston:16200000 },
]

// Per-branch giving breakdown by type (%)
const TYPE_SPLIT: Record<string, Record<string,number>> = {
  lekki:   { Tithe:42, Offering:28, Seed:12, 'Special Gift':8, 'Building Fund':6, Missions:4 },
  gbagada: { Tithe:40, Offering:30, Seed:11, 'Special Gift':9, 'Building Fund':6, Missions:4 },
  london:  { Tithe:45, Offering:25, Seed:10, 'Special Gift':10,'Building Fund':6, Missions:4 },
  houston: { Tithe:44, Offering:26, Seed:11, 'Special Gift':9, 'Building Fund':6, Missions:4 },
}
const DEFAULT_SPLIT = { Tithe:41, Offering:29, Seed:12, 'Special Gift':8, 'Building Fund':6, Missions:4 }

const PIE_COLORS = ['#1B4332','#C9A84C','#10B981','#3B82F6','#F59E0B','#8B5CF6']

type GivingRecord = {
  id: string
  branch_id: string
  branch_name: string
  giving_date: string
  type: string
  amount: number
  currency: string
  recorded_by: string
  notes: string
  created_at: string
}

function fmt(n: number, sym = '₦') {
  if (n >= 1_000_000_000) return `${sym}${(n/1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${sym}${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${sym}${(n/1_000).toFixed(0)}k`
  return `${sym}${n.toLocaleString()}`
}

function fmtFull(n: number, sym = '₦') {
  return `${sym}${n.toLocaleString()}`
}

export default function Giving() {
  const { user } = useSession()
  const [tab, setTab]         = useState<'overview'|'record'|'history'>('overview')
  const [branchFilter, setBranchFilter] = useState('all')
  const [liveRecords, setLiveRecords]   = useState<GivingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  const [form, setForm] = useState({
    branch:    user?.branch_id || 'lekki',
    date:      new Date().toISOString().slice(0,10),
    type:      'Tithe',
    amount:    '',
    notes:     '',
  })

  // Load live records from Supabase
  const loadRecords = async () => {
    setLoading(true)
    if (supabase) {
      try {
        const { data } = await supabase
          .from('giving_records')
          .select('*')
          .order('giving_date', { ascending: false })
          .limit(300)
        if (data) {
          setLiveRecords(data.map((r: any) => ({
            id: r.id, branch_id: r.branch_id,
            branch_name: branches.find(b=>b.id===r.branch_id)?.name || r.branch_id,
            giving_date: r.giving_date, type: r.type,
            amount: r.amount, currency: r.currency || 'NGN',
            recorded_by: r.recorded_by || '', notes: r.notes || '',
            created_at: r.created_at,
          })))
        }
      } catch {}
    }
    setLoading(false)
  }

  useEffect(() => { loadRecords() }, [])

  const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const cur = CURRENCY[form.branch] || CURRENCY.lekki
    const row = {
      branch_id:   form.branch,
      giving_date: form.date,
      type:        form.type,
      amount:      Number(form.amount),
      currency:    cur.code,
      recorded_by: user?.id || '',
      notes:       form.notes,
    }
    if (supabase) {
      try {
        await supabase.from('giving_records').insert(row)
        await loadRecords()
      } catch {}
    } else {
      // Optimistic fallback
      setLiveRecords(prev => [{
        id: `gv${Date.now()}`,
        branch_name: branches.find(b=>b.id===form.branch)?.name || form.branch,
        created_at: new Date().toISOString(),
        ...row,
      }, ...prev])
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setTab('history'); setForm(f=>({...f,amount:'',notes:''})) }, 2000)
    setSaving(false)
  }

  // ------------------------------------------------------------------
  // Computed aggregates
  // ------------------------------------------------------------------
  const curMonth = new Date().getMonth()
  const curMonthData = MONTHLY_GIVING[MONTHLY_GIVING.length - 1]
  const prevMonthData = MONTHLY_GIVING[MONTHLY_GIVING.length - 2]

  const totalNGN = (Object.entries(curMonthData) as [string,any][])
    .filter(([k]) => k !== 'month')
    .reduce((sum, [k, v]) => sum + v, 0)

  const prevTotalNGN = (Object.entries(prevMonthData) as [string,any][])
    .filter(([k]) => k !== 'month')
    .reduce((sum, [k, v]) => sum + v, 0)

  const totalGBP = (curMonthData.london as number) / CURRENCY.london.rate
  const totalUSD = (curMonthData.houston as number) / CURRENCY.houston.rate
  const momGrowth = ((totalNGN - prevTotalNGN) / prevTotalNGN * 100).toFixed(1)

  // Branch breakdown for pie
  const branchPie = branches.map(b => ({
    name: b.short,
    value: (curMonthData as any)[b.id] || 0,
    color: b.color,
  })).sort((a,b)=>b.value-a.value)

  // Type split for selected branch or all
  const typeSplit = branchFilter === 'all'
    ? DEFAULT_SPLIT
    : TYPE_SPLIT[branchFilter] || DEFAULT_SPLIT

  const typePie = Object.entries(typeSplit).map(([name, pct], i) => ({
    name,
    value: pct,
    color: PIE_COLORS[i],
  }))

  // Monthly trend chart (top 4 branches)
  const trendData = MONTHLY_GIVING.map(m => ({
    month: m.month,
    Lekki:        Math.round(m.lekki / 1_000_000),
    Gbagada:      Math.round(m.gbagada / 1_000_000),
    London:       Math.round(m.london / 1_000_000),
    Houston:      Math.round(m.houston / 1_000_000),
  }))

  // Filtered live history
  const filteredRecords = branchFilter === 'all'
    ? liveRecords
    : liveRecords.filter(r => r.branch_id === branchFilter)

  // ------------------------------------------------------------------
  const CT = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'var(--s-3)',border:'0.5px solid var(--border-md)',borderRadius:10,padding:'10px 14px',fontSize:12,boxShadow:'var(--sh-md)' }}>
        <div style={{ fontWeight:600,marginBottom:6,color:'var(--t-1)' }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color:p.color,marginBottom:2 }}>
            {p.name}: <strong>₦{p.value}M</strong>
          </div>
        ))}
      </div>
    )
  }

  const branchOptions = [{ id:'all', name:'All branches' }, ...branches]
  const selectedBranch = branches.find(b=>b.id===branchFilter)
  const branchCur = selectedBranch ? CURRENCY[selectedBranch.id] : null

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Giving & Finance</div>
          <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>Multi-currency · Tithe · Offering · Seed · Building Fund</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={() => setTab('record')}>+ Record giving</button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {([['overview','Overview'],['record','Record'],['history','History']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Branch filter */}
      {tab !== 'record' && (
        <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
          <select className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }}
            value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {branchCur && (
            <span style={{ fontSize:11.5, color:'var(--t-3)', background:'var(--s-4)', padding:'4px 10px', borderRadius:100 }}>
              {branchCur.symbol} {branchCur.code}
            </span>
          )}
        </div>
      )}

      {/* ── OVERVIEW ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
            <div className="metric-tile metric-tile-accent">
              <div className="metric-label">May giving (NGN)</div>
              <div className="metric-value" style={{ fontSize:'1.4rem' }}>{fmt(totalNGN)}</div>
              <div style={{ fontSize:11, color: Number(momGrowth)>=0?'var(--green)':'var(--red)', marginTop:4 }}>
                {Number(momGrowth)>=0?'↑':'↓'} {Math.abs(Number(momGrowth))}% vs Apr
              </div>
            </div>
            <div className="metric-tile metric-tile-accent">
              <div className="metric-label">London (GBP)</div>
              <div className="metric-value" style={{ fontSize:'1.4rem' }}>£{(totalGBP/1000).toFixed(0)}k</div>
              <div style={{ fontSize:11, color:'var(--t-3)', marginTop:4 }}>≈ {fmt(curMonthData.london)}</div>
            </div>
            <div className="metric-tile metric-tile-accent">
              <div className="metric-label">Houston (USD)</div>
              <div className="metric-value" style={{ fontSize:'1.4rem' }}>${(totalUSD/1000).toFixed(0)}k</div>
              <div style={{ fontSize:11, color:'var(--t-3)', marginTop:4 }}>≈ {fmt(curMonthData.houston)}</div>
            </div>
            <div className="metric-tile metric-tile-accent">
              <div className="metric-label">Tithe % (avg)</div>
              <div className="metric-value" style={{ fontSize:'1.4rem' }}>41%</div>
              <div style={{ fontSize:11, color:'var(--t-3)', marginTop:4 }}>of total giving</div>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="card card-p" style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Monthly giving trend — top branches (₦M)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <defs>
                  {[['Lekki','#1B4332'],['Gbagada','#C9A84C'],['London','#3B82F6'],['Houston','#14B8A6']].map(([k,c])=>(
                    <linearGradient key={k} id={`grad${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--t-3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'var(--t-3)' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }}/>
                {(['Lekki','Gbagada','London','Houston'] as const).map((k,i) => {
                  const colors = ['#1B4332','#C9A84C','#3B82F6','#14B8A6']
                  return <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fill={`url(#grad${k})`} strokeWidth={2}/>
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Two-column charts */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {/* Branch pie */}
            <div className="card card-p">
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>May giving by branch</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={branchPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {branchPie.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any) => [fmt(v as number), '']}
                    contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, fontSize:11 }}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:11 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Type split */}
            <div className="card card-p">
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>
                Giving by type {branchFilter!=='all' && `— ${selectedBranch?.short}`}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={typePie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {typePie.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any) => [`${v}%`, '']}
                    contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, fontSize:11 }}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:11 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Branch giving table */}
          <div className="card card-p">
            <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Branch giving summary — May 2026</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Currency</th>
                  <th>This month</th>
                  <th>Last month</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => {
                  const cur = CURRENCY[b.id]
                  const thisM = (curMonthData as any)[b.id] as number
                  const prevM = (prevMonthData as any)[b.id] as number
                  const nativeThis = thisM / cur.rate
                  const nativePrev = prevM / cur.rate
                  const chg = ((nativeThis - nativePrev) / nativePrev * 100).toFixed(1)
                  const up = Number(chg) >= 0
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:b.color, flexShrink:0 }}/>
                          <strong>{b.name}</strong>
                        </div>
                      </td>
                      <td style={{ fontSize:11.5, color:'var(--t-3)' }}>{cur.code}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)' }}>
                        {fmt(nativeThis, cur.symbol)}
                      </td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t-2)' }}>
                        {fmt(nativePrev, cur.symbol)}
                      </td>
                      <td>
                        <span style={{
                          fontSize:11.5, fontWeight:700, fontFamily:'var(--font-mono)',
                          color: up ? 'var(--green)' : 'var(--red)',
                        }}>
                          {up ? '↑' : '↓'} {Math.abs(Number(chg))}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── RECORD ───────────────────────────────────────────────── */}
      {tab === 'record' && (
        <div className="card card-p" style={{ maxWidth:520 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Record giving entry</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16 }}>
            Use the branch's local currency. The system stores the original amount and currency.
          </div>
          {saved && (
            <div style={{ padding:'10px 14px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--green)', marginBottom:16, fontWeight:600 }}>
              ✓ Giving record saved.
            </div>
          )}
          <form onSubmit={saveRecord}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Branch</label>
                <select className="input" value={form.branch} onChange={e => setForm(f=>({...f,branch:e.target.value}))}>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Giving type</label>
                <select className="input" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                  {GIVING_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>
                  Amount ({CURRENCY[form.branch]?.code || 'NGN'})
                </label>
                <input className="input" type="number" min="0" step="any"
                  placeholder={`e.g. ${CURRENCY[form.branch]?.code==='GBP'?'500':CURRENCY[form.branch]?.code==='USD'?'400':'250000'}`}
                  value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} required/>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Notes (optional)</label>
              <input className="input" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}
                placeholder="e.g. First Sunday offering, special convention seed"/>
            </div>
            <div style={{ padding:'10px 14px', background:'var(--s-4)', borderRadius:'var(--r)', fontSize:12, color:'var(--t-2)', marginBottom:16 }}>
              💡 This records the <strong>aggregate</strong> for a service or period — not individual member giving. Individual giving reports are handled via the church's banking system.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="btn btn-brand" style={{ flex:1, justifyContent:'center', padding:'10px' }} disabled={saving}>
                {saving ? 'Saving…' : 'Save giving record'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setTab('overview')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── HISTORY ──────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="card card-p">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>
              {loading ? 'Loading…' : liveRecords.length === 0
                ? 'No records yet'
                : `${filteredRecords.length} record${filteredRecords.length!==1?'s':''}`}
            </div>
          </div>

          {filteredRecords.length === 0 && !loading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>
              No giving records yet. Use "Record giving" to add your first entry.
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0,100).map(r => {
                  const cur = CURRENCY[r.branch_id] || CURRENCY.lekki
                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:branches.find(b=>b.id===r.branch_id)?.color||'var(--brand)', flexShrink:0 }}/>
                          <strong style={{ fontSize:12 }}>{r.branch_name}</strong>
                        </div>
                      </td>
                      <td style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>{r.giving_date}</td>
                      <td>
                        <span style={{ fontSize:11.5, background:'var(--s-4)', padding:'2px 8px', borderRadius:100, color:'var(--t-2)' }}>{r.type}</span>
                      </td>
                      <td style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)', fontSize:13 }}>
                        {cur.symbol}{Number(r.amount).toLocaleString()}
                        {r.currency !== 'NGN' && <span style={{ fontSize:10, marginLeft:4, color:'var(--t-3)' }}>{r.currency}</span>}
                      </td>
                      <td style={{ fontSize:12, color:'var(--t-2)' }}>{r.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {filteredRecords.length > 100 && (
            <div style={{ textAlign:'center', fontSize:12, color:'var(--t-3)', marginTop:10 }}>
              Showing 100 of {filteredRecords.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
