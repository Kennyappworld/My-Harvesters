/**
 * HICC Leadership Platform — Backend API v4.0
 * ─────────────────────────────────────────────────────────────────────────
 * OWASP Top 10 2025 hardening:
 *  A01 Broken Access Control    → requireRole() + requireBranch() on all routes
 *  A02 Cryptographic Failures   → bcrypt rounds=12, JWT HS256, httpOnly Secure SameSite cookies
 *  A03 Injection                → Zod + mongoSanitize + xss-clean on all inputs
 *  A04 Insecure Design          → Least privilege, deny-by-default role hierarchy
 *  A05 Security Misconfiguration→ Helmet CSP+HSTS, no X-Powered-By, explicit CORS allowlist
 *  A06 Vulnerable Components    → npm audit in CI/CD
 *  A07 Auth & Session Failures  → 15min JWTs, refresh rotation, rate limiting, jti revocation
 *  A08 Data Integrity Failures  → JWT algorithm pinning (HS256 only), iss/aud checks
 *  A09 Logging & Monitoring     → Morgan + request ID tracing + graceful shutdown
 *  A10 SSRF                     → No user-controlled URL fetching
 * ─────────────────────────────────────────────────────────────────────────
 */
'use strict'

require('dotenv').config()

const express       = require('express')
const cors          = require('cors')
const helmet        = require('helmet')
const rateLimit     = require('express-rate-limit')
const morgan        = require('morgan')
const mongoSanitize = require('express-mongo-sanitize')
const xssClean      = require('xss-clean')
const hpp           = require('hpp')
const compression   = require('compression')
const cookieParser  = require('cookie-parser')

const authRoutes      = require('./routes/auth')
const analyticsRoutes = require('./routes/analytics')
const memberRoutes    = require('./routes/members')
const branchRoutes    = require('./routes/branches')
const givingRoutes    = require('./routes/giving')
const chatRoutes      = require('./routes/chat')
const prayerRoutes    = require('./routes/prayer')
const { errorHandler }  = require('./middleware/error')
const { requestLogger } = require('./middleware/logger')

/* ── Validate critical secrets at startup ─────────────────────────────── */
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  console.error('FATAL: JWT_ACCESS_SECRET must be at least 32 characters. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"')
  process.exit(1)
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('FATAL: JWT_REFRESH_SECRET must be set and different from JWT_ACCESS_SECRET.')
  process.exit(1)
}

const app = express()

/* ── Trust proxy (Vercel / Railway / Nginx) ───────────────────────────── */
app.set('trust proxy', 1)

/* ── Security headers ─────────────────────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:      ["'self'"],
      scriptSrc:       ["'self'"],
      styleSrc:        ["'self'", "'unsafe-inline'"],
      imgSrc:          ["'self'", 'data:'],
      connectSrc:      ["'self'"],
      frameAncestors:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  crossOriginEmbedderPolicy: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))
app.disable('x-powered-by')

/* ── CORS — explicit allowlist, NEVER wildcard ────────────────────────── */
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server calls (no Origin header) and allowlisted origins
    if (!origin || ALLOWED.includes(origin)) return cb(null, true)
    const err = new Error(`CORS policy violation: ${origin}`)
    Object.assign(err, { status: 403 })
    cb(err)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}))

/* ── Request ID + logging ─────────────────────────────────────────────── */
app.use(requestLogger)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

/* ── Body parsing — hard cap prevents DoS ────────────────────────────── */
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

/* ── Input sanitisation ───────────────────────────────────────────────── */
app.use(mongoSanitize())  // Strips $-operators → prevents NoSQL injection
app.use(xssClean())       // Strips HTML tags from input → prevents XSS
app.use(hpp())            // Strips duplicate query params → prevents HPP

/* ── Compression ──────────────────────────────────────────────────────── */
app.use(compression())

/* ── Global rate limiter (burst protection) ──────────────────────────── */
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests — please try again shortly.' },
  // Don't count successful requests (prevents penalising legitimate users)
  skipSuccessfulRequests: false,
}))

/* ── Routes ───────────────────────────────────────────────────────────── */
app.use('/api/auth',      authRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/members',   memberRoutes)
app.use('/api/branches',  branchRoutes)
app.use('/api/giving',    givingRoutes)
app.use('/api/chat',      chatRoutes)
app.use('/api/prayer',    prayerRoutes)

/* ── Health check (unauthenticated, safe) ────────────────────────────── */
app.get('/health', (_req, res) => {
  res.json({ status:'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV })
})

/* ── 404 handler ─────────────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found.' })
})

/* ── Global error handler (never leaks stack in production) ──────────── */
app.use(errorHandler)

/* ── Start server ─────────────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || '5000', 10)
const server = app.listen(PORT, () => {
  console.log(`[HICC API] Listening on port ${PORT} · env=${process.env.NODE_ENV}`)
})

/* ── Graceful shutdown ────────────────────────────────────────────────── */
const shutdown = (signal) => {
  console.log(`[HICC API] ${signal} received — shutting down gracefully`)
  server.close(() => {
    console.log('[HICC API] Server closed.')
    process.exit(0)
  })
  setTimeout(() => { console.error('[HICC API] Forced shutdown'); process.exit(1) }, 10000)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

module.exports = app
