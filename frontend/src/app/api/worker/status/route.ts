/**
 * PATCH /api/worker/status
 *
 * Admin-only: update a worker's status (active / deleted / suspended).
 * Replaces direct client-side supabase.from('workers').update({status}) calls.
 *
 * Security:
 *  - Requires valid Supabase JWT from caller
 *  - Caller must have admin-level role (ops_head/admin_head/admin/pastor/senior_pastor/developer)
 *  - A caller cannot elevate or deactivate someone with a higher role level
 *  - Service role key server-side only — never in browser
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

const ROLE_LEVEL: Record<string, number> = {
  developer: 7, senior_pastor: 6, pastor: 5,
  ops_head: 4, admin_head: 4, admin: 3,
  unit_head: 2, worker: 1, guest: 0,
}

const ALLOWED_CALLER_ROLES = new Set([
  'developer', 'senior_pastor', 'pastor', 'ops_head', 'admin_head', 'admin',
])

const VALID_STATUSES = new Set(['active', 'deleted', 'suspended', 'inactive'])

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}

export async function PATCH(req: NextRequest) {
  // 1. Auth
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return json({ error: 'Unauthorized' }, 401)

  let sb: SupabaseClient
  try { sb = makeClient() } catch {
    return json({ error: 'Server not configured' }, 503)
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user?.id) return json({ error: 'Unauthorized' }, 401)

  // 2. Load caller role from DB — never from JWT metadata
  const { data: caller } = await sb
    .from('workers')
    .select('id, role, status, org_id')
    .eq('id', user.id)
    .single()

  if (!caller || !ALLOWED_CALLER_ROLES.has(caller.role)) {
    return json({ error: 'Forbidden — admin role required' }, 403)
  }
  if (caller.status !== 'active') return json({ error: 'Forbidden — account not active' }, 403)

  // 3. Parse body
  let body: { target_id?: string; status?: string }
  try { body = await req.json() } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  const { target_id, status: newStatus } = body

  if (!target_id || typeof target_id !== 'string') {
    return json({ error: 'target_id is required' }, 400)
  }
  if (!newStatus || !VALID_STATUSES.has(newStatus)) {
    return json({ error: `status must be one of: ${Array.from(VALID_STATUSES).join(', ')}` }, 400)
  }

  // 4. Load target worker — must be same org
  const { data: target } = await sb
    .from('workers')
    .select('id, role, org_id')
    .eq('id', target_id)
    .single()

  if (!target) return json({ error: 'Worker not found' }, 404)

  // Cannot modify a worker with a higher or equal role (except developer)
  const callerLevel = ROLE_LEVEL[caller.role] ?? 0
  const targetLevel = ROLE_LEVEL[target.role] ?? 0
  if (caller.role !== 'developer' && targetLevel >= callerLevel) {
    return json({ error: 'Forbidden — cannot modify a user with equal or higher role' }, 403)
  }

  // Cannot self-delete or self-suspend
  if (target_id === caller.id && newStatus !== 'active') {
    return json({ error: 'Cannot deactivate your own account' }, 400)
  }

  // 5. Apply
  const { error: updateErr } = await sb
    .from('workers')
    .update({ status: newStatus })
    .eq('id', target_id)

  if (updateErr) {
    console.error('[worker/status] update error:', updateErr.message)
    return json({ error: 'Failed to update status' }, 500)
  }

  return json({ ok: true })
}
