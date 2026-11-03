/**
 * POST /api/signup — public self-registration (QR / join link).
 *
 * Replaces the browser inserting straight into `workers`, which either failed
 * silently (workers.id must be a real login account) while showing "success",
 * or — on databases with open rules — let anyone register themselves as an
 * active admin. Here the server decides role and status:
 *  - role is always 'worker'
 *  - status comes from the church's own "require approval" setting
 *  - a login account is created; while awaiting approval it is locked
 *  - the person sets their password with "Forgot password" once approved
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { makeSupabaseAdmin } from '@/lib/server-env'

const hits = new Map<string, number[]>()
function allow(ip: string): boolean {
  const now = Date.now()
  const list = (hits.get(ip) ?? []).filter(t => now - t < 30 * 60 * 1000)
  if (list.length >= 5) { hits.set(ip, list); return false }
  list.push(now)
  hits.set(ip, list)
  return true
}

const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!allow(ip)) return json({ error: 'Too many registrations from this network. Please try again later.' }, 429)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Invalid request.' }, 400) }

  const name   = str(body.name, 200)
  const phone  = str(body.phone, 30)
  const email  = str(body.email, 200).toLowerCase()
  const branch = str(body.branch_key, 60) || null
  const dept   = str(body.department, 100) || null
  const dob    = /^\d{2}-\d{2}$/.test(str(body.dob, 5)) ? str(body.dob, 5) : null
  const orgId  = str(body.org_id, 64) || null

  if (name.length < 2) return json({ error: 'Please enter your full name.' }, 400)
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone)) return json({ error: 'Please enter a valid phone number.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address — it is your login.' }, 400)

  let extra: Record<string, string> | null = null
  if (body.extra_fields && typeof body.extra_fields === 'object') {
    extra = {}
    for (const [k, v] of Object.entries(body.extra_fields as Record<string, unknown>).slice(0, 30)) {
      extra[String(k).slice(0, 60)] = str(v, 500)
    }
  }

  let sb: ReturnType<typeof makeSupabaseAdmin>
  try { sb = makeSupabaseAdmin() } catch {
    return json({ error: 'Registration is not available right now. Please contact the church office.' }, 503)
  }

  // The church must exist and allow self-registration; its own setting decides approval.
  const orgQuery = sb.from('organisations').select('*').limit(1)
  const { data: orgs } = orgId ? await orgQuery.eq('id', orgId) : await orgQuery
  const org = (orgs?.[0] ?? null) as Record<string, unknown> | null
  if (!org) return json({ error: 'This registration link is not valid.' }, 400)
  if (org.allow_self_reg === false) return json({ error: 'Self-registration is closed. Please contact the church office.' }, 403)
  const needsApproval = org.require_approval !== false

  // Create the login account (random password — they set their own via "Forgot password").
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password: randomBytes(24).toString('base64url'),
    email_confirm: true,
    user_metadata: { full_name: name },
    ...(needsApproval ? { ban_duration: '876000h' } : {}),
  })
  if (createErr || !created?.user) {
    const msg = (createErr?.message ?? '').toLowerCase()
    if (msg.includes('already')) return json({ error: 'This email is already registered. Try signing in, or use "Forgot password".' }, 409)
    console.error('[signup] create user error:', createErr?.message)
    return json({ error: 'Registration failed — please try again.' }, 500)
  }

  const { error: insertErr } = await sb.from('workers').insert({
    id:                   created.user.id,
    org_id:               (org.id as string) ?? null,
    full_name:            name,
    phone,
    email,
    branch_key:           branch,
    department:           dept,
    role:                 'worker',
    first_timer:          body.first_timer === true,
    dob,
    extra_fields:         extra && Object.keys(extra).length ? extra : null,
    status:               needsApproval ? 'pending' : 'active',
    must_change_password: true,
  })
  if (insertErr) {
    console.error('[signup] profile insert error:', insertErr.message)
    await sb.auth.admin.deleteUser(created.user.id).catch(() => {})
    return json({ error: 'Registration failed — please try again.' }, 500)
  }

  // Let the admins know (best effort).
  await Promise.resolve(sb.from('announcements').insert({
    title: `New registration: ${name}`,
    body:  `${name} joined ${branch ?? 'a campus'} · ${dept ?? 'No department'}. ${needsApproval ? 'Pending admin approval.' : 'Auto-approved.'}`,
    scope: 'admin',
  })).catch(() => null)

  return json({ ok: true, pending: needsApproval })
}
