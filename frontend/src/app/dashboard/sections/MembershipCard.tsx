'use client'
import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@/lib/useSession'
import { branches, DEPARTMENTS } from '@/lib/data'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) : null

type CardHolder = {
  id: string; name: string; email: string; role: string
  branch_id: string; branch_name: string; dept: string
  memberSince: string; phone: string; status: string
}

const ROLE_DISPLAY: Record<string,string> = {
  senior_pastor:'Senior Pastor', pastor:'Branch Pastor', admin:'Administrator',
  unit_head:'Unit Head', worker:'Worker', guest:'Guest',
}
const BRANCH_COLOR: Record<string,string> = {
  lekki:'#1B4332', gbagada:'#1D9E75', ikeja:'#185FA5', anthony:'#6B7280',
  abuja:'#D85A30', portharcourt:'#993556', ibadan:'#C05621', london:'#3C3489', houston:'#854F0B',
}

function initials(name:string) { return name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() }

function MemberCard({ holder, onClose }: { holder:CardHolder; onClose:()=>void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const branchColor = BRANCH_COLOR[holder.branch_id] || '#1B4332'
  const dept = DEPARTMENTS.find(d=>d.name===holder.dept||d.id===holder.dept)
  const qrData = JSON.stringify({ id:holder.id, name:holder.name, branch:holder.branch_id, role:holder.role, ts:Date.now() })

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:400 }}>

        {/* Card */}
        <div ref={cardRef} style={{ background:`linear-gradient(135deg, ${branchColor} 0%, #0D1F16 100%)`, borderRadius:20, padding:28, position:'relative', overflow:'hidden', boxShadow:`0 24px 64px ${branchColor}66` }}>
          {/* Watermark cross */}
          <div style={{ position:'absolute', top:-20, right:-20, opacity:0.04, pointerEvents:'none' }}>
            <svg viewBox="0 0 120 120" width="160" height="160" fill="white"><rect x="54" y="6" width="12" height="108"/><rect x="6" y="54" width="108" height="12"/></svg>
          </div>
          {/* Gold top bar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)' }}/>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(201,168,76,0.8)', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:3 }}>Harvesters Intl Christian Centre</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'.06em', textTransform:'uppercase' }}>Workforce Community</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:holder.status==='active'?'#22c55e':'#f59e0b', boxShadow:`0 0 8px ${holder.status==='active'?'#22c55e':'#f59e0b'}`, marginLeft:'auto', marginBottom:3 }}/>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.06em' }}>{holder.status}</div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{ width:64, height:64, borderRadius:16, background:'rgba(201,168,76,0.15)', border:'1.5px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#C9A84C', flexShrink:0, fontFamily:'var(--font-display)' }}>
              {initials(holder.name)}
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.01em', marginBottom:4 }}>{holder.name}</div>
              <div style={{ fontSize:12, color:'rgba(201,168,76,0.85)', fontWeight:600 }}>{ROLE_DISPLAY[holder.role]||holder.role}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{holder.branch_name}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[
              { l:'Department', v: dept?.name||holder.dept||'—' },
              { l:'Member since', v: holder.memberSince||'—' },
              { l:'Email', v: holder.email||'—' },
              { l:'Phone', v: holder.phone||'—' },
            ].map(f=>(
              <div key={f.l}>
                <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:2 }}>{f.l}</div>
                <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.75)', fontFamily: f.l==='Email'||f.l==='Phone'?'var(--font-mono)':'var(--font-body)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.v}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontFamily:'var(--font-mono)', letterSpacing:'.08em' }}>ID: {holder.id.slice(0,8).toUpperCase()}</div>
            <div style={{ background:'white', padding:6, borderRadius:8 }}>
              <QRCodeSVG value={qrData} size={72} fgColor="#0D1F16" bgColor="#fff" level="M"/>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button className="btn btn-brand" style={{ flex:1, justifyContent:'center' }} onClick={()=>window.print()}>🖨 Print card</button>
          <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={onClose}>Close</button>
        </div>
        <div style={{ textAlign:'center', fontSize:11.5, color:'rgba(255,255,255,0.35)', marginTop:10 }}>
          QR code verified against live database. Valid only for active members.
        </div>
      </div>
    </div>
  )
}

export default function MembershipCards() {
  const { user } = useSession()
  const [workers, setWorkers] = useState<CardHolder[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CardHolder|null>(null)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (supabase) {
        try {
          const { data } = await supabase
            .from('workers')
            .select('*')
            .eq('status','active')
            .order('full_name', { ascending:true })
            .limit(200)
          if (data) {
            setWorkers(data.map((w:any) => ({
              id: w.id,
              name: w.full_name || w.name || 'Unknown',
              email: w.email || '',
              role: w.role || 'worker',
              branch_id: w.branch_id || 'lekki',
              branch_name: branches.find(b=>b.id===w.branch_id)?.name || w.branch_id || 'Lekki HQ',
              dept: w.department || '',
              memberSince: w.created_at?.slice(0,7) || '',
              phone: w.phone || '',
              status: w.status || 'active',
            })))
          }
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [])

  // My own card always first
  const myCard = workers.find(w=>w.id===user?.id)

  const filtered = workers
    .filter(w => filterBranch==='all' || w.branch_id===filterBranch)
    .filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {selected && <MemberCard holder={selected} onClose={()=>setSelected(null)}/>}

      <div style={{ marginBottom:14 }}>
        <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)', marginBottom:2 }}>Membership Cards</div>
        <div style={{ fontSize:12, color:'var(--t-2)' }}>Digital ID cards generated from live database · QR verified</div>
      </div>

      {/* My card */}
      {myCard && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--t-3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>My card</div>
          <div className="card card-hover card-p" style={{ maxWidth:320, cursor:'pointer', borderLeft:'3px solid var(--gold)' }} onClick={()=>setSelected(myCard)}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, fontFamily:'var(--font-display)' }}>{initials(myCard.name)}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{myCard.name}</div>
                <div style={{ fontSize:11.5, color:'var(--t-2)' }}>{ROLE_DISPLAY[myCard.role]} · {myCard.branch_name}</div>
              </div>
              <div style={{ marginLeft:'auto', fontSize:11.5, color:'var(--brand)', fontWeight:600 }}>View →</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <input className="input" placeholder="Search workers…" value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1, minWidth:180 }}/>
        <select className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }} value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
          <option value="all">All branches</option>
          {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)' }}>Loading workers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>
          {workers.length === 0 ? 'No active workers in database yet.' : 'No workers match your search.'}
        </div>
      ) : (
        <div>
          <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:12 }}>{filtered.length} workers · click any card to generate</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
            {filtered.map(w => (
              <div key={w.id} className="card card-hover" style={{ padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }} onClick={()=>setSelected(w)}>
                <div style={{ width:38, height:38, borderRadius:10, background:BRANCH_COLOR[w.branch_id]||'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12, flexShrink:0 }}>{initials(w.name)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.name}</div>
                  <div style={{ fontSize:11, color:'var(--t-3)' }}>{ROLE_DISPLAY[w.role]} · {w.branch_name}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="14" height="14"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h3M17 14v3h3"/></svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
