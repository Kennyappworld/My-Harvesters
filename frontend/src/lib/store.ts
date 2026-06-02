// Lightweight localStorage persistence store
// Replaces React-only state for all user-generated data
// In production: swap the get/set calls for API calls to Supabase/Railway

type StorageKey =
  | 'hicc_chat_channels'
  | 'hicc_prayer_requests'
  | 'hicc_testimonies'
  | 'hicc_soul_tracker'
  | 'hicc_announcements'
  | 'hicc_events'
  | 'hicc_members_photos'
  | 'hicc_meetings'
  | 'hicc_network_profiles'
  | 'hicc_network_opps'
  | 'hicc_verif_members'
  | 'hicc_attendance'
  | 'hicc_devotional_plans'
  | 'hicc_chat_channels_v2'
  | 'hicc_chat_invites'
  | 'hicc_wa_numbers'
  | 'hicc_members'
  | 'hicc_souls'

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
