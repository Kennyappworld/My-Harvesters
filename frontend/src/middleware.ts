import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PROTECTED = ['/dashboard']
const PUBLIC_ONLY = ['/login', '/signup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static files — always allow
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox')
  ) return NextResponse.next()

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p))

  // Check Supabase session via cookie
  let isAuthenticated = false
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      // Supabase stores session in cookies with sb- prefix
      const cookieHeader = req.headers.get('cookie') || ''
      const hasSupabaseSession = cookieHeader.includes('sb-') && cookieHeader.includes('-auth-token')
      isAuthenticated = hasSupabaseSession
    } catch {}
  }

  // Fallback: check for our session marker cookie
  if (!isAuthenticated) {
    const sessionCookie = req.cookies.get('hicc_session')
    isAuthenticated = !!sessionCookie?.value
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup
  if (isPublicOnly && isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (isProtected) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox-.*).*)',],
}
