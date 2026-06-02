/**
 * POST /api/create-worker-account
 * Server-side only — uses SUPABASE_SERVICE_ROLE_KEY (never exposed to browser).
 * Called by Settings when an admin approves a pending worker registration.
 * Protected: only authenticated senior_pastors / admins can call this.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? ''
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY     ?? ''
const anonKey          = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export async function POST(req: NextRequest) {
  // ── 1. Verify caller is an authenticated admin ───────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const callerToken = authHeader.replace('Bearer ', '')

  if (!callerToken || !supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the caller's JWT with the anon client
  const anonClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: authErr } = await anonClient.auth.getUser(callerToken)

  if (authErr || !caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check caller has admin-level role
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: callerWorker } = await adminClient
    .from('workers')
    .select('role')
    .eq('id', caller.id)
    .single()

  const allowedRoles = ['senior_pastor', 'pastor', 'admin']
  if (!callerWorker || !allowedRoles.includes(callerWorker.role)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 })
  }

  // ── 2. Parse and validate body ───────────────────────────────────────────
  let body: { email?: string; password?: string; name?: string; branch?: string; dept?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password, name, branch, dept } = body
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // ── 3. Create auth account using service role ────────────────────────────
  if (!serviceRoleKey) {
    // Service role not configured — skip auth creation, worker record only
    return NextResponse.json({ ok: true, note: 'Service role not configured — worker record only' })
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      branch_id: branch ?? '',
      department: dept  ?? '',
      role: 'worker',
    },
  })

  if (error) {
    // User may already exist — that's acceptable
    if (error.message?.includes('already registered')) {
      return NextResponse.json({ ok: true, note: 'Account already exists' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: data.user?.id })
}
