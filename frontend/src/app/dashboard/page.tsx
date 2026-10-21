'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, hasRole } from '@/lib/useSession'
import { checkSoulFollowUpReminders, requestNotificationPermission } from '@/lib/notifications'
import { useOrgSettings } from '@/lib/orgSettings'
import { useBranches, useDepartments, ROLE_LABELS } from '@/lib/data'
import dynamic from 'next/dynamic'
import PoweredBy from '@/lib/PoweredBy'

const Overview      = dynamic(() => import('./sections/Overview'),           { loading: () => <PageLoader/> })
const Growth        = dynamic(() => import('./sections/Growth'),             { loading: () => <PageLoader/> })
const Chat          = dynamic(() => import('./sections/Chat'),               { loading: () => <PageLoader/> })
const Prayer        = dynamic(() => import('./sections/Prayer'),             { loading: () => <PageLoader/> })
const Testimony     = dynamic(() => import('./sections/Testimony'),          { loading: () => <PageLoader/> })
const Announcements = dynamic(() => import('./sections/Announcements'),      { loading: () => <PageLoader/> })
const Meetings      = dynamic(() => import('./sections/Meetings'),           { loading: () => <PageLoader/> })
const Members       = dynamic(() => import('./sections/Members'),            { loading: () => <PageLoader/> })
const SoulTracker   = dynamic(() => import('./sections/SoulTracker'),        { loading: () => <PageLoader/> })
const MemberVerif   = dynamic(() => import('./sections/MemberVerification'), { loading: () => <PageLoader/> })
const Volunteer     = dynamic(() => import('./sections/Volunteer'),          { loading: () => <PageLoader/> })
const Attendance    = dynamic(() => import('./sections/Attendance'),         { loading: () => <PageLoader/> })
const Events        = dynamic(() => import('./sections/Events'),             { loading: () => <PageLoader/> })
const Reports       = dynamic(() => import('./sections/Reports'),            { loading: () => <PageLoader/> })
const Settings      = dynamic(() => import('./sections/Settings'),           { loading: () => <PageLoader/> })
const PastoralPulse = dynamic(() => import('./sections/PastoralPulse'),     { loading: () => <PageLoader/> })
const MembershipCard= dynamic(() => import('./sections/MembershipCard'),    { loading: () => <PageLoader/> })
const BranchDash    = dynamic(() => import('./sections/BranchDashboard'),   { loading: () => <PageLoader/> })
const Devotional    = dynamic(() => import('./sections/Devotional'),        { loading: () => <PageLoader/> })
const Network       = dynamic(() => import('./sections/Network'),           { loading: () => <PageLoader/> })

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height: 280, gap: 8, color: 'var(--t-4)', fontSize: 13 }}>
      <svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Loading…
    </div>
  )
}

// ── NAV CONFIG ───────────────────────────────────────────────────────────────

const NAV = [
  { section: 'MAIN', items: [
    { key: 'overview',      label: 'Dashboard',          icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { key: 'branches',      label: 'Branch Dashboards',  icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
    { key: 'growth',        label: 'Growth & Retention', icon: 'M18 20V10M12 20V4M6 20v-6', badge: '↑', bc: 'nb-green' },
    { key: 'chat',          label: 'Community Chat',     icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', badge: 7 },
    { key: 'prayer',        label: 'Prayer Wall',        icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', badge: 12, bc: 'nb-brand' },
    { key: 'testimony',     label: 'Testimonies',        icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', badge: 4, bc: 'nb-green' },
    { key: 'announcements', label: 'Announcements',      icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', badge: 4 },
    { key: 'devotional',    label: 'Daily Devotional',   icon: 'M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z', badge: 'New', bc: 'nb-green' },
    { key: 'pastoral',      label: 'Pastoral Pulse',     icon: 'M22 12h-4l-3 9L9 3l-3 9H2', badge: '!', bc: 'nb-brand', minRole: 'pastor' },
    { key: 'meetings',      label: 'Meetings',           icon: 'M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.259a1 1 0 0 1-1.447.894L15 14M2 8h13v8H2z' },
    { key: 'events',        label: 'Events',             icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', badge: 2, bc: 'nb-brand' },
  ]},
  { section: 'PEOPLE', items: [
    { key: 'members',      label: 'Members',             icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
    { key: 'network',      label: 'Kingdom Network',     icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', badge: 'New', bc: 'nb-green' },
    { key: 'soultracker',  label: 'Soul Tracker',        icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', badge: 'New', bc: 'nb-green' },
    { key: 'memberverif',  label: 'Member Verification', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3' },
    { key: 'volunteer',    label: 'Workforce',           icon: 'M9 11l3 3L22 4' },
    { key: 'membcard',     label: 'Membership Cards',    icon: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z' },
  ]},
  { section: 'OPERATIONS', items: [
    { key: 'attendance',   label: 'Attendance',          icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
    { key: 'reports',      label: 'Reports',             icon: 'M18 20V10M12 20V4M6 20v-6', badge: 3, minRole: 'unit_head' },
  ]},
  { section: 'ADMIN', items: [
    { key: 'settings',     label: 'Settings',            icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  ]},
]

const TITLES: Record<string, { title: string; sub: string }> = {
  overview:     { title: 'Dashboard',           sub: 'Overview of your church workforce' },
  branches:     { title: 'Branch Dashboards',   sub: 'Per-branch KPIs & departments' },
  growth:       { title: 'Growth & Retention',  sub: 'Member trends, retention & funnel' },
  chat:         { title: 'Community Chat',       sub: 'Unit · Peer · Leadership channels' },
  prayer:       { title: 'Prayer Wall',          sub: 'Collective prayer & elevation' },
  testimony:    { title: 'Testimonies',          sub: 'Cross-branch celebrations' },
  announcements:{ title: 'Announcements',        sub: 'Targeted broadcasts & notifications' },
  meetings:     { title: 'Meetings',             sub: 'Schedule, attend & summarise' },
  events:       { title: 'Events',               sub: 'Create · Approve · Manage registrations' },
  network:      { title: 'Kingdom Network',      sub: 'Directory · Opportunities · Connections' },
  members:      { title: 'Members',              sub: 'Directory, profiles & growth passport' },
  soultracker:  { title: 'Soul Tracker',         sub: 'New converts & automated follow-up' },
  memberverif:  { title: 'Member Verification',  sub: '6-month threshold · Referral links' },
  volunteer:    { title: 'Workforce',            sub: 'Slots · Sign-up · Capacity management' },
  attendance:   { title: 'Attendance',           sub: 'Per-service · Per-department tracking' },
  reports:      { title: 'Reports',              sub: 'Monthly branch reports & analytics' },
  settings:     { title: 'Settings',             sub: 'Organisation, users, branches & more' },
  membcard:     { title: 'Membership Cards',     sub: 'Digital ID · QR verification · Print' },
  pastoral:     { title: 'Pastoral Pulse',       sub: 'Spiritual health · Care pipeline' },
  devotional:   { title: 'Daily Devotional',     sub: 'Scripture, reflection & prayer' },
}

const PAGES: Record<string, React.ComponentType<any>> = {
  overview: Overview, growth: Growth, chat: Chat, prayer: Prayer,
  testimony: Testimony, announcements: Announcements, meetings: Meetings,
  events: Events, members: Members, soultracker: SoulTracker,
  memberverif: MemberVerif, volunteer: Volunteer, attendance: Attendance,
  reports: Reports, settings: Settings, pastoral: PastoralPulse,
  devotional: Devotional, membcard: MembershipCard, branches: BranchDash, network: Network,
}

// ── BROADCAST MODAL ──────────────────────────────────────────────────────────

type AudienceGroup = {
  id: string; name: string; color: string; type: 'preset' | 'custom'
  branches: string[]; depts: string[]; roles: string[]; count: number
}

const ROLE_AUDIENCES = [
  { id: 'leadership', name: 'Leadership',  color: '#166534', roles: ['senior_pastor','pastor','admin'] },
  { id: 'pastors',    name: 'All Pastors', color: '#7c3aed', roles: ['senior_pastor','pastor'] },
  { id: 'unit_heads', name: 'Unit Heads',  color: '#0d9488', roles: ['unit_head'] },
  { id: 'workers',    name: 'All Workers', color: '#2563eb', roles: ['worker'] },
]

const BROADCAST_ROLES = [
  ['senior_pastor','Senior Pastor'],['pastor','Branch Pastor'],
  ['admin','Admin'],['unit_head','Unit Head'],['worker','Worker'],
]

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const { branches } = useBranches()
  const { departments } = useDepartments()
  const [step, setStep] = useState<'compose'|'audience'|'confirm'|'sent'>('compose')
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState<'platform'|'whatsapp'|'sms'|'all'>('platform')
  const [selected, setSelected] = useState<AudienceGroup[]>([])
  const [customGroups, setCustomGroups] = useState<AudienceGroup[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('org_custom_audiences') || '[]') } catch { return [] }
  })
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', branches: [] as string[], depts: [] as string[], roles: [] as string[] })
  const [sending, setSending] = useState(false)

  const PRESET_AUDIENCES: AudienceGroup[] = [
    { id: 'all', name: 'Everyone', color: '#166534', type: 'preset', branches: ['all'], depts: ['all'], roles: ['all'], count: 0 },
    ...ROLE_AUDIENCES.map(r => ({ ...r, type: 'preset' as const, branches: ['all'], depts: ['all'], count: 0 })),
    ...branches.map(b => ({ id: b.branch_key, name: b.name, color: b.color || '#166534', type: 'preset' as const, branches: [b.branch_key], depts: ['all'], roles: ['all'], count: 0 })),
  ]

  const toggleAudience = (g: AudienceGroup) =>
    setSelected(prev => prev.find(a => a.id === g.id) ? prev.filter(a => a.id !== g.id) : [...prev, g])

  const saveGroup = (e: React.FormEvent) => {
    e.preventDefault()
    const g: AudienceGroup = {
      id: `cg_${Date.now()}`, name: newGroup.name, color: '#166534', type: 'custom',
      branches: newGroup.branches, depts: newGroup.depts, roles: newGroup.roles, count: 0,
    }
    const updated = [...customGroups, g]
    setCustomGroups(updated)
    try { sessionStorage.setItem('org_custom_audiences', JSON.stringify(updated)) } catch {}
    setSelected(prev => [...prev, g])
    setShowNewGroup(false)
    setNewGroup({ name: '', branches: [], depts: [], roles: [] })
  }

  const deleteGroup = (id: string) => {
    const updated = customGroups.filter(g => g.id !== id)
    setCustomGroups(updated)
    try { sessionStorage.setItem('org_custom_audiences', JSON.stringify(updated)) } catch {}
    setSelected(prev => prev.filter(a => a.id !== id))
  }

  const send = async () => {
    setSending(true)
    if (channel === 'whatsapp' || channel === 'all') {
      const names = selected.map(a => a.name).join(', ')
      window.open(`https://wa.me/?text=${encodeURIComponent(`📣 ANNOUNCEMENT\n\n${message}\n\nTo: ${names}`)}`, '_blank', 'noopener,noreferrer')
    }
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && key) {
        await createClient(url, key).from('announcements').insert({
          title: title || 'Broadcast', body: message,
          scope: selected.some(a => a.id === 'all') ? 'all' : 'branch',
        })
      }
    } catch {}
    setSending(false)
    setStep('sent')
    setTimeout(() => onClose(), 2800)
  }

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: 'var(--r-full)',
        border: `1.5px solid ${active ? 'var(--brand)' : 'var(--border-md)'}`,
        background: active ? 'var(--brand-soft)' : 'transparent',
        fontSize: 12, fontWeight: active ? 600 : 400,
        color: active ? 'var(--brand)' : 'var(--t-2)', cursor: 'pointer',
        transition: 'all .12s',
      }}
    >{label}</button>
  )

  const CHANNELS = [
    { v: 'platform', icon: '📱', l: 'Platform', d: 'Visible on app feed' },
    { v: 'whatsapp', icon: '💬', l: 'WhatsApp', d: 'Opens WhatsApp' },
    { v: 'sms',      icon: '📟', l: 'SMS',       d: 'Via SMS gateway' },
    { v: 'all',      icon: '🔔', l: 'All',        d: 'All channels' },
  ] as const

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: 'var(--dark)', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="15" height="15"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>Broadcast</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                {step === 'sent' ? '✓ Sent' : step === 'confirm' ? 'Step 3 · Review & send' : step === 'audience' ? 'Step 2 · Select audience' : 'Step 1 · Compose'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {step !== 'sent' && (
              <div style={{ display: 'flex', gap: 3 }}>
                {['compose','audience','confirm'].map((s, i) => (
                  <div key={s} style={{ width: 20, height: 2.5, borderRadius: 2, background: ['compose','audience','confirm'].indexOf(step) >= i ? '#22c55e' : 'rgba(255,255,255,0.15)', transition: 'background .2s' }}/>
                ))}
              </div>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="modal-body">
          {step === 'sent' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--brand)', marginBottom: 8 }}>Broadcast sent!</div>
              <div style={{ fontSize: 13, color: 'var(--t-2)', lineHeight: 1.7 }}>
                Saved for <strong>{selected.map(a => a.name).join(', ')}</strong>.
              </div>
            </div>
          )}

          {step === 'compose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Title (optional)</label>
                <input className="input" placeholder="e.g. Sunday Service Update" value={title} onChange={e => setTitle(e.target.value)}/>
              </div>
              <div>
                <label className="form-label">Message *</label>
                <textarea className="input" rows={5} placeholder="Type your broadcast message…" value={message} onChange={e => setMessage(e.target.value.slice(0,2000))}/>
                <div style={{ fontSize: 11, color: 'var(--t-4)', marginTop: 4, textAlign: 'right' }}>{message.length}/2000</div>
              </div>
              <div>
                <label className="form-label">Deliver via</label>
                <div className="grid-2" style={{ gap: 8 }}>
                  {CHANNELS.map(({ v, icon, l, d }) => (
                    <button key={v} type="button" onClick={() => setChannel(v)} style={{
                      padding: '10px 12px', borderRadius: 'var(--r)',
                      border: `1.5px solid ${channel === v ? 'var(--brand)' : 'var(--border-md)'}`,
                      background: channel === v ? 'var(--brand-soft)' : 'var(--bg-2)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .12s',
                    }}>
                      <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: channel === v ? 'var(--brand)' : 'var(--t-1)' }}>{l}</div>
                      <div style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 1 }}>{d}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => message.trim() && setStep('audience')} disabled={!message.trim()} className="btn btn-brand" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}>
                Next: Choose audience →
              </button>
            </div>
          )}

          {step === 'audience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Select audience groups</div>
                <div style={{ fontSize: 12.5, color: 'var(--t-3)', lineHeight: 1.6 }}>Choose one or more groups to receive this broadcast.</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Preset groups</div>
                <div className="grid-2" style={{ gap: 7 }}>
                  {PRESET_AUDIENCES.map(g => {
                    const on = !!selected.find(a => a.id === g.id)
                    return (
                      <button key={g.id} type="button" onClick={() => toggleAudience(g)} style={{
                        padding: '9px 12px', borderRadius: 'var(--r)',
                        border: `1.5px solid ${on ? g.color : 'var(--border-md)'}`,
                        background: on ? `${g.color}10` : 'var(--bg-2)', cursor: 'pointer',
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .12s',
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: on ? g.color : 'var(--bg-4)', flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: on ? g.color : 'var(--t-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                        </div>
                        {on && <svg viewBox="0 0 24 24" fill="none" stroke={g.color} strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {customGroups.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Custom groups</div>
                  {customGroups.map(g => {
                    const on = !!selected.find(a => a.id === g.id)
                    return (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--r)', border: `1.5px solid ${on ? 'var(--brand)' : 'var(--border-md)'}`, background: on ? 'var(--brand-soft)' : 'var(--bg-2)', marginBottom: 6 }}>
                        <button type="button" onClick={() => toggleAudience(g)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: on ? 'var(--brand)' : 'var(--bg-4)', flexShrink: 0 }}/>
                          <div style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--brand)' : 'var(--t-1)' }}>{g.name}</div>
                        </button>
                        <button type="button" onClick={() => deleteGroup(g.id)} className="btn btn-danger btn-xs btn-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {!showNewGroup ? (
                <button type="button" onClick={() => setShowNewGroup(true)} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
                  + Create custom audience group
                </button>
              ) : (
                <form onSubmit={saveGroup} style={{ background: 'var(--bg-2)', borderRadius: 'var(--r)', padding: '14px', border: '1px solid var(--border-md)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>New custom group</div>
                  <input className="input" placeholder="Group name" value={newGroup.name} onChange={e => setNewGroup(f => ({...f, name: e.target.value}))} style={{ marginBottom: 10 }} required/>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', marginBottom: 5 }}>Branches (empty = all)</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                    {branches.map(b => <Chip key={b.branch_key} label={b.name} active={newGroup.branches.includes(b.branch_key)} onClick={() => setNewGroup(f => ({ ...f, branches: f.branches.includes(b.branch_key) ? f.branches.filter(x => x !== b.branch_key) : [...f.branches, b.branch_key] }))}/>)}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', marginBottom: 5 }}>Roles (empty = all)</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {BROADCAST_ROLES.map(([id, name]) => <Chip key={id} label={name} active={newGroup.roles.includes(id)} onClick={() => setNewGroup(f => ({ ...f, roles: f.roles.includes(id) ? f.roles.filter(x => x !== id) : [...f.roles, id] }))}/>)}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn btn-brand btn-sm" style={{ flex: 1, justifyContent: 'center' }} disabled={!newGroup.name.trim()}>Save group</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewGroup(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {selected.length > 0 && (
                <div style={{ padding: '9px 12px', background: 'var(--brand-soft)', border: '1px solid var(--border-brand)', borderRadius: 'var(--r)', fontSize: 12.5 }}>
                  <span style={{ fontWeight: 700, color: 'var(--brand)' }}>Selected: </span>
                  <span style={{ color: 'var(--t-2)' }}>{selected.map(a => a.name).join(' + ')}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep('compose')}>← Back</button>
                <button type="button" onClick={() => selected.length > 0 && setStep('confirm')} disabled={selected.length === 0} className="btn btn-brand" style={{ flex: 1, justifyContent: 'center', opacity: selected.length > 0 ? 1 : 0.5 }}>
                  Review & send →
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Confirm broadcast</div>
              <div className="card card-p-sm">
                <div className="form-label" style={{ marginBottom: 6 }}>Message</div>
                {title && <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{title}</div>}
                <div style={{ fontSize: 13, color: 'var(--t-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{message}</div>
              </div>
              <div className="card card-p-sm">
                <div className="form-label" style={{ marginBottom: 8 }}>Audience</div>
                {selected.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }}/>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{a.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep('audience')}>← Back</button>
                <button type="button" onClick={send} disabled={sending} className="btn btn-brand" style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: 14, fontWeight: 700 }}>
                  {sending ? (
                    <><svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sending…</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>Send broadcast</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SIDEBAR ──────────────────────────────────────────────────────────────────

const Sidebar = React.memo(function Sidebar({
  page, user, setPage, setMobileOpen,
}: { page: string; user: any; setPage: (p: string) => void; setMobileOpen: (v: boolean) => void }) {
  const { settings } = useOrgSettings()

  const handleSignOut = useCallback(async () => {
    if (!window.confirm('Sign out of SanctuaryHQ?')) return
    // Clear session cookie securely
    document.cookie = 'sanctuaryhq_session=; path=/; max-age=0; SameSite=Lax'
    sessionStorage.clear()
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && key) await createClient(url, key).auth.signOut()
    } catch {}
    window.location.href = '/login'
  }, [])

  return (
    <>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            {settings.logoUrl
              ? <img src={settings.logoUrl} alt="logo"/>
              : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            }
          </div>
          <div>
            <div className="sidebar-app-name">{settings.appName || 'SanctuaryHQ'}</div>
            <div className="sidebar-org-name">{settings.name || 'Your Church'}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        {NAV.map(sec => (
          <div key={sec.section}>
            <div className="nav-section-label">{sec.section}</div>
            {sec.items
              .filter((item: any) => !item.minRole || !user || hasRole(user.role, item.minRole))
              .map((item: any) => (
                <div
                  key={item.key}
                  className={`nav-link ${page === item.key ? 'active' : ''}`}
                  onClick={() => { setPage(item.key); setMobileOpen(false) }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && (setPage(item.key), setMobileOpen(false))}
                >
                  <span className="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                      <path d={item.icon}/>
                    </svg>
                  </span>
                  <span style={{ flex: 1, fontSize: 12.5, letterSpacing: '-0.01em' }}>{item.label}</span>
                  {item.badge && <span className={`nav-badge ${item.bc || 'nb-red'}`}>{item.badge}</span>}
                </div>
              ))
            }
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{(user?.name || 'W').slice(0,2).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name truncate">{user?.name || 'Worker'}</div>
            <div className="user-role truncate">{user?.role?.replace(/_/g,' ') || 'worker'}{user?.branch_key ? ` · ${user.branch_key}` : ''}</div>
          </div>
          <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4, borderRadius: 6, flexShrink: 0, transition: 'color .12s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
        <PoweredBy dark={true}/>
      </div>
    </>
  )
})

// ── MOBILE NAV ───────────────────────────────────────────────────────────────

const MOBILE_NAV = [
  { key: 'overview',      label: 'Home',     icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { key: 'members',       label: 'Members',  icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { key: 'prayer',        label: 'Prayer',   icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  { key: 'chat',          label: 'Chat',     icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', dot: true },
  { key: 'settings',      label: 'More',     icon: 'M4 6h16M4 12h16M4 18h16' },
]

// ── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useSession()
  const [page, setPage] = useState('overview')
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const pageKey = useRef(0)
  const [renderKey, setRenderKey] = useState(0)

  const changePage = useCallback((p: string) => {
    if (p === page) return
    pageKey.current++
    setRenderKey(k => k + 1)
    setPage(p)
  }, [page])

  // Notification permission + soul follow-up
  useEffect(() => {
    if (!user?.id) return
    const setup = async () => {
      const granted = await requestNotificationPermission()
      if (granted) {
        const lastCheck = sessionStorage.getItem('sanctuaryhq_followup_check')
        const now = Date.now()
        if (!lastCheck || now - parseInt(lastCheck) > 4 * 60 * 60 * 1000) {
          sessionStorage.setItem('sanctuaryhq_followup_check', String(now))
          await checkSoulFollowUpReminders(user.id)
        }
      }
    }
    setup()
  }, [user?.id])

  // 30-minute inactivity timeout — SECURITY
  // On each activity event we also slide the cookie's expiry forward so the
  // cookie and the JS timer stay in sync; without this the cookie can expire
  // while the user is still active, causing a false session_expired redirect.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const TIMEOUT = 30 * 60 * 1000
    let lastRefresh = 0

    const refreshCookie = () => {
      // Throttle cookie refresh to once per minute to avoid excessive writes
      const now = Date.now()
      if (now - lastRefresh < 60_000) return
      lastRefresh = now
      const token = document.cookie.split(';').find(c => c.trim().startsWith('sanctuaryhq_session='))?.split('=')[1]?.trim()
      if (!token) return
      const expires = new Date(now + TIMEOUT).toUTCString()
      const isSecure = location.protocol === 'https:'
      document.cookie = `sanctuaryhq_session=${token}; path=/; expires=${expires}; SameSite=Lax${isSecure ? '; Secure' : ''}`
    }

    const reset = () => {
      clearTimeout(timer)
      refreshCookie()
      timer = setTimeout(() => {
        document.cookie = 'sanctuaryhq_session=; path=/; max-age=0; SameSite=Lax'
        sessionStorage.clear()
        window.location.href = '/login?reason=session_expired'
      }, TIMEOUT)
    }
    const events = ['mousedown','keydown','touchstart','scroll'] as const
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [])

  // Online/offline detection
  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Navigate event from child components (renamed from hicc-navigate)
  useEffect(() => {
    const handler = (e: Event) => {
      const { page: p, search } = (e as CustomEvent).detail || {}
      if (p) changePage(p)
      if (search) setMemberSearch(search)
    }
    // Listen for both names for backward compat
    window.addEventListener('sanctuaryhq-navigate', handler)
    window.addEventListener('hicc-navigate', handler)
    return () => {
      window.removeEventListener('sanctuaryhq-navigate', handler)
      window.removeEventListener('hicc-navigate', handler)
    }
  }, [changePage])

  const meta = TITLES[page] || { title: page, sub: '' }
  const Page = PAGES[page]

  return (
    <div className="app-shell">
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)}/>}

      {/* Desktop sidebar */}
      <aside className="sidebar">
        <Sidebar page={page} user={user} setPage={changePage} setMobileOpen={setMobileOpen}/>
      </aside>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div style={{ width: 240, background: 'var(--dark)', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '4px 0 24px rgba(0,0,0,0.3)', animation: 'page-enter 0.15s ease-out' }}>
            <Sidebar page={page} user={user} setPage={changePage} setMobileOpen={setMobileOpen}/>
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)}/>
        </div>
      )}

      <div className="main-area">
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-ghost btn-icon" id="mob-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t-1)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{meta.title}</div>
              <div style={{ fontSize: 11, color: 'var(--t-4)', marginTop: 1 }}>{meta.sub}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Global search */}
            <div className="topbar-search" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-4)" strokeWidth="2" width="13" height="13" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="input"
                placeholder="Search members, prayers…"
                style={{ paddingLeft: 30, fontSize: 12.5, height: 34, width: 210, borderRadius: 'var(--r-full)' }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (!val) return
                    window.dispatchEvent(new CustomEvent('sanctuaryhq-navigate', { detail: { page: 'members', search: val } }))
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>

            <button className="btn btn-ghost btn-icon" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>

            <button className="btn btn-brand btn-sm" onClick={() => setShowBroadcast(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
              <span className="topbar-search">Broadcast</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="content-area">
          {!isOnline && (
            <div className="alert-offline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
              You're offline — showing cached data. Changes will sync when reconnected.
            </div>
          )}
          <div key={renderKey} className="page-enter">
            {Page
              ? <Page onNavigate={changePage} memberSearch={page === 'members' ? memberSearch : ''} onMemberSearchConsumed={() => setMemberSearch('')}/>
              : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--t-3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>🔧</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--t-1)', marginBottom: 8, textTransform: 'capitalize' }}>{page}</div>
                  <div style={{ fontSize: 13 }}>This section is coming soon.</div>
                </div>
              )
            }
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <div className="bottom-nav-inner">
            {MOBILE_NAV.map(item => (
              <button
                key={item.key}
                className={`bottom-nav-item ${page === item.key ? 'active' : ''}`}
                onClick={() => changePage(item.key)}
                aria-label={item.label}
                aria-current={page === item.key ? 'page' : undefined}
              >
                {page === item.key && <div className="bottom-nav-indicator"/>}
                <div className="bottom-nav-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill={page === item.key ? 'white' : 'none'}
                    stroke={page === item.key ? 'white' : 'rgba(255,255,255,0.4)'}
                    strokeWidth="1.8"
                    width="22" height="22"
                  >
                    <path d={item.icon}/>
                  </svg>
                  {item.dot && <div className="bottom-nav-dot"/>}
                </div>
                <span className="bottom-nav-label" style={{ fontWeight: page === item.key ? 700 : 500 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
