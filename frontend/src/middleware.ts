/**
 * ChurchOS / SanctuaryHQ / PulpitPro — Edge Middleware
 *
 * Auth strategy:
 *  - churchos_session cookie (httpOnly, Secure, SameSite=Lax) set by login
 *  - Real data security is always enforced by Supabase RLS on every DB call
 *  - This middleware only prevents unauthenticated route access at the edge
 *
 * Security:
 *  - Cookie value is opaque (UUID token, not '1') — set at login
 *  - Cache-Control: no-store on all protected routes
 *  - X-Request-ID added for audit trail correlation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED   = ['/dashboard']
const PUBLIC_ONLY = ['/login', '/signup']
const PUBLIC_PASS = ['/_next', '/api/', '/change-password', '/icon-', '/manifest', '/sw.js', '/workbox']

const SESSION_COOKIE = 'churchos_session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Always pass static assets and api ───────────────────────────────────
  if (PUBLIC_PASS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const isProtected  = PROTECTED.some(p => pathname.startsWith(p))
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p))

  // ── Auth check ────────────────────────────────────────────────────────────
  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value ?? ''
  // Session cookie must be a non-empty string of at least 8 chars (UUID)
  const isAuthenticated = sessionCookie.length >= 8

  // ── Route guards ──────────────────────────────────────────────────────────
  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    const from = pathname && !pathname.startsWith('//') ? pathname : '/dashboard'
    url.searchParams.set('from', encodeURIComponent(from))
    const response = NextResponse.redirect(url)
    // Clear any stale cookies on redirect
    response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
    return response
  }

  if (isPublicOnly && isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Build response with security headers ──────────────────────────────────
  const response = NextResponse.next()

  // Prevent caching on protected pages
  if (isProtected) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Request correlation ID for audit logs
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-192\\.png|icon-512\\.png|manifest\\.json|sw\\.js|workbox-.*).*)',
  ],
}
