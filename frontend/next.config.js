const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /\/(login|signup|api\/)(.*)/,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/_next\/static\/chunks\/app\/.+\.js$/i,
        handler: 'NetworkFirst',
        options: { cacheName: 'next-app-chunks', networkTimeoutSeconds: 5 },
      },
      {
        urlPattern: /\/_next\/static\/.+\.(css|js)$/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'next-static-assets', expiration: { maxEntries: 128, maxAgeSeconds: 86400 } },
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: { cacheName: 'google-fonts', expiration: { maxEntries: 8, maxAgeSeconds: 604800 } },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'CacheFirst',
        options: { cacheName: 'images', expiration: { maxEntries: 64, maxAgeSeconds: 2592000 } },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,        // never leak X-Powered-By: Next.js
  compress: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,   // block SVG XSS payloads via <img>
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ── Transport security ──────────────────────────────────────────────
          { key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload' },

          // ── Content Security Policy ─────────────────────────────────────────
          // script-src allows only same-origin + Google Fonts JS
          // style-src allows Google Fonts inline styles
          // img-src allows data: (base64 logos) + Cloudinary
          // connect-src allows Anthropic API + own origin
          { key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'" + (process.env.NODE_ENV === "development" ? " 'unsafe-inline' 'unsafe-eval'" : ""),
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://fonts.googleapis.com https://fonts.gstatic.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; ')
          },

          // ── Framing / clickjacking ──────────────────────────────────────────
          { key: 'X-Frame-Options', value: 'DENY' },

          // ── MIME sniffing ───────────────────────────────────────────────────
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // ── Referrer ────────────────────────────────────────────────────────
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // ── Permissions ─────────────────────────────────────────────────────
          { key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },

          // ── DNS prefetch ────────────────────────────────────────────────────
          { key: 'X-DNS-Prefetch-Control', value: 'on' },

          // ── Cross-Origin policies ───────────────────────────────────────────
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          // COEP: require-corp breaks Google Fonts. Use credentialless for compatibility.
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },

          // ── Search engine indexing — this is a private workforce app ────────
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet, noodp, noarchive' },
        ],
      },
      // ── Cache static assets aggressively ─────────────────────────────────
      {
        source: '/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  // Redirect HTTP → HTTPS at app level (belt-and-suspenders)
  async redirects() {
    return []
  },
}

module.exports = withPWA(nextConfig)
