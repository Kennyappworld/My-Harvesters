// Org-level settings — stored in localStorage, editable by super admin
// Security note: localStorage is readable by any JS on the page (XSS risk).
// This store contains only non-sensitive display config (logo, org name, UI prefs).
// It intentionally contains NO credentials, tokens, or PII.
// In production: org settings would be fetched from /api/org/settings with
// a proper session cookie and stored server-side.

export type OrgSettings = {
  name: string
  logoUrl: string        // base64 data URL or empty string
  poweredByText: string
  poweredByUrl: string
  poweredByVisible: boolean
}

const DEFAULTS: OrgSettings = {
  name: 'Harvesters International Christian Centre',
  logoUrl: '',
  poweredByText: 'Powered by Anchorsuites Technologies Ltd',
  poweredByUrl: 'https://anchorsuites.com',
  poweredByVisible: true,
}

const KEY = 'hicc_org_settings'

export function getOrgSettings(): OrgSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const stored = localStorage.getItem(KEY)
    if (!stored) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {
    return DEFAULTS
  }
}

export function saveOrgSettings(settings: Partial<OrgSettings>): void {
  if (typeof window === 'undefined') return
  const current = getOrgSettings()
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...settings }))
}
