import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard']
const PUBLIC_ONLY = ['/login', '/signup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static files — always allow through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox') ||
    pathname.startsWith('/api/')
  ) return NextResponse.next()

  const isProtected  = PROTECTED.some(p => pathname.startsWith(p))
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p))

  // Read our explicit session cookie (set by the login page after Supabase confirms auth)
  const session = req.cookies.get('hicc_session')?.value
  const isAuthenticated = !!session

  // Unauthenticated → send to login
  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
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
