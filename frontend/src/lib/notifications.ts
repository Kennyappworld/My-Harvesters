/**
 * Push notification utilities — HICC Workforce Platform
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function subscribeToPush(_userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) return true
    // Full push subscription requires a VAPID public key in NEXT_PUBLIC_VAPID_PUBLIC_KEY
    // and a server-side endpoint to receive + dispatch payloads via web-push library.
    // Until configured, we fall back to local notifications only.
    return false
  } catch {
    return false
  }
}

export function showLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return
  try {
    const n = new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'hicc-notif' })
    n.onclick = () => { window.focus(); n.close() }
  } catch {}
}

export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
}

/**
 * Soul follow-up reminder — fires a local notification when converts
 * are at stage 1 for more than 14 days without follow-up.
 */
export async function checkSoulFollowUpReminders(userId: string): Promise<void> {
  if (typeof window === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('soul_records')
      .select('id, first_name, follow_up_stage, created_at')
      .eq('led_by', userId)
      .eq('follow_up_stage', 1)
      .lt('created_at', cutoff)
      .limit(5)
    if (data && data.length > 0) {
      const names = data.map((s: Record<string, string>) => s.first_name).join(', ')
      showLocalNotification(
        `${data.length} soul${data.length > 1 ? 's' : ''} need follow-up`,
        `${names} — recorded over 2 weeks ago, still at stage 1. Time to check in.`
      )
    }
  } catch {}
}
