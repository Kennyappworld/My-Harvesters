/**
 * POST /api/auth/login
 *
 * Server-side login — Supabase URL + keys never exposed to the browser.
 * The client sends { email, password } and gets back worker profile data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Rate limiting ─────────────────────────────────────────────────────────────
const attempts = new Map<string, number[]>()
const LIMIT  = 10
const WINDOW = 10 * 60 * 1000

function rateCheck(ip: string): boolean {
  const now  = Date.now()
  const list = (attempts.get(ip) ?? []).filter(t => now - t < WINDOW)
  if (list.length >= LIMIT) return false
  list.push(now)
  attempts.set(ip, list)
  return true
}

// ── Supabase client factory ───────────────────────────────────────────────────
function makeClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? ''
  if (!url || !key) throw new Error('SUPABASE_URL / key not set in environment.')
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateCheck(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 10 minutes before trying again.' },
      { status: 429 }
    )
  }

  // Parse body
  let email = '', password = ''
  try {
    const body = await req.json()
    email    = ((body.email    ?? '') as string).trim().toLowerCase()
    password = ((body.password ?? '') as string)
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // Build Supabase client — return clear error if env vars missing
  let sb: SupabaseClient
  try {
    sb = makeClient()
  } catch (e) {
    console.error('[login] env not configured:', e)
    return NextResponse.json(
      { error: 'Server is not fully configured. Contact your administrator.' },
      { status: 503 }
    )
  }

  try {
    // ── 1. Check worker record exists first ───────────────────────────────────
    const { data: workerCheck } = await sb
      .from('workers')
      .select('email,status')
      .eq('email', email)
      .maybeSingle()

    if (!workerCheck) {
      // Worker row missing — check if the email is in auth.users at all
      const { data: userList } = await sb.auth.admin.listUsers()
      const inAuth = (userList?.users ?? []).some(
        (u: { email?: string }) => (u.email ?? '').toLowerCase() === email
      )
      if (!inAuth) {
        return NextResponse.json(
          { error: 'No account found with that email address. Please check and try again.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'Your account is not fully set up yet. Contact your administrator.' },
        { status: 403 }
      )
    }

    if (workerCheck.status === 'inactive') {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact your administrator.' },
        { status: 403 }
      )
    }

    // ── 2. Sign in ────────────────────────────────────────────────────────────
    const { data: authData, error: authErr } = await sb.auth.signInWithPassword({
      email,
      password,
    })

    if (authErr || !authData?.session) {
      const msg = (authErr?.message ?? '').toLowerCase()
      console.error('[login] Supabase auth error:', authErr?.message)

      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('wrong')) {
        return NextResponse.json(
          { error: 'Incorrect password. Please try again or use "Forgot password".' },
          { status: 401 }
        )
      }
      if (msg.includes('not confirmed')) {
        return NextResponse.json(
          { error: 'Please confirm your email address before signing in.' },
          { status: 401 }
        )
      }
      if (msg.includes('too many') || msg.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please wait a few minutes.' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: authErr?.message || 'Sign in failed. Please try again.' },
        { status: 401 }
      )
    }

    // ── 3. Load full worker profile ───────────────────────────────────────────
    const { data: worker, error: wErr } = await sb
      .from('workers')
      .select('id,email,full_name,role,status,branch_key,department,avatar_url,must_change_password')
      .eq('email', email)
      .single()

    if (wErr || !worker) {
      console.error('[login] Worker fetch error:', wErr?.message)
      return NextResponse.json(
        { error: 'Your profile could not be loaded. Contact your administrator.' },
        { status: 403 }
      )
    }

    // ── 4. Success ────────────────────────────────────────────────────────────
    return NextResponse.json({
      ok: true,
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
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
