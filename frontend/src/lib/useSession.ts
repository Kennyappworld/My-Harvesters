/**
 * useSession — reads the current Supabase session and returns
 * user info + role. Falls back to sessionStorage demo data.
 */
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

export type UserRole = 'senior_pastor' | 'pastor' | 'admin' | 'unit_head' | 'worker' | 'guest'

export type SessionUser = {
  id: string
  email: string
  name: string
  role: UserRole
  branch_id: string
  department: string
  avatar_url: string | null
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  senior_pastor: 5,
  pastor: 4,
  admin: 3,
  unit_head: 2,
  worker: 1,
  guest: 0,
}

export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const meta = session.user.user_metadata || {}
            // Try to get full profile from workers table
            const { data: worker } = await supabase
              .from('workers')
              .select('*')
              .eq('id', session.user.id)
              .single()

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: worker?.full_name || meta.full_name || session.user.email?.split('@')[0] || 'Worker',
              role: (worker?.role || meta.role || 'worker') as UserRole,
              branch_id: worker?.branch_id || meta.branch_id || 'lekki',
              department: worker?.department || meta.department || '',
              avatar_url: worker?.avatar_url || null,
            })
            setLoading(false)
            return
          }
        }
        // Fallback: sessionStorage demo data
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem('hicc_user') : null
        if (raw) {
          const d = JSON.parse(raw)
          setUser({
            id: 'demo',
            email: d.email || '',
            name: d.name || d.email?.split('@')[0] || 'Worker',
            role: (d.role || 'senior_pastor') as UserRole,
            branch_id: d.branch_id || 'lekki',
            department: d.department || '',
            avatar_url: null,
          })
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  return { user, loading }
}
