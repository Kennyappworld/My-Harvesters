import { NextRequest, NextResponse } from 'next/server'

// Routes that require authentication
const PROTECTED = ['/dashboard']

// Routes that should redirect authenticated users away (login, landing)
const AUTH_ONLY = ['/login']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Check for session — this is a client-side app so we check a session flag
  // In production: verify a signed httpOnly session cookie here instead
  const sessionCookie = req.cookies.get('hicc_session')
  const isAuthenticated = !!sessionCookie?.value

  // Block direct /dashboard access without session
  // Since this is a static export app, we redirect to login
  // The client-side sessionStorage check provides the actual guard
  if (PROTECTED.some(p => pathname.startsWith(p)) && !isAuthenticated) {
    // Allow through — client-side guard handles this for static export
    // In a server-rendered production app, redirect here instead:
    // return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.next()
  }

  // Security: prevent access to internal Next.js internals
  if (pathname.startsWith('/_next/server') || pathname.startsWith('/api/internal')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Add extra security headers not possible via next.config.js
  const response = NextResponse.next()

  // Prevent the app from being loaded in an iframe on ANY domain
  response.headers.set('X-Frame-Options', 'DENY')

  // Tell the browser not to cache responses that contain user data
  if (PROTECTED.some(p => pathname.startsWith(p))) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox-.*).*)',
  ],
}
