'use client'
import { useState } from 'react'

const SAMPLE_MEMBERS = [
  { id:'m1', name:'Emmanuel Abiola',  branch:'Gbagada',  joinDate:'Nov 2024', monthsActive:7, rating:5, eligible:true,  verified:true,  referrals:3, status:'verified'   },
  { id:'m2', name:'Funke Oladipo',    branch:'Ikeja',    joinDate:'Dec 2024', monthsActive:6, rating:4, eligible:true,  verified:false, referrals:0, status:'eligible'   },
  { id:'m3', name:'Kolade Nwachukwu', branch:'London UK',joinDate:'Jan 2025', monthsActive:5, rating:3, eligible:false, verified:false, referrals:0, status:'building'   },
  { id:'m4', name:'Toyin Okafor',     branch:'Lekki HQ', joinDate:'Mar 2025', monthsActive:3, rating:2, eligible:false, verified:false, referrals:0, status:'building'   },
  { id:'m5', name:'Ngozi Kalu',       branch:'Lekki HQ', joinDate:'Oct 2024', monthsActive:8, rating:5, eligible:true,  verified:true,  referrals:5, status:'verified'   },
  { id:'m6', name:'Richard Eze',      branch:'Abuja',    joinDate:'Feb 2025', monthsActive:4, rating:3, eligible:false, verified:false, referrals:0, status:'building'   },
]

const STATUS_STYLE: Record<string, { label:string; color:string; bg:string }> = {
  verified: { label:'Verified member', color:'#22C55E', bg:'rgba(34,197,94,0.12)' },
  eligible: { label:'Eligible — awaiting', color:'#F59E0B', bg:'rgba(245,158,11,0.12)' },
  building: { label:'Building towards', color:'#71717A', bg:'rgba(113,113,122,0.12)' },
}

function StarRating({ value, max=5 }: { value:number; max?:number }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {Array.from({length:max}).map((_,i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i < value ? '#F59E0B' : 'none'} stroke={i < value ? '#F59E0B' : '#3F3F46'} strokeWidth="1.5" width="13" height="13">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

export default function MemberVerification({ onNavigate }: { onNavigate: (p:string)=>void }) {
  const [tab, setTab] = useState<'overview'|'requests'|'settings'>('overview')
  const [threshold, setThreshold] = useState(6)
  const [selected, setSelected] = useState<string|null>(null)

  const eligible = SAMPLE_MEMBERS.filter(m => m.eligible)
  const verified = SAMPLE_MEMBERS.filter(m => m.verified)

  return (
    <div>
      {/* Explainer */}
      <div style={{ background:'var(--s-2)', border:'0.5px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:16, borderLeft:'3px solid var(--brand)' }}>
        <div style={{ fontSize:10.5, color:'var(--brand)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>How membership verification works</div>
        <div style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.7 }}>
          After <strong style={{ color:'var(--t-1)' }}>{threshold} months</strong> of active engagement, a member becomes eligible to request a <strong style={{ color:'var(--t-1)' }}>membership referral link</strong>. They share this link with someone they want to bring in. The cell or church admin accepts the request. The system rates the referring member on a <strong style={{ color:'var(--t-1)' }}>1–5 commitment scale</strong> based on attendance, giving faithfulness, prayer activity, and serving record — giving leadership a clear picture of engagement depth.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { l:'Verified members', v:verified.length,  sub:'Full membership confirmed' },
          { l:'Eligible for referral', v:eligible.length, sub:`${threshold}+ months active`, accent:true },
          { l:'Referral links issued', v:SAMPLE_MEMBERS.reduce((a,b)=>a+b.referrals,0), sub:'All time, all branches' },
          { l:'Avg commitment score', v:'4.0', sub:'Out of 5 · all branches' },
        ].map(m => (
          <div key={m.l} className="metric-tile" style={{ borderTop:`2px solid ${m.accent?'var(--brand)':'var(--s-4)'}` }}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-value" style={{ fontSize:'1.5rem' }}>{m.v}</div>
            <div className="metric-sub flat">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {([['overview','Member status'],['requests','Pending requests'],['settings','Threshold settings']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="card card-p">
          <div style={{ fontSize:13.5, fontWeight:600, marginBottom:14 }}>Member verification status</div>
          <table className="tbl">
            <thead><tr><th>Member</th><th>Branch</th><th>Active since</th><th>Months</th><th>Commitment</th><th>Referrals given</th><th>Status</th></tr></thead>
            <tbody>
              {SAMPLE_MEMBERS.map(m => {
                const st = STATUS_STYLE[m.status]
                return (
                  <tr key={m.id} style={{ cursor:'pointer' }} onClick={() => setSelected(selected===m.id?null:m.id)}>
                    <td><strong>{m.name}</strong></td>
                    <td style={{ fontSize:12 }}>{m.branch}</td>
                    <td style={{ fontSize:12, color:'var(--t-2)' }}>{m.joinDate}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:60, height:4, background:'var(--s-4)', borderRadius:100, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:100, background: m.monthsActive>=threshold?'var(--green)':'var(--brand)', width:`${Math.min(100,(m.monthsActive/threshold)*100)}%` }}/>
                        </div>
                        <span style={{ fontSize:11.5, fontFamily:'var(--font-mono)', color: m.monthsActive>=threshold?'var(--green)':'var(--t-2)' }}>{m.monthsActive}mo</span>
                      </div>
                    </td>
                    <td><StarRating value={m.rating}/></td>
                    <td style={{ fontSize:12, fontFamily:'var(--font-mono)', color: m.referrals>0?'var(--brand)':'var(--t-3)' }}>{m.referrals}</td>
                    <td><span style={{ background:st.bg, color:st.color, padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:500 }}>{st.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Expanded detail */}
          {selected && (() => {
            const m = SAMPLE_MEMBERS.find(x => x.id === selected)!
            return (
              <div style={{ marginTop:14, padding:'14px 16px', background:'var(--s-3)', borderRadius:10, border:'0.5px solid var(--border)' }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>{m.name} — commitment profile</div>
                {[
                  { label:'Months active', score: m.monthsActive, max:12, unit:'mo' },
                  { label:'Commitment rating', score: m.rating, max:5, unit:'/5' },
                  { label:'Referrals given', score: m.referrals, max:10, unit:'' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 0', borderBottom:'0.5px solid var(--border)' }}>
                    <div style={{ width:140, fontSize:12, color:'var(--t-2)' }}>{row.label}</div>
                    <div style={{ flex:1, height:5, background:'var(--s-4)', borderRadius:100, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:100, background:'var(--brand)', width:`${(row.score/row.max)*100}%` }}/>
                    </div>
                    <div style={{ fontSize:12, fontFamily:'var(--font-mono)', fontWeight:600 }}>{row.score}{row.unit}</div>
                  </div>
                ))}
                {m.eligible && !m.verified && (
                  <button className="btn btn-brand btn-sm" style={{ marginTop:12 }}>Generate referral link ↗</button>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── PENDING REQUESTS ── */}
      {tab === 'requests' && (
        <div className="card card-p">
          <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4 }}>Pending referral requests</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16 }}>Members who are eligible and have requested their referral link for review.</div>
          {eligible.filter(m=>!m.verified).map(m => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'0.5px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{m.name}</div>
                <div style={{ fontSize:11.5, color:'var(--t-2)', marginTop:2 }}>{m.branch} · {m.monthsActive} months active</div>
                <div style={{ marginTop:6 }}><StarRating value={m.rating}/></div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-sm btn-brand">Approve & generate link</button>
                <button className="btn btn-sm">Review later</button>
              </div>
            </div>
          ))}
          {eligible.filter(m=>!m.verified).length === 0 && (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--t-3)', fontSize:13 }}>No pending requests at this time.</div>
          )}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === 'settings' && (
        <div className="card card-p" style={{ maxWidth:480 }}>
          <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4 }}>Verification threshold</div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:20, lineHeight:1.65 }}>
            Super admin, senior pastor, or group admin can adjust the minimum months required before a member becomes eligible for a referral link.
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:500, color:'var(--t-2)', display:'block', marginBottom:8 }}>Minimum active months: <strong style={{ color:'var(--brand)', fontFamily:'var(--font-mono)' }}>{threshold}</strong></label>
            <input type="range" min={1} max={24} value={threshold} onChange={e=>setThreshold(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--brand)' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t-3)', marginTop:4 }}>
              <span>1 month</span><span>12 months</span><span>24 months</span>
            </div>
          </div>
          {[
            { label:'Who can approve referral requests', val:'Cell admin / Church admin', note:'Set per branch' },
            { label:'Commitment rating components', val:'Attendance · Giving · Prayer · Serving', note:'Weighted equally' },
            { label:'Rating scale', val:'1 (lowest) → 5 (highest commitment)', note:'Shown to approving admin' },
            { label:'Link expiry', val:'30 days after generation', note:'Requester can renew' },
          ].map(row => (
            <div key={row.label} className="stat-row">
              <div>
                <div style={{ fontSize:12.5 }}>{row.label}</div>
                <div style={{ fontSize:11, color:'var(--t-3)' }}>{row.note}</div>
              </div>
              <div style={{ fontSize:12, color:'var(--brand)', fontWeight:500, textAlign:'right', maxWidth:200 }}>{row.val}</div>
            </div>
          ))}
          <button className="btn btn-brand btn-sm" style={{ marginTop:16 }}>Save settings</button>
        </div>
      )}
    </div>
  )
}
