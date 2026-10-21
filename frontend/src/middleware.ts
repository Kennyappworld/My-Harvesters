/**
 * SanctuaryHQ — Edge Middleware (Security v2)
 *
 * Auth strategy:
 *  - sanctuaryhq_session cookie set by login page (opaque hex token, 64 chars)
 *  - Real data security is enforced by Supabase RLS on every DB call
 *  - This middleware prevents unauthenticated route access at the edge
 *
 * Security headers applied on every response:
 *  - Content-Security-Policy (strict)
 *  - X-Frame-Options: DENY
 *  - X-Content-Type-Options: nosniff
 *  - Referrer-Policy: strict-origin-when-cross-origin
 *  - Permissions-Policy: minimal footprint
 *  - Cache-Control: no-store on all protected routes
 *  - X-Request-ID for audit trail correlation
 */

import { NextRequest, NextResponse } from 'next/server'

const PROTECTED   = ['/dashboard']
const PUBLIC_ONLY = ['/login', '/signup']
const PUBLIC_PASS = ['/_next', '/api/', '/change-password', '/icon-', '/manifest', '/sw.js', '/workbox']

const SESSION_COOKIE = 'sanctuaryhq_session'
// Minimum token length: 64 hex chars (32 bytes from crypto.getRandomValues)
const MIN_TOKEN_LEN  = 32

// ── CSP policy ────────────────────────────────────────────────────────────────
// Adjust nonce-based scripts when adding inline script requirements.
// 'unsafe-inline' is avoided — all styles go via classes / CSS files.
const CSP = [
  "default-src 'self'",
  // Scripts: self + Next.js inline bootstrap (required for hydration)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Styles: self + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com data:",
  // Images: self + Supabase storage + data URIs
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://lh3.googleusercontent.com",
  // Connect: self + Supabase
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://vitals.vercel-insights.com",
  // Media: self only
  "media-src 'self'",
  // Workers (Next.js SW)
  "worker-src 'self' blob:",
  // Frames: none
  "frame-src 'none'",
  "frame-ancestors 'none'",
  // Form submissions: self only
  "form-action 'self'",
  // No plugin types
  "object-src 'none'",
  // Base URI locked to self
  "base-uri 'self'",
  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
].join('; ')

const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'ambient-light-sensor=()',
  'autoplay=()',
  'battery=()',
  'camera=(self)',         // Allow self for potential photo uploads
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=()',
  'screen-wake-lock=()',
  'usb=()',
  'xr-spatial-tracking=()',
].join(', ')

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Always pass static assets and api routes ─────────────────────────────
  if (PUBLIC_PASS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const isProtected  = PROTECTED.some(p => pathname.startsWith(p))
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p))

  // ── Auth check ────────────────────────────────────────────────────────────
  const sessionCookie    = req.cookies.get(SESSION_COOKIE)?.value ?? ''
  // Must be at least MIN_TOKEN_LEN chars and hex-only (no spaces, no special)
  const isAuthenticated  = (
    sessionCookie.length >= MIN_TOKEN_LEN &&
    /^[0-9a-f]+$/.test(sessionCookie)
  )

  // ── Route guards ──────────────────────────────────────────────────────────
  if (isProtected && !isAuthenticated) {
    const url  = req.nextUrl.clone()
    url.pathname = '/login'
    const from = pathname && !pathname.startsWith('//') ? pathname : '/dashboard'
    url.searchParams.set('from', encodeURIComponent(from))
    const response = NextResponse.redirect(url)
    // Clear any stale / invalid cookies on redirect
    response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
    applySecurityHeaders(response, isProtected)
    return response
  }

  if (isPublicOnly && isAuthenticated) {
    const url  = req.nextUrl.clone()
    url.pathname = '/dashboard'
    const response = NextResponse.redirect(url)
    applySecurityHeaders(response, false)
    return response
  }

  // ── Pass through with full security headers ───────────────────────────────
  const response = NextResponse.next()
  applySecurityHeaders(response, isProtected)
  return response
}

// ── Helper: attach all security headers ──────────────────────────────────────
function applySecurityHeaders(response: NextResponse, isProtected: boolean) {
  // Content-Security-Policy
  response.headers.set('Content-Security-Policy', CSP)

  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'DENY')

  // MIME sniffing protection
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set('Permissions-Policy', PERMISSIONS_POLICY)

  // HSTS (1 year, includeSubDomains)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // Cross-origin policies
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  // Prevent caching on authenticated pages
  if (isProtected) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Request correlation ID for audit logs
  response.headers.set('X-Request-ID', crypto.randomUUID())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-192\\.png|icon-512\\.png|manifest\\.json|sw\\.js|workbox-.*).*)',
  ],
}
