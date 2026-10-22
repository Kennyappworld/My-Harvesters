/**
 * POST /api/passkey/auth-options
 * Step 1 of passkey authentication: generate challenge for the browser.
 * Does NOT require a session — this is the login step.
 * Body: { email: string }  — used to find the worker's credentials
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() { return createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
) }

const RP_ID = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost'

// Rate limit: simple in-memory map (resets on cold start — good enough for edge)
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { email } = await req.json() as { email?: string }

    // ── Option A: email provided → lookup known credentials ──
    let allowCredentials: { id: string; transports: AuthenticatorTransport[] }[] = []

    if (email) {
      const { data: worker } = await getSupabaseAdmin()
        .from('workers')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (worker) {
        const { data: creds } = await getSupabaseAdmin()
          .from('passkey_credentials')
          .select('credential_id, transports')
          .eq('worker_id', worker.id)
          .eq('is_active', true)

        allowCredentials = (creds ?? []).map((c) => ({
          id:         c.credential_id as string,
          transports: (c.transports ?? []) as AuthenticatorTransport[],
        }))
      }
    }
    // Option B: no email → discoverable credential flow
    // (browser will prompt for which passkey to use)

    const options = await generateAuthenticationOptions({
      rpID:               RP_ID,
      userVerification:   'required',
      allowCredentials:   allowCredentials.length > 0 ? allowCredentials : undefined,
    })

    // Store challenge — no worker_id yet (we find it on verify)
    await getSupabaseAdmin()
      .from('passkey_challenges')
      .insert({
        challenge: options.challenge,
        email:     email ?? null,
        type:      'authentication',
      })

    return NextResponse.json(options)
  } catch (err) {
    console.error('[passkey/auth-options]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
