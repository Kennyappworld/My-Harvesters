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

// Shared input style for dark theme
const inputSt: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px',
  background: '#0d1424',
  border: '1px solid #1e2d45',
  borderRadius: 10,
  color: '#e8edf5',
  fontSize: 13.5,
  outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color .15s, box-shadow .15s',
  boxSizing: 'border-box',
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
      <div style={{ color: '#7a8fa8', textAlign: 'center', padding: '3rem', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <svg style={{ animation: 'spin .75s linear infinite', display: 'block', margin: '0 auto 12px' }} viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5" width="22" height="22">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Loading…
      </div>
    )
  }

  const next = (e: React.FormEvent) => { e.preventDefault(); setStep(2) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setSignupErr('')

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
        await Promise.resolve(supabase.from('announcements').insert({
          title: `New registration: ${form.name.trim()}`,
          body: `${form.name.trim()} joined ${selectedBranch?.name || form.branch || 'a campus'} · ${form.dept || 'No department'}. ${settings.requireApproval ? 'Pending admin approval.' : 'Auto-approved.'}`,
          scope: 'admin',
        })).catch(() => null)
      }
      setDone(true)
    } catch {
      setSignupErr('Registration failed — please check your details and try again.')
    } finally {
      setBusy(false)
    }
  }

  const labelSt: React.CSSProperties = {
    display: 'block', fontSize: 10.5, fontWeight: 600,
    color: '#7a8fa8', letterSpacing: '0.09em',
    textTransform: 'uppercase', marginBottom: 7,
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>🙌</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 28, fontWeight: 600, color: '#e8edf5',
        letterSpacing: '0.01em', marginBottom: 12,
      }}>
        Welcome to the family!
      </div>
      <div style={{ fontSize: 15, color: '#7a8fa8', lineHeight: 1.75, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
        Hi <strong style={{ color: '#c9a84c' }}>{form.name}</strong> — welcome to{' '}
        <strong style={{ color: '#e8edf5' }}>{selectedBranch?.name || settings.name}!</strong>{' '}
        {settings.requireApproval
          ? 'Your admin will review your registration and send you your login details shortly.'
          : 'Your account is ready! Ask your admin for your login details.'}
      </div>

      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 14,
        padding: '18px 22px', maxWidth: 360, margin: '0 auto 28px', textAlign: 'left',
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#c9a84c', marginBottom: 12, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          What happens next
        </div>
        {[
          settings.requireApproval ? 'Admin reviews your registration' : 'Your registration is confirmed',
          'Your login credentials are sent to you',
          'You will receive a WhatsApp message with your password',
          'Log in and change your password on first login',
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '9px 0',
            borderBottom: i < 3 ? '1px solid #1e2d45' : 'none',
            fontSize: 12.5, color: '#7a8fa8', alignItems: 'center',
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(201,168,76,0.10)',
              border: '1px solid rgba(201,168,76,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#c9a84c', flexShrink: 0,
            }}>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      <Link href="/login" style={{
        textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '12px 28px',
        background: 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
        border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: 10, color: '#06090f',
        fontSize: 14, fontWeight: 700,
        boxShadow: '0 4px 20px rgba(201,168,76,0.25)',
      }}>
        Sign in to your account
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>
    </div>
  )

  return (
    <div style={{ width: '100%', maxWidth: 460, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: 60, height: 60,
          background: '#111827',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 8px 28px rgba(201,168,76,0.14)',
          overflow: 'hidden',
        }}>
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" width="28" height="28">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
          }
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 24, fontWeight: 600, color: '#e8edf5',
          letterSpacing: '0.01em', marginBottom: 5,
        }}>
          {selectedBranch ? `Welcome to ${selectedBranch.name}` : `Join ${settings.name || 'Our Church'}`}
        </div>
        <div style={{ fontSize: 13, color: '#7a8fa8' }}>
          {settings.tagline || 'Register to join our workforce'}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: step >= s ? 'linear-gradient(135deg, #8a6a20, #c9a84c)' : '#0d1424',
                border: `1.5px solid ${step >= s ? 'rgba(201,168,76,0.5)' : '#1e2d45'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: step >= s ? '#06090f' : '#4a6080',
                boxShadow: step >= s ? '0 2px 12px rgba(201,168,76,0.25)' : 'none',
                transition: 'all .2s',
              }}>{s}</div>
              {s < 2 && (
                <div style={{
                  width: 44, height: 2,
                  background: step > s
                    ? 'linear-gradient(90deg, #c9a84c, #e2c06c)'
                    : '#1e2d45',
                  borderRadius: 2,
                  transition: 'background .2s',
                }}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div style={{
        background: 'rgba(13,20,36,0.80)',
        border: '1px solid #1e2d45',
        borderRadius: 20,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e2d45' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.01em' }}>
            {step === 1 ? 'Personal details' : 'Get involved'}
          </div>
          <div style={{ fontSize: 11.5, color: '#4a6080', marginTop: 2 }}>
            Step {step} of 2
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {signupErr && (
            <div style={{
              padding: '10px 13px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
              display: 'flex', gap: 9, alignItems: 'flex-start',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div style={{ fontSize: 12.5, color: '#fca5a5', lineHeight: 1.55 }}>{signupErr}</div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={next} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelSt}>Full name *</label>
                <input style={inputSt} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name" maxLength={80} required autoFocus
                  onFocus={e => { e.target.style.borderColor='rgba(201,168,76,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='#1e2d45'; e.target.style.boxShadow='none' }}
                />
              </div>
              <div>
                <label style={labelSt}>Phone number *</label>
                <input style={inputSt} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+234 800 000 0000" maxLength={20} required
                  onFocus={e => { e.target.style.borderColor='rgba(201,168,76,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='#1e2d45'; e.target.style.boxShadow='none' }}
                />
              </div>
              <div>
                <label style={labelSt}>Email address <span style={{ opacity: 0.5, fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input style={inputSt} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="for login access"
                  onFocus={e => { e.target.style.borderColor='rgba(201,168,76,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='#1e2d45'; e.target.style.boxShadow='none' }}
                />
              </div>
              <div>
                <label style={labelSt}>Date of birth <span style={{ opacity: 0.5, fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input style={{ ...inputSt, colorScheme: 'dark' }} type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor='rgba(201,168,76,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='#1e2d45'; e.target.style.boxShadow='none' }}
                />
              </div>
              {branches.length > 0 && (
                <div>
                  <label style={labelSt}>Campus / Branch *</label>
                  <select
                    style={{
                      ...inputSt,
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%234a6080' stroke-width='1.5' d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '16px',
                      paddingRight: 30,
                      cursor: 'pointer',
                    }}
                    value={form.branch}
                    onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                    required
                    onFocus={e => { e.target.style.borderColor='rgba(201,168,76,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.12)' }}
                    onBlur={e => { e.target.style.borderColor='#1e2d45'; e.target.style.boxShadow='none' }}
                  >
                    <option value="">Select your campus</option>
                    {branches.map(b => <option key={b.branch_key} value={b.branch_key}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" style={{
                width: '100%', height: 46, marginTop: 4,
                background: 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                border: '1px solid rgba(201,168,76,0.40)',
                borderRadius: 10, color: '#06090f',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(201,168,76,0.25)',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                Continue
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </form>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelSt}>Are you a first-time visitor?</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {([['yes', 'Yes, first time! 🙋'], ['no', 'Visited before']] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, firstTimer: v }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 10,
                        background: form.firstTimer === v ? 'rgba(201,168,76,0.10)' : '#0d1424',
                        border: `1.5px solid ${form.firstTimer === v ? 'rgba(201,168,76,0.40)' : '#1e2d45'}`,
                        color: form.firstTimer === v ? '#c9a84c' : '#7a8fa8',
                        fontSize: 12.5, fontWeight: form.firstTimer === v ? 700 : 400,
                        cursor: 'pointer', transition: 'all .15s',
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {departments.length > 0 && (
                <div>
                  <label style={labelSt}>Which department interests you?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {departments.map(d => (
                      <button key={d.dept_key} type="button" onClick={() => setForm(f => ({ ...f, dept: d.dept_key }))}
                        style={{
                          padding: '10px 12px', borderRadius: 10,
                          border: `1.5px solid ${form.dept === d.dept_key ? 'rgba(201,168,76,0.35)' : '#1e2d45'}`,
                          background: form.dept === d.dept_key ? 'rgba(201,168,76,0.08)' : '#0d1424',
                          cursor: 'pointer', textAlign: 'left', transition: 'all .12s',
                          display: 'flex', gap: 8, alignItems: 'center',
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}>
                        <span style={{ fontSize: 16 }}>{d.icon}</span>
                        <span style={{
                          fontSize: 12, lineHeight: 1.3,
                          color: form.dept === d.dept_key ? '#c9a84c' : '#7a8fa8',
                          fontWeight: form.dept === d.dept_key ? 600 : 400,
                        }}>{d.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{
                    padding: '10px 16px', borderRadius: 10,
                    background: '#0d1424', border: '1px solid #1e2d45',
                    color: '#7a8fa8', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
                <button type="submit" disabled={busy}
                  style={{
                    flex: 1, height: 44,
                    background: busy ? 'rgba(201,168,76,0.25)' : 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
                    border: `1px solid ${busy ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.40)'}`,
                    borderRadius: 10,
                    color: busy ? 'rgba(201,168,76,0.5)' : '#06090f',
                    fontSize: 14, fontWeight: 700,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: busy ? 'none' : '0 4px 20px rgba(201,168,76,0.25)',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: 'all .15s',
                  }}>
                  {busy ? (
                    <>
                      <svg style={{ animation: 'spin .75s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Registering…
                    </>
                  ) : (
                    <>
                      Complete registration 🙌
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#4a6080', marginTop: '1.25rem' }}>
        Already registered?{' '}
        <Link href="/login" style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill, select:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0d1424 inset !important;
          -webkit-text-fill-color: #e8edf5 !important;
        }
        select option { background: #0d1424; color: #e8edf5; }
      `}</style>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#06090f',
      padding: '1.5rem',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}/>
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,130,246,0.04) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}/>
      </div>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Suspense fallback={<div style={{ color: '#7a8fa8', textAlign: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Loading…</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
