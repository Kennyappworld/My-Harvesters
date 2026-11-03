/**
 * POST /api/auth/login
 *
 * Checks the password with Supabase and, on success, returns the Supabase
 * session to the browser. The browser stores it with supabase.auth.setSession()
 * so every screen and API call can prove who the user is.
 *
 * (Previously the session was created here and thrown away, so the browser
 * was "logged in" with no Supabase session: dashboards showed no data and
 * every admin action failed with 401.)
 *
 * Security:
 *  - Rate limited per IP and per email address
 *  - One message for "no such account" and "wrong password" (no account probing)
 *  - Account status is checked only after the password is proven
 *  - Role is always loaded from the workers table, never from token metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { makeSupabaseAdmin } from '@/lib/server-env'

// ── Rate limiting (in-memory, per serverless instance) ────────────────────────
const byIp = new Map<string, number[]>()
const byEmail = new Map<string, number[]>()
const WINDOW = 10 * 60 * 1000

function allow(map: Map<string, number[]>, key: string, limit: number): boolean {
  const now = Date.now()
  const list = (map.get(key) ?? []).filter(t => now - t < WINDOW)
  if (list.length >= limit) { map.set(key, list); return false }
  list.push(now)
  map.set(key, list)
  return true
}

const BAD_LOGIN = 'Incorrect email or password. Please try again or use "Forgot password".'

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!allow(byIp, ip, 20)) {
    return json({ error: 'Too many attempts. Please wait 10 minutes before trying again.' }, 429)
  }

  let email = '', password = ''
  try {
    const body = await req.json()
    email    = String(body.email ?? '').trim().toLowerCase()
    password = String(body.password ?? '')
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  if (!email || !password) return json({ error: 'Email and password are required.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || password.length > 200) {
    return json({ error: 'Please enter a valid email address.' }, 400)
  }
  if (!allow(byEmail, email, 8)) {
    return json({ error: 'Too many attempts for this account. Please wait 10 minutes or reset your password.' }, 429)
  }

  let sb: ReturnType<typeof makeSupabaseAdmin>
  try {
    sb = makeSupabaseAdmin()
  } catch (e) {
    console.error('[login] env not configured:', e instanceof Error ? e.message : e)
    return json({ error: 'Server is not fully configured. Contact your administrator.' }, 503)
  }

  try {
    // ── 1. Prove the password ────────────────────────────────────────────────
    const { data: authData, error: authErr } = await sb.auth.signInWithPassword({ email, password })

    if (authErr || !authData?.session) {
      const msg = (authErr?.message ?? '').toLowerCase()
      if (msg.includes('not confirmed')) {
        return json({ error: 'Please confirm your email address before signing in.' }, 401)
      }
      if (msg.includes('banned')) {
        return json({ error: 'Your account is awaiting approval by your church administrator.' }, 403)
      }
      if (msg.includes('too many') || msg.includes('rate limit')) {
        return json({ error: 'Too many failed attempts. Please wait a few minutes.' }, 429)
      }
      return json({ error: BAD_LOGIN }, 401)
    }

    const session = authData.session
    const userId = authData.user.id

    // ── 2. Load the worker profile (by account id, falling back to email) ────
    // Read as the signed-in user when the service key is missing, so login
    // still works on a deployment that only has the public key configured.
    const reader = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? sb
      : createClient(
          (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
          (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
          { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } },
        )

    const cols = 'id, email, full_name, role, status, branch_key, department, avatar_url, must_change_password'
    let { data: worker } = await reader.from('workers').select(cols).eq('id', userId).maybeSingle()
    if (!worker) {
      ;({ data: worker } = await reader.from('workers').select(cols).eq('email', email).maybeSingle())
    }

    const revoke = async () => {
      try { await sb.auth.admin.signOut(session.access_token) } catch { /* best effort */ }
    }

    if (!worker) {
      await revoke()
      return json({ error: 'Your account is not fully set up yet. Ask your administrator to finish creating it.' }, 403)
    }
    if (['inactive', 'suspended', 'deleted'].includes(worker.status ?? '')) {
      await revoke()
      return json({ error: 'Your account has been deactivated. Contact your administrator.' }, 403)
    }

    // ── 3. Success — hand the session to the browser ─────────────────────────
    return json({
      ok: true,
      session: {
        access_token:  session.access_token,
        refresh_token: session.refresh_token,
      },
      worker: {
        id:                 worker.id,
        email:              worker.email,
        name:               worker.full_name,
        role:               worker.role,
        branch_key:         worker.branch_key,
        department:         worker.department,
        avatar_url:         worker.avatar_url,
        mustChangePassword: worker.must_change_password ?? false,
      },
    })
  } catch (err: unknown) {
    console.error('[login] Unexpected error:', err)
    return json({ error: 'An unexpected error occurred. Please try again.' }, 500)
  }
}
