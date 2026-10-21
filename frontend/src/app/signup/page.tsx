'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useOrgSettings } from '@/lib/orgSettings'
import { useBranches, useDepartments } from '@/lib/data'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  ) : null

// Rate limit: max 3 signups per 30 min per browser session
const SIGNUP_RATE_KEY    = 'shq_signup_attempts'
const SIGNUP_RATE_LIMIT  = 3
const SIGNUP_RATE_WINDOW = 30 * 60 * 1000

function checkSignupRateLimit(): { allowed: boolean; resetMs: number } {
  try {
    const raw = sessionStorage.getItem(SIGNUP_RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter((t: number) => now - t < SIGNUP_RATE_WINDOW)
    const allowed = data.attempts.length < SIGNUP_RATE_LIMIT
    const oldest = data.attempts[0]
    const resetMs = oldest ? SIGNUP_RATE_WINDOW - (now - oldest) : 0
    return { allowed, resetMs }
  } catch {
    return { allowed: true, resetMs: 0 }
  }
}

function recordSignupAttempt() {
  try {
    const raw = sessionStorage.getItem(SIGNUP_RATE_KEY)
    const data: { attempts: number[] } = raw ? JSON.parse(raw) : { attempts: [] }
    const now = Date.now()
    data.attempts = data.attempts.filter((t: number) => now - t < SIGNUP_RATE_WINDOW)
    data.attempts.push(now)
    sessionStorage.setItem(SIGNUP_RATE_KEY, JSON.stringify(data))
  } catch {}
}

function SignupForm() {
  const params = useSearchParams()
  const branchParam = params.get('branch') || ''
  const deptParam   = params.get('dept')   || ''

  const { settings, loading: orgLoading } = useOrgSettings()
  const { branches, loading: branchLoading } = useBranches()
  const { departments, loading: deptLoading } = useDepartments()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', branch: branchParam, dept: deptParam, firstTimer: 'no', dob: '',
  })
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [signupErr, setSignupErr] = useState('')

  const selectedBranch = branches.find(b => b.branch_key === form.branch)

  if (orgLoading || branchLoading || deptLoading) {
    return (
      <div style={{ color: 'var(--t-2)', textAlign: 'center', padding: '3rem' }}>
        <svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginBottom: 12 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <div>Loading…</div>
      </div>
    )
  }

  const next = (e: React.FormEvent) => { e.preventDefault(); setStep(2) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setSignupErr('')

    // Client-side rate limit (belt-and-suspenders — Supabase RLS is the real gate)
    const rate = checkSignupRateLimit()
    if (!rate.allowed) {
      const min = Math.ceil(rate.resetMs / 60000)
      setSignupErr(`Too many registrations from this browser. Please wait ${min <= 1 ? '1 minute' : `${min} minutes`} and try again.`)
      setBusy(false)
      return
    }

    const phoneClean = form.phone.replace(/[\s\-\(\)]/g, '')
    if (!/^[\+]?[0-9]{7,15}$/.test(phoneClean)) {
      setSignupErr('Please enter a valid phone number (7-15 digits, optional + prefix).')
      setBusy(false)
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSignupErr('Please enter a valid email address.')
      setBusy(false)
      return
    }
    recordSignupAttempt()

    try {
      if (supabase) {
        await supabase.from('workers').insert({
          org_id:      settings.id || null,
          full_name:   form.name.trim(),
          phone:       form.phone.trim(),
          email:       form.email.trim().toLowerCase() || null,
          branch_key:  form.branch || null,
          department:  form.dept || null,
          role:        'worker',
          first_timer: form.firstTimer === 'yes',
          dob:         form.dob || null,
          status:      settings.requireApproval ? 'pending' : 'active',
          must_change_password: true,
        })
        // Notify admins
        await supabase.from('announcements').insert({
          title: `New registration: ${form.name.trim()}`,
          body: `${form.name.trim()} joined ${selectedBranch?.name || form.branch || 'a campus'} · ${form.dept || 'No department'}. ${settings.requireApproval ? 'Pending admin approval.' : 'Auto-approved.'}`,
          scope: 'admin',
        }).catch(() => null)
      }
      setDone(true)
    } catch {
      setSignupErr('Registration failed — please check your details and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>🙌</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--t-1)', letterSpacing: '-0.02em', marginBottom: 10 }}>
        Welcome to the family!
      </div>
      <div style={{ fontSize: 15, color: 'var(--t-2)', lineHeight: 1.75, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
        Hi <strong style={{ color: 'var(--brand)' }}>{form.name}</strong> — welcome to{' '}
        <strong>{selectedBranch?.name || settings.name}!</strong>{' '}
        {settings.requireApproval
          ? 'Your admin will review your registration and send you your login details shortly.'
          : 'Your account is ready! Ask your admin for your login details.'}
      </div>
      <div style={{ background: 'var(--s-3)', border: '1px solid var(--border-md)', borderRadius: 14, padding: '16px 20px', maxWidth: 360, margin: '0 auto 24px', textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>What happens next</div>
        {[
          settings.requireApproval ? 'Admin reviews your registration' : 'Your registration is confirmed',
          'Your login credentials are sent to you',
          'You will receive a WhatsApp message with your password',
          'Log in and change your password on first login',
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12.5, color: 'var(--t-2)', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>{i + 1}.</span>{s}
          </div>
        ))}
      </div>
      <Link href="/login" className="btn btn-brand">Go to login</Link>
    </div>
  )

  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: 56, height: 56, background: 'var(--grad-brand)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: 'var(--sh-brand)', overflow: 'hidden' }}>
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt="logo" style={{ width: 56, height: 56, objectFit: 'cover' }} />
            : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="28" height="28"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          }
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--t-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          {selectedBranch ? `Welcome to ${selectedBranch.name}` : `Join ${settings.name || 'Our Church'}`}
        </div>
        <div style={{ fontSize: 13, color: 'var(--t-2)' }}>
          {settings.tagline || 'Register to join our workforce'}
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= s ? 'var(--grad-brand)' : 'var(--s-3)', border: `2px solid ${step >= s ? 'var(--brand)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: step >= s ? 'white' : 'var(--t-3)' }}>{s}</div>
              {s < 2 && <div style={{ width: 40, height: 2, background: step > s ? 'var(--brand)' : 'var(--s-4)', borderRadius: 2 }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="card glass" style={{ padding: '2rem' }}>
        {signupErr && (
          <div style={{ padding: '10px 14px', background: 'var(--red-lt)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>{signupErr}</div>
        )}

        {step === 1 ? (
          <form onSubmit={next}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Personal details</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Full name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" maxLength={80} required autoFocus />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Phone number *</label>
              <input className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 8900" maxLength={20} required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Email address</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Optional — for login" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Date of birth</label>
              <input className="input" type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
            </div>
            {branches.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Campus / Branch *</label>
                <select className="input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} required>
                  <option value="">Select your campus</option>
                  {branches.map(b => <option key={b.branch_key} value={b.branch_key}>{b.name}</option>)}
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-brand" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>Next →</button>
          </form>
        ) : (
          <form onSubmit={submit}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Get involved</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 8 }}>Are you a first-time visitor?</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['yes', 'Yes, first time! 🙋'], ['no', 'No, I have visited before']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, firstTimer: v }))} className="btn btn-sm"
                    style={{ flex: 1, justifyContent: 'center', background: form.firstTimer === v ? 'var(--grad-brand)' : 'transparent', color: form.firstTimer === v ? 'white' : 'var(--t-2)', border: `1px solid ${form.firstTimer === v ? 'var(--brand)' : 'var(--border-md)'}`, fontSize: 11.5 }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {departments.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 8 }}>Which department interests you?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {departments.map(d => (
                    <button key={d.dept_key} type="button" onClick={() => setForm(f => ({ ...f, dept: d.dept_key }))}
                      style={{ padding: '8px 10px', borderRadius: 'var(--r)', border: `1px solid ${form.dept === d.dept_key ? 'var(--brand)' : 'var(--border-md)'}`, background: form.dept === d.dept_key ? 'var(--brand-soft)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all .12s', display: 'flex', gap: 7, alignItems: 'center' }}>
                      <span style={{ fontSize: 16 }}>{d.icon}</span>
                      <span style={{ fontSize: 11.5, color: form.dept === d.dept_key ? 'var(--brand)' : 'var(--t-2)', fontWeight: form.dept === d.dept_key ? 600 : 400 }}>{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {signupErr && <div style={{ padding: '10px 14px', background: 'var(--red-lt)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{signupErr}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn btn-brand" style={{ flex: 1, justifyContent: 'center', padding: '11px' }} disabled={busy}>
                {busy ? 'Registering…' : 'Complete registration 🙌'}
              </button>
            </div>
          </form>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--t-3)', marginTop: '1rem' }}>
        Already registered? <Link href="/login" style={{ color: 'var(--brand)' }}>Sign in</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <Suspense fallback={<div style={{ color: 'var(--t-2)', textAlign: 'center' }}>Loading…</div>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
