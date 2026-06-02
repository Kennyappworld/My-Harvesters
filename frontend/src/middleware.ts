import { NextRequest, NextResponse } from 'next/server'

const PROTECTED   = ['/dashboard']
const PUBLIC_ONLY = ['/login', '/signup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/change-password')
  ) return NextResponse.next()

  const isProtected  = PROTECTED.some(p => pathname.startsWith(p))
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p))

  // ── Single auth check: hicc_session cookie ──────────────────────────────
  // This cookie is set synchronously by the login page BEFORE router.push.
  // The Supabase cookie arrives asynchronously and cannot be relied on here.
  // Real data security is enforced by Supabase RLS on every API call.
  const session = req.cookies.get('hicc_session')?.value
  const isAuthenticated = session === '1'

  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    const from = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/dashboard'
    url.searchParams.set('from', from)
    return NextResponse.redirect(url)
  }

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
