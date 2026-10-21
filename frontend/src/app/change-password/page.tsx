'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Rate limit: max 5 attempts per 15 min (client-side guard; server should also enforce via Supabase)
const RATE_KEY    = 'shq_chpw_attempts'
const RATE_LIMIT  = 5
const RATE_WINDOW = 15 * 60 * 1000

function checkRateLimit(): { allowed: boolean; resetMs: number } {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter((t: number) => now - t < RATE_WINDOW)
    const allowed = data.attempts.length < RATE_LIMIT
    const oldest = data.attempts[0]
    const resetMs = oldest ? RATE_WINDOW - (now - oldest) : 0
    return { allowed, resetMs }
  } catch {
    return { allowed: true, resetMs: 0 }
  }
}

function recordAttempt() {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter((t: number) => now - t < RATE_WINDOW)
    data.attempts.push(now)
    sessionStorage.setItem(RATE_KEY, JSON.stringify(data))
  } catch {}
}

// Build Supabase client once — prefer publishable key, fall back to anon key
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

export default function ChangePassword() {
  const router = useRouter()
  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)
  const [done, setDone]     = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null) // null = loading
  const [rateLocked, setRateLocked] = useState(false)

  // Verify the user is actually authenticated before rendering the form
  useEffect(() => {
    if (!supabase) { setAuthed(false); return }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuthed(true)
      } else {
        // Not authenticated — redirect to login
        router.replace('/login')
      }
    }).catch(() => {
      router.replace('/login')
    })
  }, [router])

  const strong = pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')

    if (!strong) {
      setErr('Password must be at least 8 characters with an uppercase letter and a number.')
      return
    }
    if (pw !== pw2) { setErr('Passwords do not match.'); return }

    const rate = checkRateLimit()
    if (!rate.allowed) {
      const min = Math.ceil(rate.resetMs / 60000)
      setErr(`Too many attempts. Please wait ${min <= 1 ? '1 minute' : `${min} minutes`}.`)
      setRateLocked(true)
      return
    }

    setBusy(true)
    recordAttempt()

    try {
      if (!supabase) throw new Error('App not configured.')

      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) { setErr(error.message); setBusy(false); return }

      // Clear must_change_password flag
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('workers').update({ must_change_password: false }).eq('id', user.id)
      }
    } catch (ex: any) {
      setErr(ex?.message || 'Something went wrong. Please try again.')
      setBusy(false)
      return
    }

    setBusy(false)
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  // Loading state while we verify auth
  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1F14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" width="24" height="24">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: '32px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 6 }}>Set your password</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            You're using a temporary password.<br/>Please set a new one to continue.
          </div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#6EE7B7', fontWeight: 600 }}>
            ✓ Password updated! Taking you to the dashboard…
          </div>
        ) : (
          <form onSubmit={submit}>
            {err && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#FCA5A5', marginBottom: 14 }}>
                {err}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                New password
              </label>
              <input
                className="input-dark" type="password" value={pw}
                onChange={e => { setPw(e.target.value); setErr(''); setRateLocked(false) }}
                required minLength={8}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                disabled={busy || rateLocked}
                autoComplete="new-password"
              />
              {pw.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  {([['8+ chars', pw.length >= 8], ['Uppercase', /[A-Z]/.test(pw)], ['Number', /[0-9]/.test(pw)]] as [string, boolean][]).map(([l, ok]) => (
                    <span key={l} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 100, background: ok ? 'rgba(110,231,183,0.12)' : 'rgba(255,255,255,0.06)', color: ok ? '#6EE7B7' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Confirm password
              </label>
              <input
                className="input-dark" type="password" value={pw2}
                onChange={e => { setPw2(e.target.value); setErr('') }}
                required placeholder="Repeat new password"
                disabled={busy || rateLocked}
                autoComplete="new-password"
              />
              {pw2.length > 0 && pw !== pw2 && (
                <div style={{ fontSize: 11.5, color: '#FCA5A5', marginTop: 5 }}>Passwords do not match</div>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || rateLocked || !strong || pw !== pw2}
              style={{
                width: '100%', padding: '12px',
                background: strong && pw === pw2 && !rateLocked
                  ? 'linear-gradient(135deg,#1B4332,#2D6A4F)'
                  : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10,
                color: strong && pw === pw2 && !rateLocked ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: 14, fontWeight: 700,
                cursor: strong && pw === pw2 && !rateLocked ? 'pointer' : 'not-allowed',
                transition: 'all .2s',
              }}
            >
              {busy ? 'Updating…' : rateLocked ? 'Too many attempts — wait a moment' : 'Set password & continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
