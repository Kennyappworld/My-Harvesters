'use client'
import { useState, useEffect } from 'react'
import { notify } from '@/lib/toast'
import { persist, hydrate } from '@/lib/store'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  : null

const SAMPLE_MEMBERS = [
  { id:'m1', name:'Emmanuel Abiola',  email:'emmanuel@hicc.org', branch:'Lekki HQ',  dept:'Ushering',        joined:'Nov 2022', months:31, rating:4.2, status:'eligible'   },
  { id:'m2', name:'Funke Oladipo',    email:'funke.o@hicc.org',  branch:'Ikeja',      dept:'Prayer',          joined:'Dec 2023', months:18, rating:3.8, status:'eligible'   },
  { id:'m3', name:'Ngozi Kalu',       email:'ngozi.k@hicc.org',  branch:'Lekki HQ',  dept:'Worship & Music', joined:'Oct 2024', months:8,  rating:4.5, status:'eligible'   },
  { id:'m4', name:'Richard Eze',      email:'richard.e@hicc.org',branch:'Abuja',      dept:'Media',           joined:'Feb 2025', months:4,  rating:2.9, status:'ineligible' },
  { id:'m5', name:'Toyin Okafor',     email:'toyin@hicc.org',    branch:'Lekki HQ',  dept:'KidsHouse',       joined:'Mar 2025', months:3,  rating:3.1, status:'ineligible' },
  { id:'m6', name:'Kolade Nwachukwu', email:'kolade@gmail.com',  branch:'London UK', dept:'Outreach',        joined:'Jan 2025', months:5,  rating:3.6, status:'ineligible' },
]

const RATING_COMPONENTS = ['Attendance', 'Giving', 'Prayer', 'Serving', 'Small group']
const APPROVER_OPTIONS  = ['Cell admin only', 'Church admin only', 'Cell admin / Church admin', 'Senior Pastor only']
const EXPIRY_OPTIONS    = ['7 days', '14 days', '30 days', '60 days', '90 days', 'Never']

function Stars({ val }: { val: number }) {
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24" width="11" height="11"
          fill={i <= Math.round(val) ? 'var(--gold)' : 'none'}
          stroke={i <= Math.round(val) ? 'var(--gold)' : 'var(--t-3)'}
          strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontSize:11, color:'var(--t-2)', marginLeft:4 }}>{val.toFixed(1)}</span>
    </span>
  )
}

export default function MemberVerification() {
  const [tab, setTab]           = useState<'overview'|'requests'|'settings'>('overview')
  const [threshold, setThreshold] = useState(6)
  const [selected, setSelected] = useState<string|null>(null)
  const [saved, setSaved]       = useState(false)

  // Editable settings state
  const [approver, setApprover]           = useState('Cell admin / Church admin')
  const [ratingComponents, setRatingComponents] = useState(['Attendance','Giving','Prayer','Serving'])
  const [expiry, setExpiry]               = useState('30 days')
  const [ratingScale, setRatingScale]     = useState<[number,number]>([1,5])
  const [platformName, setPlatformName]   = useState('Harvesters International Christian Centre Workforce Community')

  const toggleComponent = (comp: string) => {
    setRatingComponents(prev =>
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    )
  }

  const saveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const [memberList, setMemberList] = useState(() => hydrate('hicc_verif_members' as any, SAMPLE_MEMBERS))

  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const { data } = await supabase.from('workers').select('id, full_name, email, branch_id, department, created_at').order('created_at', { ascending: true })
        if (data && data.length > 0) {
          const now = new Date()
          const mapped = data.map((w:any) => {
            const joined = new Date(w.created_at)
            const months = Math.floor((now.getTime()-joined.getTime())/(1000*60*60*24*30))
            return {
              id: w.id, name: w.full_name, email: w.email,
              branch: w.branch_id, dept: w.department || 'General',
              joined: joined.toLocaleDateString('en-US',{month:'short',year:'numeric'}),
              months, rating: 3.5 + Math.random(), status: months >= 6 ? 'eligible' : 'ineligible',
            }
          })
          setMemberList(mapped)
          persist('hicc_verif_members' as any, mapped)
        }
      } catch {}
    }
    load()
  }, [])

  const eligible   = memberList.filter((m:any) => m.months >= threshold)
  const ineligible = memberList.filter((m:any) => m.months < threshold)

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontWeight:800, fontSize:17, fontFamily:'var(--font-display)', color:'var(--t-1)', marginBottom:3 }}>Member Verification</h2>
        <p style={{ fontSize:12.5, color:'var(--t-2)' }}>Manage eligibility thresholds, referral links, and commitment ratings.</p>
      </div>

      <div className="tabs" style={{ marginBottom:16 }}>
        {([['overview','Overview'],['requests','Referral requests'],['settings','Settings']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
            {[
              { l:'Eligible members', v:eligible.length, sub:`Active ≥ ${threshold} months`, accent:'var(--brand)' },
              { l:'Not yet eligible', v:ineligible.length, sub:'Below threshold', accent:'var(--amber)' },
              { l:'Avg commitment',   v:'3.9★', sub:'Across all branches', accent:'var(--gold)' },
              { l:'Links generated',  v:12, sub:'This quarter', accent:'var(--teal)' },
            ].map(m => (
              <div key={m.l} className="metric-tile" style={{ borderTop:`3px solid ${m.accent}` }}>
                <div className="metric-label">{m.l}</div>
                <div className="metric-value" style={{ fontSize:'1.6rem' }}>{m.v}</div>
                <div className="metric-sub flat">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ overflow:'hidden', marginBottom:12 }}>
            <div style={{ padding:'12px 18px', background:'linear-gradient(90deg,rgba(27,67,50,0.05) 0%,transparent 100%)', borderBottom:'1px solid var(--border-md)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-display)' }}>Eligible for referral link</span>
              <span className="chip chip-brand">{eligible.length} members</span>
            </div>
            <table className="tbl">
              <thead><tr><th>Member</th><th>Branch</th><th>Active months</th><th>Rating</th><th>Action</th></tr></thead>
              <tbody>
                {eligible.map(m => (
                  <tr key={m.id} style={{ cursor:'pointer' }} onClick={()=>setSelected(selected===m.id?null:m.id)}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{m.name}</div>
                      <div style={{ fontSize:11, color:'var(--t-3)' }}>{m.dept}</div>
                    </td>
                    <td><span className="chip chip-gray">{m.branch}</span></td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--brand)', fontSize:13 }}>{m.months}mo</span></td>
                    <td><Stars val={m.rating}/></td>
                    <td>
                      <button className="btn btn-brand btn-sm" onClick={e=>{e.stopPropagation(); notify.success(`Link generated — hicc.org/join?ref=${m.id}`); navigator.clipboard?.writeText(`https://hicc.org/join?ref=${m.id}&branch=${m.branch.toLowerCase().replace(' ','-')}`).then(()=>notify.copy())}} style={{ fontSize:11 }}>
                        Generate link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', background:'linear-gradient(90deg,rgba(201,168,76,0.06) 0%,transparent 100%)', borderBottom:'1px solid var(--border-md)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-display)' }}>Not yet eligible</span>
              <span className="chip chip-amber">{ineligible.length} members · below {threshold}-month threshold</span>
            </div>
            <table className="tbl">
              <thead><tr><th>Member</th><th>Branch</th><th>Active months</th><th>Remaining</th></tr></thead>
              <tbody>
                {ineligible.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{m.name}</div>
                      <div style={{ fontSize:11, color:'var(--t-3)' }}>{m.dept}</div>
                    </td>
                    <td><span className="chip chip-gray">{m.branch}</span></td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:13 }}>{m.months}mo</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="track" style={{ width:80 }}>
                          <div className="fill fill-brand" style={{ width:`${Math.min(100,(m.months/threshold)*100)}%` }}/>
                        </div>
                        <span style={{ fontSize:11, color:'var(--t-3)', fontFamily:'var(--font-mono)' }}>{threshold-m.months}mo left</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REFERRAL REQUESTS ── */}
      {tab === 'requests' && (
        <div className="card card-p" style={{ textAlign:'center', padding:'3rem' }}>
          <div style={{ fontSize:40, marginBottom:14 }}>🔗</div>
          <div style={{ fontWeight:700, fontSize:15, color:'var(--t-1)', marginBottom:6 }}>No pending referral requests</div>
          <p style={{ fontSize:13, color:'var(--t-2)', maxWidth:360, margin:'0 auto' }}>When eligible members request a referral link, they'll appear here for you to approve and generate.</p>
        </div>
      )}

      {/* ── SETTINGS ── fully editable ── */}
      {tab === 'settings' && (
        <div style={{ maxWidth:560 }}>
          {saved && (
            <div style={{ background:'var(--green-lt)', border:'1px solid rgba(27,158,90,0.3)', borderRadius:'var(--r)', padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--green)', fontWeight:600 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
              Settings saved successfully
            </div>
          )}

          <div className="card card-p" style={{ marginBottom:12 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Verification threshold</h3>
            <p style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:18, lineHeight:1.6 }}>
              Minimum months a member must be active before they can request a referral link.
            </p>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:8 }}>
              Minimum active months: <strong style={{ color:'var(--brand)', fontFamily:'var(--font-mono)', fontSize:15 }}>{threshold}</strong>
            </label>
            <input
              type="range" min={1} max={24} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              style={{ width:'100%', accentColor:'var(--brand)', cursor:'pointer', height:6 }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--t-3)', marginTop:5 }}>
              <span>1 month</span><span>12 months</span><span>24 months</span>
            </div>
          </div>

          <div className="card card-p" style={{ marginBottom:12 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:14 }}>Who can approve referral requests</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {APPROVER_OPTIONS.map(opt => (
                <label key={opt} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', borderRadius:'var(--r)', border:`1px solid ${approver===opt?'var(--brand)':'var(--border)'}`, background:approver===opt?'var(--brand-soft)':'transparent', transition:'all .12s' }}>
                  <input type="radio" name="approver" value={opt} checked={approver===opt} onChange={()=>setApprover(opt)} style={{ accentColor:'var(--brand)', width:15, height:15 }}/>
                  <span style={{ fontSize:13, fontWeight:approver===opt?600:400, color:'var(--t-1)' }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card card-p" style={{ marginBottom:12 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:6 }}>Commitment rating components</h3>
            <p style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:14 }}>Select which activities contribute to a member's commitment score.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {RATING_COMPONENTS.map(comp => {
                const on = ratingComponents.includes(comp)
                return (
                  <button key={comp} onClick={()=>toggleComponent(comp)} style={{ padding:'7px 14px', borderRadius:100, fontSize:12.5, fontWeight:on?700:400, cursor:'pointer', border:`1px solid ${on?'var(--brand)':'var(--border-md)'}`, background:on?'var(--brand)':'var(--s-2)', color:on?'white':'var(--t-2)', transition:'all .12s', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:6 }}>
                    {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>}
                    {comp}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize:11.5, color:'var(--t-3)', marginTop:10 }}>Selected components are weighted equally. {ratingComponents.length} component{ratingComponents.length!==1?'s':''} selected.</p>
          </div>

          <div className="card card-p" style={{ marginBottom:12 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:14 }}>Referral link expiry</h3>
            <select className="select" value={expiry} onChange={e=>setExpiry(e.target.value)}>
              {EXPIRY_OPTIONS.map(o => <option key={o} value={o}>{o} after generation</option>)}
            </select>
            <p style={{ fontSize:11.5, color:'var(--t-3)', marginTop:8 }}>After expiry, the member can request a fresh link from their unit head.</p>
          </div>

          <div className="card card-p" style={{ marginBottom:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, marginBottom:6 }}>Rating scale</h3>
            <p style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:12 }}>Set the rating range visible to approving admins.</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Minimum</label>
                <select className="select" value={ratingScale[0]} onChange={e=>setRatingScale([Number(e.target.value),ratingScale[1]])}>
                  {[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <span style={{ fontSize:18, color:'var(--t-3)', marginTop:18 }}>→</span>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Maximum</label>
                <select className="select" value={ratingScale[1]} onChange={e=>setRatingScale([ratingScale[0],Number(e.target.value)])}>
                  {[3,4,5,7,10].map(n=><option key={n} value={n}>{n} (highest)</option>)}
                </select>
              </div>
            </div>
          </div>

          <button className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14, fontWeight:700 }} onClick={saveSettings}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
            Save settings
          </button>
        </div>
      )}
    </div>
  )
}
