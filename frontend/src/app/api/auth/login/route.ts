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

  // Validate email format first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  try {
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = getSupabase()
    } catch {
      console.error('[/api/auth/login] Supabase not configured — missing env vars')
      return NextResponse.json(
        { error: 'Server is not configured yet. Please contact your administrator.' },
        { status: 503 }
      )
    }

    // 1. Check if email exists (gives a better "email not found" message)
    const adminClient = createClient(
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: existingUser } = await adminClient
      .from('workers')
      .select('email,status')
      .eq('email', email)
      .maybeSingle()

    if (!existingUser) {
      // No worker record — check auth.users to distinguish "wrong email" from "not set up"
      const { data: authList } = await adminClient.auth.admin.listUsers()
      const authUserExists = authList?.users?.some((u: { email?: string }) => u.email?.toLowerCase() === email)
      if (!authUserExists) {
        return NextResponse.json(
          { error: 'No account found with that email address. Check your email and try again.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'Your account exists but is not fully set up. Contact your administrator.' },
        { status: 403 }
      )
    }

    if (existingUser.status === 'inactive') {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact your administrator to regain access.' },
        { status: 403 }
      )
    }

    // 2. Sign in with password
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr || !data?.session) {
      const msg = (authErr?.message ?? '').toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('wrong')) {
        return NextResponse.json(
          { error: 'Wrong password. Please try again, or use "Forgot password" below.' },
          { status: 401 }
        )
      }
      if (msg.includes('email not confirmed')) {
        return NextResponse.json(
          { error: 'Please check your email and click the confirmation link before signing in.' },
          { status: 401 }
        )
      }
      if (msg.includes('too many') || msg.includes('rate')) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please wait a few minutes before trying again.' },
          { status: 429 }
        )
      }
      // Log the raw message for debugging but don't expose internals
      console.error('[/api/auth/login] Auth error:', authErr?.message)
      return NextResponse.json(
        { error: authErr?.message || 'Sign in failed. Please try again.' },
        { status: 401 }
      )
    }

    // 3. Load full worker record
    const { data: worker, error: wErr } = await adminClient
      .from('workers')
      .select('id,email,full_name,role,status,branch_key,department,avatar_url,must_change_password')
      .eq('email', email)
      .single()

    if (wErr || !worker) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your worker profile could not be loaded. Contact your administrator.' },
        { status: 403 }
      )
    }

    // 4. Return worker data
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
    console.error('[/api/auth/login] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
