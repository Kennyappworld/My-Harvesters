/**
 * POST /api/passkey/auth-verify
 * Step 2 of passkey authentication: verify the authenticator response,
 * then sign the worker in via Supabase and set the session cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const RP_ID  = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost'
const ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const body: { response: AuthenticationResponseJSON } = await req.json()

    // ── 1. Decode challenge from the response ─────────────────
    const clientDataJSON = JSON.parse(
      Buffer.from(body.response.response.clientDataJSON, 'base64url').toString()
    )
    const challenge = clientDataJSON.challenge as string

    // ── 2. Find challenge in DB ──────────────────────────────
    const { data: challengeRow } = await supabaseAdmin
      .from('passkey_challenges')
      .select('*')
      .eq('challenge', challenge)
      .eq('type', 'authentication')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!challengeRow) {
      return NextResponse.json({ error: 'Challenge not found or expired' }, { status: 400 })
    }

    // ── 3. Find the credential in DB ─────────────────────────
    const credentialId = body.response.id
    const { data: credRow } = await supabaseAdmin
      .from('passkey_credentials')
      .select('*, worker_id')
      .eq('credential_id', credentialId)
      .eq('is_active', true)
      .single()

    if (!credRow) {
      return NextResponse.json({ error: 'Passkey not recognised' }, { status: 400 })
    }

    // ── 4. Verify the authentication response ────────────────
    const verification = await verifyAuthenticationResponse({
      response:           body.response,
      expectedChallenge:  challenge,
      expectedOrigin:     ORIGIN,
      expectedRPID:       RP_ID,
      credential: {
        id:        credRow.credential_id,
        publicKey: Buffer.from(credRow.public_key, 'base64url'),
        counter:   credRow.counter,
        transports: credRow.transports ?? [],
      },
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    // ── 5. Update counter + last_used_at (replay-attack protection) ──
    await supabaseAdmin
      .from('passkey_credentials')
      .update({
        counter:      verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', credRow.id)

    // Mark challenge used
    await supabaseAdmin
      .from('passkey_challenges')
      .update({ used: true })
      .eq('id', challengeRow.id)

    // ── 6. Look up the worker's email and create a Supabase session ──
    const { data: worker } = await supabaseAdmin
      .from('workers')
      .select('id, email, role, status, must_change_password')
      .eq('id', credRow.worker_id)
      .single()

    if (!worker || worker.status !== 'active') {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 })
    }

    // Generate a magic link token so the client can sign in without knowing the password
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type:  'magiclink',
      email: worker.email,
    })

    if (linkErr || !linkData.properties?.hashed_token) {
      console.error('[passkey/auth-verify] magic link error', linkErr)
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 })
    }

    // Return the token — the client will exchange it for a session
    return NextResponse.json({
      verified:        true,
      token:           linkData.properties.hashed_token,
      email:           worker.email,
      role:            worker.role,
      mustChangePassword: worker.must_change_password,
    })
  } catch (err) {
    console.error('[passkey/auth-verify]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
