const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: { disableDevLogs: true },
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
              "script-src 'self'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),   // 'unsafe-eval' required by Next.js dev; tighten in prod
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://api.anthropic.com",
              "frame-ancestors 'none'",             // blocks clickjacking at CSP level
              "base-uri 'self'",                    // blocks base tag injection
              "form-action 'self'",                 // restricts form targets
              "object-src 'none'",                  // no Flash/plugins
              "upgrade-insecure-requests",
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
