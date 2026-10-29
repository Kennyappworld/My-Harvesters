/**
 * GET /api/org-settings
 *
 * Returns public org display settings (name, logo, tagline, etc.)
 * Server-side only — Supabase URL never exposed to the browser.
 * Safe to call from the login page (no auth required).
 */

import { NextResponse } from 'next/server'
import { makeSupabaseAdmin } from '@/lib/server-env'

// Cache for 60 seconds to avoid hammering Supabase on every page load
let cache: { data: Record<string, unknown>; at: number } | null = null
const CACHE_TTL = 60_000

export async function GET() {
  // Return cached response if fresh
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }

  let sb: ReturnType<typeof makeSupabaseAdmin>
  try {
    sb = makeSupabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  try {
    const { data, error } = await sb
      .from('organisations')
      .select('id,slug,name,tagline,logo_url,app_name,powered_by_text,powered_by_url,powered_by_visible,primary_color,accent_color,allow_self_reg,signup_fields')
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    cache = { data: data as Record<string, unknown>, at: Date.now() }
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  } catch (err) {
    console.error('[/api/org-settings]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
