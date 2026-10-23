'use client'
/**
 * BirthdayWidget — compact 7-day birthday preview for unit_head dashboards.
 *
 * Pulls team members with birthdays in the next 7 days from the `workers` table,
 * filtered by the caller's department. Includes work anniversaries (1yr, 3yr, 5yr).
 *
 * Security: reads via client Supabase (read-only workers data, no PII mutation).
 * Shown on: Overview dashboard for unit_head, dept heads, ops_head, senior_pastor.
 */

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  ) : null

interface BdayMember {
  id:            string
  full_name:     string
  avatar_url:    string | null
  phone:         string
  department:    string
  date_of_birth: string | null  // ISO date e.g. "1990-06-15"
  created_at:    string         // for work anniversary
  // Derived
  daysUntil:  number
  isToday:    boolean
  anniversary: number | null    // years of service (1, 3, 5 only)
}

function daysUntilNextBirthday(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  const next  = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  const diff = Math.round((next.getTime() - today.getTime()) / 86400000)
  return diff
}

function anniversaryYears(joinedAt: string): number | null {
  const joined    = new Date(joinedAt)
  const today     = new Date()
  const diffYears = today.getFullYear() - joined.getFullYear()
  if (diffYears < 1) return null
  // Anniversary today or within this week?
  const nextAnn = new Date(today.getFullYear(), joined.getMonth(), joined.getDate())
  if (nextAnn < today) nextAnn.setFullYear(today.getFullYear() + 1)
  const daysTo  = Math.round((nextAnn.getTime() - today.getTime()) / 86400000)
  if (daysTo <= 7 && [1, 3, 5, 10].includes(diffYears)) return diffYears
  return null
}

function WhatsAppWishButton({ phone, name }: { phone: string; name: string }) {
  const first    = name.split(' ')[0]
  const template = encodeURIComponent(`Happy Birthday, ${first}! 🎂 Wishing you a wonderful day filled with God's blessings. From all of us at church 🙏`)
  const url      = `https://wa.me/${phone.replace(/\D/g, '')}?text=${template}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="btn btn-sm"
      style={{ fontSize:11, background:'rgba(37,211,102,0.12)', color:'#25D366', border:'1px solid rgba(37,211,102,0.3)', textDecoration:'none' }}>
      💬 Wish
    </a>
  )
}

interface BirthdayWidgetProps {
  department?: string      // filter to this dept; undefined = show all
  maxItems?:   number      // default 5
  compact?:    boolean     // true = single-line per member (for sidebar)
  onNavigate?: (page: string) => void
}

export default function BirthdayWidget({
  department, maxItems = 5, compact = false, onNavigate,
}: BirthdayWidgetProps) {
  const [members, setMembers]     = useState<BdayMember[]>([])
  const [loading, setLoading]     = useState(true)
  const [celebrated, setCelebrated] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    const load = async () => {
      try {
        let q = supabase.from('workers')
          .select('id, full_name, avatar_url, phone, department, date_of_birth, created_at')
          .eq('status', 'active')

        if (department) q = q.eq('department', department)

        const { data, error } = await q
        if (error || !data) { setLoading(false); return }

        const today = new Date()
        const result: BdayMember[] = []

        for (const w of data) {
          const hasDob = !!w.date_of_birth
          const annYrs = anniversaryYears(w.created_at)

          if (hasDob) {
            const days     = daysUntilNextBirthday(w.date_of_birth!)
            const isToday  = days === 0
            if (days <= 7) {
              result.push({
                ...w,
                date_of_birth: w.date_of_birth,
                daysUntil:  days,
                isToday,
                anniversary: null,
              })
            }
          }

          // Also push anniversary entries separately
          if (annYrs !== null) {
            result.push({
              ...w,
              date_of_birth: null,
              daysUntil:  0,
              isToday:    false,
              anniversary: annYrs,
            })
          }
        }

        // Sort: today first, then by days
        result.sort((a, b) => {
          if (a.isToday && !b.isToday) return -1
          if (!a.isToday && b.isToday) return 1
          return a.daysUntil - b.daysUntil
        })

        setMembers(result.slice(0, maxItems + 10)) // fetch more, slice in render
      } catch {}
      setLoading(false)
    }
    load()
  }, [department, maxItems])

  const markCelebrated = (id: string) => {
    setCelebrated(prev => new Set([...prev, id]))
  }

  const visible = members.filter(m => !celebrated.has(m.id)).slice(0, maxItems)
  const todayCount = visible.filter(m => m.isToday).length

  if (loading) {
    return (
      <div style={{ padding:'14px 18px', borderRadius:'var(--r-lg)', background:'var(--s-3)', border:'1px solid var(--border)' }}>
        <div style={{ fontSize:12, color:'var(--t-3)' }}>Loading birthdays…</div>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div style={{ padding:'14px 18px', borderRadius:'var(--r-lg)', background:'var(--s-3)', border:'1px solid var(--border)', fontSize:12, color:'var(--t-3)' }}>
        🎂 Birthday widget — connect database to see upcoming birthdays.
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <div style={{
        padding:'14px 18px', borderRadius:'var(--r-lg)',
        background:'rgba(99,102,241,0.04)', border:'1px solid rgba(99,102,241,0.12)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontSize:18 }}>🎂</span>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--t-1)' }}>Upcoming Birthdays</div>
        </div>
        <div style={{ fontSize:12.5, color:'var(--t-3)' }}>
          No birthdays in the next 7 days{department ? ` in ${department}` : ''}.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius:'var(--r-lg)',
      background:'rgba(99,102,241,0.04)',
      border:'1px solid rgba(99,102,241,0.15)',
      overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:'11px 16px', display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'rgba(99,102,241,0.06)', borderBottom:'1px solid rgba(99,102,241,0.12)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>🎂</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'var(--t-1)' }}>Upcoming Birthdays</div>
            {department && <div style={{ fontSize:11, color:'var(--t-3)', marginTop:1 }}>{department}</div>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {todayCount > 0 && (
            <span style={{
              background:'rgba(239,68,68,0.12)', color:'var(--red)',
              border:'1px solid rgba(239,68,68,0.3)',
              borderRadius:20, padding:'2px 8px', fontSize:10.5, fontWeight:700,
            }}>
              🎉 {todayCount} today!
            </span>
          )}
          <span className="chip chip-gray" style={{ fontSize:10 }}>{visible.length} in 7 days</span>
        </div>
      </div>

      {/* Member list */}
      <div style={{ padding:'8px 0' }}>
        {visible.map((m, i) => (
          <div key={`${m.id}-${m.anniversary ?? 'bday'}`} style={{
            display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
            borderBottom: i < visible.length - 1 ? '0.5px solid rgba(99,102,241,0.08)' : 'none',
            background: m.isToday ? 'rgba(239,68,68,0.04)' : 'transparent',
            transition:'background .15s',
          }}>
            {/* Avatar */}
            <div style={{
              width:36, height:36, borderRadius:'50%', flexShrink:0, overflow:'hidden',
              border: m.isToday ? '2px solid var(--red)' : '2px solid rgba(99,102,241,0.2)',
              position:'relative',
            }}>
              {m.avatar_url ? (
                <img src={m.avatar_url} alt={m.full_name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              ) : (
                <div style={{
                  width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(99,102,241,0.12)', fontSize:14, fontWeight:800,
                  color:'var(--brand)',
                }}>
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              {m.isToday && (
                <div style={{
                  position:'absolute', bottom:-1, right:-1, fontSize:12,
                  lineHeight:1, filter:'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
                }}>🎂</div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:13, color:'var(--t-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {m.full_name}
                {m.anniversary && (
                  <span style={{ marginLeft:6, fontSize:10, fontWeight:700, color:'#C9A84C', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:20, padding:'1px 6px' }}>
                    🏆 {m.anniversary}yr anniversary
                  </span>
                )}
              </div>
              <div style={{ fontSize:11, color:'var(--t-3)', marginTop:2 }}>
                {m.isToday
                  ? <span style={{ color:'var(--red)', fontWeight:700 }}>🎉 Birthday today!</span>
                  : m.anniversary
                    ? <span style={{ color:'#C9A84C' }}>Work anniversary coming up</span>
                    : `In ${m.daysUntil} day${m.daysUntil === 1 ? '' : 's'}`}
                {!compact && m.department && (
                  <span style={{ marginLeft:6, color:'var(--t-3)' }}>· {m.department}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            {!compact && (
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {m.phone && <WhatsAppWishButton phone={m.phone} name={m.full_name}/>}
                {!celebrated.has(m.id) && (
                  <button className="btn btn-sm" onClick={() => markCelebrated(m.id)}
                    style={{ fontSize:11, background:'rgba(99,102,241,0.1)', color:'var(--brand)', border:'1px solid rgba(99,102,241,0.25)' }}>
                    ✓ Celebrated
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {onNavigate && (
        <div style={{ padding:'8px 16px', borderTop:'0.5px solid rgba(99,102,241,0.1)', display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => onNavigate('birthdays')}>
            All birthdays →
          </button>
        </div>
      )}
    </div>
  )
}
