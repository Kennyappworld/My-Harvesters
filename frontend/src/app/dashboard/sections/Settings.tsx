'use client'
import { useSession } from '@/lib/useSession'
import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useOrgSettings, saveOrgSettings, OrgSettings } from '@/lib/orgSettings'
import { useBranches, useDepartments, BRANCH_COLOR_PALETTE, DEPT_COLOR_PALETTE, ROLE_LABELS, ROLE_COLORS } from '@/lib/data'
import { notify } from '@/lib/toast'
import { QRCodeSVG } from 'qrcode.react'
import { usePasskey } from '@/hooks/usePasskey'

// ── Supabase client ───────────────────────────────────────────────────────────
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  ) : null

// ── QR Code Widget ────────────────────────────────────────────────────────────
function QRCodeWidget({ value, size = 160 }: { value: string; size?: number }) {
  return (
    <div style={{ background: 'white', padding: 12, borderRadius: 12, display: 'inline-block', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
      <QRCodeSVG value={value} size={size} fgColor="#1a1040" bgColor="#ffffff" level="M" />
    </div>
  )
}

// ── Profile Editor ────────────────────────────────────────────────────────────
function ProfileEditor() {
  const { user, refresh } = useSession()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', dept: user?.department || '', marital_status: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwErr, setPwErr] = useState('')
  const [pwDone, setPwDone] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { departments } = useDepartments()

  useEffect(() => {
    if (!supabase || !user?.id) return
    supabase.from('workers').select('phone,marital_status,department').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setForm(f => ({
          ...f,
          phone: (data as any).phone || '',
          marital_status: (data as any).marital_status || '',
          dept: (data as any).department || f.dept,
        }))
      })
  }, [user?.id])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (supabase && user?.id) {
      const { error } = await supabase.from('workers').update({
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        department: form.dept,
        marital_status: form.marital_status || null,
      }).eq('id', user.id)
      if (error) { notify.error('Failed to save profile: ' + error.message); setSaving(false); return }
    }
    setSaving(false); setSaved(true)
    refresh?.()
    setTimeout(() => setSaved(false), 2500)
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwErr('')
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match'); return }
    if (pwForm.next.length < 8) { setPwErr('Minimum 8 characters required'); return }
    if (!/[A-Z]/.test(pwForm.next)) { setPwErr('Must include at least one uppercase letter'); return }
    if (!/[0-9]/.test(pwForm.next)) { setPwErr('Must include at least one number'); return }
    setPwSaving(true)
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) { setPwErr(error.message); setPwSaving(false); return }
      try {
        await supabase.from('workers').update({ must_change_password: false }).eq('id', user?.id || '')
      } catch {}
    }
    setPwSaving(false); setPwDone(true); setPwForm({ next: '', confirm: '' })
    setTimeout(() => setPwDone(false), 3000)
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>My Profile</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        <div className="card card-p">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Personal details</div>
          {saved && <div style={{ padding: '8px 12px', background: 'var(--green-lt)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--green)', marginBottom: 12, fontWeight: 600 }}>✓ Profile updated</div>}
          <form onSubmit={saveProfile}>
            {([['Full name', 'name', 'text'], ['Phone', 'phone', 'tel']] as const).map(([l, k, t]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>{l}</label>
                <input className="input" type={t} value={(form as any)[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={k === 'phone' ? '+1 234 567 8900' : undefined} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Marital status</label>
              <select className="input" value={form.marital_status} onChange={e => setForm(f => ({ ...f, marital_status: e.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Department</label>
              <select className="input" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.dept_key} value={d.dept_key}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-brand btn-sm" style={{ justifyContent: 'center', width: '100%' }} disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </div>
        <div className="card card-p">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Change password</div>
          {pwErr && <div style={{ padding: '8px 12px', background: 'var(--red-lt)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{pwErr}</div>}
          {pwDone && <div style={{ padding: '8px 12px', background: 'var(--green-lt)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--green)', marginBottom: 12, fontWeight: 600 }}>✓ Password changed successfully</div>}
          <form onSubmit={changePassword}>
            {([['New password', 'next'], ['Confirm password', 'confirm']] as const).map(([l, k]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>{l}</label>
                <input className="input" type={showPw ? 'text' : 'password'}
                  value={(pwForm as any)[k]}
                  onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))}
                  minLength={8} required placeholder="Min 8 chars, 1 uppercase, 1 number" />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t-3)', marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} />
              Show passwords
            </label>
            <div style={{ marginBottom: 14, fontSize: 11.5, color: 'var(--t-3)' }}>Minimum 8 characters · 1 uppercase · 1 number</div>
            <button type="submit" className="btn btn-brand btn-sm" style={{ justifyContent: 'center', width: '100%' }} disabled={pwSaving}>
              {pwSaving ? 'Updating…' : 'Change password'}
            </button>
          </form>
        </div>

        {/* ── Biometric / Passkey card ── */}
        <PasskeyCard />
      </div>
    </div>
  )
}

function PasskeyCard() {
  const passkey = usePasskey()
  const [biometricOk, setBiometricOk]     = useState(false)
  const [passkeys,    setPasskeys]         = useState<any[]>([])
  const [deviceName,  setDeviceName]       = useState('My Device')
  const [registering, setRegistering]      = useState(false)
  const [msg,         setMsg]              = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [loadingList, setLoadingList]      = useState(true)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (passkey.isSupported) {
      passkey.checkBiometricAvailable().then(setBiometricOk)
    }
    loadPasskeys()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPasskeys() {
    setLoadingList(true)
    const { data } = await supabase
      .from('passkey_credentials')
      .select('id, device_name, created_at, last_used_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setPasskeys(data ?? [])
    setLoadingList(false)
  }

  async function handleRegister() {
    setRegistering(true)
    setMsg(null)
    const ok = await passkey.registerPasskey(deviceName || 'My Device')
    if (ok) {
      setMsg({ type: 'ok', text: 'Passkey registered! You can now sign in with your fingerprint or Face ID.' })
      setDeviceName('My Device')
      loadPasskeys()
    } else if (passkey.error) {
      setMsg({ type: 'err', text: passkey.error })
    }
    setRegistering(false)
  }

  async function handleRevoke(id: string) {
    await supabase
      .from('passkey_credentials')
      .update({ is_active: false })
      .eq('id', id)
    loadPasskeys()
    notify.success('Passkey removed.')
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  if (!biometricOk && !loadingList && passkeys.length === 0) {
    return (
      <div className="card card-p">
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Biometric Login</div>
        <p style={{ fontSize: 12, color: 'var(--t-3)', margin: 0 }}>
          Your device or browser does not support passkeys / biometric login yet.
          This feature works on modern Android, iPhone, Windows Hello and Mac Touch ID.
        </p>
      </div>
    )
  }

  return (
    <div className="card card-p">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {/* Fingerprint icon */}
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" width="18" height="18">
          <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
          <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
          <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
          <path d="M2 12a10 10 0 0 1 18-6"/>
          <path d="M2 17c1 0 1.5-.5 1.5-1.5S2 14 2 13a10 10 0 0 1 3.17-7.26"/>
          <path d="M20 12c0 5-2.5 8.5-5 10"/>
          <path d="M7 14c0 4.74.5 8 2.5 9.5"/>
          <path d="M12 6a6 6 0 0 1 6 6c0 .55-.07 1.29-.2 2"/>
        </svg>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Biometric Login (Passkeys)</span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--t-3)', marginBottom: 14, lineHeight: 1.6 }}>
        Register your fingerprint or Face ID to sign in without typing your password.
        Works on your phone, laptop, or any device with biometrics.
      </p>

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--r)', fontSize: 12, marginBottom: 12,
          background: msg.type === 'ok' ? 'var(--green-lt)' : 'var(--red-lt)',
          color: msg.type === 'ok' ? 'var(--green)' : 'var(--red)',
          fontWeight: 600,
        }}>
          {msg.type === 'ok' ? '✓ ' : '⚠ '}{msg.text}
        </div>
      )}

      {/* Register new passkey */}
      {biometricOk && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>
              Device name (e.g. "My iPhone")
            </label>
            <input
              className="input"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              placeholder="My Device"
              maxLength={40}
            />
          </div>
          <button
            className="btn btn-brand btn-sm"
            onClick={handleRegister}
            disabled={registering || passkey.loading}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {registering ? 'Registering…' : '+ Add passkey'}
          </button>
        </div>
      )}

      {/* Existing passkeys list */}
      {loadingList ? (
        <div style={{ fontSize: 12, color: 'var(--t-3)' }}>Loading…</div>
      ) : passkeys.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--t-3)' }}>No passkeys registered yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
            Registered devices
          </div>
          {passkeys.map(pk => (
            <div key={pk.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px',
              background: 'var(--bg-2)',
              borderRadius: 'var(--r)',
              border: '1px solid var(--border)',
              gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t-1)' }}>{pk.device_name || 'Device'}</div>
                <div style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 2 }}>
                  Added {fmt(pk.created_at)}
                  {pk.last_used_at && ` · Last used ${fmt(pk.last_used_at)}`}
                </div>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => handleRevoke(pk.id)}
                style={{ background: 'var(--red-lt)', color: 'var(--red)', border: 'none', flexShrink: 0 }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Organisation Settings ─────────────────────────────────────────────────────
function OrgSettingsPanel() {
  const { settings, loading } = useOrgSettings()
  const { user } = useSession()
  const [form, setForm] = useState<Partial<OrgSettings>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) {
      setForm({
        name: settings.name,
        tagline: settings.tagline,
        address: settings.address,
        city: settings.city,
        country: settings.country,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        primaryColor: settings.primaryColor,
        accentColor: settings.accentColor,
        appName: settings.appName,
        poweredByText: settings.poweredByText,
        poweredByUrl: settings.poweredByUrl,
        poweredByVisible: settings.poweredByVisible,
        allowSelfReg: settings.allowSelfReg,
        requireApproval: settings.requireApproval,
        followupStages: settings.followupStages,
        timezone: settings.timezone,
        currency: settings.currency,
      })
      setLogoPreview(settings.logoUrl || '')
    }
  }, [loading, settings])

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { notify.error('Logo must be under 2MB'); return }

    // Upload to Supabase Storage if available
    if (supabase && settings.id) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `org-logos/${settings.slug || 'default'}/logo.${ext}`
      const { data, error } = await supabase.storage.from('public').upload(path, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('public').getPublicUrl(path)
        const url = urlData?.publicUrl || ''
        setLogoPreview(url)
        setForm(f => ({ ...f, logoUrl: url }))
        return
      }
    }

    // Fallback: base64 preview
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setLogoPreview(url)
      setForm(f => ({ ...f, logoUrl: url }))
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    const result = await saveOrgSettings(settings.id, form)
    if (!result.ok) {
      notify.error('Failed to save: ' + (result.error || 'Unknown error'))
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  const toggle = (key: keyof OrgSettings) => setForm(f => ({ ...f, [key]: !(f as any)[key] }))

  if (loading) return <div style={{ padding: 24, color: 'var(--t-3)', fontSize: 13 }}>Loading organisation settings…</div>

  return (
    <div style={{ maxWidth: 580 }}>
      {saved && (
        <div style={{ background: 'var(--green-lt)', border: '1px solid rgba(27,158,90,0.3)', borderRadius: 'var(--r)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12" /></svg>
          Organisation settings saved
        </div>
      )}

      {/* ── Church Identity ── */}
      <div className="card card-p" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Church identity</h3>
        <p style={{ fontSize: 12.5, color: 'var(--t-2)', marginBottom: 16 }}>This information appears throughout the platform and is visible to all workers.</p>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, border: '2px dashed var(--border-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s-3)', overflow: 'hidden', flexShrink: 0 }}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 14 }} />
              : <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-3)" strokeWidth="1.5" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            }
          </div>
          <div>
            <button className="btn btn-sm" onClick={() => logoRef.current?.click()} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Upload church logo
            </button>
            {logoPreview && <button className="btn btn-sm btn-danger" onClick={() => { setLogoPreview(''); setForm(f => ({ ...f, logoUrl: '' })) }} style={{ fontSize: 11 }}>Remove</button>}
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <p style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 6 }}>PNG, JPG, SVG · max 2MB · square recommended</p>
          </div>
        </div>

        {[
          ['Church name', 'name', 'text', 'e.g. Grace Community Church'],
          ['Tagline / motto', 'tagline', 'text', 'e.g. Transforming Lives, One Soul at a Time'],
          ['Address', 'address', 'text', 'Street address'],
          ['City', 'city', 'text', 'City'],
          ['Country (2-letter code)', 'country', 'text', 'NG'],
          ['Contact phone', 'phone', 'tel', '+1 234 567 8900'],
          ['Contact email', 'email', 'email', 'info@church.org'],
          ['Website', 'website', 'url', 'https://church.org'],
        ].map(([label, key, type, placeholder]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>{label}</label>
            <input className="input" type={type as string} value={(form as any)[key] || ''}
              onChange={e => setForm(f => ({ ...f, [key as string]: e.target.value }))}
              placeholder={placeholder as string} />
          </div>
        ))}
      </div>

      {/* ── App name ── */}
      <div className="card card-p" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Platform name</h3>
        <p style={{ fontSize: 12.5, color: 'var(--t-2)', marginBottom: 12 }}>Choose the branded name displayed across the platform.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
          {['SanctuaryHQ', 'SanctuaryHQ', 'PulpitPro'].map(n => (
            <button key={n} onClick={() => setForm(f => ({ ...f, appName: n }))}
              style={{
                padding: '14px 10px', borderRadius: 'var(--r)', border: `2px solid ${form.appName === n ? 'var(--brand)' : 'var(--border)'}`,
                background: form.appName === n ? 'var(--green-lt)' : 'var(--s-3)',
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
                color: form.appName === n ? 'var(--brand)' : 'var(--t-2)',
                transition: 'all .15s',
              }}>
              {n}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--t-3)' }}>Or enter a custom name:</p>
        <input className="input" style={{ marginTop: 8 }} value={form.appName || ''} onChange={e => setForm(f => ({ ...f, appName: e.target.value }))} placeholder="Custom name…" />
      </div>

      {/* ── Branding colours ── */}
      <div className="card card-p" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Brand colours</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Primary colour', 'primaryColor'], ['Accent colour', 'accentColor']].map(([l, k]) => (
            <div key={k}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 6 }}>{l}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="color" value={(form as any)[k] || '#1B4332'} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                <input className="input" value={(form as any)[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }} placeholder="#1B4332" maxLength={7} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Region ── */}
      <div className="card card-p" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Region & localisation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Timezone</label>
            <select className="input" value={form.timezone || 'Africa/Lagos'} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
              {['Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Currency</label>
            <select className="input" value={form.currency || 'NGN'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {[['NGN', '₦ Nigerian Naira'], ['USD', '$ US Dollar'], ['GBP', '£ British Pound'], ['EUR', '€ Euro'], ['GHS', '₵ Ghanaian Cedi'], ['KES', 'KSh Kenyan Shilling'], ['ZAR', 'R South African Rand'], ['CAD', 'C$ Canadian Dollar'], ['AUD', 'A$ Australian Dollar']].map(([c, l]) => (
                <option key={c} value={c}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Registration ── */}
      <div className="card card-p" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Registration settings</h3>
        {[
          { label: 'Allow self-registration via QR code', note: 'Members can sign up by scanning branch QR codes', key: 'allowSelfReg' as const },
          { label: 'Require admin approval for new accounts', note: 'New registrations stay pending until approved', key: 'requireApproval' as const },
        ].map(s => (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-1)' }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>{s.note}</div>
            </div>
            <button onClick={() => toggle(s.key)} style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: form[s.key] ? 'var(--brand)' : 'var(--s-4)', transition: 'background .2s', position: 'relative', flexShrink: 0, marginLeft: 16 }}>
              <span style={{ position: 'absolute', top: 2, left: form[s.key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Powered-by ── */}
      <div className="card card-p" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Platform attribution</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--t-1)' }}>Show powered-by line</span>
          <button onClick={() => toggle('poweredByVisible')} style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: form.poweredByVisible ? 'var(--brand)' : 'var(--s-4)', transition: 'background .2s', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 2, left: form.poweredByVisible ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
          </button>
        </div>
        {form.poweredByVisible && (
          <>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Attribution text</label>
            <input className="input" value={form.poweredByText || ''} onChange={e => setForm(f => ({ ...f, poweredByText: e.target.value }))} style={{ marginBottom: 10 }} />
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Link URL</label>
            <input className="input" type="url" value={form.poweredByUrl || ''} onChange={e => setForm(f => ({ ...f, poweredByUrl: e.target.value }))} />
          </>
        )}
      </div>

      <button className="btn btn-brand" onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, fontWeight: 700 }}>
        {saving ? 'Saving…' : '✓ Save organisation settings'}
      </button>
    </div>
  )
}

// ── Branch Manager ─────────────────────────────────────────────────────────────
function BranchManager() {
  const { settings } = useOrgSettings()
  const { branches, loading } = useBranches()
  const [list, setList] = useState(branches)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', short_name: '', location: '', country: 'NG', type: 'branch', pastor_name: '', phone: '', email: '', color: '#1B4332', founded_year: new Date().getFullYear() })
  const [saving, setSaving] = useState(false)
  const { user } = useSession()

  useEffect(() => { setList(branches) }, [branches])

  const resetForm = () => setForm({ name: '', short_name: '', location: '', country: 'NG', type: 'branch', pastor_name: '', phone: '', email: '', color: '#1B4332', founded_year: new Date().getFullYear() })

  const addBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const branch_key = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (supabase && settings.id) {
      const { data, error } = await supabase.from('branches').insert({
        org_id: settings.id, branch_key, name: form.name.trim(),
        short_name: form.short_name.trim() || form.name.split(' ')[0],
        location: form.location, country: form.country, type: form.type,
        pastor_name: form.pastor_name, phone: form.phone, email: form.email,
        color: form.color, founded_year: form.founded_year, is_active: true, sort_order: list.length,
      }).select().single()
      if (error) { notify.error('Failed to add branch: ' + error.message); setSaving(false); return }
      if (data) setList(prev => [...prev, data as any])
    } else {
      setList(prev => [...prev, { id: `tmp-${Date.now()}`, branch_key, ...form, is_active: true, sort_order: prev.length } as any])
    }
    resetForm(); setShowAdd(false); setSaving(false)
    notify.success?.('Branch added')
  }

  const deleteBranch = async (id: string) => {
    if (!['developer', 'senior_pastor'].includes(user?.role || '')) {
      notify.error('Only the Super Admin can delete a branch.')
      setDeleteConfirm(null); return
    }
    if (supabase) await supabase.from('branches').delete().eq('id', id)
    setList(prev => prev.filter(b => b.id !== id))
    setDeleteConfirm(null)
    notify.success?.('Branch deleted')
  }

  if (loading) return <div style={{ padding: 24, color: 'var(--t-3)', fontSize: 13 }}>Loading branches…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Branches & Campuses</div>
          <div style={{ fontSize: 12, color: 'var(--t-3)' }}>{list.length} location{list.length !== 1 ? 's' : ''} registered</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add branch
        </button>
      </div>

      {showAdd && (
        <div className="card card-p" style={{ marginBottom: 16, border: '1.5px solid var(--brand)' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: 'var(--brand)' }}>New branch / campus</div>
          <form onSubmit={addBranch}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
              {[
                ['Branch name *', 'name', 'text', 'e.g. Downtown Campus'],
                ['Short name', 'short_name', 'text', 'e.g. Downtown'],
                ['Location / Address', 'location', 'text', 'City, State'],
                ['Country (2-letter)', 'country', 'text', 'NG'],
                ['Lead Pastor name', 'pastor_name', 'text', 'Pastor John Smith'],
                ['Contact phone', 'phone', 'tel', '+234 800 000 0000'],
                ['Contact email', 'email', 'email', 'branch@church.org'],
                ['Founded year', 'founded_year', 'number', new Date().getFullYear().toString()],
              ].map(([label, key, type, placeholder]) => (
                <div key={key}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input className="input" type={type as string} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key as string]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    placeholder={placeholder as string} required={key === 'name'} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {[['hq', 'Headquarters'], ['branch', 'Branch'], ['satellite', 'Satellite'], ['international', 'International'], ['online', 'Online']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Branch colour</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', padding: 2, cursor: 'pointer' }} />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {BRANCH_COLOR_PALETTE.slice(0, 8).map(c => (
                      <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer', border: form.color === c ? '2px solid white' : '1px solid transparent', boxShadow: form.color === c ? '0 0 0 2px var(--brand)' : 'none' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="submit" className="btn btn-brand btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Add branch'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowAdd(false); resetForm() }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((b, i) => (
          <div key={b.id} className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 36, borderRadius: 5, background: b.color || '#1B4332', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--t-3)' }}>
                {[b.location, b.country, b.type !== 'branch' ? b.type.charAt(0).toUpperCase() + b.type.slice(1) : ''].filter(Boolean).join(' · ')}
                {b.pastor_name ? ` · ${b.pastor_name}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {deleteConfirm === b.id ? (
                <>
                  <span style={{ fontSize: 11.5, color: 'var(--red)', fontWeight: 600 }}>Delete?</span>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteBranch(b.id)}>Yes</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(null)}>No</button>
                </>
              ) : (
                <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(b.id)} style={{ color: 'var(--red)', fontSize: 11 }}>Delete</button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ textAlign: 'center', color: 'var(--t-3)', fontSize: 13, padding: 24 }}>No branches yet. Add your first location above.</div>}
      </div>
    </div>
  )
}

// ── Department Manager ─────────────────────────────────────────────────────────
function DepartmentManager() {
  const { settings } = useOrgSettings()
  const { departments, loading } = useDepartments()
  const [list, setList] = useState(departments)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', dept_key: '', icon: '📋', color: '#1B4332', head_name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { setList(departments) }, [departments])

  const ICONS = ['📋', '🚪', '🎵', '📷', '🧒', '🤝', '❤️', '📢', '🙏', '🛡️', '🎭', '💻', '🌟', '✝', '🎤', '🏫', '🎸', '⛪', '🎺', '🎪']

  const addDept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const dept_key = form.dept_key.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (supabase && settings.id) {
      const { data, error } = await supabase.from('departments').insert({
        org_id: settings.id, dept_key, name: form.name.trim(),
        icon: form.icon, color: form.color, head_name: form.head_name, is_active: true, sort_order: list.length,
      }).select().single()
      if (error) { notify.error('Failed to add department: ' + error.message); setSaving(false); return }
      if (data) setList(prev => [...prev, data as any])
    } else {
      setList(prev => [...prev, { id: `tmp-${Date.now()}`, dept_key, ...form, is_active: true } as any])
    }
    setForm({ name: '', dept_key: '', icon: '📋', color: '#1B4332', head_name: '' })
    setShowAdd(false); setSaving(false)
    notify.success?.('Department added')
  }

  const deleteDept = async (id: string) => {
    if (supabase) await supabase.from('departments').delete().eq('id', id)
    setList(prev => prev.filter(d => d.id !== id))
    setDeleteConfirm(null)
    notify.success?.('Department deleted')
  }

  if (loading) return <div style={{ padding: 24, color: 'var(--t-3)', fontSize: 13 }}>Loading departments…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Departments & Units</div>
          <div style={{ fontSize: 12, color: 'var(--t-3)' }}>{list.length} unit{list.length !== 1 ? 's' : ''} defined</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add department
        </button>
      </div>

      {showAdd && (
        <div className="card card-p" style={{ marginBottom: 16, border: '1.5px solid var(--brand)' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: 'var(--brand)' }}>New department</div>
          <form onSubmit={addDept}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Department name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Worship & Music" required />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Head / Leader name</label>
                <input className="input" value={form.head_name} onChange={e => setForm(f => ({ ...f, head_name: e.target.value }))} placeholder="Minister John Smith" />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Icon</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      style={{ width: 32, height: 32, borderRadius: 6, border: `2px solid ${form.icon === ic ? 'var(--brand)' : 'var(--border)'}`, background: form.icon === ic ? 'var(--green-lt)' : 'var(--s-3)', cursor: 'pointer', fontSize: 16 }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Colour</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', padding: 2, cursor: 'pointer' }} />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {DEPT_COLOR_PALETTE.slice(0, 8).map(c => (
                      <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer', border: form.color === c ? '2px solid white' : '1px solid transparent', boxShadow: form.color === c ? '0 0 0 2px var(--brand)' : 'none' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="submit" className="btn btn-brand btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Add department'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
        {list.map(d => (
          <div key={d.id} className="card card-p" style={{ borderLeft: `4px solid ${d.color || '#1B4332'}`, position: 'relative' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{d.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{d.name}</div>
            {d.head_name && <div style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{d.head_name}</div>}
            {deleteConfirm === d.id ? (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-danger" onClick={() => deleteDept(d.id)} style={{ fontSize: 11 }}>Delete</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(null)} style={{ fontSize: 11 }}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(d.id)}
                style={{ position: 'absolute', top: 8, right: 8, color: 'var(--t-3)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--t-3)', fontSize: 13, padding: 24 }}>No departments yet. Add your first unit above.</div>}
      </div>
    </div>
  )
}

// ── QR Generator ─────────────────────────────────────────────────────────────
function QRGenerator() {
  const { settings } = useOrgSettings()
  const { branches } = useBranches()
  const { departments } = useDepartments()
  const [qrBranch, setQrBranch] = useState('')
  const [qrDept, setQrDept] = useState('')
  const [qrMode, setQrMode] = useState<'branch' | 'dept' | 'combined'>('branch')

  const BASE = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/signup`
    : '/signup'

  const qrUrl = qrMode === 'branch' ? `${BASE}?branch=${qrBranch}`
    : qrMode === 'dept'   ? `${BASE}?dept=${qrDept}`
    : `${BASE}?branch=${qrBranch}&dept=${qrDept}`

  const selectedBranch = branches.find(b => b.branch_key === qrBranch)
  const selectedDept   = departments.find(d => d.dept_key === qrDept)

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>QR Signup Codes</div>
      <div className="card card-p" style={{ marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>Generate QR code</h3>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>QR code type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['branch', 'By branch'], ['dept', 'By department'], ['combined', 'Branch + Dept']].map(([v, l]) => (
              <button key={v} onClick={() => setQrMode(v as any)} style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--r)', border: `1.5px solid ${qrMode === v ? 'var(--brand)' : 'var(--border)'}`, background: qrMode === v ? 'var(--green-lt)' : 'var(--s-3)', cursor: 'pointer', fontSize: 12, fontWeight: qrMode === v ? 700 : 400, color: qrMode === v ? 'var(--brand)' : 'var(--t-2)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {(qrMode === 'branch' || qrMode === 'combined') && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Select branch</label>
            <select className="input" value={qrBranch} onChange={e => setQrBranch(e.target.value)}>
              <option value="">— All branches —</option>
              {branches.map(b => <option key={b.branch_key} value={b.branch_key}>{b.name}</option>)}
            </select>
          </div>
        )}
        {(qrMode === 'dept' || qrMode === 'combined') && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 5 }}>Select department</label>
            <select className="input" value={qrDept} onChange={e => setQrDept(e.target.value)}>
              <option value="">— All departments —</option>
              {departments.map(d => <option key={d.dept_key} value={d.dept_key}>{d.icon} {d.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="card card-p" style={{ textAlign: 'center' }}>
        <QRCodeWidget value={qrUrl} size={200} />
        <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--t-1)' }}>
          {settings.name}
          {selectedBranch && ` · ${selectedBranch.name}`}
          {selectedDept && ` · ${selectedDept.name}`}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 4, wordBreak: 'break-all' }}>{qrUrl}</p>
        <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(qrUrl)} style={{ marginTop: 10 }}>Copy link</button>
      </div>
    </div>
  )
}

// ── User Manager ──────────────────────────────────────────────────────────────
function UserManager() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [credModal, setCredModal] = useState<{ user: any; tempPass: string } | null>(null)
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'worker', branch_key: '', dept: '' })
  const { user: currentUser } = useSession()
  const { branches } = useBranches()
  const { departments } = useDepartments()

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('workers')
        .select('id,email,full_name,role,branch_id,department,status,created_at,last_seen,phone,must_change_password')
        .order('created_at', { ascending: false })
        .limit(500)
      if (data) setUsers(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const genTempPass = () => {
    const words = ['Grace', 'Faith', 'Hope', 'Light', 'Peace', 'Love', 'Joy', 'Worthy']
    const num = Math.floor(Math.random() * 900) + 100
    return words[Math.floor(Math.random() * words.length)] + num + '!'
  }

  const approveUser = async (u: any) => {
    const tempPass = genTempPass()
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: 'active' } : x))
    if (supabase) {
      await supabase.from('workers').update({ status: 'active' }).eq('id', u.id)
      if (u.email) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          await fetch('/api/create-worker-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
            body: JSON.stringify({ email: u.email, password: tempPass, name: u.full_name, branch_key: u.branch_key, dept: u.department }),
          })
        } catch {}
      }
    }
    setCredModal({ user: u, tempPass })
  }

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id))
    setDeleteConfirm(null)
    if (supabase) await supabase.from('workers').update({ status: 'deleted' }).eq('id', id)
  }

  const resetPassword = async (u: any) => {
    const tempPass = genTempPass()
    setResetConfirm(null)
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/create-worker-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ email: u.email, password: tempPass, name: u.full_name, branch_key: u.branch_id, dept: u.department, resetOnly: true }),
        })
      } catch {}
    }
    setCredModal({ user: u, tempPass })
  }

  const filtered = users.filter(u => {
    const matchRole = filter === 'all' || filter === 'pending' ? (filter === 'pending' ? u.status === 'pending' : true) : u.role === filter
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div>
      {credModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card card-p" style={{ maxWidth: 420, width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Login credentials ✓</div>
            <p style={{ fontSize: 13, color: 'var(--t-2)', marginBottom: 14 }}>Share these credentials with <strong>{credModal.user.full_name}</strong> via WhatsApp or email.</p>
            <div style={{ background: 'var(--s-3)', borderRadius: 'var(--r)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 2, marginBottom: 14 }}>
              <div><strong>Email:</strong> {credModal.user.email}</div>
              <div><strong>Password:</strong> {credModal.tempPass}</div>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--t-3)', marginBottom: 14 }}>They will be prompted to change their password on first login.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => {
                const text = `Welcome to ${currentUser?.name || 'the team'}!\n\nYour login:\nEmail: ${credModal.user.email}\nPassword: ${credModal.tempPass}\n\nPlease change your password after logging in.`
                navigator.clipboard?.writeText(text)
              }} style={{ flex: 1 }}>Copy credentials</button>
              <button className="btn btn-brand btn-sm" onClick={() => setCredModal(null)} style={{ flex: 1 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Workers & Accounts</div>
          <div style={{ fontSize: 12, color: 'var(--t-3)' }}>{users.length} total · {users.filter(u => u.status === 'pending').length} pending</div>
        </div>
        <button className="btn btn-brand btn-sm" onClick={() => setShowAdd(true)}>+ Invite worker</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ width: 150 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All roles</option>
          <option value="pending">Pending</option>
          <option value="developer">Developer</option>
          <option value="senior_pastor">Senior Pastor</option>
          <option value="pastor">Pastor</option>
          <option value="admin">Admin</option>
          <option value="unit_head">Unit Head</option>
          <option value="worker">Worker</option>
        </select>
      </div>

      {showAdd && (
        <div className="card card-p" style={{ marginBottom: 14, border: '1.5px solid var(--brand)' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--brand)' }}>Invite new worker</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            {[['Full name', 'name', 'text'], ['Email address', 'email', 'email'], ['Phone number *', 'phone', 'tel']].map(([l, k, t]) => (
              <div key={k}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>{l}</label>
                <input className="input" type={t} placeholder={k === 'phone' ? '+234 800 000 0000' : undefined} value={(userForm as any)[k]} onChange={e => setUserForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Role</label>
              <select className="input" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                <option value="worker">Worker</option>
                <option value="unit_head">Unit Head</option>
                <option value="admin">Admin</option>
                <option value="pastor">Branch Pastor</option>
                {currentUser?.role === 'developer' && <option value="senior_pastor">Senior Pastor</option>}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Branch</label>
              <select className="input" value={userForm.branch_key} onChange={e => setUserForm(f => ({ ...f, branch_key: e.target.value }))}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.branch_key} value={b.branch_key}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t-2)', display: 'block', marginBottom: 4 }}>Department</label>
              <select className="input" value={userForm.dept} onChange={e => setUserForm(f => ({ ...f, dept: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.dept_key} value={d.dept_key}>{d.icon} {d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-brand btn-sm" onClick={async () => {
              if (!userForm.name || !userForm.email) return notify.error('Name and email are required.')
              if (!userForm.phone) return notify.error('Phone number is required.')
              const phoneClean = userForm.phone.replace(/[\s\-\(\)]/g, '')
              if (!/^[\+]?[0-9]{7,15}$/.test(phoneClean)) return notify.error('Please enter a valid phone number.')
              const tempPass = genTempPass()
              if (supabase) {
                const { data: { session } } = await supabase.auth.getSession()
                const res = await fetch('/api/create-worker-account', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
                  body: JSON.stringify({ email: userForm.email, password: tempPass, name: userForm.name, phone: userForm.phone, branch_key: userForm.branch_key, dept: userForm.dept, role: userForm.role }),
                })
                if (res.ok) {
                  setCredModal({ user: { email: userForm.email, full_name: userForm.name }, tempPass })
                  setUserForm({ name: '', email: '', phone: '', role: 'worker', branch_key: '', dept: '' })
                  setShowAdd(false)
                  load()
                } else {
                  const err = await res.json()
                  notify.error(err.error || 'Failed to create account')
                }
              }
            }}>Create account</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--t-3)', fontSize: 13 }}>Loading workers…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(u => (
            <div key={u.id} className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${ROLE_COLORS[u.role] || '#6B7280'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: ROLE_COLORS[u.role] || '#6B7280' }}>
                  {u.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}{u.branch_id ? ` · ${u.branch_id}` : ''}</div>
                {u.must_change_password && <div style={{ fontSize: 10.5, color: '#f59e0b', marginTop: 1 }}>⚠ Must change password</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 20, background: `${ROLE_COLORS[u.role] || '#6B7280'}18`, color: ROLE_COLORS[u.role] || '#6B7280' }}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
                {u.status === 'pending' && (
                  <button className="btn btn-sm btn-brand" onClick={() => approveUser(u)} style={{ fontSize: 11 }}>Approve</button>
                )}
                {resetConfirm === u.id ? (
                  <>
                    <span style={{ fontSize: 11, color: 'var(--t-2)' }}>Reset password?</span>
                    <button className="btn btn-sm btn-brand" onClick={() => resetPassword(u)} style={{ fontSize: 11 }}>Yes</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setResetConfirm(null)} style={{ fontSize: 11 }}>No</button>
                  </>
                ) : deleteConfirm === u.id ? (
                  <>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id)} style={{ fontSize: 11 }}>Confirm delete</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(null)} style={{ fontSize: 11 }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setResetConfirm(u.id)} style={{ fontSize: 11, color: 'var(--t-2)' }}>Reset pwd</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(u.id)} style={{ color: 'var(--t-3)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', color: 'var(--t-3)', fontSize: 13, padding: 24 }}>No workers match your filter.</div>}
        </div>
      )}
    </div>
  )
}

// ── Main Settings component ───────────────────────────────────────────────────
export default function Settings() {
  const { user } = useSession()
  const [tab, setTab] = useState<'users' | 'branches' | 'departments' | 'qr' | 'general' | 'profile'>('users')

  const isAdmin = ['developer', 'senior_pastor', 'pastor', 'admin'].includes(user?.role || '')

  const TABS = [
    { id: 'users',       label: 'Workers',       icon: '👥', adminOnly: true },
    { id: 'general',     label: 'Organisation',  icon: '⛪', adminOnly: true },
    { id: 'branches',    label: 'Branches',      icon: '🏛️', adminOnly: true },
    { id: 'departments', label: 'Departments',   icon: '📋', adminOnly: true },
    { id: 'qr',          label: 'QR Codes',      icon: '📷', adminOnly: true },
    { id: 'profile',     label: 'My Profile',    icon: '👤', adminOnly: false },
  ] as const

  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 17, fontFamily: 'var(--font-display)', color: 'var(--t-1)', letterSpacing: '-0.02em', marginBottom: 3 }}>Platform Settings</h2>
        <p style={{ fontSize: 12.5, color: 'var(--t-3)' }}>Manage your organisation, branches, departments, and your profile</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0, overflowX: 'auto' }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{
              padding: '8px 14px', borderRadius: 'var(--r) var(--r) 0 0',
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
              background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--brand)' : 'var(--t-3)',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'users'       && <UserManager />}
      {tab === 'general'     && isAdmin && <OrgSettingsPanel />}
      {tab === 'branches'    && isAdmin && <BranchManager />}
      {tab === 'departments' && isAdmin && <DepartmentManager />}
      {tab === 'qr'          && isAdmin && <QRGenerator />}
      {tab === 'profile'     && <ProfileEditor />}
    </div>
  )
}
