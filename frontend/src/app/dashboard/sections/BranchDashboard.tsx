'use client'
import { useState } from 'react'
import { branches, memberGrowthMonthly, retentionCohorts, retentionMonthly } from '@/lib/data'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

// Simulated per-branch workforce breakdown
const BRANCH_WORKFORCE: Record<string, {
  totalWorkforce: number
  activeWorkforce: number
  departments: { name: string; count: number; color: string }[]
  growthTrend: number[]
  newSouls: number
  prayerRequests: number
  upcomingEvents: number
}> = {
  lekki:        { totalWorkforce:3240, activeWorkforce:2810, departments:[{name:'Ushering',count:420,color:'#1B4332'},{name:'Worship',count:380,color:'#C9A84C'},{name:'KidsHouse',count:310,color:'#0D9488'},{name:'Prayer',count:290,color:'#2B6CB0'},{name:'Media',count:180,color:'#C05621'},{name:'Outreach',count:240,color:'#1B9E5A'}], growthTrend:[310,288,342,368,394], newSouls:46, prayerRequests:128, upcomingEvents:4 },
  gbagada:      { totalWorkforce:2180, activeWorkforce:1940, departments:[{name:'Ushering',count:310,color:'#1B4332'},{name:'Worship',count:280,color:'#C9A84C'},{name:'KidsHouse',count:240,color:'#0D9488'},{name:'Prayer',count:210,color:'#2B6CB0'},{name:'Media',count:130,color:'#C05621'},{name:'Outreach',count:180,color:'#1B9E5A'}], growthTrend:[245,230,271,292,314], newSouls:31, prayerRequests:84, upcomingEvents:3 },
  ikeja:        { totalWorkforce:1760, activeWorkforce:1540, departments:[{name:'Ushering',count:260,color:'#1B4332'},{name:'Worship',count:230,color:'#C9A84C'},{name:'KidsHouse',count:190,color:'#0D9488'},{name:'Prayer',count:170,color:'#2B6CB0'},{name:'Media',count:110,color:'#C05621'},{name:'Outreach',count:140,color:'#1B9E5A'}], growthTrend:[190,175,204,218,231], newSouls:24, prayerRequests:62, upcomingEvents:2 },
  anthony:      { totalWorkforce:1410, activeWorkforce:1220, departments:[{name:'Ushering',count:210,color:'#1B4332'},{name:'Worship',count:185,color:'#C9A84C'},{name:'KidsHouse',count:155,color:'#0D9488'},{name:'Prayer',count:140,color:'#2B6CB0'},{name:'Media',count:90,color:'#C05621'},{name:'Outreach',count:115,color:'#1B9E5A'}], growthTrend:[148,139,166,179,192], newSouls:18, prayerRequests:48, upcomingEvents:2 },
  abuja:        { totalWorkforce:1305, activeWorkforce:1100, departments:[{name:'Ushering',count:195,color:'#1B4332'},{name:'Worship',count:170,color:'#C9A84C'},{name:'KidsHouse',count:145,color:'#0D9488'},{name:'Prayer',count:130,color:'#2B6CB0'},{name:'Media',count:85,color:'#C05621'},{name:'Outreach',count:105,color:'#1B9E5A'}], growthTrend:[162,144,178,191,204], newSouls:21, prayerRequests:54, upcomingEvents:2 },
  portharcourt: { totalWorkforce:1020, activeWorkforce:880, departments:[{name:'Ushering',count:152,color:'#1B4332'},{name:'Worship',count:134,color:'#C9A84C'},{name:'KidsHouse',count:112,color:'#0D9488'},{name:'Prayer',count:100,color:'#2B6CB0'},{name:'Media',count:66,color:'#C05621'},{name:'Outreach',count:82,color:'#1B9E5A'}], growthTrend:[112,104,128,141,155], newSouls:15, prayerRequests:40, upcomingEvents:2 },
  ibadan:       { totalWorkforce:555,  activeWorkforce:460, departments:[{name:'Ushering',count:83,color:'#1B4332'},{name:'Worship',count:72,color:'#C9A84C'},{name:'KidsHouse',count:61,color:'#0D9488'},{name:'Prayer',count:55,color:'#2B6CB0'},{name:'Media',count:36,color:'#C05621'},{name:'Outreach',count:44,color:'#1B9E5A'}], growthTrend:[58,52,67,72,81], newSouls:8, prayerRequests:22, upcomingEvents:1 },
  london:       { totalWorkforce:930,  activeWorkforce:820, departments:[{name:'Ushering',count:139,color:'#1B4332'},{name:'Worship',count:122,color:'#C9A84C'},{name:'KidsHouse',count:102,color:'#0D9488'},{name:'Prayer',count:92,color:'#2B6CB0'},{name:'Media',count:61,color:'#C05621'},{name:'Outreach',count:75,color:'#1B9E5A'}], growthTrend:[98,110,124,131,148], newSouls:14, prayerRequests:38, upcomingEvents:2 },
  houston:      { totalWorkforce:615,  activeWorkforce:530, departments:[{name:'Ushering',count:92,color:'#1B4332'},{name:'Worship',count:80,color:'#C9A84C'},{name:'KidsHouse',count:68,color:'#0D9488'},{name:'Prayer',count:61,color:'#2B6CB0'},{name:'Media',count:40,color:'#C05621'},{name:'Outreach',count:50,color:'#1B9E5A'}], growthTrend:[64,71,78,84,91], newSouls:9, prayerRequests:26, upcomingEvents:1 },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May']

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const d = data.map((v,i) => ({ m: MONTHS[i], v }))
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={d} margin={{top:2,right:0,left:0,bottom:0}}>
        <defs>
          <linearGradient id={`bg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} fill={`url(#bg${color.replace('#','')})`} dot={false}/>
        <Tooltip contentStyle={{fontSize:11,padding:'4px 8px',borderRadius:6,border:'none',background:'rgba(13,31,22,0.9)',color:'white'}} formatter={(v:number)=>[v.toLocaleString(),'New members']}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function BranchDashboard() {
  const [selected, setSelected] = useState<string>('lekki')
  const branch = branches.find(b => b.id === selected)!
  const wf = BRANCH_WORKFORCE[selected]
  const cohort = retentionCohorts.find(r => r.id === selected)
  const monthlyAvg = Math.round(
    memberGrowthMonthly.reduce((sum, m) => sum + (m[selected as keyof typeof m] as number || 0), 0) / memberGrowthMonthly.length
  )

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontWeight:800, fontSize:17, fontFamily:'var(--font-display)', color:'var(--t-1)', marginBottom:3 }}>Branch Dashboards</h2>
        <p style={{ fontSize:12.5, color:'var(--t-2)' }}>Select a branch to view their workforce summary and key metrics.</p>
      </div>

      {/* Branch selector */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {branches.map(b => (
          <button key={b.id} onClick={()=>setSelected(b.id)} style={{
            padding:'7px 14px', borderRadius:100, fontSize:12.5, fontWeight:selected===b.id?700:500,
            cursor:'pointer', border:`1.5px solid ${selected===b.id?b.color:'var(--border-md)'}`,
            background:selected===b.id?`${b.color}15`:'var(--s-2)',
            color:selected===b.id?b.color:'var(--t-2)',
            transition:'all .12s', fontFamily:'var(--font-body)',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:b.color, display:'inline-block' }}/>
            {b.name}
          </button>
        ))}
      </div>

      {/* Branch header */}
      <div className="card" style={{ marginBottom:14, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', background:`linear-gradient(135deg, ${branch.color}18 0%, transparent 100%)`, borderBottom:'1px solid var(--border-md)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${branch.color}20`, border:`2px solid ${branch.color}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ width:14, height:14, borderRadius:'50%', background:branch.color, display:'block', boxShadow:`0 0 10px ${branch.color}` }}/>
            </div>
            <div>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, color:'var(--t-1)' }}>{branch.name}</h3>
              <p style={{ fontSize:12, color:'var(--t-3)' }}>{branch.location} · Founded {branch.founded} · Pastor: {branch.pastor}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <span className={`chip chip-${branch.type==='hq'?'brand':branch.type==='international'?'blue':branch.type==='review'?'amber':'green'}`}>
              {branch.type==='hq'?'Headquarters':branch.type==='international'?'International':branch.type==='review'?'Under review':'Active'}
            </span>
            <span className="chip chip-gray">{branch.country}</span>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:14 }}>
        {[
          { l:'Total members',       v:branch.members.toLocaleString(),  sub:'Registered',             accent:branch.color },
          { l:'Monthly avg (new)',   v:monthlyAvg.toLocaleString(),      sub:'Jan–May average',         accent:'var(--gold)' },
          { l:'Weekly attendance',   v:`${branch.attendance}%`,          sub:'Of total members',        accent:'var(--teal)' },
          { l:'Total workforce',     v:wf.totalWorkforce.toLocaleString(),sub:'Serving in departments', accent:'var(--brand)' },
          { l:'Active workforce',    v:wf.activeWorkforce.toLocaleString(),sub:'Served this month',     accent:'var(--green)' },
          { l:'3m retention',        v:`${cohort?.r3m||0}%`,            sub:'Members retained',        accent:'var(--brand)' },
          { l:'New souls (May)',      v:wf.newSouls,                     sub:'Recorded this month',     accent:'var(--gold)' },
          { l:'Prayer requests',     v:wf.prayerRequests,               sub:'Active on prayer wall',   accent:'var(--teal)' },
        ].map(m => (
          <div key={m.l} className="metric-tile" style={{ borderTop:`3px solid ${m.accent}` }}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.5rem', color:'var(--t-1)' }}>{m.v}</div>
            <div className="metric-sub flat">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom:14 }}>
        {/* New member trend */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border-md)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-display)' }}>New member trend</span>
            <span style={{ fontSize:11, color:'var(--t-3)' }}>Jan–May 2026</span>
          </div>
          <div style={{ padding:'14px 18px' }}>
            <MiniChart data={wf.growthTrend} color={branch.color}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t-3)', marginTop:4 }}>
              {MONTHS.map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* Workforce by department */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border-md)' }}>
            <span style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-display)' }}>Workforce by department</span>
          </div>
          <div style={{ padding:'12px 18px' }}>
            {wf.departments.map(dept => {
              const pct = Math.round((dept.count / wf.totalWorkforce) * 100)
              return (
                <div key={dept.name} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12.5, fontWeight:500, color:'var(--t-1)' }}>{dept.name}</span>
                    <span style={{ fontSize:12, color:'var(--t-2)', fontFamily:'var(--font-mono)' }}>{dept.count} · {pct}%</span>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width:`${pct}%`, background:dept.color, transition:'width .6s ease' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card card-p">
        <div style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-display)', marginBottom:12 }}>Quick actions for {branch.name}</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { label:'View members',    icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
            { label:'Soul tracker',    icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
            { label:'Attendance log',  icon:'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
            { label:'Schedule event',  icon:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
            { label:'Broadcast',       icon:'M22 2L11 13M22 2L15 22 11 13 2 9l20-7z' },
          ].map(a => (
            <button key={a.label} className="btn btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d={a.icon}/></svg>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
