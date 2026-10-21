/**
 * data.ts — Static reference data and chart helpers
 *
 * NOTE: Branch and department lists are now loaded from Supabase at runtime.
 * The FALLBACK_BRANCHES and FALLBACK_DEPARTMENTS below are only used when the
 * DB has no rows yet, or when Supabase is not configured.
 *
 * All HICC-specific church data has been removed — this module is now
 * church-agnostic.  Chart seed data (memberGrowthMonthly, etc.) is also
 * replaced by live Supabase queries in the respective section components.
 */

// ── Branch type ───────────────────────────────────────────────────────────────

export type BranchType = 'hq' | 'branch' | 'satellite' | 'international' | 'online'

export type Branch = {
  id:          string     // UUID from Supabase branches table
  branch_key:  string     // slug-style key (e.g. 'main-campus')
  name:        string
  short_name:  string
  location:    string
  country:     string
  type:        BranchType
  pastor_name: string
  phone:       string
  email:       string
  color:       string
  founded_year: number
  is_active:   boolean
  sort_order:  number
}

export type Department = {
  id:       string
  dept_key: string
  name:     string
  icon:     string
  color:    string
  head_name: string
  is_active: boolean
}

// ── Fallback data (used only when DB has no rows) ─────────────────────────────

export const FALLBACK_BRANCHES: Branch[] = [
  {
    id: 'fallback-hq', branch_key: 'main-campus', name: 'Main Campus',
    short_name: 'Main', location: 'City Centre', country: 'NG',
    type: 'hq', pastor_name: '', phone: '', email: '',
    color: '#1B4332', founded_year: new Date().getFullYear(), is_active: true, sort_order: 0,
  },
]

export const FALLBACK_DEPARTMENTS: Department[] = [
  { id: 'f-ushering',  dept_key: 'ushering',  name: 'Ushering',         icon: '🚪', color: '#1B4332', head_name: '', is_active: true },
  { id: 'f-worship',   dept_key: 'worship',   name: 'Worship & Music',  icon: '🎵', color: '#F59E0B', head_name: '', is_active: true },
  { id: 'f-media',     dept_key: 'media',     name: 'Media',            icon: '📷', color: '#3B82F6', head_name: '', is_active: true },
  { id: 'f-kids',      dept_key: 'kids',      name: 'Children Ministry',icon: '🧒', color: '#10B981', head_name: '', is_active: true },
  { id: 'f-protocol',  dept_key: 'protocol',  name: 'Protocol',         icon: '🤝', color: '#9C4221', head_name: '', is_active: true },
  { id: 'f-welfare',   dept_key: 'welfare',   name: 'Welfare & Care',   icon: '❤️', color: '#C05621', head_name: '', is_active: true },
  { id: 'f-outreach',  dept_key: 'outreach',  name: 'Outreach',         icon: '📢', color: '#F97316', head_name: '', is_active: true },
  { id: 'f-prayer',    dept_key: 'prayer',    name: 'Prayer',           icon: '🙏', color: '#6B7280', head_name: '', is_active: true },
  { id: 'f-security',  dept_key: 'security',  name: 'Security',         icon: '🛡️', color: '#14B8A6', head_name: '', is_active: true },
  { id: 'f-admin',     dept_key: 'admin',     name: 'Administration',   icon: '📋', color: '#84CC16', head_name: '', is_active: true },
]

// ── Supabase loaders ──────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/** Load branches from Supabase for the current org. Falls back to FALLBACK_BRANCHES. */
export async function loadBranches(): Promise<Branch[]> {
  const sb = getSupabase()
  if (!sb) return FALLBACK_BRANCHES
  try {
    const { data, error } = await sb
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return FALLBACK_BRANCHES
    return data.map((r: Record<string, unknown>) => ({
      id:           String(r.id),
      branch_key:   String(r.branch_key),
      name:         String(r.name),
      short_name:   String(r.short_name || r.name),
      location:     String(r.location || ''),
      country:      String(r.country || 'NG'),
      type:         (r.type || 'branch') as BranchType,
      pastor_name:  String(r.pastor_name || ''),
      phone:        String(r.phone || ''),
      email:        String(r.email || ''),
      color:        String(r.color || '#1B4332'),
      founded_year: Number(r.founded_year || new Date().getFullYear()),
      is_active:    Boolean(r.is_active !== false),
      sort_order:   Number(r.sort_order || 0),
    }))
  } catch {
    return FALLBACK_BRANCHES
  }
}

/** Load departments from Supabase for the current org. Falls back to FALLBACK_DEPARTMENTS. */
export async function loadDepartments(): Promise<Department[]> {
  const sb = getSupabase()
  if (!sb) return FALLBACK_DEPARTMENTS
  try {
    const { data, error } = await sb
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return FALLBACK_DEPARTMENTS
    return data.map((r: Record<string, unknown>) => ({
      id:        String(r.id),
      dept_key:  String(r.dept_key),
      name:      String(r.name),
      icon:      String(r.icon || '📋'),
      color:     String(r.color || '#1B4332'),
      head_name: String(r.head_name || ''),
      is_active: Boolean(r.is_active !== false),
    }))
  } catch {
    return FALLBACK_DEPARTMENTS
  }
}

// ── React hooks for branches and departments ───────────────────────────────────

import { useState, useEffect } from 'react'

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>(FALLBACK_BRANCHES)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    loadBranches().then(b => { if (!cancelled) { setBranches(b); setLoading(false) } })
    return () => { cancelled = true }
  }, [])
  return { branches, loading }
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(FALLBACK_DEPARTMENTS)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    loadDepartments().then(d => { if (!cancelled) { setDepartments(d); setLoading(false) } })
    return () => { cancelled = true }
  }, [])
  return { departments, loading }
}

// ── Color palette helpers ─────────────────────────────────────────────────────

export const BRANCH_COLOR_PALETTE = [
  '#1B4332', '#10B981', '#F59E0B', '#3B82F6', '#6B7280',
  '#C05621', '#9C4221', '#F97316', '#14B8A6', '#6366F1',
  '#8B5CF6', '#EC4899', '#EF4444', '#84CC16', '#06B6D4',
]

export const DEPT_COLOR_PALETTE = [
  '#1B4332', '#F59E0B', '#3B82F6', '#10B981', '#9C4221',
  '#C05621', '#F97316', '#6B7280', '#14B8A6', '#6366F1',
  '#06B6D4', '#84CC16', '#EC4899', '#EF4444', '#8B5CF6',
]

export function pickBranchColor(index: number): string {
  return BRANCH_COLOR_PALETTE[index % BRANCH_COLOR_PALETTE.length]
}

export function pickDeptColor(index: number): string {
  return DEPT_COLOR_PALETTE[index % DEPT_COLOR_PALETTE.length]
}

// ── Attendance chart helpers ───────────────────────────────────────────────────

export type AttendancePoint = {
  label: string   // date or period label
  count: number
}

/** Format a date for display in charts */
export function formatChartDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// ── Soul record status helpers ────────────────────────────────────────────────

export const FOLLOW_UP_STAGE_LABELS: Record<number, string> = {
  1: 'First Contact',
  2: 'Second Touch',
  3: 'Follow-up Call',
  4: 'Home Visit',
  5: 'Integrated',
}

export function getSoulStageLabel(stage: number): string {
  return FOLLOW_UP_STAGE_LABELS[stage] ?? `Stage ${stage}`
}

// ── Role hierarchy ────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  developer:      'Developer Admin',
  senior_pastor:  'Senior Pastor',
  pastor:         'Branch Pastor',
  admin:          'Administrator',
  unit_head:      'Unit Head',
  worker:         'Worker',
  guest:          'Guest',
}

export const ROLE_COLORS: Record<string, string> = {
  developer:      '#7C3AED',
  senior_pastor:  '#1B4332',
  pastor:         '#6B46C1',
  admin:          '#C9A84C',
  unit_head:      '#0D9488',
  worker:         '#2B6CB0',
  guest:          '#6B7280',
}

// ── Backward-compat aliases (consumed by section components) ──────────────────

/** Alias: synchronous empty arrays — components load real data from Supabase */
export const branches: Branch[] = []
export const DEPARTMENTS: Department[] = []
export const announcements: unknown[] = []

// Chart seed shapes (components replace with live Supabase data)
export type GrowthPoint = { month: string; total: number; new: number; left: number }
export const memberGrowthMonthly: GrowthPoint[] = []

export type AttendanceRecord = { date: string; count: number; branch?: string }
export const weeklyAttendance: AttendanceRecord[] = []

export type CohortRow = { cohort: string; m0: number; m1: number; m2: number; m3: number; m6: number; m12: number }
export const retentionCohorts: CohortRow[] = []

export type RetentionPoint = { month: string; rate: number }
export const retentionMonthly: RetentionPoint[] = []

export type FunnelStep = { stage: string; count: number }
export const firstTimerFunnel: FunnelStep[] = []

export type ChurnReason = { reason: string; count: number }
export const churnReasons: ChurnReason[] = []

export type ServiceRecord = { date: string; service: string; branch: string; count: number }
export const SERVICE_RECORDS: ServiceRecord[] = []

// Alias for components importing BRANCH_COLORS
export const BRANCH_COLORS: Record<string, string> = {}
