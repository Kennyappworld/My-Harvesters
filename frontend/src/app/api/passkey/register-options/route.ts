/**
 * POST /api/passkey/register-options
 * Step 1 of passkey registration: generate challenge options for the browser.
 * Requires an authenticated session (cookie).
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const RP_NAME = 'SanctuaryHQ'
const RP_ID   = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost' // e.g. my-harvesters.vercel.app

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify the caller is authenticated ────────────────
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // ── 2. Load existing passkeys to exclude (prevent re-registering same device) ──
    const { data: existing } = await supabaseAdmin
      .from('passkey_credentials')
      .select('credential_id, transports')
      .eq('worker_id', user.id)
      .eq('is_active', true)

    const excludeCredentials = (existing ?? []).map((c) => ({
      id:         c.credential_id as string,
      transports: (c.transports ?? []) as AuthenticatorTransport[],
    }))

    // ── 3. Generate WebAuthn registration options ────────────
    const options = await generateRegistrationOptions({
      rpName:                  RP_NAME,
      rpID:                    RP_ID,
      userName:                user.email ?? user.id,
      userDisplayName:         user.email ?? 'Worker',
      attestationType:         'none',            // simplest — we trust the device
      authenticatorSelection:  {
        residentKey:           'required',        // passkeys must be resident (discoverable)
        userVerification:      'required',        // require biometric / PIN
        authenticatorAttachment: 'platform',      // prefer on-device (fingerprint, face)
      },
      excludeCredentials,
    })

    // ── 4. Store challenge in DB (expires in 5 min) ──────────
    await supabaseAdmin
      .from('passkey_challenges')
      .insert({
        challenge:  options.challenge,
        worker_id:  user.id,
        type:       'registration',
      })

    return NextResponse.json(options)
  } catch (err) {
    console.error('[passkey/register-options]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
