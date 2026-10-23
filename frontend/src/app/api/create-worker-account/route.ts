/**
 * POST /api/create-worker-account
 *
 * Server-side only — uses SUPABASE_SERVICE_ROLE_KEY (never exposed to browser).
 * Called by Settings when an admin approves a pending worker registration.
 *
 * Security:
 *  - Verifies caller's Supabase JWT before doing anything
 *  - Checks caller has admin-level role from the DB (not metadata)
 *  - Rate-limited at the edge (Vercel) by IP via X-Forwarded-For
 *  - All inputs validated and sanitised
 *  - Returns minimal information to caller
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY     ?? ''
const anonKey        = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// ops_head and admin_head (level 4) are trusted to create accounts
const ADMIN_ROLES = new Set(['developer', 'senior_pastor', 'pastor', 'ops_head', 'admin_head', 'admin'])

// ── Request body type ─────────────────────────────────────────────────────────
type CreateWorkerBody = {
  email:       string
  password:    string
  name:        string
  phone?:      string
  branch_key?: string
  dept?:       string
  role?:       string
  resetOnly?:  boolean   // if true, just reset password for existing user
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 0. Config check ──────────────────────────────────────────────────────
  if (!supabaseUrl || !anonKey) {
    return json({ error: 'Service not configured' }, 503)
  }

  // ── 1. Verify caller JWT ─────────────────────────────────────────────────
  const authHeader  = req.headers.get('authorization') ?? ''
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!callerToken || callerToken.length < 20) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const anonClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: authErr } = await anonClient.auth.getUser(callerToken)

  if (authErr || !caller?.id) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // ── 2. Verify caller has admin role (from DB, not metadata) ──────────────
  if (!serviceRoleKey) {
    return json({ error: 'Service role not configured — contact administrator' }, 503)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: callerWorker, error: workerErr } = await adminClient
    .from('workers')
    .select('role, org_id, status')
    .eq('id', caller.id)
    .single()

  if (workerErr || !callerWorker || !ADMIN_ROLES.has(callerWorker.role)) {
    return json({ error: 'Forbidden — admin role required' }, 403)
  }

  if (callerWorker.status !== 'active') {
    return json({ error: 'Forbidden — account is not active' }, 403)
  }

  // ── 3. Parse and validate body ───────────────────────────────────────────
  let body: CreateWorkerBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  const { email, password, name, phone, branch_key, dept, role, resetOnly } = body

  // Required fields
  if (!email || typeof email !== 'string') return json({ error: 'email is required' }, 400)
  if (!password || typeof password !== 'string') return json({ error: 'password is required' }, 400)
  if (!resetOnly && (!name || typeof name !== 'string')) return json({ error: 'name is required' }, 400)

  // Sanitise email
  const cleanEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return json({ error: 'Invalid email address' }, 400)
  }
  if (cleanEmail.length > 200) return json({ error: 'Email too long' }, 400)

  // Name length
  const cleanName = name.trim().slice(0, 200)
  if (cleanName.length < 2) return json({ error: 'Name too short' }, 400)

  // Password strength (basic server-side check)
  if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)
  if (password.length > 128) return json({ error: 'Password too long' }, 400)

  // Role elevation rules — higher roles can only be set by developer or senior_pastor
  const allowedNewRoles =
    callerWorker.role === 'developer'
      ? ['developer', 'senior_pastor', 'pastor', 'ops_head', 'admin_head', 'admin', 'unit_head', 'worker']
    : callerWorker.role === 'senior_pastor'
      ? ['pastor', 'ops_head', 'admin_head', 'admin', 'unit_head', 'worker']
    : callerWorker.role === 'pastor' || callerWorker.role === 'ops_head' || callerWorker.role === 'admin_head'
      ? ['admin', 'unit_head', 'worker']
      : ['unit_head', 'worker']  // admin can only create unit_head/worker
  const cleanRole = typeof role === 'string' && allowedNewRoles.includes(role) ? role : 'worker'

  // ── 4a. Reset-only: just update password for existing user ───────────────
  if (resetOnly) {
    const { data: existingWorker } = await adminClient
      .from('workers')
      .select('id')
      .eq('email', cleanEmail)
      .single()
    if (!existingWorker?.id) return json({ error: 'Worker not found' }, 404)
    const { error: pwErr } = await adminClient.auth.admin.updateUserById(existingWorker.id, {
      password,
    })
    if (pwErr) return json({ error: 'Failed to reset password' }, 500)
    await adminClient.from('workers').update({ must_change_password: true }).eq('id', existingWorker.id)
    return json({ ok: true })
  }

  // ── 4. Create Supabase auth user ─────────────────────────────────────────
  const { data, error: createErr } = await adminClient.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,      // skip confirmation email
    user_metadata: {
      full_name:   cleanName,
      branch_key:  branch_key ?? '',
      department:  dept ?? '',
      role:        cleanRole,
    },
  })

  if (createErr) {
    if (createErr.message?.toLowerCase().includes('already registered')) {
      // Idempotent — user already exists, just update their worker record
      await adminClient
        .from('workers')
        .update({ status: 'active', must_change_password: true, phone: phone?.trim() ?? undefined })
        .eq('email', cleanEmail)
      return json({ ok: true, note: 'Account already exists — set to active' })
    }
    // Do not leak internal error details
    console.error('[create-worker-account] Supabase error:', createErr.message)
    return json({ error: 'Failed to create account — please try again' }, 500)
  }

  const newUserId = data.user?.id

  // ── 5. Ensure worker record is synced ────────────────────────────────────
  if (newUserId) {
    await adminClient
      .from('workers')
      .upsert({
        id:                newUserId,
        org_id:            callerWorker.org_id,
        email:             cleanEmail,
        full_name:         cleanName,
        role:              cleanRole,
        branch_id:         branch_key ?? '',
        department:        dept ?? '',
        phone:             phone?.trim() ?? '',
        status:            'active',
        must_change_password: true,
      }, { onConflict: 'id' })
  }

  return json({ ok: true, userId: newUserId })
}

// Helper
function json(body: object, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
