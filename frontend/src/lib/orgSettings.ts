/**
 * Org settings — loaded from Supabase `organisations` table.
 * Falls back to a localStorage cache for offline/pre-load rendering.
 *
 * Security note: This module stores only non-sensitive display config.
 * No credentials, tokens, or PII are stored here.
 * The authoritative source is always the Supabase `organisations` table,
 * enforced by RLS (only admins can write, authenticated users can read).
 */

import { createClient } from '@supabase/supabase-js'

// ── Types ────────────────────────────────────────────────────────────────────

export type OrgSettings = {
  id:               string
  slug:             string
  name:             string
  tagline:          string
  logoUrl:          string
  address:          string
  city:             string
  country:          string
  phone:            string
  email:            string
  website:          string
  primaryColor:     string
  accentColor:      string
  timezone:         string
  currency:         string
  appName:          string            // SanctuaryHQ | SanctuaryHQ | PulpitPro
  poweredByText:    string
  poweredByUrl:     string
  poweredByVisible: boolean
  allowSelfReg:     boolean
  requireApproval:  boolean
  followupStages:   string[]
}

// ── Defaults (used before DB load & when Supabase is not configured) ──────────

export const ORG_DEFAULTS: OrgSettings = {
  id:               '',
  slug:             'default',
  name:             'My Church',
  tagline:          '',
  logoUrl:          '',
  address:          '',
  city:             '',
  country:          'NG',
  phone:            '',
  email:            '',
  website:          '',
  primaryColor:     '#1B4332',
  accentColor:      '#C9A84C',
  timezone:         'Africa/Lagos',
  currency:         'NGN',
  appName:          'SanctuaryHQ',
  poweredByText:    'Powered by Anchorsuites Technologies Ltd',
  poweredByUrl:     'https://anchorsuites.com',
  poweredByVisible: true,
  allowSelfReg:     true,
  requireApproval:  true,
  followupStages:   ['2 weeks', '4 weeks', '3 months', '4 months'],
}

// ── localStorage cache key ────────────────────────────────────────────────────

const CACHE_KEY = 'sanctuaryhq_org_settings_v2'

function readCache(): OrgSettings {
  if (typeof window === 'undefined') return ORG_DEFAULTS
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return ORG_DEFAULTS
    return { ...ORG_DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return ORG_DEFAULTS
  }
}

function writeCache(s: OrgSettings): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)) } catch {}
}

// ── DB row → OrgSettings ──────────────────────────────────────────────────────

function rowToSettings(row: Record<string, unknown>): OrgSettings {
  return {
    id:               String(row.id || ''),
    slug:             String(row.slug || 'default'),
    name:             String(row.name || 'My Church'),
    tagline:          String(row.tagline || ''),
    logoUrl:          String(row.logo_url || ''),
    address:          String(row.address || ''),
    city:             String(row.city || ''),
    country:          String(row.country || 'NG'),
    phone:            String(row.phone || ''),
    email:            String(row.email || ''),
    website:          String(row.website || ''),
    primaryColor:     String(row.primary_color || '#1B4332'),
    accentColor:      String(row.accent_color || '#C9A84C'),
    timezone:         String(row.timezone || 'Africa/Lagos'),
    currency:         String(row.currency || 'NGN'),
    appName:          String(row.app_name || 'SanctuaryHQ'),
    poweredByText:    String(row.powered_by_text || 'Powered by Anchorsuites Technologies Ltd'),
    poweredByUrl:     String(row.powered_by_url || 'https://anchorsuites.com'),
    poweredByVisible: row.powered_by_visible !== false,
    allowSelfReg:     row.allow_self_reg !== false,
    requireApproval:  row.require_approval !== false,
    followupStages:   Array.isArray(row.followup_stages)
      ? (row.followup_stages as string[])
      : ORG_DEFAULTS.followupStages,
  }
}

// ── OrgSettings → DB row ──────────────────────────────────────────────────────

function settingsToRow(s: Partial<OrgSettings>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (s.name             !== undefined) row.name               = s.name
  if (s.tagline          !== undefined) row.tagline             = s.tagline
  if (s.logoUrl          !== undefined) row.logo_url            = s.logoUrl
  if (s.address          !== undefined) row.address             = s.address
  if (s.city             !== undefined) row.city                = s.city
  if (s.country          !== undefined) row.country             = s.country
  if (s.phone            !== undefined) row.phone               = s.phone
  if (s.email            !== undefined) row.email               = s.email
  if (s.website          !== undefined) row.website             = s.website
  if (s.primaryColor     !== undefined) row.primary_color       = s.primaryColor
  if (s.accentColor      !== undefined) row.accent_color        = s.accentColor
  if (s.timezone         !== undefined) row.timezone            = s.timezone
  if (s.currency         !== undefined) row.currency            = s.currency
  if (s.appName          !== undefined) row.app_name            = s.appName
  if (s.poweredByText    !== undefined) row.powered_by_text     = s.poweredByText
  if (s.poweredByUrl     !== undefined) row.powered_by_url      = s.poweredByUrl
  if (s.poweredByVisible !== undefined) row.powered_by_visible  = s.poweredByVisible
  if (s.allowSelfReg     !== undefined) row.allow_self_reg      = s.allowSelfReg
  if (s.requireApproval  !== undefined) row.require_approval    = s.requireApproval
  if (s.followupStages   !== undefined) row.followup_stages     = s.followupStages
  return row
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns cached settings synchronously — safe to call during render. */
export function getOrgSettings(): OrgSettings {
  return readCache()
}

/** Loads settings from Supabase and refreshes the cache. Returns the result. */
export async function loadOrgSettings(): Promise<OrgSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return readCache()

  try {
    const sb = createClient(url, key)
    const { data, error } = await sb
      .from('organisations')
      .select('*')
      .limit(1)
      .single()

    if (error || !data) return readCache()
    const settings = rowToSettings(data as Record<string, unknown>)
    writeCache(settings)
    return settings
  } catch {
    return readCache()
  }
}

/** Saves partial settings to Supabase AND updates the cache.
 *  Must be called from an authenticated admin session. */
export async function saveOrgSettings(
  orgId: string,
  partial: Partial<OrgSettings>
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // localStorage-only fallback
    const current = readCache()
    writeCache({ ...current, ...partial })
    return { ok: true }
  }

  try {
    const sb = createClient(url, key)
    const row = settingsToRow(partial)
    const { error } = await sb
      .from('organisations')
      .update(row)
      .eq('id', orgId)

    if (error) return { ok: false, error: error.message }

    // Update cache
    const current = readCache()
    writeCache({ ...current, ...partial })
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/** Clears the settings cache (used on sign-out). */
export function clearOrgCache(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

// ── React hook ────────────────────────────────────────────────────────────────
// Import { useOrgSettings } from '@/lib/orgSettings' in components

import { useState, useEffect } from 'react'

export function useOrgSettings() {
  const [settings, setSettings] = useState<OrgSettings>(readCache)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadOrgSettings().then(s => {
      if (!cancelled) { setSettings(s); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  return { settings, loading }
}
