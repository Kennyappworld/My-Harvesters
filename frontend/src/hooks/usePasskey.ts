'use client'
/**
 * usePasskey — React hook for passkey registration and authentication.
 * Uses @simplewebauthn/browser to talk to the WebAuthn APIs.
 */
import { useState } from 'react'
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser'
import { supabase } from '@/lib/supabase'
import { setAppSessionCookie } from '@/lib/appSession'

// The signed-in user's token, sent so the server knows who is registering.
async function authHeader(): Promise<Record<string, string>> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function usePasskey() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // ── Check support ────────────────────────────────────────────
  const isSupported = browserSupportsWebAuthn()

  async function checkBiometricAvailable(): Promise<boolean> {
    try {
      return await platformAuthenticatorIsAvailable()
    } catch {
      return false
    }
  }

  // ── Register a new passkey (called from Profile page) ────────
  async function registerPasskey(deviceName?: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    try {
      // Step 1: get options from server
      const optRes = await fetch('/api/passkey/register-options', { method: 'POST', headers: await authHeader() })
      if (!optRes.ok) throw new Error((await optRes.json()).error)
      const options = await optRes.json()

      // Step 2: prompt the browser / OS for biometric
      const registration = await startRegistration({ optionsJSON: options })

      // Step 3: verify with server
      const verifyRes = await fetch('/api/passkey/register-verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body:    JSON.stringify({ response: registration, deviceName }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error ?? 'Registration failed')
      }

      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      // User cancelled — don't show as error
      if (msg.includes('cancelled') || msg.includes('AbortError')) {
        setLoading(false)
        return false
      }
      setError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  // ── Authenticate with passkey (called from Login page) ───────
  async function authenticateWithPasskey(email?: string): Promise<{
    success: boolean
    mustChangePassword?: boolean
  }> {
    setLoading(true)
    setError(null)
    try {
      // Step 1: get challenge options
      const optRes = await fetch('/api/passkey/auth-options', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      if (!optRes.ok) throw new Error((await optRes.json()).error)
      const options = await optRes.json()

      // Step 2: browser / OS prompts for biometric
      const authentication = await startAuthentication({ optionsJSON: options })

      // Step 3: verify with server, get back a token
      const verifyRes = await fetch('/api/passkey/auth-verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ response: authentication }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error ?? 'Authentication failed')
      }

      // Step 4: exchange the magic-link token for a Supabase session
      if (!supabase) throw new Error('Supabase not configured')
      // The server returns a hashed one-time token, which is exchanged as token_hash.
      const { error: sessionErr } = await supabase.auth.verifyOtp({
        token_hash: verifyData.token,
        type:       'magiclink',
      })
      if (sessionErr) throw new Error('Could not complete sign in. Please use your password.')
      setAppSessionCookie()

      return { success: true, mustChangePassword: verifyData.mustChangePassword }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (msg.includes('cancelled') || msg.includes('AbortError')) {
        setLoading(false)
        return { success: false }
      }
      setError(msg)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    isSupported,
    loading,
    error,
    checkBiometricAvailable,
    registerPasskey,
    authenticateWithPasskey,
  }
}
