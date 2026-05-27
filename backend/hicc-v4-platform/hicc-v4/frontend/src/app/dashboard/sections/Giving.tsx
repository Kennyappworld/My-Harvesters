'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { givingMonthly, branches } from '@/lib/data'

const pieData = [
  { name:'Tithes',   value:89, color:'#3B82F6' },
  { name:'Offerings',value:34, color:'var(--accent)' },
  { name:'Special',  value:19, color:'var(--brand)' },
]

export default function Giving() {
  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 className="section-title">Giving & Finance</h1>
        <p className="section-sub">Multi-currency giving across all branches — ₦ Nigeria · £ UK · $ USA</p>
      </div>

      <div className="bento bento-3" style={{ gap:10 }}>
        {[
          { label:'Total May Giving (₦)', value:'₦142M', sub:'+8.4% vs April', color:'var(--brand)' },
          { label:'London May (£)',        value:'£18,000', sub:'+5.2% vs April', color:'var(--indigo,#6366F1)' },
          { label:'Houston May ($)',       value:'$12,000', sub:'+6.1% vs April', color:'var(--green)' },
        ].map((k,i) => (
          <div key={i} className="kpi-card">
            <div style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-heading)', fontWeight:600, textTransform:'uppercase', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:26, fontWeight:700, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:12, color:'var(--green)', marginTop:6 }}>↑ {k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <div className="section-title" style={{ fontSize:15 }}>Monthly Giving Trend (₦M)</div>
            <div className="section-sub">Stacked: Tithes · Offerings · Special Seeds</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={givingMonthly}>
              <XAxis dataKey="month" stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} />
              <YAxis stroke="transparent" tick={{ fill:'var(--t-3)', fontSize:11 }} width={35} />
              <Tooltip contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--t-1)', fontFamily:'var(--font-mono)', fontSize:12 }} formatter={(v: number) => [`₦${v}M`, '']} />
              <Bar dataKey="tithes" stackId="a" fill="#3B82F6" name="Tithes" />
              <Bar dataKey="offerings" stackId="a" fill="var(--accent)" name="Offerings" />
              <Bar dataKey="special" stackId="a" fill="var(--brand)" name="Special" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ marginBottom:16 }}>
            <div className="section-title" style={{ fontSize:15 }}>May Split</div>
            <div className="section-sub">By giving type</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}M`}>
                {pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--s-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--t-1)', fontFamily:'var(--font-mono)', fontSize:12 }} formatter={(v: number) => [`₦${v}M`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
            {pieData.map((d,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:d.color }} />
                  <span style={{ color:'var(--t-2)' }}>{d.name}</span>
                </div>
                <span style={{ fontFamily:'var(--font-mono)', color:'var(--t-1)' }}>₦{d.value}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch giving table */}
      <div className="card">
        <div style={{ marginBottom:16 }}>
          <div className="section-title" style={{ fontSize:15 }}>Giving by Branch — May 2026</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {branches.filter(b => b.givingNGN).sort((a,b) => (b.givingNGN||0)-(a.givingNGN||0)).map(b => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:3, height:20, borderRadius:2, background:b.color, flexShrink:0 }} />
              <div style={{ width:80, fontFamily:'var(--font-heading)', fontSize:13, color:'var(--t-2)' }}>{b.short}</div>
              <div style={{ flex:1, background:'var(--s-3)', borderRadius:4, height:10, overflow:'hidden' }}>
                <div style={{ height:'100%', background:b.color, borderRadius:4, width:`${((b.givingNGN||0)/38000000)*100}%` }} />
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--t-1)', width:60, textAlign:'right' }}>
                ₦{((b.givingNGN||0)/1000000).toFixed(0)}M
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
