/**
 * POST /api/send-sms
 *
 * Sends one or more SMS messages via Termii.
 *
 * Security rules (strictly enforced):
 *  - TERMII_API_KEY is server-side only — never sent to the browser
 *  - Rate-limited: 20 requests per 10 minutes per IP (Next.js edge-compatible)
 *  - Only authenticated users (valid Supabase session cookie) may call this
 *  - Maximum 200 recipients per request
 *  - Phone numbers are sanitised (digits only, min 7 chars) before sending
 *
 * Request body:
 *   { messages: Array<{ to: string; message: string }> }
 *
 * Response:
 *   { sent: number }  |  { error: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { makeSupabaseAdmin }         from '@/lib/server-env'

// ─── Simple in-process rate limiter ───────────────────────────────────────────
// In production you'd use Redis / Upstash, but this keeps zero extra deps.
const WINDOW_MS  = 10 * 60 * 1000   // 10 minutes
const MAX_CALLS  = 20                // per IP per window
const calls      = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const rec = calls.get(ip)
  if (!rec || rec.reset < now) {
    calls.set(ip, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (rec.count >= MAX_CALLS) return false
  rec.count++
  return true
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Env check — fail fast with a clear message during setup
  const TERMII_API_KEY  = process.env.TERMII_API_KEY
  const TERMII_SENDER   = process.env.TERMII_SENDER_ID || 'SanctuaryHQ'

  if (!TERMII_API_KEY) {
    return NextResponse.json({ error: 'SMS not configured: TERMII_API_KEY missing from server env' }, { status: 503 })
  }

  // 2. Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests — please wait a few minutes' }, { status: 429 })
  }

  // 3. Auth check — user must have a valid Supabase session
  {
    const authHeader = req.headers.get('authorization') || ''
    const token      = authHeader.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Verify token with Supabase service role
    try {
      const admin = makeSupabaseAdmin()
      const { data: { user }, error } = await admin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Role check — only admins / pastors may send bulk SMS
      const { data: worker } = await admin
        .from('workers')
        .select('role')
        .eq('id', user.id)
        .single()
      // ops_head and admin_head are at level 4 — allowed to send SMS broadcasts
      const ALLOWED_ROLES = ['developer', 'senior_pastor', 'pastor', 'ops_head', 'admin_head', 'admin']
      if (!worker || !ALLOWED_ROLES.includes(worker.role)) {
        return NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 })
      }
    } catch {
      // If Supabase check fails (service key not configured) let it through in dev
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Auth check failed' }, { status: 500 })
      }
    }
  }

  // 4. Parse and validate body
  let messages: Array<{ to: string; message: string }>
  try {
    const body = await req.json()
    if (!Array.isArray(body?.messages)) throw new Error('messages must be an array')
    messages = body.messages
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid request body: ' + err.message }, { status: 400 })
  }

  // Sanitise
  const clean = messages
    .map(m => ({ to: String(m.to || '').replace(/\D/g,''), message: String(m.message || '').slice(0, 480) }))
    .filter(m => m.to.length >= 7 && m.message.length > 0)
    .slice(0, 200)  // Hard cap — 200 recipients max per call

  if (clean.length === 0) {
    return NextResponse.json({ error: 'No valid recipients after sanitisation' }, { status: 400 })
  }

  // 5. Send via Termii
  const TERMII_BASE = 'https://api.ng.termii.com/api'
  let sent = 0
  const errors: string[] = []

  await Promise.all(
    clean.map(async ({ to, message }) => {
      try {
        const res = await fetch(`${TERMII_BASE}/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            from:    TERMII_SENDER,
            sms:     message,
            type:    'plain',
            channel: 'generic',
            api_key: TERMII_API_KEY,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.message_id) {
          sent++
        } else {
          errors.push(`${to}: ${data.message || res.statusText}`)
        }
      } catch (err: any) {
        errors.push(`${to}: ${err.message}`)
      }
    })
  )

  if (sent === 0 && errors.length > 0) {
    return NextResponse.json({ error: `All sends failed. First error: ${errors[0]}` }, { status: 502 })
  }

  return NextResponse.json({ sent, failed: errors.length, errors: errors.slice(0, 5) })
}
