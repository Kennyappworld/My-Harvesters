import type { Metadata, Viewport } from 'next'
import './globals.css'
import ToastProvider from './ToastProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B4332',
}

export const metadata: Metadata = {
  title: 'Harvesters International Christian Centre — Workforce Community',
  description: 'Workforce Community for Harvesters International Christian Centre',
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'HICC' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <meta name="mobile-web-app-capable" content="yes"/>
      </head>
      <body>
        {children}
        <ToastProvider/>
      </body>
    </html>
  )
}
