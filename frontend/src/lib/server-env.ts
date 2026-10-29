/**
 * server-env.ts — Shared server-side Supabase client factory
 *
 * Robust URL normalisation: handles missing https://, trailing slashes,
 * and accidental whitespace that users sometimes paste into hosting dashboards.
 *
 * NEVER import this file from client-side code — it references service role keys.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/** Normalise a Supabase project URL so it always has https:// and no trailing slash */
function normaliseUrl(raw: string): string {
  let u = raw.trim()
  if (!u) return ''
  // Add scheme if missing
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = 'https://' + u
  }
  // Strip trailing slash
  u = u.replace(/\/+$/, '')
  return u
}

/**
 * Build and return a Supabase client using server-only env vars.
 * Throws a clear error if the vars are missing or malformed.
 */
export function makeSupabaseAdmin(): SupabaseClient {
  const rawUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ''

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''

  const url = normaliseUrl(rawUrl)

  if (!url) {
    throw new Error(
      'SUPABASE_URL is not set. ' +
      'Add it to your Railway / Vercel environment variables: ' +
      'SUPABASE_URL=https://<project-id>.supabase.co'
    )
  }
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Copy it from Supabase → Project Settings → API → service_role key.'
    )
  }

  // Validate URL shape (catches typos early)
  try {
    new URL(url)
  } catch {
    throw new Error(`SUPABASE_URL is malformed: "${url}". It must be a full URL like https://xxxx.supabase.co`)
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** JSON response helper with standard security headers */
export function jsonResponse(body: object, status = 200) {
  const { NextResponse } = require('next/server')
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
