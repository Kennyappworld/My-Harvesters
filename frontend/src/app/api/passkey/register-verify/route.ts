/**
 * POST /api/passkey/register-verify
 * Step 2 of passkey registration: verify the authenticator response and save credential.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const RP_ID     = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost'
const ORIGIN    = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'http://localhost:3000'
// e.g. NEXT_PUBLIC_APP_ORIGIN=https://my-harvesters.vercel.app

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body: { response: RegistrationResponseJSON; deviceName?: string } = await req.json()

    // ── 2. Look up the challenge ─────────────────────────────
    const clientDataJSON   = JSON.parse(
      Buffer.from(body.response.response.clientDataJSON, 'base64url').toString()
    )
    const challenge = clientDataJSON.challenge as string

    const { data: challengeRow, error: challengeErr } = await supabaseAdmin
      .from('passkey_challenges')
      .select('*')
      .eq('challenge', challenge)
      .eq('worker_id', user.id)
      .eq('type', 'registration')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (challengeErr || !challengeRow) {
      return NextResponse.json({ error: 'Challenge not found or expired' }, { status: 400 })
    }

    // ── 3. Verify the registration response ──────────────────
    const verification = await verifyRegistrationResponse({
      response:             body.response,
      expectedChallenge:    challenge,
      expectedOrigin:       ORIGIN,
      expectedRPID:         RP_ID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    const { credential } = verification.registrationInfo

    // ── 4. Mark challenge as used ────────────────────────────
    await supabaseAdmin
      .from('passkey_challenges')
      .update({ used: true })
      .eq('id', challengeRow.id)

    // ── 5. Save credential ───────────────────────────────────
    const { error: insertErr } = await supabaseAdmin
      .from('passkey_credentials')
      .insert({
        worker_id:     user.id,
        credential_id: credential.id,
        public_key:    Buffer.from(credential.publicKey).toString('base64url'),
        counter:       credential.counter,
        device_name:   body.deviceName ?? 'My Device',
        aaguid:        verification.registrationInfo.aaguid,
        transports:    body.response.response.transports ?? [],
        is_active:     true,
      })

    if (insertErr) {
      console.error('[passkey/register-verify] insert error', insertErr)
      return NextResponse.json({ error: 'Failed to save credential' }, { status: 500 })
    }

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('[passkey/register-verify]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
