// Org-level settings — stored in localStorage, editable by super admin
// In production these would be stored in the database

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
