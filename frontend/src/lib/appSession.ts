/**
 * appSession — the small "signed in" cookie the edge middleware checks.
 *
 * The real session is the Supabase session the browser holds (JWT in
 * localStorage). This cookie only lets the middleware send signed-out
 * visitors to /login quickly; useSession() verifies the Supabase session on
 * every protected page and signs the user out if it is missing or invalid,
 * so a hand-made cookie on its own shows nothing.
 */
'use client'

const COOKIE = 'sanctuaryhq_session'
const LIFETIME_MS = 30 * 60 * 1000

export function setAppSessionCookie() {
  if (typeof window === 'undefined') return
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const expires = new Date(Date.now() + LIFETIME_MS).toUTCString()
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE}=${token}; path=/; expires=${expires}; SameSite=Lax${secure}`
}

export function clearAppSessionCookie() {
  if (typeof window === 'undefined') return
  document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`
}
