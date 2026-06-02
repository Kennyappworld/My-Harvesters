'use client'
import { useState, useEffect } from 'react'
import { branches, memberGrowthMonthly, retentionCohorts, weeklyAttendance } from '@/lib/data'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

const MONTHS = ['January','February','March','April','May']

export default function Reports() {
  const [tab, setTab] = useState<'monthly'|'generate'>('monthly')
  const [liveStats, setLiveStats] = useState<{totalWorkers:number; totalSouls:number; totalAttendance:number} | null>(null)

  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const [{ count: workers }, { count: souls }, { data: attendance }] = await Promise.all([
          supabase.from('workers').select('*', { count:'exact', head:true }),
          supabase.from('soul_records').select('*', { count:'exact', head:true }),
          supabase.from('attendance_logs').select('count').limit(1),
        ])
        setLiveStats({
          totalWorkers: workers || 0,
          totalSouls: souls || 0,
          totalAttendance: 0,
        })
      } catch {}
    }
    load()
  }, [])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('May')
  const [generated, setGenerated] = useState(false)

  const branchData = branches.map(b => {
    const growth = memberGrowthMonthly[4] as any
    const cohort = retentionCohorts.find(r=>r.id===b.id)
    const attend = weeklyAttendance[weeklyAttendance.length-1] as any
    return {
      ...b,
      newMembers: growth[b.id]||0,
      retention3m: cohort?.r3m||0,
      goneQuiet: cohort?.goneQuiet||0,
      lastAttendance: attend[b.id]||0,
    }
  })

  const displayBranches = selectedBranch==='all'?branchData:branchData.filter(b=>b.id===selectedBranch)
  const totalNew = displayBranches.reduce((a,b)=>a+b.newMembers,0)
  const totalMembers = displayBranches.reduce((a,b)=>a+b.members,0)
  const avgRetention = Math.round(displayBranches.reduce((a,b)=>a+b.retention3m,0)/displayBranches.length)

  const generate = () => {
    // Build CSV from branch data
    const headers = ['Branch','Country','Members','New (May)','Retention 3m','Gone Quiet','Attendance %']
    const rows = displayBranches.map(b => [b.name, b.country, b.members, b.newMembers, `${b.retention3m}%`, b.goneQuiet, `${b.attendance}%`])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `HICC-Report-${selectedMonth}-${selectedBranch}.csv`
    a.click(); URL.revokeObjectURL(url)
    setGenerated(true); setTimeout(()=>setGenerated(false), 3000)
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:'var(--font-display)'}}>Reports</div>
          <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>Monthly branch reports · analytics summaries · export</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={generate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export report
        </button>
      </div>

      {generated && <div style={{padding:'10px 16px',background:'var(--green-lt)',borderRadius:'var(--r)',fontSize:13,color:'var(--green)',marginBottom:14,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>✓ CSV downloaded to your device — open in Excel or Google Sheets.</div>}

      {liveStats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16,padding:'14px 16px',background:'var(--brand-soft)',borderRadius:12,border:'1px solid rgba(27,67,50,0.12)'}}>
          <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:800,color:'var(--brand)',fontFamily:'var(--font-display)'}}>{liveStats.totalWorkers}</div><div style={{fontSize:11,color:'var(--t-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginTop:3}}>Live workers in DB</div></div>
          <div style={{textAlign:'center',borderLeft:'0.5px solid var(--border)',borderRight:'0.5px solid var(--border)'}}><div style={{fontSize:22,fontWeight:800,color:'var(--brand)',fontFamily:'var(--font-display)'}}>{liveStats.totalSouls}</div><div style={{fontSize:11,color:'var(--t-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginTop:3}}>Souls recorded</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:800,color:'var(--brand)',fontFamily:'var(--font-display)'}}>Live</div><div style={{fontSize:11,color:'var(--t-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginTop:3}}>Supabase connected</div></div>
        </div>
      )}

      <div className="tabs" style={{marginBottom:16}}>
        {([['monthly','Monthly report'],['generate','Branch summary']] as const).map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <select className="input" value={selectedBranch} onChange={e=>setSelectedBranch(e.target.value)} style={{width:200}}>
          <option value="all">All branches</option>
          {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="input" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{width:140}}>
          {MONTHS.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>

      {tab==='monthly' && (
        <>
          {/* Summary KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:16}}>
            {[
              {l:'Total members',v:totalMembers.toLocaleString(),up:true},
              {l:'New members (May)',v:totalNew.toLocaleString(),up:true},
              {l:'Avg retention (3m)',v:`${avgRetention}%`,up:true},
              {l:'Branches in report',v:displayBranches.length,up:false},
            ].map(m=>(
              <div key={m.l} className="metric-tile metric-tile-accent">
                <div className="metric-label">{m.l}</div>
                <div className="metric-value" style={{fontSize:'1.4rem'}}>{m.v}</div>
                {m.up && <div className="metric-sub up">↑ improving</div>}
              </div>
            ))}
          </div>

          <div className="card card-p">
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>{selectedMonth} 2026 — Branch performance report</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Branch</th><th>Members</th><th>New ({selectedMonth})</th>
                  <th>3m retention</th><th>Gone quiet</th><th>Last attendance</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayBranches.map(b=>{
                  const rCol = b.retention3m>=88?'var(--green)':b.retention3m>=80?'var(--amber)':'var(--red)'
                  return (
                    <tr key={b.id}>
                      <td><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:8,height:8,borderRadius:'50%',background:b.color,boxShadow:`0 0 6px ${b.color}`}}/><strong>{b.name}</strong></div></td>
                      <td style={{fontFamily:'var(--font-mono)'}}>{b.members.toLocaleString()}</td>
                      <td style={{fontFamily:'var(--font-mono)',color:'var(--brand)',fontWeight:700}}>+{b.newMembers}</td>
                      <td><span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:rCol}}>{b.retention3m}%</span></td>
                      <td><span style={{fontFamily:'var(--font-mono)',color:'var(--red)'}}>{b.goneQuiet.toLocaleString()}</span></td>
                      <td style={{fontFamily:'var(--font-mono)'}}>{b.lastAttendance.toLocaleString()}</td>
                      <td>
                        <span className={`chip chip-${b.type==='review'?'amber':b.type==='international'?'purple':'green'}`}>
                          {b.type==='hq'?'HQ':b.type==='review'?'Needs review':b.type==='international'?'International':'Active'}
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

      {tab==='generate' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {displayBranches.map(b=>{
            const rCol = b.retention3m>=88?'var(--green)':b.retention3m>=80?'var(--amber)':'var(--red)'
            return (
              <div key={b.id} className="card" style={{padding:'16px 18px',borderTop:`3px solid ${b.color}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{width:10,height:10,borderRadius:'50%',background:b.color,boxShadow:`0 0 8px ${b.color}`}}/>
                  <div style={{fontWeight:700,fontSize:14}}>{b.name}</div>
                  <span className="chip chip-gray" style={{marginLeft:'auto',fontSize:10}}>{b.country}</span>
                </div>
                {[
                  {l:'Members',v:b.members.toLocaleString(),c:'var(--t-1)'},
                  {l:'New this month',v:`+${b.newMembers}`,c:'var(--brand)'},
                  {l:'3m retention',v:`${b.retention3m}%`,c:rCol},
                  {l:'Gone quiet',v:b.goneQuiet.toLocaleString(),c:'var(--red)'},
                  {l:'Pastor',v:b.pastor,c:'var(--t-2)'},
                ].map(row=>(
                  <div key={row.l} className="stat-row">
                    <span style={{fontSize:12,color:'var(--t-3)'}}>{row.l}</span>
                    <span style={{fontSize:12.5,fontWeight:600,color:row.c}}>{row.v}</span>
                  </div>
                ))}
                <button className="btn btn-sm" style={{width:'100%',justifyContent:'center',marginTop:12,fontSize:11}} onClick={generate}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export {b.short} report
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
