'use client'
import { useState, useEffect } from 'react'
import { ATTENDANCE_RECORDS, branches } from '@/lib/data'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@/lib/useSession'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

export default function Attendance() {
  const { user } = useSession()
  const [view, setView] = useState<'summary'|'record'|'register'>('summary')
  const [selected, setSelected] = useState<any>(null)
  const [selectedDept, setSelectedDept] = useState<string|null>(null)
  
  // Sample participant roster per department — in production from the backend
  const DEPT_MEMBERS: Record<string, { name:string; phone:string; role:string }[]> = {
    'Ushering':         [{name:'Segun Adeyemi',phone:'+234 810 111 2222',role:'Unit Head'},{name:'Emeka Obi',phone:'+234 803 234 5678',role:'Member'},{name:'Ngozi Kalu',phone:'+234 706 345 6789',role:'Member'},{name:'Femi Adeyemi',phone:'+234 812 456 7890',role:'Member'}],
    'Worship & Music':  [{name:'Tolu Mensah',phone:'+234 805 567 8901',role:'Unit Head'},{name:'Seun Adesanya',phone:'+234 817 678 9012',role:'Member'},{name:'Kemi Brown',phone:'+234 908 789 0123',role:'Member'}],
    'KidsHouse':        [{name:'Tosin Obi',phone:'+234 813 890 1234',role:'Unit Head'},{name:'Blessing Okafor',phone:'+234 906 901 2345',role:'Member'},{name:'Peace Nwosu',phone:'+234 811 012 3456',role:'Member'}],
    'Media & Technology':[{name:'Kenny Appiah',phone:'+234 815 123 4567',role:'Unit Head'},{name:'Rotimi Bello',phone:'+234 804 234 5678',role:'Member'}],
    'Prayer & Intercession':[{name:'Elder Taiwo',phone:'+234 802 345 6789',role:'Unit Head'},{name:'Sister Grace',phone:'+234 809 456 7890',role:'Member'},{name:'Bro Ike',phone:'+234 816 567 8901',role:'Member'}],
  }
  const [records, setRecords] = useState(ATTENDANCE_RECORDS)
  const [regForm, setRegForm] = useState({ branch:'lekki', date:'', service:'1st Service (8AM)', total:'' })
  const [saved, setSaved] = useState(false)

  const totalThisWeek = records.reduce((a,r)=>a+r.total,0)

  const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const br = branches.find(b=>b.id===regForm.branch)!
    setRecords(prev => [...prev, { id:`at${Date.now()}`, date:regForm.date, branchId:regForm.branch, branchName:br.name, service:regForm.service, total:Number(regForm.total), departments:[] }])
    if (supabase && user?.id) {
      await supabase.from('attendance_logs').insert({
        branch_id: regForm.branch,
        service_date: regForm.date,
        department: regForm.service,
        count: Number(regForm.total),
        recorded_by: user.id,
      })
    }
    setSaved(true)
    setTimeout(()=>{ setSaved(false); setView('summary') }, 2000)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Attendance</div>
          <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>Per-service · Per-branch · Per-department breakdown</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-sm" onClick={()=>setView('register')}>+ Record attendance</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:16 }}>
        {[{ l:'Total this week',v:totalThisWeek.toLocaleString()},{ l:'Services recorded',v:records.length},{ l:'Branches reporting',v:records.map(r=>r.branchId).filter((v,i,a)=>a.indexOf(v)===i).length},{ l:'Dept logs',v:records.reduce((a,r)=>a+r.departments.length,0)}].map(m=>(
          <div key={m.l} className="metric-tile metric-tile-accent"><div className="metric-label">{m.l}</div><div className="metric-value" style={{ fontSize:'1.5rem' }}>{m.v}</div></div>
        ))}
      </div>

      {view === 'register' && (
        <div className="card card-p" style={{ maxWidth:480, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Record service attendance</div>
          {saved && <div style={{ padding:'8px 12px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--green)', marginBottom:12, fontWeight:600 }}>✓ Attendance recorded.</div>}
          <form onSubmit={saveRecord}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Branch</label>
                <select className="input" value={regForm.branch} onChange={e=>setRegForm(f=>({...f,branch:e.target.value}))}>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Date</label>
                <input className="input" type="date" value={regForm.date} onChange={e=>setRegForm(f=>({...f,date:e.target.value}))} required/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Service</label>
                <select className="input" value={regForm.service} onChange={e=>setRegForm(f=>({...f,service:e.target.value}))}>
                  {['1st Service (8AM)','2nd Service (10AM)','3rd Service (12PM)','Single Service (9AM)','Evening Service (6PM)'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Total count</label>
                <input className="input" type="number" placeholder="e.g. 3500" value={regForm.total} onChange={e=>setRegForm(f=>({...f,total:e.target.value}))} required/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="btn btn-brand btn-sm" style={{ flex:1, justifyContent:'center' }}>Save record</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setView('summary')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Summary table */}
      {!selected && (
        <div className="card card-p">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>All service records — click any row for full breakdown</div>
          <table className="tbl">
            <thead><tr><th>Branch</th><th>Date</th><th>Service</th><th>Total</th><th>Dept. logs</th><th>Details</th></tr></thead>
            <tbody>
              {records.map(r => {
                const b = branches.find(br=>br.id===r.branchId)
                return (
                  <tr key={r.id} style={{ cursor:'pointer' }} onClick={()=>{ setSelected(r); setSelectedDept(null) }}>
                    <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ width:8, height:8, borderRadius:'50%', background:b?.color||'var(--brand)', boxShadow:`0 0 6px ${b?.color||'var(--brand)'}` }}/><strong>{r.branchName}</strong></div></td>
                    <td style={{ fontSize:12 }}>{r.date}</td>
                    <td style={{ fontSize:12 }}>{r.service}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)', fontSize:13 }}>{r.total.toLocaleString()}</td>
                    <td><span className="chip chip-purple">{r.departments.length} depts</span></td>
                    <td><button className="btn btn-sm">View →</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drilldown */}
      {selected && (
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={()=>{ setSelected(null); setSelectedDept(null) }}>← All records</button>
          <div className="card card-p" style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{selected.branchName} · {selected.service}</div>
                <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>{selected.date}</div>
              </div>
              <div style={{ fontSize:32, fontWeight:800, color:'var(--brand)', fontFamily:'var(--font-display)' }}>{selected.total.toLocaleString()}</div>
            </div>
          </div>

          {selected.departments.length > 0 ? (
            <>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'var(--t-2)' }}>Department breakdown — click to see member names</div>
              {selected.departments.map((dept: any) => (
                <div key={dept.dept}>
                  <div className="card card-hover" style={{ padding:'14px 18px', marginBottom: selectedDept===dept.dept?0:8, borderRadius: selectedDept===dept.dept?'14px 14px 0 0':'var(--r-lg)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }} onClick={()=>setSelectedDept(selectedDept===dept.dept?null:dept.dept)}>
                    <div style={{ fontWeight:700 }}>{dept.dept}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:18, fontWeight:800, color:'var(--brand)', fontFamily:'var(--font-mono)' }}>{dept.count}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="14" height="14" style={{ transform: selectedDept===dept.dept?'rotate(90deg)':'rotate(0)', transition:'transform .2s' }}><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                  {selectedDept === dept.dept && (
                    <div style={{ background:'var(--s-3)', borderRadius:'0 0 var(--r-lg) var(--r-lg)', padding:'0 18px 14px', border:'0.5px solid var(--border)', borderTop:'none', marginBottom:8 }}>
                      <table className="tbl">
                        <thead><tr><th>Name</th><th>Phone</th></tr></thead>
                        <tbody>
                          {dept.members.map((m: any, i: number) => (
                            <tr key={i}><td style={{ fontWeight:600 }}>{m.name}</td><td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{m.phone}</td></tr>
                          ))}
                        </tbody>
                      </table>
                      {dept.members.length < dept.count && <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:8 }}>Showing {dept.members.length} of {dept.count} · Connect to backend for full list</div>}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--t-3)', fontSize:13, background:'var(--s-2)', borderRadius:'var(--r-lg)' }}>No department breakdown recorded for this service. Departments can add their counts when logging attendance.</div>
          )}
        </div>
      )}
    </div>
  )
}
