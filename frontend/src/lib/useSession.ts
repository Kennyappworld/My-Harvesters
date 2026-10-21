/**
 * useSession — Reads the current Supabase session and returns user info.
 *
 * Security:
 *  - Always reads from Supabase (never trusts sessionStorage role field)
 *  - On SIGNED_OUT: clears churchos_session cookie, redirects to login
 *  - developer role is only assignable in DB, never derived from metadata
 */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  ) : null

export type UserRole = 'developer' | 'senior_pastor' | 'pastor' | 'admin' | 'unit_head' | 'worker' | 'guest'

export type SessionUser = {
  id:          string
  email:       string
  name:        string
  role:        UserRole
  branch_key:  string
  branch_id:   string | null
  org_id:      string | null
  department:  string
  avatar_url:  string | null
  phone:       string
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  developer:     6,
  senior_pastor: 5,
  pastor:        4,
  admin:         3,
  unit_head:     2,
  worker:        1,
  guest:         0,
}

export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[required] ?? 0)
}

// Allowed roles that can come from the DB workers table
const VALID_ROLES = new Set<string>([
  'developer', 'senior_pastor', 'pastor', 'admin', 'unit_head', 'worker', 'guest',
])

function sanitizeRole(raw: unknown): UserRole {
  if (typeof raw === 'string' && VALID_ROLES.has(raw)) return raw as UserRole
  return 'worker'
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      // Always load role from workers table — not from JWT metadata
      const { data: worker } = await supabase
        .from('workers')
        .select('id, org_id, full_name, role, branch_key, branch_id, department, phone, avatar_url, must_change_password, status')
        .eq('id', session.user.id)
        .single()

      if (!worker) {
        // Worker record not yet created — use metadata temporarily
        const meta = session.user.user_metadata || {}
        setUser({
          id:         session.user.id,
          email:      session.user.email || '',
          name:       String(meta.full_name || session.user.email?.split('@')[0] || 'User'),
          role:       'worker',
          branch_key: String(meta.branch_key || ''),
          branch_id:  null,
          org_id:     null,
          department: String(meta.department || ''),
          avatar_url: null,
          phone:      '',
        })
        setLoading(false)
        return
      }

      // Redirect if account is suspended or pending
      if (worker.status === 'suspended') {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=suspended'
        }
        return
      }

      // Force password change if flagged
      if (worker.must_change_password && typeof window !== 'undefined') {
        if (!window.location.pathname.includes('/change-password')) {
          window.location.href = '/change-password'
          return
        }
      }

      setUser({
        id:         session.user.id,
        email:      session.user.email || worker.email || '',
        name:       String(worker.full_name || session.user.email?.split('@')[0] || 'User'),
        role:       sanitizeRole(worker.role),
        branch_key: String(worker.branch_key || ''),
        branch_id:  worker.branch_id || null,
        org_id:     worker.org_id || null,
        department: String(worker.department || ''),
        avatar_url: worker.avatar_url || null,
        phone:      String(worker.phone || ''),
      })
    } catch {
      // Session read failed — clear and redirect
      clearSessionAndRedirect()
    } finally {
      setLoading(false)
    }
  }, [])

  function clearSessionAndRedirect() {
    if (typeof window === 'undefined') return
    document.cookie = 'churchos_session=; path=/; max-age=0; SameSite=Lax; Secure'
    // Also clear legacy cookie name
    document.cookie = 'hicc_session=; path=/; max-age=0'
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?reason=session_expired'
    }
  }

  useEffect(() => {
    loadUser()

    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        clearSessionAndRedirect()
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        loadUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUser])

  return { user, loading, refresh: loadUser }
}
