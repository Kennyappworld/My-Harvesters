'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { weeklyAttendance, branches } from '@/lib/data'

export default function Attendance() {
  const latest = weeklyAttendance[weeklyAttendance.length - 1]
  const prev    = weeklyAttendance[weeklyAttendance.length - 2]
  const keys    = ['lekki','gbagada','ikeja','anthony','abuja','london','houston']

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 className="section-title">Attendance Tracking</h1>
        <p className="section-sub">Weekly attendance across all branches — last 8 Sundays</p>
      </div>

      <div className="bento bento-4" style={{ gap:10 }}>
        {keys.slice(0,4).map(k => {
          const branch = branches.find(b => b.id===k)!
          const cur = (latest as unknown as Record<string,number>)[k]
          const pre = (prev as unknown as Record<string,number>)[k]
          const chg = cur - pre
          return (
            <div key={k} className="kpi-card">
              <div style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-heading)', fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>{branch.short}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:24, fontWeight:700, color:branch.color }}>{cur.toLocaleString()}</div>
              <div style={{ fontSize:12, color: chg>=0 ? 'var(--green)' : 'var(--red)', marginTop:6 }}>
                {chg>=0?'↑':'↓'} {Math.abs(chg).toLocaleString()} vs last week
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div style={{ marginBottom:16 }}>
          <div className="section-title" style={{ fontSize:15 }}>Weekly Attendance Trend</div>
          <div className="section-sub">All branches — last 8 Sundays</div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyAttendance}>
            <XAxis dataKey="week" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
            <YAxis stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={50} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--t-1)', fontFamily:'var(--font-mono)', fontSize:12 }}
              formatter={(v: number) => [v.toLocaleString(), '']}
            />
            <Legend wrapperStyle={{ fontSize:12 }} />
            {keys.map(k => (
              <Line key={k} type="monotone" dataKey={k}
                stroke={branches.find(b=>b.id===k)?.color||'#666'}
                strokeWidth={1.8} dot={{ r:3 }}
                name={branches.find(b=>b.id===k)?.short||k}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div style={{ marginBottom:16 }}>
          <div className="section-title" style={{ fontSize:15 }}>Branch Attendance Rates (May 25)</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {branches.map(b => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:80, fontFamily:'var(--font-heading)', fontSize:13, color:'var(--t-2)' }}>{b.short}</div>
              <div style={{ flex:1, background:'var(--s-3)', borderRadius:4, height:10, overflow:'hidden' }}>
                <div style={{ height:'100%', background:b.color, borderRadius:4, width:`${b.attendance}%` }} />
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color:'var(--t-1)', width:40, textAlign:'right' }}>{b.attendance}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
