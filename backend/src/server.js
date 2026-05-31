/**
 * HICC Backend API v3.0
 * ─────────────────────────────────────────────────────────────────────────
 * Security hardening checklist (30-year cybersecurity expert standard):
 *
 * OWASP Top 10 2025:
 *  A01 Broken Access Control    → requireRole() + requireBranchAccess() on every route
 *  A02 Cryptographic Failures   → bcrypt rounds=12, JWT HS256, httpOnly cookies, HTTPS-only
 *  A03 Injection                → Zod validation + mongoSanitize + xss-clean on all inputs
 *  A04 Insecure Design          → Principle of least privilege, deny-by-default
 *  A05 Security Misconfiguration→ Helmet CSP, HSTS, no X-Powered-By, CORS allowlist
 *  A06 Vulnerable Components    → npm audit in CI/CD pipeline
 *  A07 Auth & Session Failures  → Short-lived JWTs (15min), refresh rotation, rate limiting
 *  A08 Data Integrity Failures  → JWT algorithm pinning (HS256 only), issuer/audience checks
 *  A09 Logging & Monitoring     → Morgan + request ID logging, graceful shutdown
 *  A10 SSRF                     → No user-controlled URLs; internal requests blocked
 * ─────────────────────────────────────────────────────────────────────────
 */
'use strict'

require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const rateLimit   = require('express-rate-limit')
const morgan      = require('morgan')
const mongoSanitize = require('express-mongo-sanitize')
const xssClean    = require('xss-clean')
const hpp         = require('hpp')
const compression = require('compression')
const cookieParser= require('cookie-parser')

const authRoutes     = require('./routes/auth')
const analyticsRoutes= require('./routes/analytics')
const memberRoutes   = require('./routes/members')
const branchRoutes   = require('./routes/branches')
const givingRoutes   = require('./routes/giving')
const chatRoutes     = require('./routes/chat')
const prayerRoutes   = require('./routes/prayer')
const { errorHandler } = require('./middleware/error')
const { requestLogger }= require('./middleware/logger')

const app = express()

/* ── Trust proxy (needed behind Vercel/Railway/Nginx) ─────────────────── */
app.set('trust proxy', 1)

/* ── Security headers (Helmet) ─────────────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],   // Prevent clickjacking
      upgradeInsecureRequests: [],  // Force HTTPS
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },  // 2-year HSTS
  crossOriginEmbedderPolicy: true,
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))
app.disable('x-powered-by')  // Don't reveal Express version

/* ── CORS — explicit allowlist, never wildcard ─────────────────────────── */
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and allowlisted origins
    if (!origin || ALLOWED.includes(origin)) return cb(null, true)
    cb(Object.assign(new Error('CORS policy violation'), { status: 403 }))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,   // Required for httpOnly cookies
  maxAge: 86400,       // 24h preflight cache
}))
app.options('*', cors())

/* ── Cookie parser (for httpOnly refresh tokens) ──────────────────────── */
app.use(cookieParser())

/* ── Body parsing with strict size limits (prevents DoS) ──────────────── */
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

/* ── Input sanitisation stack ─────────────────────────────────────────── */
app.use(mongoSanitize())          // Strip $ and . from keys (NoSQL injection — A03)
app.use(xssClean())               // Sanitise HTML entities in body/params/query (A03)
app.use(hpp({                     // HTTP parameter pollution (A03)
  whitelist: ['sort', 'fields', 'page', 'limit', 'branchId'],
}))

/* ── Compression ──────────────────────────────────────────────────────── */
app.use(compression())

/* ── Request logging + ID injection ──────────────────────────────────── */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}
app.use(requestLogger)

/* ── Rate limiting (A07) ──────────────────────────────────────────────── */

// Global: 200 req / 15 min per IP
app.use('/api', rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             200,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { status: 'error', message: 'Too many requests. Please retry after 15 minutes.' },
}))

// Auth: 10 failed attempts / 15 min (only counts failures via skipSuccessfulRequests)
const authLimiter = rateLimit({
  windowMs:              15 * 60 * 1000,
  max:                   10,
  skipSuccessfulRequests: true,
  message:               { status: 'error', message: 'Too many failed login attempts. Please wait 15 minutes.' },
})
app.use('/api/auth/login',    authLimiter)
app.use('/api/auth/register', authLimiter)

/* ── Health check (public) ─────────────────────────────────────────────── */
app.get('/health', (req, res) => res.json({
  status:    'ok',
  env:       process.env.NODE_ENV || 'development',
  version:   '3.0.0',
  timestamp: new Date().toISOString(),
}))

/* ── API routes ────────────────────────────────────────────────────────── */
app.use('/api/auth',      authRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/members',   memberRoutes)
app.use('/api/branches',  branchRoutes)
app.use('/api/giving',    givingRoutes)
app.use('/api/chat',      chatRoutes)
app.use('/api/prayer',    prayerRoutes)

/* ── 404 ────────────────────────────────────────────────────────────────── */
app.all('*', (req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.originalUrl} not found.` })
})

/* ── Global error handler ─────────────────────────────────────────────── */
app.use(errorHandler)

/* ── Start ─────────────────────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || '5000', 10)
const server = app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development'
  console.log(`[HICC API v3.0] Listening on :${PORT} · ${env}`)
  if (env === 'production' && !process.env.JWT_ACCESS_SECRET) {
    console.error('[HICC API] FATAL: JWT_ACCESS_SECRET not set. Shutting down.')
    process.exit(1)
  }
})

/* ── Graceful shutdown ─────────────────────────────────────────────────── */
const shutdown = (signal) => {
  console.log(`[HICC API] ${signal} received — shutting down gracefully`)
  server.close(() => { console.log('[HICC API] Server closed.'); process.exit(0) })
  setTimeout(() => { console.error('[HICC API] Force-exiting after timeout'); process.exit(1) }, 10000)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('unhandledRejection', (err) => {
  console.error('[HICC API] Unhandled rejection:', err)
  shutdown('unhandledRejection')
})

module.exports = app
