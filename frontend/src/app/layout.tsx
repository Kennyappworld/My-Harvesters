import type { Metadata, Viewport } from 'next'
import './globals.css'
import ToastProvider from './ToastProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#15803d',
}

export const metadata: Metadata = {
  title: 'SanctuaryHQ — Workforce Community',
  description: 'Workforce Community powered by SanctuaryHQ',
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SanctuaryHQ',
  },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts — preconnect declared first, then single stylesheet request */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Plus Jakarta Sans (display/headings), Inter (body fallback),
          JetBrains Mono (code) — all loaded in one request.
          globals.css @import also requests these; the browser deduplicates.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
