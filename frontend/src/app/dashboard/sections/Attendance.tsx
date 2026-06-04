'use client'
import { useState, useEffect } from 'react'
import { branches, DEPARTMENTS } from '@/lib/data'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@/lib/useSession'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) : null

type AttendanceLog = {
  id: string; branch_id: string; branch_name: string
  service_date: string; service_name: string; department: string; count: number
  recorded_by: string; created_at: string
}

export default function Attendance() {
  const { user } = useSession()
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'summary'|'record'>('summary')
  const [selected, setSelected] = useState<AttendanceLog|null>(null)
  const [form, setForm] = useState({ branch: user?.branch_id||'lekki', date: new Date().toISOString().slice(0,10), service: '1st Service (8AM)', count: '', department: 'all' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filterBranch, setFilterBranch] = useState('all')

  const load = async () => {
    setLoading(true)
    if (supabase) {
      try {
        const { data } = await supabase
          .from('attendance_logs')
          .select('*')
          .order('service_date', { ascending: false })
          .limit(200)
        if (data) {
          setLogs(data.map((r:any) => ({
            id: r.id, branch_id: r.branch_id,
            branch_name: branches.find(b=>b.id===r.branch_id)?.name || r.branch_id,
            service_date: r.service_date, service_name: r.service || r.department || '',
            department: r.department || 'All departments', count: r.count,
            recorded_by: r.recorded_by || '', created_at: r.created_at,
          })))
        }
      } catch {}
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const br = branches.find(b=>b.id===form.branch)!
    if (supabase && user?.id) {
      try {
        await supabase.from('attendance_logs').insert({
          branch_id: form.branch,
          service_date: form.date,
          service: form.service,
          department: form.department === 'all' ? 'All departments' : DEPARTMENTS.find(d=>d.id===form.department)?.name || form.department,
          count: Number(form.count),
          recorded_by: user.id,
        })
        await load()
        setSaved(true)
        setTimeout(() => { setSaved(false); setView('summary'); setForm(f=>({...f,count:'',department:'all'})) }, 2000)
      } catch (err) {
        console.error(err)
      }
    } else {
      // Offline fallback
      setLogs(prev => [{
        id: `at${Date.now()}`, branch_id: form.branch, branch_name: br.name,
        service_date: form.date, service_name: form.service,
        department: form.department === 'all' ? 'All departments' : form.department,
        count: Number(form.count), recorded_by: user?.id||'', created_at: new Date().toISOString(),
      }, ...prev])
      setSaved(true)
      setTimeout(() => { setSaved(false); setView('summary') }, 2000)
    }
    setSaving(false)
  }

  const filtered = filterBranch === 'all' ? logs : logs.filter(r=>r.branch_id===filterBranch)

  // Chart data — last 8 dates
  const chartDates = Array.from(new Set(logs.map(l=>l.service_date))).slice(0,8).reverse()
  const chartData = chartDates.map(date => {
    const dayLogs = logs.filter(l=>l.service_date===date)
    return { date: date.slice(5), total: dayLogs.reduce((a,l)=>a+l.count,0) }
  })

  // KPIs
  const thisWeek = new Date(Date.now()-7*86400000).toISOString().slice(0,10)
  const weekLogs = logs.filter(l=>l.service_date>=thisWeek)
  const totalWeek = weekLogs.reduce((a,l)=>a+l.count,0)
  const branchesReporting = Array.from(new Set(logs.map(l=>l.branch_id))).length
  const avgPerService = logs.length ? Math.round(logs.reduce((a,l)=>a+l.count,0)/logs.length) : 0

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Attendance</div>
          <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>Live from database · Per-service · Per-branch · History</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={()=>setView(view==='record'?'summary':'record')}>
          {view==='record' ? '← Back' : '+ Record attendance'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { l:'This week', v: totalWeek.toLocaleString() },
          { l:'Services logged', v: logs.length },
          { l:'Branches reporting', v: branchesReporting },
          { l:'Avg per service', v: avgPerService.toLocaleString() },
        ].map(m=>(
          <div key={m.l} className="metric-tile metric-tile-accent">
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.5rem' }}>{loading ? '…' : m.v}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {chartData.length > 0 && !view && (
        <div className="card card-p" style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Attendance trend</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--t-3)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'var(--t-3)' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} formatter={(v:any)=>[v.toLocaleString(),'Total']}/>
              <Bar dataKey="total" fill="var(--brand)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Record form */}
      {view === 'record' && (
        <div className="card card-p" style={{ maxWidth:520, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Record service attendance</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16 }}>Enter the total headcount for a service. Optionally specify a department.</div>
          {saved && <div style={{ padding:'8px 12px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--green)', marginBottom:12, fontWeight:600 }}>✓ Attendance saved to database.</div>}
          <form onSubmit={saveRecord}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Branch</label>
                <select className="input" value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Date</label>
                <input className="input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Service</label>
                <select className="input" value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))}>
                  {['1st Service (8AM)','2nd Service (10AM)','3rd Service (12PM)','Single Service (9AM)','Evening Service (6PM)'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Department (optional)</label>
                <select className="input" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                  <option value="all">All departments (total)</option>
                  {DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Total count *</label>
                <input className="input" type="number" min="0" placeholder="e.g. 3500" value={form.count} onChange={e=>setForm(f=>({...f,count:e.target.value}))} required/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="btn btn-brand" style={{ flex:1, justifyContent:'center', padding:'10px' }} disabled={saving}>
                {saving ? 'Saving…' : 'Save to database'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={()=>setView('summary')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* History table */}
      {view === 'summary' && (
        <div className="card card-p">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>
              {loading ? 'Loading…' : `${filtered.length} records`}
            </div>
            <select className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }} value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {filtered.length === 0 && !loading ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--t-3)', fontSize:13 }}>
              No attendance records yet. Click "+ Record attendance" to add your first entry.
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Branch</th><th>Date</th><th>Service</th><th>Department</th><th>Count</th></tr></thead>
              <tbody>
                {filtered.slice(0,100).map(r => (
                  <tr key={r.id}>
                    <td><div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:8,height:8,borderRadius:'50%',background:branches.find(b=>b.id===r.branch_id)?.color||'var(--brand)',flexShrink:0 }}/>
                      <strong>{r.branch_name}</strong>
                    </div></td>
                    <td style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>{r.service_date}</td>
                    <td style={{ fontSize:12 }}>{r.service_name}</td>
                    <td style={{ fontSize:12, color:'var(--t-2)' }}>{r.department}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)', fontSize:13 }}>{r.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filtered.length > 100 && <div style={{ textAlign:'center', fontSize:12, color:'var(--t-3)', marginTop:10 }}>Showing 100 of {filtered.length}</div>}
        </div>
      )}
    </div>
  )
}
