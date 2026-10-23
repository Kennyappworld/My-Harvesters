/**
 * /api/announcements
 *
 * Central announcement workflow API.
 * All Supabase access is server-side — no keys in the browser.
 *
 * Workflow states:
 *   draft → submitted → dept_approved → collated → ops_review → approved → published | rejected
 *
 * Role permissions:
 *   unit_head     — submit drafts; list own submissions
 *   admin         — same as unit_head + can view dept queue
 *   admin_head    — collate approved items; mark as ops_review ready
 *   ops_head      — approve/reject the collated package; publish
 *   pastor        — read-only published feed + stats
 *   senior_pastor — read-only published feed + stats + highlight
 *   developer     — full access
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Supabase factory ─────────────────────────────────────────────────────────
function makeClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? ''
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── In-memory rate limiting ───────────────────────────────────────────────────
const submitAttempts = new Map<string, number[]>()
function rateCheckSubmit(ip: string): boolean {
  const now = Date.now(); const win = 10 * 60 * 1000; const limit = 10
  const list = (submitAttempts.get(ip) ?? []).filter(t => now - t < win)
  if (list.length >= limit) return false
  list.push(now); submitAttempts.set(ip, list); return true
}

// ── Auth helper ───────────────────────────────────────────────────────────────
const ROLE_LEVEL: Record<string, number> = {
  developer: 7, senior_pastor: 6, pastor: 5,
  ops_head: 4, admin_head: 4, admin: 3,
  unit_head: 2, worker: 1, guest: 0,
}

async function getWorkerFromCookie(req: NextRequest, sb: SupabaseClient) {
  // Read session cookie
  const cookieHeader = req.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/sanctuaryhq_session=([0-9a-f]{64})/)
  if (!match) return null
  const sessionToken = match[1]

  // Look up session in Supabase (sessions table stores token → user_id mapping)
  // Fall back to checking Authorization: Bearer header for token-based auth
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7)
    const { data: { user }, error } = await sb.auth.getUser(jwt)
    if (error || !user) return null
    const { data: worker } = await sb.from('workers')
      .select('id, role, department, branch_id, branch_key, full_name')
      .eq('id', user.id).single()
    return worker
  }

  return null
}

// ── GET /api/announcements ────────────────────────────────────────────────────
// Query params:
//   view=feed        → published items (all roles)
//   view=inbox       → items pending this role's action
//   view=mine        → items submitted by caller
//   view=collation   → items for admin_head bulletin builder
export async function GET(req: NextRequest) {
  let sb: SupabaseClient
  try { sb = makeClient() } catch {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  // Get caller identity from JWT (Authorization header from browser)
  const authHeader = req.headers.get('authorization')
  let callerRole = 'worker'; let callerId = ''; let callerDept = ''
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7)
    const { data: { user } } = await sb.auth.getUser(jwt)
    if (user) {
      const { data: worker } = await sb.from('workers')
        .select('id, role, department, branch_id')
        .eq('id', user.id).single()
      if (worker) {
        callerRole = worker.role ?? 'worker'
        callerId   = worker.id
        callerDept = worker.department ?? ''
      }
    }
  }

  const url  = new URL(req.url)
  const view = url.searchParams.get('view') ?? 'feed'
  const level = ROLE_LEVEL[callerRole] ?? 0

  try {
    let query = sb.from('announcements').select(`
      id, title, body, type, target_audience, run_start, run_end,
      priority, status, submitted_by, unit_id, dept_id, dept_name,
      submitter_name, media_url, rejection_reason, created_at, updated_at,
      channel, scope, branch_id,
      announcement_approvals(id, role_at_approval, action, note, created_at,
        workers!approved_by(full_name, role))
    `).order('created_at', { ascending: false })

    if (view === 'feed') {
      query = query.eq('status', 'published')
    } else if (view === 'mine') {
      query = query.eq('submitted_by', callerId)
    } else if (view === 'inbox') {
      // Each role sees items that need THEIR action
      if (callerRole === 'unit_head' || callerRole === 'admin') {
        query = query.eq('submitted_by', callerId).in('status', ['draft','submitted','rejected'])
      } else if (callerRole === 'admin_head') {
        // Admin head: items approved at dept level, needs collation
        query = query.in('status', ['dept_approved', 'submitted'])
      } else if (callerRole === 'ops_head') {
        // Ops head: items ready for final review
        query = query.in('status', ['collated', 'dept_approved', 'submitted'])
      } else if (level >= 5) {
        // pastor/senior_pastor: approved + published
        query = query.in('status', ['approved', 'published'])
      }
    } else if (view === 'collation') {
      if (level < 4) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      query = query.in('status', ['dept_approved', 'submitted', 'collated', 'ops_review'])
        .order('priority', { ascending: false })
    } else if (view === 'all') {
      if (level < 4) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      // No additional filter
    }

    const { data, error } = await query.limit(100)
    if (error) throw error
    return NextResponse.json({ items: data ?? [], caller_role: callerRole })
  } catch (err: any) {
    console.error('[GET /api/announcements]', err)
    return NextResponse.json({ error: err.message ?? 'Query failed' }, { status: 500 })
  }
}

// ── POST /api/announcements ───────────────────────────────────────────────────
// Body: { action, ...payload }
// action = 'submit' | 'approve' | 'reject' | 'collate' | 'publish' | 'highlight'
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  let sb: SupabaseClient
  try { sb = makeClient() } catch {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  // Auth
  const authHeader = req.headers.get('authorization')
  let callerRole = 'worker'; let callerId = ''; let callerName = ''
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7)
    const { data: { user } } = await sb.auth.getUser(jwt)
    if (user) {
      const { data: worker } = await sb.from('workers')
        .select('id, role, department, full_name, branch_id')
        .eq('id', user.id).single()
      if (worker) {
        callerRole = worker.role ?? 'worker'
        callerId   = worker.id
        callerName = worker.full_name ?? ''
      }
    }
  }

  if (!callerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const level = ROLE_LEVEL[callerRole] ?? 0

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action } = body

  // ── SUBMIT new announcement ──
  if (action === 'submit') {
    if (!rateCheckSubmit(ip)) {
      return NextResponse.json({ error: 'Too many submissions. Try again in 10 minutes.' }, { status: 429 })
    }

    if (level < 1) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { title, annBody, type, target_audience, run_start, run_end, priority, channel, scope, dept_id, dept_name, media_url } = body

    if (!title?.trim() || !annBody?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    if (title.trim().length > 120) {
      return NextResponse.json({ error: 'Title too long (max 120 chars)' }, { status: 400 })
    }
    if (annBody.trim().length > 800) {
      return NextResponse.json({ error: 'Body too long (max 800 chars)' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data, error } = await sb.from('announcements').insert({
      title:           title.trim(),
      body:            annBody.trim(),
      type:            type ?? 'all',
      target_audience: target_audience ?? 'all-church',
      run_start:       run_start ?? now,
      run_end:         run_end ?? null,
      priority:        priority ?? 'standard',
      status:          'submitted',
      submitted_by:    callerId,
      submitter_name:  callerName,
      dept_id:         dept_id ?? null,
      dept_name:       dept_name ?? null,
      channel:         channel ?? 'platform',
      scope:           scope ?? 'all',
      media_url:       media_url ?? null,
      created_at:      now,
      updated_at:      now,
    }).select().single()

    if (error) {
      console.error('[submit announcement]', error)
      return NextResponse.json({ error: 'Failed to submit announcement.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, announcement: data })
  }

  // ── APPROVE (dept-level) ──
  if (action === 'approve') {
    if (level < 3) { // admin or higher
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const { id, note } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const now = new Date().toISOString()
    const [upd, approval] = await Promise.all([
      sb.from('announcements').update({ status: 'dept_approved', updated_at: now }).eq('id', id).select().single(),
      sb.from('announcement_approvals').insert({
        announcement_id: id, approved_by: callerId,
        role_at_approval: callerRole, action: 'approved',
        note: note ?? null, created_at: now,
      }),
    ])

    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, announcement: upd.data })
  }

  // ── REJECT ──
  if (action === 'reject') {
    if (level < 3) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const { id, rejection_reason, note } = body
    if (!id || !rejection_reason?.trim()) {
      return NextResponse.json({ error: 'id and rejection_reason required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const [upd] = await Promise.all([
      sb.from('announcements').update({
        status: 'rejected', rejection_reason: rejection_reason.trim(), updated_at: now
      }).eq('id', id).select().single(),
      sb.from('announcement_approvals').insert({
        announcement_id: id, approved_by: callerId,
        role_at_approval: callerRole, action: 'rejected',
        note: note ?? rejection_reason, created_at: now,
      }),
    ])

    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, announcement: upd.data })
  }

  // ── COLLATE (admin_head moves items into weekly bulletin) ──
  if (action === 'collate') {
    if (level < 4) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const { ids } = body // array of announcement IDs to mark as collated
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { error } = await sb.from('announcements')
      .update({ status: 'collated', updated_at: now })
      .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, collated: ids.length })
  }

  // ── PUBLISH (ops_head final approval → published) ──
  if (action === 'publish') {
    if (level < 4) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const { id, note } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const now = new Date().toISOString()
    const [upd] = await Promise.all([
      sb.from('announcements').update({ status: 'published', updated_at: now }).eq('id', id).select().single(),
      sb.from('announcement_approvals').insert({
        announcement_id: id, approved_by: callerId,
        role_at_approval: callerRole, action: 'approved',
        note: note ?? 'Published', created_at: now,
      }),
    ])

    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, announcement: upd.data })
  }

  // ── HIGHLIGHT (senior_pastor pins announcement to all dashboards) ──
  if (action === 'highlight') {
    if (level < 5) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const { id, highlighted } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data, error } = await sb.from('announcements')
      .update({ is_highlighted: highlighted ?? true, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, announcement: data })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
