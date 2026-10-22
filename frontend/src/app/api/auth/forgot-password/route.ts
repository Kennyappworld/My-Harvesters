/**
 * POST /api/auth/forgot-password
 *
 * Server-side password reset request.
 * Accepts { email } and triggers a Supabase reset email.
 * Never reveals whether the email is registered (anti-enumeration).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Rate limiting ─────────────────────────────────────────────────────────────
const attempts = new Map<string, number[]>()
const LIMIT  = 3
const WINDOW = 15 * 60 * 1000

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
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateCheck(ip)) {
    // Still return 200 to not reveal rate limit (anti-enumeration)
    return NextResponse.json({ ok: true })
  }

  let email = ''
  try {
    const body = await req.json()
    email = ((body.email ?? '') as string).trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  let sb: SupabaseClient
  try {
    sb = makeClient()
  } catch (e) {
    console.error('[forgot-password] env not configured:', e)
    return NextResponse.json(
      { error: 'Server is not fully configured. Contact your administrator.' },
      { status: 503 }
    )
  }

  try {
    // Derive the app origin for the redirect
    const origin = process.env.NEXT_PUBLIC_APP_ORIGIN
                ?? process.env.VERCEL_URL
                  ? `https://${process.env.VERCEL_URL}`
                  : req.headers.get('origin')
                  ?? 'https://my-harvesters.vercel.app'

    const { error: resetErr } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })

    if (resetErr) {
      console.error('[forgot-password] Supabase error:', resetErr.message)
      // Still return ok — never reveal whether email exists
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password] Unexpected error:', err)
    // Return success anyway — client shouldn't know about server errors here
    return NextResponse.json({ ok: true })
  }
}
