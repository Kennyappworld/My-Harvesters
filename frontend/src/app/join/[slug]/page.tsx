/**
 * /join/[slug] — Public signup entry point
 *
 * Accessed via QR code or shared link.
 * Renders the org's signup form directly (same as /signup),
 * pre-seeded with branch/dept from query params if provided.
 *
 * URL examples:
 *   /join/hicc                          → general signup
 *   /join/hicc?branch=main              → pre-select branch
 *   /join/hicc?branch=main&dept=youth   → pre-select branch + dept
 */

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

interface Props {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function JoinPage({ params, searchParams }: Props) {
  const { slug } = params

  // Validate slug exists in organisations table (server-side)
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } })
    const { data } = await sb
      .from('organisations')
      .select('id,slug')
      .eq('slug', slug)
      .single()

    if (!data) {
      // Unknown slug — redirect to generic signup
      redirect('/signup')
    }
  }

  // Build redirect to /signup preserving all query params + slug
  const branch = typeof searchParams.branch === 'string' ? searchParams.branch : ''
  const dept   = typeof searchParams.dept   === 'string' ? searchParams.dept   : ''

  const qs = new URLSearchParams()
  qs.set('org', slug)
  if (branch) qs.set('branch', branch)
  if (dept)   qs.set('dept', dept)

  redirect(`/signup?${qs.toString()}`)
}
