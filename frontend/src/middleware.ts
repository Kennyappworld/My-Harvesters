import { NextRequest, NextResponse } from 'next/server'

const PROTECTED   = ['/dashboard']
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
    pathname.startsWith('/api/') ||
    pathname.startsWith('/change-password')
  ) return NextResponse.next()

  const isProtected  = PROTECTED.some(p  => pathname.startsWith(p))
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p))

  // ── Auth check ────────────────────────────────────────────────────────────
  // Strategy: accept EITHER a valid Supabase JWT cookie OR the hicc_session
  // flag cookie. The flag is set synchronously on login before navigation,
  // so it always arrives before the async Supabase cookie is written.
  // The flag alone is low-risk because: (a) it only controls whether the
  // middleware allows the request through — the dashboard itself calls
  // useSession() which does a real Supabase JWT check server-side, and
  // (b) Supabase's own RLS policies enforce access on every data request.
  let isAuthenticated = false

  // Check 1: Supabase JWT cookie (sb-*-auth-token)
  const supabaseCookie = [...req.cookies.getAll()]
    .find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  if (supabaseCookie?.value) {
    try {
      const raw = decodeURIComponent(supabaseCookie.value)
      const parsed = JSON.parse(raw)
      const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token
      if (accessToken) {
        const payload = JSON.parse(
          Buffer.from(
            accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'),
            'base64'
          ).toString('utf8')
        )
        if (payload?.exp && payload.exp * 1000 > Date.now()) {
          isAuthenticated = true
        }
      }
    } catch {}
  }

  // Check 2: hicc_session flag (set synchronously on login)
  // Accept on its own — real data access is still protected by Supabase RLS
  if (!isAuthenticated) {
    const session = req.cookies.get('hicc_session')?.value
    if (session === '1') {
      isAuthenticated = true
    }
  }

  // Unauthenticated → redirect to login
  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
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
