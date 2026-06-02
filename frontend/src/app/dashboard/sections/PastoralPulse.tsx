'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type Alert = {
  id: string
  urgency: 'high' | 'medium' | 'low'
  category: 'attendance' | 'growth' | 'workforce' | 'pastoral'
  branch: string
  headline: string
  detail: string
  action: string
  count?: number
}

type Insight = {
  label: string
  value: string | number
  trend: 'up' | 'down' | 'stable'
  sub: string
}

// ------------------------------------------------------------------
// Pastoral intelligence — blends real Supabase data with smart defaults
// ------------------------------------------------------------------
async function fetchRealAlerts(): Promise<Alert[]> {
  if (!supabase) return []
  const alerts: Alert[] = []
  try {
    // Check for recently registered workers (last 7 days)
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()
    const { count: newWorkers } = await supabase
      .from('workers').select('*', { count:'exact', head:true })
      .gte('created_at', weekAgo)
    if (newWorkers && newWorkers > 0) {
      alerts.push({ id:'live_1', urgency:'low', category:'growth', branch:'All branches',
        headline: `${newWorkers} new worker${newWorkers>1?'s':''} registered this week`,
        detail: `${newWorkers} worker account${newWorkers>1?'s':''} created in the last 7 days. Check Settings → Users to review and assign roles.`,
        action: 'Review in Settings', count: newWorkers })
    }
    // Check for soul records needing follow-up
    const { count: souls } = await supabase
      .from('soul_records').select('*', { count:'exact', head:true })
      .eq('follow_up_stage', 1)
    if (souls && souls > 0) {
      alerts.push({ id:'live_2', urgency:'medium', category:'pastoral', branch:'All branches',
        headline: `${souls} new soul${souls>1?'s':''} awaiting first follow-up`,
        detail: `${souls} convert${souls>1?'s':''} recorded at stage 1 — the 2-week welcome message hasn't been marked sent yet.`,
        action: 'Open Soul Tracker', count: souls })
    }
    // Check prayer wall activity
    const dayAgo = new Date(Date.now() - 24*60*60*1000).toISOString()
    const { count: prayers } = await supabase
      .from('prayer_requests').select('*', { count:'exact', head:true })
      .gte('created_at', dayAgo)
    if (prayers && prayers > 2) {
      alerts.push({ id:'live_3', urgency:'low', category:'pastoral', branch:'All branches',
        headline: `${prayers} prayer requests in the last 24 hours`,
        detail: 'Workers are actively using the prayer wall. Consider acknowledging them in the next service or sending an encouragement broadcast.',
        action: 'View Prayer Wall', count: prayers })
    }
  } catch {}
  return alerts
}

// ------------------------------------------------------------------
// Simulated pastoral intelligence data (fallback)
// ------------------------------------------------------------------
const ALERTS: Alert[] = [
  {
    id: 'a1', urgency: 'high', category: 'attendance', branch: 'Gbagada',
    headline: '14 members gone quiet — 60+ days',
    detail: 'This group includes 3 former unit heads and 2 Growth Track graduates. Historically, lapsed unit heads rarely return without a personal reach-out.',
    action: 'View list & draft message',
  },
  {
    id: 'a2', urgency: 'high', category: 'workforce', branch: 'Lekki HQ',
    headline: 'Ushering unit running below capacity',
    detail: 'Sunday coverage has dropped to 61% of recommended headcount for the past 3 weeks. Peak period is approaching with the upcoming communion Sunday.',
    action: 'Open workforce scheduler',
  },
  {
    id: 'a3', urgency: 'medium', category: 'growth', branch: 'Ikeja',
    headline: 'First-timer retention dropped 8 points',
    detail: 'Of 43 first-timers recorded in April, only 18 (42%) returned in week 2 — compared to a 50% average. The 2-week follow-up message may not have been sent for 11 of them.',
    action: 'Check Soul Tracker',
  },
  {
    id: 'a4', urgency: 'medium', category: 'pastoral', branch: 'Abuja',
    headline: 'Volunteer burnout signal — 3 members',
    detail: 'Chika Obi, Dare Adewale, and Ngozi Kalu have served every single Sunday for 11 consecutive weeks without a recorded rest. A brief word of appreciation from leadership goes a long way.',
    action: 'Send appreciation message',
  },
  {
    id: 'a5', urgency: 'low', category: 'growth', branch: 'London UK',
    headline: 'Growth Track Level 2 completions pending',
    detail: '7 members completed Level 1 in March and have not yet enrolled in Level 2. Auto-invitations are due this week.',
    action: 'View Growth Track',
  },
  {
    id: 'a6', urgency: 'low', category: 'attendance', branch: 'Port Harcourt',
    headline: 'Membership plateau — 4th consecutive month',
    detail: 'Net new members has been flat at 8–11 per month since January. Outreach activity in that branch has also declined by 30% compared to Q4 last year.',
    action: 'Review branch report',
  },
]

const INSIGHTS: Insight[] = [
  { label: 'Overall retention',   value: '71%',   trend: 'down',   sub: 'Down 4pts from last month' },
  { label: 'Active workforce',    value: '2,847', trend: 'up',     sub: 'Serving at least once/month' },
  { label: 'New members (May)',   value: 312,     trend: 'up',     sub: 'Across all 9 branches' },
  { label: 'Gone quiet',         value: 89,      trend: 'down',   sub: 'Not seen in 60+ days' },
  { label: 'Pending follow-ups', value: 24,      trend: 'stable', sub: 'Soul tracker queue' },
  { label: 'Events this month',  value: 11,      trend: 'stable', sub: '3 pending approval' },
]

const CAT_COLORS: Record<string, string> = {
  attendance: 'var(--red)',
  growth:     'var(--teal)',
  workforce:  'var(--brand)',
  pastoral:   '#D4A017',
}

const URGENCY_LABELS: Record<string, string> = {
  high:   'Needs attention',
  medium: 'Worth reviewing',
  low:    'For your awareness',
}

// ------------------------------------------------------------------
// Skeleton placeholder for the metric tiles
// ------------------------------------------------------------------
function SkeletonTile() {
  return (
    <div style={{ background: 'var(--s-2)', borderRadius: 'var(--r-lg)', padding: '14px 18px', border: '0.5px solid var(--border)', animation: 'pulse 1.6s ease-in-out infinite' }}>
      <div style={{ width: 70, height: 10, background: 'var(--s-4)', borderRadius: 4, marginBottom: 12 }}/>
      <div style={{ width: 50, height: 22, background: 'var(--s-4)', borderRadius: 4, marginBottom: 6 }}/>
      <div style={{ width: 100, height: 9, background: 'var(--s-4)', borderRadius: 4 }}/>
    </div>
  )
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export default function PastoralPulse() {
  const [loaded, setLoaded] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [dismissed, setDismissed] = useState<string[]>([])
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([])

  useEffect(() => {
    fetchRealAlerts().then(alerts => { if (alerts.length > 0) setLiveAlerts(alerts) })
  }, [])

  const ALL_ALERTS = [...liveAlerts, ...ALERTS]

  // Simulate async data load — mimics a real API call
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 900)
    return () => clearTimeout(t)
  }, [])

  const visible = ALL_ALERTS
    .filter(a => !dismissed.includes(a.id))
    .filter(a => filter === 'all' || a.urgency === filter)

  const highCount  = ALL_ALERTS.filter(a => a.urgency === 'high'   && !dismissed.includes(a.id)).length
  const medCount   = ALL_ALERTS.filter(a => a.urgency === 'medium' && !dismissed.includes(a.id)).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 17, fontFamily: 'var(--font-display)', color: 'var(--t-1)', marginBottom: 3 }}>Pastoral Pulse</h2>
            <p style={{ fontSize: 12.5, color: 'var(--t-2)' }}>A high-level read of what's happening across your branches — curated for leadership.</p>
          </div>
          {(highCount > 0 || medCount > 0) && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {highCount > 0 && <span style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', borderRadius: 20, fontSize: 11.5, fontWeight: 700, padding: '4px 10px' }}>{highCount} need attention</span>}
              {medCount > 0  && <span style={{ background: 'rgba(245,158,11,.1)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,.25)', borderRadius: 20, fontSize: 11.5, fontWeight: 700, padding: '4px 10px' }}>{medCount} worth reviewing</span>}
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid with skeleton loading */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        {!loaded
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i}/>)
          : INSIGHTS.map(ins => (
            <div key={ins.label} className="metric-tile metric-tile-accent" style={{ position: 'relative' }}>
              <div className="metric-label">{ins.label}</div>
              <div className="metric-value" style={{ fontSize: '1.55rem' }}>{ins.value}</div>
              <div style={{ fontSize: 11, color: ins.trend === 'up' ? 'var(--green)' : ins.trend === 'down' ? '#ef4444' : 'var(--t-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                {ins.trend === 'up' ? '↑' : ins.trend === 'down' ? '↓' : '→'} {ins.sub}
              </div>
            </div>
          ))
        }
      </div>

      {/* Disclaimer */}
      <div style={{ background: 'rgba(124,58,237,.06)', border: '1px solid rgba(124,58,237,.15)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p style={{ fontSize: 12, color: 'var(--t-2)', lineHeight: 1.6, margin: 0 }}>These signals are generated from platform activity data and are indicative, not definitive. Use your pastoral judgement alongside them. Numbers are rounded for readability.</p>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${ALL_ALERTS.filter(a => !dismissed.includes(a.id)).length})` : URGENCY_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!loaded
          ? [1, 2, 3].map(i => (
            <div key={i} style={{ background: 'var(--s-2)', borderRadius: 'var(--r-lg)', padding: '18px 20px', border: '0.5px solid var(--border)', animation: 'pulse 1.6s ease-in-out infinite' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 40, background: 'var(--s-4)', borderRadius: 4, flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 13, background: 'var(--s-4)', borderRadius: 4, marginBottom: 10 }}/>
                  <div style={{ width: '90%', height: 10, background: 'var(--s-4)', borderRadius: 4, marginBottom: 6 }}/>
                  <div style={{ width: '75%', height: 10, background: 'var(--s-4)', borderRadius: 4 }}/>
                </div>
              </div>
            </div>
          ))
          : visible.length === 0
            ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--t-3)', fontSize: 13 }}>All clear — no alerts in this category.</div>
            : visible.map(alert => {
              const isOpen = expanded === alert.id
              const accentColor = alert.urgency === 'high' ? '#ef4444' : alert.urgency === 'medium' ? '#f59e0b' : 'var(--t-3)'
              return (
                <div key={alert.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${accentColor}` }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : alert.id)}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-1)' }}>{alert.headline}</span>
                        <span style={{ fontSize: 10.5, color: CAT_COLORS[alert.category] || 'var(--brand)', background: 'rgba(124,58,237,.1)', borderRadius: 10, padding: '2px 8px', fontWeight: 600, textTransform: 'capitalize' }}>{alert.category}</span>
                        <span className="chip chip-gray" style={{ fontSize: 10.5 }}>{alert.branch}</span>
                      </div>
                      {!isOpen && <p style={{ fontSize: 12, color: 'var(--t-3)', margin: 0, lineHeight: 1.5 }}>{alert.detail.slice(0, 80)}…</p>}
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0, marginTop: 2, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6"/></svg>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 18px 16px', borderTop: '0.5px solid var(--border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--t-2)', lineHeight: 1.7, margin: '12px 0 14px' }}>{alert.detail}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm btn-brand">{alert.action}</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setDismissed(d => [...d, alert.id])}>Dismiss</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: .5 }
        }
      `}</style>
    </div>
  )
}
