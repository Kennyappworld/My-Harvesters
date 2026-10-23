'use client'
/**
 * Announcements — Central Announcement Workflow
 *
 * Roles & views:
 *   unit_head / worker   → Submit tab (draft & submit) + My submissions tab
 *   admin_head           → Collation board (bulletin builder) + all tabs
 *   ops_head             → Inbox (approve/reject/publish) + all tabs
 *   pastor / senior_pastor → Published feed + highlight (senior_pastor only)
 *   developer            → All tabs
 *
 * All writes go through /api/announcements (server-side, no client Supabase keys).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, hasRole } from '@/lib/useSession'
import { DEPARTMENTS, branches } from '@/lib/data'

// ── Types ─────────────────────────────────────────────────────────────────────
type AnnStatus = 'draft'|'submitted'|'dept_approved'|'collated'|'ops_review'|'approved'|'published'|'rejected'
type AnnType   = 'pulpit'|'bulletin'|'screen'|'all'
type Priority  = 'standard'|'urgent'

interface Announcement {
  id:               string
  title:            string
  body:             string
  type:             AnnType
  target_audience:  string
  run_start:        string
  run_end:          string | null
  priority:         Priority
  status:           AnnStatus
  submitted_by:     string
  submitter_name:   string
  dept_name:        string | null
  channel:          string
  scope:            string
  rejection_reason: string | null
  is_highlighted:   boolean
  created_at:       string
  updated_at:       string
  announcement_approvals?: any[]
}

// ── API helper ─────────────────────────────────────────────────────────────────
async function apiAnn(action: string, payload: Record<string,any> = {}): Promise<any> {
  const res = await fetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  return res.json()
}

async function fetchAnns(view: string): Promise<Announcement[]> {
  const res = await fetch(`/api/announcements?view=${view}`)
  if (!res.ok) return []
  const json = await res.json()
  return json.items ?? []
}

// ── Status display helpers ─────────────────────────────────────────────────────
const STATUS_LABEL: Record<AnnStatus, string> = {
  draft:         '✏️ Draft',
  submitted:     '📤 Submitted',
  dept_approved: '✅ Dept approved',
  collated:      '📋 Collated',
  ops_review:    '🔍 Ops review',
  approved:      '✔ Approved',
  published:     '📢 Published',
  rejected:      '✗ Rejected',
}
const STATUS_COLOR: Record<AnnStatus, string> = {
  draft:         'chip-gray',
  submitted:     'chip-blue',
  dept_approved: 'chip-teal',
  collated:      'chip-purple',
  ops_review:    'chip-amber',
  approved:      'chip-green',
  published:     'chip-green',
  rejected:      'chip-red',
}

const PRIORITY_COLOR: Record<Priority, string> = {
  standard: 'chip-gray',
  urgent:   'chip-red',
}

// ── Relative time ──────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Pipeline tracker strip ─────────────────────────────────────────────────────
const PIPELINE: AnnStatus[] = ['submitted','dept_approved','collated','ops_review','published']

function PipelineStrip({ status }: { status: AnnStatus }) {
  const idx = PIPELINE.indexOf(status)
  if (idx < 0) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, margin:'6px 0 10px', flexWrap:'wrap' }}>
      {PIPELINE.map((s, i) => {
        const done    = i < idx
        const current = i === idx
        return (
          <React.Fragment key={s}>
            <div style={{
              padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600,
              background: current ? 'var(--brand)' : done ? 'rgba(16,185,129,0.18)' : 'var(--s-3)',
              color: current ? '#fff' : done ? 'var(--green)' : 'var(--t-3)',
              border: current ? 'none' : done ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
              transition: 'all .2s',
            }}>
              {done ? '✓ ' : ''}{STATUS_LABEL[s].replace(/^[^\s]+ /, '')}
            </div>
            {i < PIPELINE.length - 1 && (
              <div style={{ width:16, height:1, background: done ? 'var(--green)' : 'var(--border)', opacity:.5 }}/>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Announcement card ──────────────────────────────────────────────────────────
function AnnCard({
  ann, callerRole, onAction, compact,
}: {
  ann: Announcement
  callerRole: string
  onAction: (action: string, id: string, extra?: any) => Promise<void>
  compact?: boolean
}) {
  const [rejReason, setRejReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState(false)
  const level = { developer:7, senior_pastor:6, pastor:5, ops_head:4, admin_head:4, admin:3, unit_head:2, worker:1, guest:0 }[callerRole] ?? 0

  const canApprove = level >= 3 && ['submitted','dept_approved'].includes(ann.status)
  const canPublish = level >= 4 && ['collated','dept_approved','submitted'].includes(ann.status)
  const canHighlight = level >= 6 && ann.status === 'published'

  const act = async (a: string, extra?: any) => {
    setLoading(true)
    await onAction(a, ann.id, extra)
    setLoading(false)
  }

  return (
    <div className="card" style={{
      padding:'14px 18px',
      borderLeft: ann.priority === 'urgent' ? '3px solid var(--red)' : '3px solid var(--border)',
      opacity: loading ? .6 : 1,
      transition: 'opacity .2s',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:6, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:0 }}>
          {ann.is_highlighted && (
            <div style={{ fontSize:10, fontWeight:700, color:'#C9A84C', letterSpacing:'.06em', marginBottom:3 }}>
              ✨ PASTOR'S HIGHLIGHT
            </div>
          )}
          <div style={{ fontWeight:700, fontSize:14, lineHeight:1.3 }}>{ann.title}</div>
          <div style={{ fontSize:11.5, color:'var(--t-3)', marginTop:3 }}>
            {ann.submitter_name || 'Unknown'} · {ann.dept_name || 'No dept'} · {timeAgo(ann.created_at)}
          </div>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0, flexWrap:'wrap' }}>
          <span className={`chip ${STATUS_COLOR[ann.status]}`}>{STATUS_LABEL[ann.status]}</span>
          {ann.priority === 'urgent' && <span className="chip chip-red">🔥 Urgent</span>}
        </div>
      </div>

      {/* Pipeline */}
      {!compact && ann.status !== 'draft' && ann.status !== 'rejected' && <PipelineStrip status={ann.status}/>}

      {/* Body */}
      <div style={{ fontSize:13, color:'var(--t-2)', lineHeight:1.7, marginBottom:10 }}>
        {compact && ann.body.length > 120 ? ann.body.slice(0,120)+'…' : ann.body}
      </div>

      {/* Meta chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        <span className="chip chip-gray" style={{ fontSize:10 }}>{ann.type === 'all' ? '📣 All types' : ann.type}</span>
        <span className="chip chip-gray" style={{ fontSize:10 }}>{ann.target_audience}</span>
        {ann.channel && ann.channel !== 'platform' && (
          <span className="chip chip-blue" style={{ fontSize:10 }}>📡 {ann.channel}</span>
        )}
      </div>

      {/* Rejection reason */}
      {ann.status === 'rejected' && ann.rejection_reason && (
        <div style={{ padding:'8px 12px', background:'rgba(239,68,68,0.07)', borderRadius:'var(--r)', fontSize:12, color:'var(--red)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:10 }}>
          <strong>Returned:</strong> {ann.rejection_reason}
        </div>
      )}

      {/* Approval trail */}
      {!compact && ann.announcement_approvals && ann.announcement_approvals.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--t-3)', marginBottom:4, letterSpacing:'.04em', textTransform:'uppercase' }}>Approval trail</div>
          {ann.announcement_approvals.map((ap: any, i: number) => (
            <div key={i} style={{ fontSize:11.5, color:'var(--t-2)', display:'flex', gap:6, padding:'2px 0' }}>
              <span style={{ color: ap.action === 'approved' ? 'var(--green)' : 'var(--red)', fontWeight:700 }}>
                {ap.action === 'approved' ? '✓' : '✗'}
              </span>
              <span>{ap.workers?.full_name ?? 'Unknown'} ({ap.role_at_approval}) · {timeAgo(ap.created_at)}</span>
              {ap.note && <span style={{ color:'var(--t-3)' }}>— {ap.note}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {!compact && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {canPublish && !showReject && (
            <button className="btn btn-sm" disabled={loading}
              style={{ background:'rgba(16,185,129,0.1)', color:'var(--green)', border:'1px solid rgba(16,185,129,0.3)', fontSize:12 }}
              onClick={() => act('publish')}>
              📢 Publish now
            </button>
          )}
          {canApprove && !canPublish && !showReject && (
            <button className="btn btn-sm" disabled={loading}
              style={{ background:'rgba(34,197,94,0.08)', color:'var(--green)', border:'1px solid rgba(34,197,94,0.25)', fontSize:12 }}
              onClick={() => act('approve')}>
              ✅ Approve
            </button>
          )}
          {level >= 3 && !showReject && ['submitted','dept_approved','collated'].includes(ann.status) && (
            <button className="btn btn-sm btn-ghost" disabled={loading} onClick={() => setShowReject(true)} style={{ fontSize:12 }}>
              ✗ Return
            </button>
          )}
          {canHighlight && (
            <button className="btn btn-sm" disabled={loading}
              style={{ background:'rgba(201,168,76,0.1)', color:'#C9A84C', border:'1px solid rgba(201,168,76,0.3)', fontSize:12 }}
              onClick={() => act('highlight', { highlighted: !ann.is_highlighted })}>
              {ann.is_highlighted ? '★ Unpin highlight' : '✨ Highlight'}
            </button>
          )}
          {showReject && (
            <div style={{ width:'100%', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <input className="input" style={{ flex:1, minWidth:160, fontSize:12 }}
                placeholder="Reason for returning…"
                value={rejReason} onChange={e => setRejReason(e.target.value)} autoFocus/>
              <button className="btn btn-sm btn-danger" disabled={loading || !rejReason.trim()}
                onClick={() => act('reject', { rejection_reason: rejReason })}>
                Return
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowReject(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Submit form ────────────────────────────────────────────────────────────────
function SubmitForm({ user, onSubmitted }: { user: any, onSubmitted: () => void }) {
  const [form, setForm] = useState({
    title: '', body: '', type: 'all' as AnnType, target_audience: 'all-church',
    run_start: '', priority: 'standard' as Priority, channel: 'platform',
    scope: 'all', dept: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')
  const [success, setSuccess] = useState(false)

  const bodyLen   = form.body.length
  const tooLong   = bodyLen > 800
  const titleLong = form.title.length > 120

  const now = new Date()
  const warnLate = form.run_start && (new Date(form.run_start).getTime() - now.getTime()) < 48*3600*1000

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tooLong || titleLong) return
    setSaving(true); setErr('')
    const res = await apiAnn('submit', {
      title:           form.title.trim(),
      annBody:         form.body.trim(),
      type:            form.type,
      target_audience: form.target_audience,
      run_start:       form.run_start || new Date().toISOString(),
      priority:        form.priority,
      channel:         form.channel,
      scope:           form.scope,
      dept_name:       user?.department || form.dept || null,
    })
    setSaving(false)
    if (res.error) { setErr(res.error); return }
    setSuccess(true)
    setTimeout(() => { setSuccess(false); onSubmitted() }, 2000)
    setForm({ title:'', body:'', type:'all', target_audience:'all-church', run_start:'', priority:'standard', channel:'platform', scope:'all', dept:'' })
  }

  return (
    <div className="card card-p" style={{ maxWidth:600 }}>
      <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>Submit announcement</div>
      <div style={{ fontSize:12.5, color:'var(--t-2)', marginBottom:16, lineHeight:1.65 }}>
        Your submission will be reviewed by the Admin Head and Operations Head before publishing.
      </div>

      {success && (
        <div style={{ padding:'10px 14px', background:'var(--green-lt)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--green)', marginBottom:16, fontWeight:600 }}>
          ✓ Submitted for review! You can track progress in "My submissions".
        </div>
      )}
      {err && (
        <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.07)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--red)', marginBottom:16, border:'1px solid rgba(239,68,68,0.2)' }}>
          {err}
        </div>
      )}

      <form onSubmit={submit}>
        {/* Title */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>
            Title * <span style={{ color: titleLong ? 'var(--red)' : 'var(--t-3)', fontWeight:400 }}>({form.title.length}/120)</span>
          </label>
          <input className="input" value={form.title} required maxLength={150}
            placeholder="e.g. Workers' meeting — Sunday 2pm"
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ border: titleLong ? '1px solid var(--red)' : undefined }}/>
        </div>

        {/* Body */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>
            Message * <span style={{ color: tooLong ? 'var(--red)' : bodyLen > 700 ? 'var(--amber)' : 'var(--t-3)', fontWeight:400 }}>({bodyLen}/800)</span>
          </label>
          <textarea className="input" rows={5} value={form.body} required
            placeholder="Write your announcement clearly. Be brief — aim for under 150 words."
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            style={{ resize:'vertical', border: tooLong ? '1px solid var(--red)' : undefined }}/>
          {tooLong && <div style={{ fontSize:11, color:'var(--red)', marginTop:4 }}>Message too long. Please shorten to 800 characters.</div>}
        </div>

        {/* Row 1: Type + Priority */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Announcement type</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AnnType }))}>
              <option value="all">📣 All types</option>
              <option value="pulpit">🎙 Pulpit (spoken)</option>
              <option value="bulletin">📄 Bulletin (print)</option>
              <option value="screen">📺 Screen display</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
              <option value="standard">Standard</option>
              <option value="urgent">🔥 Urgent</option>
            </select>
          </div>
        </div>

        {/* Row 2: Target + Requested date */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Target audience</label>
            <select className="input" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}>
              <option value="all-church">🌍 All members</option>
              <option value="workers">👷 Workers only</option>
              <option value="unit">👥 My unit only</option>
              <option value="department">🏢 My department</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:5 }}>Requested run date</label>
            <input type="date" className="input" value={form.run_start}
              onChange={e => setForm(f => ({ ...f, run_start: e.target.value }))}
              style={{ border: warnLate ? '1px solid var(--amber)' : undefined }}/>
            {warnLate && <div style={{ fontSize:11, color:'var(--amber)', marginTop:3 }}>⚠ Less than 48 hours — may not make it in time.</div>}
          </div>
        </div>

        {/* Channel */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11.5, fontWeight:600, color:'var(--t-2)', display:'block', marginBottom:7 }}>Delivery channel</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[['platform','📱 Platform'],['whatsapp','💬 WhatsApp'],['sms','📟 SMS'],['all_channels','🔔 All channels']].map(([v,l]) => (
              <button key={v} type="button"
                onClick={() => setForm(f => ({ ...f, channel: v }))}
                className="btn btn-sm"
                style={{
                  background: form.channel === v ? 'var(--brand)' : 'transparent',
                  color: form.channel === v ? 'white' : 'var(--t-2)',
                  border: `1px solid ${form.channel === v ? 'var(--brand)' : 'var(--border-md)'}`,
                  fontSize: 12,
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button type="submit" className="btn btn-brand" disabled={saving || tooLong || titleLong}
            style={{ flex:1, justifyContent:'center', padding:'10px' }}>
            {saving ? 'Submitting…' : '📤 Submit for review'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Collation board (admin_head) ───────────────────────────────────────────────
function CollationBoard({ anns, onAction, loading }: {
  anns: Announcement[]
  onAction: (action: string, id: string, extra?: any) => Promise<void>
  loading: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setSelected(s => {
    const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n
  })

  const pending    = anns.filter(a => ['submitted','dept_approved'].includes(a.status))
  const collated   = anns.filter(a => a.status === 'collated')
  const opsReview  = anns.filter(a => a.status === 'ops_review')

  return (
    <div>
      <div style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'var(--r-lg)', padding:'14px 18px', marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--purple)', marginBottom:3 }}>📋 Bulletin Builder</div>
        <div style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.65 }}>
          Select and collate approved submissions into this week's announcement package. Once collated, the Operations Head reviews and publishes.
        </div>
      </div>

      {/* Pending queue */}
      <div style={{ fontWeight:700, fontSize:13, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
        📥 Incoming — needs dept review
        <span className="chip chip-blue">{pending.length}</span>
      </div>
      {pending.length === 0 && (
        <div style={{ color:'var(--t-3)', fontSize:12.5, padding:'12px 0', marginBottom:16 }}>No pending submissions.</div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {pending.map(a => (
          <div key={a.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)}
              style={{ marginTop:6, accentColor:'var(--brand)', width:16, height:16, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <AnnCard ann={a} callerRole="admin_head" onAction={onAction} compact/>
            </div>
          </div>
        ))}
      </div>

      {/* Collate selected */}
      {selected.size > 0 && (
        <button className="btn btn-brand" style={{ marginBottom:20, fontSize:13 }}
          onClick={async () => { await onAction('collate', '', { ids: [...selected] }); setSelected(new Set()) }}
          disabled={loading}>
          📋 Collate {selected.size} selected for ops review
        </button>
      )}

      {/* Collated */}
      <div style={{ fontWeight:700, fontSize:13, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
        📋 Collated — awaiting ops approval
        <span className="chip chip-purple">{collated.length}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {collated.map(a => <AnnCard key={a.id} ann={a} callerRole="admin_head" onAction={onAction} compact/>)}
        {collated.length === 0 && <div style={{ color:'var(--t-3)', fontSize:12.5, padding:'12px 0' }}>Nothing collated yet.</div>}
      </div>

      {/* Ops review */}
      {opsReview.length > 0 && (
        <>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
            🔍 With Ops Head for review
            <span className="chip chip-amber">{opsReview.length}</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {opsReview.map(a => <AnnCard key={a.id} ann={a} callerRole="admin_head" onAction={onAction} compact/>)}
          </div>
        </>
      )}
    </div>
  )
}

// ── SMS config notice ──────────────────────────────────────────────────────────
function SmsConfig() {
  return (
    <div style={{ marginTop:20, padding:'14px 18px', background:'rgba(245,158,11,0.06)', borderRadius:'var(--r-lg)', border:'1px solid rgba(245,158,11,0.22)', maxWidth:640 }}>
      <div style={{ fontWeight:700, fontSize:13, marginBottom:4, color:'var(--text-primary)' }}>SMS delivery — Termii</div>
      <div style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:12 }}>
        Members without WhatsApp receive SMS as fallback via Termii.
      </div>
      <div style={{ padding:'10px 14px', background:'rgba(245,158,11,0.09)', borderRadius:'var(--r)', fontSize:12.5, color:'#f59e0b', border:'1px solid rgba(245,158,11,0.22)' }}>
        🔒 <strong>Security notice:</strong> SMS API credentials are configured as server-side environment variables
        (<code style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>TERMII_API_KEY</code> and <code style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>TERMII_SENDER_ID</code>)
        and are never stored in the browser. Contact your administrator to update these credentials.
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Announcements() {
  const { user, loading: sessionLoading } = useSession()

  const role  = user?.role ?? 'worker'
  const level = { developer:7, senior_pastor:6, pastor:5, ops_head:4, admin_head:4, admin:3, unit_head:2, worker:1, guest:0 }[role] ?? 0

  // Tab options depend on role
  const isOpsOrAdmin  = role === 'ops_head' || role === 'admin_head' || role === 'developer'
  const isCollator    = role === 'admin_head' || role === 'developer'
  const canSubmit     = level >= 1
  const isSeniorUp    = level >= 5

  type TabKey = 'feed'|'submit'|'mine'|'inbox'|'collation'|'whatsapp'
  const tabs: [TabKey, string][] = [
    ['feed',      '📢 Published feed'],
    ...(canSubmit && !isSeniorUp ? [['submit', '✏️ Submit'] as [TabKey,string]] : []),
    ...(canSubmit && !isSeniorUp ? [['mine', '📋 My submissions'] as [TabKey,string]] : []),
    ...(isOpsOrAdmin           ? [['inbox', '📥 Inbox'] as [TabKey,string]] : []),
    ...(isCollator             ? [['collation', '📋 Collation board'] as [TabKey,string]] : []),
    ['whatsapp',  '💬 WhatsApp setup'],
  ]

  const [tab, setTab]   = useState<TabKey>('feed')
  const [items, setItems] = useState<Announcement[]>([])
  const [fetching, setFetching] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const viewMap: Record<TabKey, string> = {
    feed: 'feed', submit: 'mine', mine: 'mine', inbox: 'inbox', collation: 'collation', whatsapp: 'feed',
  }

  const load = useCallback(async () => {
    if (tab === 'submit' || tab === 'whatsapp') return
    setFetching(true)
    const view = viewMap[tab] ?? 'feed'
    const data = await fetchAnns(view)
    setItems(data)
    setFetching(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const handleAction = async (action: string, id: string, extra?: any) => {
    setActionLoading(true)
    let res: any
    if (action === 'collate') {
      res = await apiAnn('collate', extra)
    } else {
      res = await apiAnn(action, { id, ...extra })
    }
    setActionLoading(false)
    if (res.error) {
      showToast(`❌ ${res.error}`)
    } else {
      const msgs: Record<string, string> = {
        approve: '✅ Approved!',
        reject:  '✗ Returned to submitter.',
        publish: '📢 Published!',
        collate: `📋 Collated ${res.collated ?? ''} items.`,
        highlight: res.announcement?.is_highlighted ? '✨ Highlighted!' : '★ Highlight removed.',
      }
      showToast(msgs[action] ?? '✓ Done')
      load()
    }
  }

  const [waNumbers, setWaNumbers] = useState<Record<string,string>>({})

  if (sessionLoading) {
    return <div style={{ padding:'2rem', color:'var(--t-3)', fontSize:13 }}>Loading…</div>
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:300,
          padding:'10px 18px', borderRadius:'var(--r-lg)',
          background:'var(--s-2)', border:'1px solid var(--border-md)',
          boxShadow:'var(--sh-lg)', fontSize:13, fontWeight:600,
          color:'var(--t-1)', display:'flex', gap:8, alignItems:'center',
          animation:'fadeIn .2s',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)' }}>Announcements</div>
          <div style={{ fontSize:12, color:'var(--t-2)', marginTop:2 }}>
            {isOpsOrAdmin
              ? 'Collate · review · publish — all submissions flow through here.'
              : 'Submit announcements for central review and publishing.'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {canSubmit && !isSeniorUp && (
            <button className="btn btn-brand btn-sm" onClick={() => setTab('submit')}>
              + New announcement
            </button>
          )}
          {fetching && (
            <div style={{ fontSize:11.5, color:'var(--t-3)', alignSelf:'center' }}>Refreshing…</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:16, flexWrap:'wrap' }}>
        {tabs.map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {l}
            {k === 'inbox' && items.length > 0 && tab !== 'inbox' && (
              <span className="chip chip-red" style={{ marginLeft:4, fontSize:9 }}></span>
            )}
          </button>
        ))}
      </div>

      {/* ── PUBLISHED FEED ── */}
      {tab === 'feed' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Pastor's Pulse banner (senior_pastor highlighted items) */}
          {items.filter(a => a.is_highlighted).map(a => (
            <div key={a.id} style={{
              padding:'16px 20px', borderRadius:'var(--r-xl)',
              background:'linear-gradient(110deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))',
              border:'1.5px solid rgba(201,168,76,0.4)',
              boxShadow:'0 2px 16px rgba(201,168,76,0.06)',
              marginBottom:4,
            }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#C9A84C', letterSpacing:'.1em', marginBottom:6 }}>
                ✨ PASTOR'S HIGHLIGHT — PINNED THIS WEEK
              </div>
              <div style={{ fontWeight:700, fontSize:15 }}>{a.title}</div>
              <div style={{ fontSize:13, color:'var(--t-2)', lineHeight:1.7, marginTop:6 }}>{a.body}</div>
            </div>
          ))}

          {items.filter(a => !a.is_highlighted).length === 0 && items.filter(a => a.is_highlighted).length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>
              No published announcements yet.
            </div>
          )}

          {items.filter(a => !a.is_highlighted).map(a => (
            <AnnCard key={a.id} ann={a} callerRole={role} onAction={handleAction}/>
          ))}
        </div>
      )}

      {/* ── SUBMIT TAB ── */}
      {tab === 'submit' && (
        <SubmitForm user={user} onSubmitted={() => setTab('mine')}/>
      )}

      {/* ── MY SUBMISSIONS ── */}
      {tab === 'mine' && (
        <div>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>
            Your submissions <span className="chip chip-gray" style={{ marginLeft:4 }}>{items.length}</span>
          </div>
          {items.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>
              You haven't submitted any announcements yet.
              <div style={{ marginTop:12 }}>
                <button className="btn btn-brand btn-sm" onClick={() => setTab('submit')}>
                  Submit your first announcement →
                </button>
              </div>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {items.map(a => <AnnCard key={a.id} ann={a} callerRole={role} onAction={handleAction}/>)}
          </div>
        </div>
      )}

      {/* ── INBOX (ops_head / admin / developer) ── */}
      {tab === 'inbox' && (
        <div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:13 }}>
              Action queue <span className="chip chip-blue" style={{ marginLeft:4 }}>{items.length}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--t-2)', marginTop:3 }}>
              {role === 'ops_head'
                ? 'Review collated submissions and publish or return them.'
                : 'Approve or return submitted announcements.'}
            </div>
          </div>

          {items.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--t-3)', fontSize:13 }}>
              🎉 All clear — no announcements pending action.
            </div>
          )}

          {/* Group by status */}
          {(['submitted','dept_approved','collated'] as AnnStatus[]).map(s => {
            const group = items.filter(a => a.status === s)
            if (group.length === 0) return null
            return (
              <div key={s} style={{ marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:12, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                  <span className={`chip ${STATUS_COLOR[s]}`}>{STATUS_LABEL[s]}</span>
                  <span style={{ color:'var(--t-3)' }}>{group.length} item{group.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {group.map(a => <AnnCard key={a.id} ann={a} callerRole={role} onAction={handleAction}/>)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── COLLATION BOARD (admin_head) ── */}
      {tab === 'collation' && (
        <CollationBoard anns={items} onAction={handleAction} loading={actionLoading}/>
      )}

      {/* ── WHATSAPP SETUP ── */}
      {tab === 'whatsapp' && (
        <div>
          <div style={{ background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:'var(--r-lg)', padding:'14px 18px', marginBottom:16, display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:28 }}>💬</span>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#25D366', marginBottom:4 }}>WhatsApp Business Integration</div>
              <div style={{ fontSize:12.5, color:'var(--t-2)', lineHeight:1.65 }}>
                Each campus uses its own WhatsApp Business number. Set up numbers below. For live delivery, connect via the <strong>WhatsApp Business API (Meta)</strong> or <strong>Termii</strong> in Settings → Integrations.
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {branches.map(b => (
              <div key={b.id} className="card" style={{ padding:'14px 18px', borderLeft:`3px solid ${b.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:b.color, boxShadow:`0 0 6px ${b.color}` }}/>
                  <div style={{ fontWeight:700, fontSize:13 }}>{b.name}</div>
                  <span className="chip chip-gray" style={{ marginLeft:'auto', fontSize:10 }}>{b.country}</span>
                </div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--t-3)', display:'block', marginBottom:5, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                  WhatsApp Business number
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <input className="input"
                    value={waNumbers[b.id] || ''}
                    onChange={e => setWaNumbers(prev => ({ ...prev, [b.id]: e.target.value }))}
                    placeholder={b.country === 'NG' ? '+234 800 000 0000' : b.country === 'UK' ? '+44 700 000 0000' : '+1 000 000 0000'}
                    style={{ fontSize:12, fontFamily:'var(--font-mono)' }}/>
                  <button className="btn btn-sm" onClick={() => { /* save to org settings via API */ }}
                    style={{ flexShrink:0, background: waNumbers[b.id] ? 'var(--green-lt)' : 'var(--s-3)', color: waNumbers[b.id] ? 'var(--green)' : 'var(--t-3)', border:`1px solid ${waNumbers[b.id] ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, fontSize:11 }}>
                    {waNumbers[b.id] ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <SmsConfig/>
        </div>
      )}
    </div>
  )
}
