/**
 * POST /api/auth/login
 *
 * Server-side login — Supabase URL + keys never exposed to the browser.
 * The client sends { email, password } and gets back worker profile data.
 *
 * Using SUPABASE_URL (no NEXT_PUBLIC_ prefix) means a wrong NEXT_PUBLIC_
 * env var can never break login.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rate limit store (in-memory per serverless instance — good enough for
// Vercel/Railway where each instance handles a limited burst)
const attempts = new Map<string, number[]>()
const LIMIT  = 10
const WINDOW = 10 * 60 * 1000 // 10 min

function rateCheck(ip: string): boolean {
  const now = Date.now()
  const list = (attempts.get(ip) ?? []).filter(t => now - t < WINDOW)
  if (list.length >= LIMIT) return false
  list.push(now)
  attempts.set(ip, list)
  return true
}

function getSupabase() {
  // Prefer non-public server-side vars; fall back to NEXT_PUBLIC_ variants
  const url = process.env.SUPABASE_URL
           ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Supabase is not configured on the server.')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  // IP-based rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateCheck(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 10 minutes.' },
      { status: 429 }
    )
  }

  let email: string, password: string
  try {
    const body = await req.json()
    email    = (body.email    ?? '').trim().toLowerCase()
    password = body.password  ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    // 1. Sign in
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr || !data?.session) {
      const msg = authErr?.message ?? ''
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
      }
      if (msg.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json({ error: 'Please confirm your email before signing in.' }, { status: 401 })
      }
      return NextResponse.json({ error: msg || 'Sign in failed.' }, { status: 401 })
    }

    // Use authed client for subsequent queries
    const authClient = createClient(
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    // 2. Load worker record
    const { data: worker, error: wErr } = await authClient
      .from('workers')
      .select('id,email,full_name,role,status,branch_key,department,avatar_url,must_change_password')
      .eq('email', email)
      .single()

    if (wErr || !worker) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your account is not set up yet. Contact your administrator.' },
        { status: 403 }
      )
    }

    if (worker.status === 'inactive') {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your account is inactive. Contact your administrator.' },
        { status: 403 }
      )
    }

    // 3. Return worker data — session cookie set by client as before
    return NextResponse.json({
      ok: true,
      worker: {
        id:                  worker.id,
        email:               worker.email,
        name:                worker.full_name,
        role:                worker.role,
        branch_key:          worker.branch_key,
        department:          worker.department,
        avatar_url:          worker.avatar_url,
        mustChangePassword:  worker.must_change_password ?? false,
      },
    })
  } catch (err: unknown) {
    console.error('[/api/auth/login]', err)
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
