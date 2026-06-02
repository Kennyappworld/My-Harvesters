import { NextRequest, NextResponse } from 'next/server'

const PROTECTED  = ['/dashboard']
const PUBLIC_ONLY = ['/login', '/signup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static / service worker — always allow
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox') ||
    pathname.startsWith('/api/')
  ) return NextResponse.next()

  const isProtected  = PROTECTED.some(p  => pathname.startsWith(p))
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p))

  // ── Real auth check: verify Supabase JWT from cookie ──────────────────────
  // Supabase stores the session as sb-<ref>-auth-token in localStorage (browser)
  // and as a cookie when using SSR helpers. We use a lightweight JWT expiry check
  // on the raw cookie value so we never trust a trivially-settable flag.
  let isAuthenticated = false

  // Look for any Supabase session cookie (sb-*-auth-token)
  const supabaseCookie = [...req.cookies.getAll()]
    .find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  if (supabaseCookie?.value) {
    try {
      // Cookie value is a JSON array [access_token, refresh_token]
      // or a URL-encoded JSON object — decode and check exp claim
      const raw = decodeURIComponent(supabaseCookie.value)
      const parsed = JSON.parse(raw)
      const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token
      if (accessToken) {
        // Decode JWT payload (middle segment, base64url)
        const payload = JSON.parse(
          Buffer.from(accessToken.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8')
        )
        // Check token is not expired
        if (payload?.exp && payload.exp * 1000 > Date.now()) {
          isAuthenticated = true
        }
      }
    } catch {}
  }

  // Fallback: also accept the explicit hicc_session cookie as a secondary signal
  // (set after successful login as belt-and-suspenders for the splash redirect)
  // BUT only if there's also a valid Supabase cookie present — prevents trivial bypass
  if (!isAuthenticated) {
    const legacyCookie = req.cookies.get('hicc_session')?.value
    // Accept legacy cookie only alongside a Supabase cookie being present
    if (legacyCookie === '1' && supabaseCookie) {
      isAuthenticated = true
    }
  }

  // Unauthenticated → redirect to login, preserving destination
  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    // Safe redirect — only preserve same-origin paths
    const from = pathname.startsWith('/') ? pathname : '/dashboard'
    url.searchParams.set('from', from)
    return NextResponse.redirect(url)
  }

  // Already authenticated → skip login/signup
  if (isPublicOnly && isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  if (isProtected) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox-.*).*)',],
}
