'use client'
import { useState } from 'react'
import { branches } from '@/lib/data'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Simulated tithe & offering data per branch
const GIVING_DATA = branches.map(b => ({
  ...b,
  monthlyTithes: [820,910,870,1100,980,1050,920,1200,1150,1300,1050,1400].map(v=>Math.round(v * b.members / 100)),
  monthlyOfferings: [320,350,310,420,380,400,360,450,430,500,410,550].map(v=>Math.round(v * b.members / 100)),
  specialSeeds: Math.round(b.members * 4.2),
  totalGivers: Math.round(b.members * 0.68),
}))

const TOTAL_MONTHLY = MONTHS.map((_,i)=>({
  month: MONTHS[i],
  tithes: GIVING_DATA.reduce((s,b)=>s+b.monthlyTithes[i],0),
  offerings: GIVING_DATA.reduce((s,b)=>s+b.monthlyOfferings[i],0),
}))

const fmt = (n:number) => n>=1_000_000 ? `₦${(n/1_000_000).toFixed(1)}M` : n>=1000 ? `₦${(n/1000).toFixed(0)}K` : `₦${n}`

function CT({ active, payload, label }:any) {
  if (!active||!payload?.length) return null
  return (
    <div style={{background:'var(--dark-2)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'white'}}>
      <div style={{fontWeight:700,marginBottom:6,color:'var(--t-1)'}}>{label}</div>
      {payload.map((p:any)=>(
        <div key={p.dataKey} style={{color:p.color,marginBottom:2}}>{p.name}: <strong>{fmt(p.value)}</strong></div>
      ))}
    </div>
  )
}

export default function Giving({ onNavigate }:{ onNavigate:(p:string)=>void }) {
  const [tab, setTab] = useState<'overview'|'branches'|'givers'>('overview')
  const [selectedBranch, setSelectedBranch] = useState(GIVING_DATA[0])
  const [period, setPeriod] = useState<'ytd'|'monthly'|'weekly'>('ytd')

  const ytdTithes = GIVING_DATA.reduce((s,b)=>s+b.monthlyTithes.slice(0,5).reduce((a,v)=>a+v,0),0)
  const ytdOfferings = GIVING_DATA.reduce((s,b)=>s+b.monthlyOfferings.slice(0,5).reduce((a,v)=>a+v,0),0)
  const totalGivers = GIVING_DATA.reduce((s,b)=>s+b.totalGivers,0)
  const totalSpecial = GIVING_DATA.reduce((s,b)=>s+b.specialSeeds,0)

  const mayTithes = GIVING_DATA.reduce((s,b)=>s+b.monthlyTithes[4],0)
  const aprTithes = GIVING_DATA.reduce((s,b)=>s+b.monthlyTithes[3],0)
  const growth = Math.round(((mayTithes-aprTithes)/aprTithes)*100)

  const branchTableData = GIVING_DATA.map(b=>({
    ...b,
    ytd: b.monthlyTithes.slice(0,5).reduce((a,v)=>a+v,0)+b.monthlyOfferings.slice(0,5).reduce((a,v)=>a+v,0),
    may: b.monthlyTithes[4]+b.monthlyOfferings[4],
    perCapita: Math.round((b.monthlyTithes[4]+b.monthlyOfferings[4])/b.totalGivers),
  })).sort((a,b)=>b.ytd-a.ytd)

  return (
    <div>
      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        {[
          {label:'YTD Tithes', value:fmt(ytdTithes), sub:`May: ${fmt(mayTithes)}`, change:`+${growth}%`, pos:true},
          {label:'YTD Offerings', value:fmt(ytdOfferings), sub:'Jan – May 2026', change:'+8%', pos:true},
          {label:'Total Givers', value:totalGivers.toLocaleString(), sub:'Active this month', change:'+3.2%', pos:true},
          {label:'Special Seeds', value:fmt(totalSpecial), sub:'One-time + mission', change:'+12%', pos:true},
        ].map(k=>(
          <div key={k.label} className="card card-p" style={{padding:'14px 16px'}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--t-3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--font-display)',color:'var(--t-1)',letterSpacing:'-0.02em',lineHeight:1.1}}>{k.value}</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
              <span style={{fontSize:11,color:'var(--t-3)'}}>{k.sub}</span>
              <span style={{fontSize:11,fontWeight:700,color:k.pos?'var(--green)':'var(--red)',background:k.pos?'rgba(16,185,129,0.1)':'rgba(197,48,48,0.1)',padding:'1px 7px',borderRadius:100}}>{k.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{marginBottom:18}}>
        {(['overview','branches','givers'] as const).map(t=>(
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{textTransform:'capitalize'}}>{t}</button>
        ))}
      </div>

      {tab==='overview' && (
        <>
          {/* Period filter */}
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {(['ytd','monthly','weekly'] as const).map(p=>(
              <button key={p} onClick={()=>setPeriod(p)} className="btn btn-sm" style={{background:period===p?'var(--brand)':'var(--s-3)',color:period===p?'white':'var(--t-2)',border:'none',textTransform:'uppercase',fontSize:10.5,letterSpacing:'.04em'}}>{p}</button>
            ))}
          </div>

          <div className="card card-p" style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:16}}>Tithes & Offerings — All Branches</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TOTAL_MONTHLY} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>fmt(v)} tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false} width={52}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="tithes"    name="Tithes"    fill="var(--brand)"   radius={[4,4,0,0]}/>
                <Bar dataKey="offerings" name="Offerings" fill="var(--gold)"    radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div className="card card-p">
              <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Giving trend</div>
              <div style={{fontSize:11,color:'var(--t-3)',marginBottom:14}}>Total giving Jan–May</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={TOTAL_MONTHLY.slice(0,5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--t-3)'}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={v=>fmt(v)} tick={{fontSize:10,fill:'var(--t-3)'}} axisLine={false} tickLine={false} width={48}/>
                  <Tooltip content={<CT/>}/>
                  <Line type="monotone" dataKey="tithes" stroke="var(--brand)" strokeWidth={2.5} dot={{r:3,fill:'var(--brand)'}} name="Tithes"/>
                  <Line type="monotone" dataKey="offerings" stroke="var(--gold)" strokeWidth={2} dot={{r:3,fill:'var(--gold)'}} name="Offerings" strokeDasharray="4 2"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card card-p">
              <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Branch share — May</div>
              <div style={{fontSize:11,color:'var(--t-3)',marginBottom:14}}>% of total monthly giving</div>
              {branchTableData.slice(0,5).map(b=>{
                const total = branchTableData.reduce((s,x)=>s+x.may,0)
                const pct = Math.round((b.may/total)*100)
                return (
                  <div key={b.id} style={{marginBottom:9}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:'var(--t-1)'}}>{b.short}</span>
                      <span style={{fontSize:12,fontWeight:700,color:'var(--t-1)'}}>{pct}%</span>
                    </div>
                    <div style={{height:5,background:'var(--s-4)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:b.color,borderRadius:10,transition:'width .4s ease'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {tab==='branches' && (
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 18px',background:'linear-gradient(90deg,var(--s-3),var(--s-2))',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontWeight:700,fontSize:13}}>Branch giving breakdown</div>
            <div style={{fontSize:11,color:'var(--t-3)'}}>YTD Jan–May 2026</div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'linear-gradient(90deg,#EBE9DF,#F4F2EA)'}}>
                  {['Branch','Tithers','YTD Total','May','Per Giver','vs Apr'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',fontSize:11,fontWeight:700,color:'var(--t-2)',textAlign:h==='Branch'?'left':'right',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branchTableData.map((b,i)=>{
                  const prevMay = b.monthlyTithes[3]+b.monthlyOfferings[3]
                  const chg = Math.round(((b.may-prevMay)/prevMay)*100)
                  return (
                    <tr key={b.id} onClick={()=>setSelectedBranch(b)} style={{cursor:'pointer',borderBottom:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(0,0,0,0.015)',transition:'background .1s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='var(--s-3)')}
                      onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'transparent':'rgba(0,0,0,0.015)')}>
                      <td style={{padding:'11px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <span style={{width:8,height:8,borderRadius:'50%',background:b.color,flexShrink:0}}/>
                          <span style={{fontWeight:600,fontSize:13}}>{b.name}</span>
                        </div>
                      </td>
                      <td style={{padding:'11px 16px',fontSize:12.5,color:'var(--t-2)',textAlign:'right'}}>{b.totalGivers.toLocaleString()}</td>
                      <td style={{padding:'11px 16px',fontSize:13,fontWeight:700,textAlign:'right'}}>{fmt(b.ytd)}</td>
                      <td style={{padding:'11px 16px',fontSize:12.5,textAlign:'right'}}>{fmt(b.may)}</td>
                      <td style={{padding:'11px 16px',fontSize:12.5,color:'var(--t-2)',textAlign:'right'}}>{fmt(b.perCapita)}</td>
                      <td style={{padding:'11px 16px',textAlign:'right'}}>
                        <span style={{fontSize:11,fontWeight:700,color:chg>=0?'var(--green)':'var(--red)',background:chg>=0?'rgba(16,185,129,0.1)':'rgba(197,48,48,0.1)',padding:'2px 8px',borderRadius:100}}>{chg>=0?'+':''}{chg}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='givers' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div className="card card-p">
            <div style={{fontWeight:700,fontSize:13,marginBottom:14}}>Giving participation rate</div>
            {GIVING_DATA.map(b=>{
              const rate = Math.round((b.totalGivers/b.members)*100)
              return (
                <div key={b.id} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12.5,color:'var(--t-1)',fontWeight:600}}>{b.short}</span>
                    <span style={{fontSize:12,color:'var(--t-2)'}}>{b.totalGivers.toLocaleString()} / {b.members.toLocaleString()} · <strong style={{color:rate>65?'var(--green)':'var(--gold)'}}>{rate}%</strong></span>
                  </div>
                  <div style={{height:6,background:'var(--s-4)',borderRadius:10,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${rate}%`,background:`linear-gradient(90deg,${b.color},${b.color}cc)`,borderRadius:10}}/>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card card-p">
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>First-time givers</div>
            <div style={{fontSize:11,color:'var(--t-3)',marginBottom:14}}>New giving records this month</div>
            {branches.slice(0,6).map(b=>{
              const firstTimers = Math.round(b.members * 0.012)
              return (
                <div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'0.5px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:b.color}}/>
                    <span style={{fontSize:12.5}}>{b.short}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:13,fontWeight:700}}>{firstTimers}</span>
                    <span style={{fontSize:10,color:'var(--t-3)'}}>new givers</span>
                  </div>
                </div>
              )
            })}
            <div style={{marginTop:14,padding:'10px 14px',background:'var(--s-3)',borderRadius:10,fontSize:12,color:'var(--t-2)',lineHeight:1.6}}>
              <strong style={{color:'var(--brand)'}}>Note:</strong> In production, giving data integrates with your church accounting system. This view shows anonymised participation metrics — amounts are never linked to individual names in this dashboard.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
