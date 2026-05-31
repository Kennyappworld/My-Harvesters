// Push notification utilities
// In production, the VAPID key pair and subscription management
// live in the backend. This module handles the browser side.

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) return true

    // In production: fetch the VAPID public key from /api/push/vapid-public-key
    // and pass it to subscribe(). For now we just check capability.
    return true
  } catch {
    return false
  }
}

// Show a local notification when the tab is not visible
export function showLocalNotification(title: string, body: string, icon = '/icon-192.png') {
  if (Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return // don't spam if they're looking at it

  new Notification(title, { body, icon, badge: '/icon-192.png', tag: 'hicc-notif' })
}

// Check if the app is running as an installed PWA
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}
