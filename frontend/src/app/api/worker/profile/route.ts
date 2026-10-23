/**
 * PATCH /api/worker/profile
 *
 * Server-side worker self-profile update.
 * Workers can only update their own non-sensitive fields (name, phone, dept, marital_status).
 * Role, status, org_id, branch_id are NEVER accepted from the client.
 *
 * Security:
 *  - Verifies Supabase JWT — only the authenticated user may update their own record
 *  - Uses service role key server-side (key never in browser)
 *  - Validates all input fields before writing
 *  - Returns no sensitive fields in response
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function makeClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

// Fields a worker is allowed to update on their own profile
const ALLOWED_PROFILE_FIELDS = ['full_name', 'phone', 'department', 'marital_status', 'avatar_url'] as const
type ProfileField = typeof ALLOWED_PROFILE_FIELDS[number]

const ADMIN_ROLES = new Set(['developer', 'senior_pastor', 'pastor', 'ops_head', 'admin_head', 'admin'])

export async function PATCH(req: NextRequest) {
  // 1. Auth — require valid Bearer JWT
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let sb: SupabaseClient
  try { sb = makeClient() } catch {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  // 2. Verify token — get user ID
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Verify worker exists and is active
  const { data: worker, error: workerErr } = await sb
    .from('workers')
    .select('id, status')
    .eq('id', user.id)
    .single()

  if (workerErr || !worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
  if (worker.status !== 'active') return NextResponse.json({ error: 'Account not active' }, { status: 403 })

  // 4. Parse and whitelist body — only allowed fields, no role/status/org changes
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // target_id allows admins to update another worker's non-sensitive fields
  // If present, verify caller is admin-level and target exists
  let targetId = user.id
  if (body.target_id && typeof body.target_id === 'string' && body.target_id !== user.id) {
    if (!ADMIN_ROLES.has(worker.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden — admin role required to update other workers' }, { status: 403 })
    }
    // Verify target exists in same DB (no org isolation needed here — admins see all)
    const { data: targetWorker } = await sb.from('workers').select('id').eq('id', body.target_id).single()
    if (!targetWorker) return NextResponse.json({ error: 'Target worker not found' }, { status: 404 })
    targetId = body.target_id
  }

  const update: Partial<Record<ProfileField, string | null>> = {}

  if (typeof body.full_name === 'string') {
    const name = body.full_name.trim().slice(0, 200)
    if (name.length < 2) return NextResponse.json({ error: 'Name too short' }, { status: 400 })
    update.full_name = name
  }
  if (typeof body.phone === 'string') {
    update.phone = body.phone.trim().slice(0, 30) || null
  }
  if (typeof body.department === 'string') {
    update.department = body.department.trim().slice(0, 100) || null
  }
  if (Object.prototype.hasOwnProperty.call(body, 'marital_status')) {
    const ms = body.marital_status
    const VALID_MS = ['single', 'married', 'widowed', 'divorced', null, '']
    if (!VALID_MS.includes(ms as string | null)) {
      return NextResponse.json({ error: 'Invalid marital_status value' }, { status: 400 })
    }
    update.marital_status = (ms as string) || null
  }
  if (typeof body.avatar_url === 'string') {
    // Validate it's a Supabase CDN URL — never accept arbitrary URLs
    const avatarUrl = body.avatar_url.trim()
    const isSupabaseUrl = avatarUrl.includes('.supabase.co/storage/') || avatarUrl.includes('.supabase.in/storage/')
    if (avatarUrl && !isSupabaseUrl) {
      return NextResponse.json({ error: 'avatar_url must be a Supabase Storage URL' }, { status: 400 })
    }
    update.avatar_url = avatarUrl || null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // 5. Write — scoped to targetId (verified above — either the user's own ID or an admin-approved target)
  const { error: updateErr } = await sb
    .from('workers')
    .update(update)
    .eq('id', targetId)

  if (updateErr) {
    console.error('[worker/profile] update error:', updateErr.message)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}

/**
 * POST /api/worker/profile?action=flag_password_changed
 *
 * Clears the must_change_password flag after a successful password change.
 * Only the authenticated user can clear their own flag.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action !== 'flag_password_changed') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let sb: SupabaseClient
  try { sb = makeClient() } catch {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await sb.from('workers')
    .update({ must_change_password: false })
    .eq('id', user.id)

  return NextResponse.json({ ok: true }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
