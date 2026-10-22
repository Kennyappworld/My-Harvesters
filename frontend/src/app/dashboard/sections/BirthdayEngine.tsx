'use client'
/**
 * BirthdayEngine — Birthday command centre
 *
 * Features:
 *  - Live birthday board (today / this week / this month)
 *  - Custom date-range search (e.g. 1 Apr – 30 Apr)
 *  - Animated "today" banner on the notice board
 *  - Export birthday list as CSV
 *  - Bulk SMS (Termii) to everyone in range
 *  - Bulk WhatsApp deep-link (opens WhatsApp with personalised message)
 *  - Custom message template with {name} / {age} / {branch} placeholders
 *  - Upcoming birthday preview card (next 7 days)
 *
 * Security:
 *  - SMS sent via /api/send-sms (server-side Termii key, never in browser)
 *  - No phone numbers stored in component state beyond session lifetime
 */
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { notify } from '@/lib/toast'
import { useSession } from '@/lib/useSession'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!)
  : null

type Member = { id: string; name: string; phone: string; email: string; birthday: string; branch: string; dept: string; dob?: string }

const DEFAULT_SMS = `🎂 Happy Birthday {name}! The entire {branch} family celebrates you today. May this new year of your life overflow with God's blessings, joy and purpose. You are deeply loved! 🙏`
const DEFAULT_WA  = `🎂 Happy Birthday *{name}*!\n\nThe *{branch}* family celebrates you today. May this new year of your life overflow with God's blessings, joy and purpose.\n\nYou are deeply loved! 🙏`

function pad(n: number) { return String(n).padStart(2,'0') }

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

/** Returns MM-DD from a birthday string (YYYY-MM-DD or MM-DD) */
function mmdd(bday: string): string {
  if (!bday) return ''
  const parts = bday.split('-')
  if (parts.length === 3) return `${parts[1]}-${parts[2]}`
  if (parts.length === 2) return bday
  return ''
}

function isBirthdayInRange(bday: string, fromMD: string, toMD: string): boolean {
  const md = mmdd(bday)
  if (!md) return false
  // Simple lexicographic comparison for MM-DD strings
  if (fromMD <= toMD) return md >= fromMD && md <= toMD
  // Wraps year-end (e.g. Dec → Jan)
  return md >= fromMD || md <= toMD
}

function birthdayCountdown(bday: string): number {
  const md = mmdd(bday)
  if (!md) return 999
  const today = new Date()
  const [m, d] = md.split('-').map(Number)
  let next = new Date(today.getFullYear(), m-1, d)
  if (next < today) next = new Date(today.getFullYear()+1, m-1, d)
  return Math.ceil((next.getTime() - today.getTime()) / 86400000)
}

function exportCSV(members: Member[]) {
  const rows = [
    ['Name','Phone','Email','Birthday','Branch','Department'],
    ...members.map(m => [m.name, m.phone, m.email, m.birthday || m.dob || '', m.branch, m.dept])
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `birthdays-${formatDate(new Date())}.csv` })
  a.click(); URL.revokeObjectURL(url)
  notify.success('Birthday list exported')
}

function personalise(template: string, member: Member) {
  const firstName = member.name.split(' ')[0]
  return template
    .replace(/\{name\}/g, firstName)
    .replace(/\{fullname\}/g, member.name)
    .replace(/\{branch\}/g, member.branch || 'our church')
    .replace(/\{dept\}/g, member.dept || 'ministry')
}

export default function BirthdayEngine() {
  const { user } = useSession()
  const isAdmin = user?.role && ['developer','senior_pastor','admin','pastor'].includes(user.role)

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading]  = useState(true)
  const [tab, setTab]          = useState<'board'|'search'|'send'>('board')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]    = useState('')
  const [smsTemplate, setSmsTemplate] = useState(DEFAULT_SMS)
  const [waTemplate,  setWaTemplate]  = useState(DEFAULT_WA)
  const [sending, setSending]  = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [mode, setMode]        = useState<'sms'|'whatsapp'>('whatsapp')

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    const load = async () => {
      try {
        const { data } = await supabase
          .from('workers')
          .select('id, full_name, phone, email, dob, branch_id, department')
          .not('dob', 'is', null)
        if (data) {
          setMembers(data.map((w: any) => ({
            id: w.id,
            name: w.full_name || 'Member',
            phone: w.phone || '',
            email: w.email || '',
            birthday: w.dob || '',
            dob: w.dob || '',
            branch: w.branch_id || '',
            dept: w.department || '',
          })))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const today = formatDate(new Date())
  const todayMD = today.slice(5)

  const todayBirthdays = useMemo(() =>
    members.filter(m => mmdd(m.birthday) === todayMD), [members, todayMD])

  const weekBirthdays = useMemo(() => {
    const days = Array.from({length:7}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate()+i)
      return `${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    })
    return members.filter(m => days.includes(mmdd(m.birthday)))
      .sort((a,b) => birthdayCountdown(a.birthday) - birthdayCountdown(b.birthday))
  }, [members])

  const monthBirthdays = useMemo(() => {
    const curMonth = pad(new Date().getMonth()+1)
    return members.filter(m => mmdd(m.birthday).startsWith(curMonth))
      .sort((a,b) => mmdd(a.birthday).localeCompare(mmdd(b.birthday)))
  }, [members])

  const rangeResults = useMemo(() => {
    if (!fromDate || !toDate) return []
    const f = fromDate.slice(5), t = toDate.slice(5)
    return members.filter(m => isBirthdayInRange(m.birthday, f, t))
      .sort((a,b) => mmdd(a.birthday).localeCompare(mmdd(b.birthday)))
  }, [members, fromDate, toDate])

  const sendTargets = tab === 'send' ? (rangeResults.length > 0 ? rangeResults : todayBirthdays) : []

  const sendWhatsApp = (member: Member) => {
    const msg = encodeURIComponent(personalise(waTemplate, member))
    const phone = member.phone.replace(/\D/g,'')
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  const sendBulkWhatsApp = () => {
    sendTargets.forEach((m, i) => {
      setTimeout(() => sendWhatsApp(m), i * 500)
    })
    notify.success(`Opened WhatsApp for ${sendTargets.length} member${sendTargets.length!==1?'s':''}`)
  }

  const sendBulkSMS = async () => {
    if (!sendTargets.length) return
    setSending(true)
    setSentCount(0)
    try {
      const payload = sendTargets.map(m => ({
        to: m.phone.replace(/\D/g,''),
        message: personalise(smsTemplate, m),
      })).filter(p => p.to.length >= 7)

      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      })
      const data = await res.json()
      if (data.sent) {
        setSentCount(data.sent)
        notify.success(`SMS sent to ${data.sent} member${data.sent!==1?'s':''}`)
      } else {
        notify.error(data.error || 'SMS send failed')
      }
    } catch (err: any) {
      notify.error('Failed to send SMS. Check Termii configuration.')
    } finally {
      setSending(false)
    }
  }

  const card = (title: string, value: string | number, sub?: string, gold?: boolean) => (
    <div style={{
      padding:'14px 18px', borderRadius:12,
      background: gold ? 'rgba(201,168,76,0.07)' : 'var(--s-3)',
      border: `1px solid ${gold ? 'rgba(201,168,76,0.22)' : 'var(--border)'}`,
      minWidth: 110,
    }}>
      <div style={{fontSize:11,color:'var(--t-3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{title}</div>
      <div style={{fontSize:22,fontWeight:700,color: gold ? '#c9a84c' : 'var(--t-1)',fontFamily:'var(--font-mono)'}}>{value}</div>
      {sub && <div style={{fontSize:11,color:'var(--t-3)',marginTop:3}}>{sub}</div>}
    </div>
  )

  const MemberRow = ({ m, showSend }: { m: Member; showSend?: boolean }) => {
    const cd = birthdayCountdown(m.birthday)
    const isToday = cd === 0
    return (
      <div style={{
        display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
        borderRadius:10, marginBottom:6,
        background: isToday ? 'rgba(201,168,76,0.06)' : 'var(--s-3)',
        border: `1px solid ${isToday ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`,
        transition:'all .15s',
      }}>
        {/* Avatar */}
        <div style={{
          width:38, height:38, borderRadius:'50%', flexShrink:0,
          background: isToday ? 'rgba(201,168,76,0.15)' : 'rgba(56,130,246,0.1)',
          border: `2px solid ${isToday ? '#c9a84c' : 'var(--border)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, fontWeight:700,
          color: isToday ? '#c9a84c' : 'var(--t-2)',
        }}>
          {isToday ? '🎂' : m.name[0]?.toUpperCase()}
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:13.5, fontWeight:600, color:'var(--t-1)', display:'flex', alignItems:'center', gap:8}}>
            {m.name}
            {isToday && <span style={{fontSize:10, background:'rgba(201,168,76,0.15)', color:'#c9a84c', padding:'2px 7px', borderRadius:6, fontWeight:700}}>TODAY 🎉</span>}
          </div>
          <div style={{fontSize:11.5, color:'var(--t-3)', marginTop:2}}>
            {m.birthday || m.dob || '—'} · {m.branch || '—'} · {m.phone || 'No phone'}
          </div>
        </div>
        <div style={{fontSize:11, color: cd<=7 ? '#c9a84c' : 'var(--t-3)', fontWeight: cd<=7 ? 700 : 400, whiteSpace:'nowrap'}}>
          {isToday ? 'Today!' : `in ${cd}d`}
        </div>
        {showSend && (
          <div style={{display:'flex', gap:6}}>
            <button
              onClick={() => sendWhatsApp(m)}
              disabled={!m.phone}
              title="Send WhatsApp"
              style={{
                padding:'5px 10px', borderRadius:8, border:'1px solid rgba(37,211,102,0.3)',
                background:'rgba(37,211,102,0.07)', color:'#25d366', cursor:'pointer',
                fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5,
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.112 1.519 5.843L.057 23.486a.5.5 0 0 0 .606.606l5.657-1.466A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.535-5.214-1.463l-.372-.215-3.863 1.002 1.003-3.847-.232-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              WA
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:'var(--font-display)',display:'flex',alignItems:'center',gap:9}}>
            🎂 Birthday Command Centre
          </div>
          <div style={{fontSize:12,color:'var(--t-2)',marginTop:2}}>
            {members.length} members with birthdays tracked · {todayBirthdays.length} celebrating today
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-sm" onClick={() => exportCSV(monthBirthdays)}>
            ↓ Export Month
          </button>
          {isAdmin && (
            <button className="btn btn-brand btn-sm" onClick={() => setTab('send')}>
              📨 Send Wishes
            </button>
          )}
        </div>
      </div>

      {/* TODAY banner */}
      {todayBirthdays.length > 0 && (
        <div style={{
          padding:'14px 18px', borderRadius:14, marginBottom:16,
          background:'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)',
          border:'1px solid rgba(201,168,76,0.30)',
          boxShadow:'0 0 30px rgba(201,168,76,0.08)',
          animation:'glow-pulse 3s ease-in-out infinite',
        }}>
          <div style={{fontSize:13,fontWeight:700,color:'#c9a84c',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
            🎉 Celebrating today — {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {todayBirthdays.map(m => (
              <div key={m.id} style={{
                padding:'6px 13px', borderRadius:20,
                background:'rgba(201,168,76,0.14)', border:'1px solid rgba(201,168,76,0.28)',
                fontSize:12.5, fontWeight:600, color:'#e8edf5',
                display:'flex',alignItems:'center',gap:6,
              }}>
                🎂 {m.name}
                {m.phone && (
                  <button onClick={() => sendWhatsApp(m)} style={{
                    background:'none',border:'none',cursor:'pointer',color:'#25d366',padding:0,fontSize:13,
                  }} title="Send WhatsApp wish">💬</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        {card('Today', todayBirthdays.length, 'birthdays', true)}
        {card('This week', weekBirthdays.length, 'upcoming')}
        {card('This month', monthBirthdays.length, 'total')}
        {card('Tracked', members.length, 'with DOB')}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{marginBottom:16}}>
        {([['board','Notice Board'],['search','Date Range Search'],['send','Bulk Send']] as const).map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── BOARD ── */}
      {tab==='board' && (
        <div className="two-col">
          <div className="card card-p">
            <div className="heading" style={{marginBottom:10}}>🗓️ This week</div>
            {loading && <div style={{color:'var(--t-3)',fontSize:12}}>Loading…</div>}
            {!loading && weekBirthdays.length === 0 && <div style={{color:'var(--t-3)',fontSize:12}}>No birthdays this week</div>}
            {weekBirthdays.map(m => <MemberRow key={m.id} m={m} showSend={!!isAdmin}/>)}
          </div>
          <div className="card card-p">
            <div className="heading" style={{marginBottom:10}}>📅 This month</div>
            {loading && <div style={{color:'var(--t-3)',fontSize:12}}>Loading…</div>}
            {!loading && monthBirthdays.length === 0 && <div style={{color:'var(--t-3)',fontSize:12}}>No birthdays this month</div>}
            <div style={{maxHeight:420,overflowY:'auto',paddingRight:4}}>
              {monthBirthdays.map(m => <MemberRow key={m.id} m={m} showSend={!!isAdmin}/>)}
            </div>
            {monthBirthdays.length > 0 && (
              <button className="btn btn-sm" style={{marginTop:10,width:'100%',justifyContent:'center'}}
                onClick={() => exportCSV(monthBirthdays)}>
                ↓ Export this month's list
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SEARCH ── */}
      {tab==='search' && (
        <div>
          <div className="card card-p" style={{marginBottom:14}}>
            <div className="heading" style={{marginBottom:12}}>Search birthdays by date range</div>
            <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
              <div>
                <label style={{display:'block',fontSize:10.5,color:'var(--t-3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.07em'}}>From date</label>
                <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}
                  style={{height:40,padding:'0 12px',background:'var(--s-4)',border:'1px solid var(--border)',borderRadius:9,color:'var(--t-1)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:10.5,color:'var(--t-3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.07em'}}>To date</label>
                <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}
                  style={{height:40,padding:'0 12px',background:'var(--s-4)',border:'1px solid var(--border)',borderRadius:9,color:'var(--t-1)',fontSize:13,outline:'none'}}/>
              </div>
              <button className="btn btn-sm" disabled={!rangeResults.length} onClick={() => exportCSV(rangeResults)}>
                ↓ Export ({rangeResults.length})
              </button>
              {isAdmin && rangeResults.length > 0 && (
                <button className="btn btn-brand btn-sm" onClick={() => setTab('send')}>
                  📨 Send to these {rangeResults.length}
                </button>
              )}
            </div>
          </div>

          {fromDate && toDate && (
            <div className="card card-p">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center'}}>
                <div className="heading">{rangeResults.length} birthdays found</div>
              </div>
              {rangeResults.length === 0
                ? <div style={{color:'var(--t-3)',fontSize:13}}>No birthdays in this range</div>
                : rangeResults.map(m => <MemberRow key={m.id} m={m} showSend={!!isAdmin}/>)
              }
            </div>
          )}
        </div>
      )}

      {/* ── SEND ── */}
      {tab==='send' && isAdmin && (
        <div className="two-col">
          <div className="card card-p">
            <div className="heading" style={{marginBottom:4}}>Message template</div>
            <div style={{fontSize:11.5,color:'var(--t-3)',marginBottom:12}}>
              Use <code style={{color:'#c9a84c'}}>{'{name}'}</code> · <code style={{color:'#c9a84c'}}>{'{branch}'}</code> · <code style={{color:'#c9a84c'}}>{'{fullname}'}</code>
            </div>

            {/* Mode */}
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {(['whatsapp','sms'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={mode===m ? 'btn btn-brand btn-sm' : 'btn btn-sm'}>
                  {m==='whatsapp' ? '💬 WhatsApp' : '📱 SMS'}
                </button>
              ))}
            </div>

            <textarea
              value={mode==='whatsapp' ? waTemplate : smsTemplate}
              onChange={e => mode==='whatsapp' ? setWaTemplate(e.target.value) : setSmsTemplate(e.target.value)}
              rows={7}
              style={{
                width:'100%', padding:'11px 13px', borderRadius:10, boxSizing:'border-box',
                background:'var(--s-4)', border:'1px solid var(--border)',
                color:'var(--t-1)', fontSize:13, resize:'vertical', outline:'none',
                fontFamily:'var(--font-body)', lineHeight:1.65,
              }}
            />

            <div style={{marginTop:10,padding:'10px 12px',background:'var(--s-3)',borderRadius:9,border:'1px solid var(--border)',fontSize:12,color:'var(--t-2)'}}>
              <strong style={{color:'var(--t-1)'}}>Preview for {sendTargets[0]?.name || 'Member'}:</strong>
              <div style={{marginTop:5,whiteSpace:'pre-wrap',lineHeight:1.6}}>
                {sendTargets[0] ? personalise(mode==='whatsapp' ? waTemplate : smsTemplate, sendTargets[0]) : '—'}
              </div>
            </div>
          </div>

          <div className="card card-p">
            <div className="heading" style={{marginBottom:4}}>Recipients</div>
            <div style={{fontSize:11.5,color:'var(--t-3)',marginBottom:14}}>
              {rangeResults.length > 0
                ? `Sending to ${rangeResults.length} members in date range`
                : `Sending to ${todayBirthdays.length} members celebrating today`}
            </div>

            <div style={{maxHeight:300,overflowY:'auto',marginBottom:14}}>
              {sendTargets.map(m => <MemberRow key={m.id} m={m}/>)}
              {sendTargets.length === 0 && <div style={{color:'var(--t-3)',fontSize:13}}>No recipients. Search a date range first or wait for today's birthdays.</div>}
            </div>

            {sendTargets.length > 0 && (
              <div style={{display:'flex',gap:10,flexDirection:'column'}}>
                <button
                  onClick={sendBulkWhatsApp}
                  disabled={!sendTargets.some(m=>m.phone)}
                  style={{
                    height:44, borderRadius:10, fontWeight:700, fontSize:13.5, cursor:'pointer',
                    background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.30)',
                    color:'#25d366', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  }}
                >
                  💬 Open WhatsApp for all {sendTargets.length} members
                </button>
                <button
                  onClick={sendBulkSMS}
                  disabled={sending || !sendTargets.some(m=>m.phone)}
                  className="btn btn-brand"
                  style={{height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}
                >
                  {sending ? (
                    <><svg style={{animation:'spin .75s linear infinite'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sending…</>
                  ) : (
                    <>📱 Send bulk SMS via Termii ({sendTargets.length})</>
                  )}
                </button>
                {sentCount > 0 && (
                  <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.20)',fontSize:12.5,color:'#86efac'}}>
                    ✓ SMS sent successfully to {sentCount} member{sentCount!==1?'s':''}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes glow-pulse{0%,100%{box-shadow:0 0 0 rgba(201,168,76,0)}50%{box-shadow:0 0 24px rgba(201,168,76,0.15)}}`}</style>
    </div>
  )
}
