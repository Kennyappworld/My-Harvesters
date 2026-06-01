'use client'
import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type CardHolder = {
  id: string
  name: string
  email: string
  role: string
  branch: string
  dept: string
  memberSince: string
  growthLevel: number
  photo?: string
  verified: boolean
}

const DEMO_MEMBERS: CardHolder[] = [
  { id: 'M001', name: 'Pastor Bolaji Idowu',  email: 'pastor@hicc.org',        role: 'Senior Pastor',   branch: 'Lekki HQ',   dept: 'Leadership',       memberSince: 'Jan 2018', growthLevel: 5, verified: true },
  { id: 'M002', name: 'Pastor Kanmi Adeyemi', email: 'pastor.ikeja@hicc.org',  role: 'Branch Pastor',   branch: 'Ikeja',       dept: 'Leadership',       memberSince: 'Mar 2019', growthLevel: 5, verified: true },
  { id: 'M003', name: 'Segun Adeyemi',        email: 'segun@hicc.org',         role: 'Unit Head',       branch: 'Lekki HQ',   dept: 'Ushering',         memberSince: 'Jun 2021', growthLevel: 3, verified: true },
  { id: 'M004', name: 'Tosin Obi',            email: 'tosin@hicc.org',         role: 'Unit Head',       branch: 'Gbagada',    dept: 'KidsHouse',        memberSince: 'Sep 2020', growthLevel: 4, verified: true },
  { id: 'M005', name: 'Chika Obi',            email: 'chika@hicc.org',         role: 'Member',          branch: 'Abuja',      dept: 'Worship & Music',  memberSince: 'Feb 2022', growthLevel: 2, verified: true },
  { id: 'M006', name: 'Ngozi Kalu',           email: 'ngozi@hicc.org',         role: 'Member',          branch: 'Lekki HQ',   dept: 'Prayer',           memberSince: 'Nov 2023', growthLevel: 1, verified: false },
]

const GROWTH_LABELS = ['', 'Foundation', 'Discipleship', 'Ministry', 'Leadership', 'Ambassador']

const BRANCH_COLORS: Record<string, string> = {
  'Lekki HQ':   '#1B4332',
  'Gbagada':    '#1D9E75',
  'Ikeja':      '#185FA5',
  'Abuja':      '#D85A30',
  'Port Harcourt': '#993556',
  'London UK':  '#3C3489',
  'Houston USA':'#854F0B',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function MemberCard({ holder, onClose }: { holder: CardHolder; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const branchColor = BRANCH_COLORS[holder.branch] || '#1B4332'
  const qrData = JSON.stringify({ id: holder.id, name: holder.name, branch: holder.branch, verified: holder.verified, ts: Date.now() })

  const handlePrint = () => window.print()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,10,46,.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420 }}>
        <div ref={cardRef} style={{ background: `linear-gradient(135deg, ${branchColor} 0%, #1a1040 100%)`, borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden', boxShadow: `0 20px 60px ${branchColor}55` }}>
          {/* Background watermark cross */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 160, height: 160, opacity: .04 }}>
            <svg viewBox="0 0 24 24" fill="white" width="160" height="160"><line x1="12" y1="2" x2="12" y2="22" stroke="white" strokeWidth="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="2"/></svg>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(245,158,11,.85)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 3 }}>Harvesters International</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'white', letterSpacing: '.05em' }}>Christian Centre</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: holder.verified ? '#10b981' : '#f59e0b', boxShadow: holder.verified ? '0 0 8px #10b98180' : '0 0 8px #f59e0b80' }}/>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{holder.verified ? 'Verified' : 'Pending'}</span>
            </div>
          </div>

          {/* Avatar + name */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 22 }}>
            {holder.photo
              ? <img src={holder.photo} alt={holder.name} style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(255,255,255,.25)' }}/>
              : <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '.05em' }}>{initials(holder.name)}</div>
            }
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 3, fontFamily: 'var(--font-display)' }}>{holder.name}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 2 }}>{holder.role} · {holder.dept}</p>
              <p style={{ fontSize: 12, color: 'rgba(245,158,11,.8)', fontWeight: 600 }}>{holder.branch}</p>
            </div>
          </div>

          {/* Details strip */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Member ID',    value: holder.id },
              { label: 'Growth Level', value: `L${holder.growthLevel} · ${GROWTH_LABELS[holder.growthLevel]}` },
              { label: 'Since',        value: holder.memberSince },
            ].map(f => (
              <div key={f.label} style={{ flex: 1, background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '8px 10px' }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</p>
                <p style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* QR code */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ background: 'white', padding: 10, borderRadius: 12 }}>
              <QRCodeSVG value={qrData} size={100} fgColor="#1a1040" bgColor="#ffffff" level="M"/>
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Scan to verify membership · harvestersng.org</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="btn btn-brand" style={{ flex: 1, justifyContent: 'center', padding: '10px' }} onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print card
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '10px' }} onClick={() => {
            const url = `${window.location.origin}/verify?id=${holder.id}`
            navigator.clipboard.writeText(url)
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy link
          </button>
          <button className="btn btn-ghost" style={{ padding: '10px 14px' }} onClick={onClose}>✕</button>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Main section
// ------------------------------------------------------------------
export default function MembershipCard() {
  const [selected, setSelected] = useState<CardHolder | null>(null)
  const [search, setSearch] = useState('')

  const filtered = DEMO_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.branch.toLowerCase().includes(search.toLowerCase()) ||
    m.dept.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: 17, fontFamily: 'var(--font-display)', color: 'var(--t-1)', marginBottom: 3 }}>Digital Membership Cards</h2>
        <p style={{ fontSize: 12.5, color: 'var(--t-2)' }}>Tap any member to generate their card. Cards include a scannable QR code for event verification.</p>
      </div>

      <div style={{ background: 'rgba(124,58,237,.06)', border: '1px solid rgba(124,58,237,.15)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" width="15" height="15"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p style={{ fontSize: 12, color: 'var(--t-2)', margin: 0 }}>Cards are issued for special events, inter-branch visits, and membership verification. The QR code confirms active membership status when scanned.</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, branch, or department…" style={{ maxWidth: 360 }}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {filtered.map(m => {
          const branchColor = BRANCH_COLORS[m.branch] || '#1B4332'
          return (
            <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s', borderLeft: `3px solid ${branchColor}` }} onClick={() => setSelected(m)}>
              <div style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${branchColor}22`, border: `1px solid ${branchColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: branchColor, flexShrink: 0 }}>
                  {initials(m.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--t-1)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--t-2)' }}>{m.role} · {m.branch}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10.5, color: m.verified ? 'var(--green)' : '#f59e0b', fontWeight: 700 }}>{m.verified ? '✓ Verified' : '⏳ Pending'}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--t-3)' }}>L{m.growthLevel}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--t-3)', fontSize: 13, padding: '2rem' }}>No members match your search.</p>
      )}

      {selected && <MemberCard holder={selected} onClose={() => setSelected(null)}/>}
    </div>
  )
}
