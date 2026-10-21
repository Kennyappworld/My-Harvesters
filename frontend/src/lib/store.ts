// Lightweight localStorage persistence store
// Replaces React-only state for all user-generated data
// In production: swap the get/set calls for API calls to Supabase/Railway

type StorageKey =
  | 'sanctuaryhq_chat_channels'
  | 'sanctuaryhq_prayer_requests'
  | 'sanctuaryhq_testimonies'
  | 'sanctuaryhq_soul_tracker'
  | 'sanctuaryhq_announcements'
  | 'sanctuaryhq_events'
  | 'sanctuaryhq_members_photos'
  | 'sanctuaryhq_meetings'
  | 'sanctuaryhq_network_profiles'
  | 'sanctuaryhq_network_opps'
  | 'sanctuaryhq_access_requests'
  | 'sanctuaryhq_verif_members'
  | 'sanctuaryhq_attendance'
  | 'sanctuaryhq_devotional_plans'
  | 'sanctuaryhq_chat_channels_v2'
  | 'sanctuaryhq_chat_invites'
  | 'sanctuaryhq_wa_numbers'
  | 'sanctuaryhq_members'
  | 'sanctuaryhq_souls'
  | 'sanctuaryhq_meetings_v2'
  | 'sanctuaryhq_giving'
  | 'sanctuaryhq_departments'
  | 'sanctuaryhq_branches'
  | 'sanctuaryhq_custom_scriptures'

export function persist<T>(key: StorageKey, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Storage quota exceeded or private browsing restriction — fail silently
  }
}

export function hydrate<T>(key: StorageKey, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function clearKey(key: StorageKey): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
