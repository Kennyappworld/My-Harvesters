'use strict'
const express   = require('express')
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { z }     = require('zod')
const { v4: uuidv4 } = require('uuid')
const { requireAuth, revokedTokens } = require('../middleware/auth')

const router = express.Router()

/* ── Auth-specific rate limiter: 10 failures per 15 min per IP ────────── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  // SECURITY: Only count failed requests — legitimate users not penalised
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status:'error', message:'Too many failed attempts. Please try again in 15 minutes.' },
})

/* ── In-memory refresh token store (replace with Redis in production) ─── */
const refreshTokenStore = new Map() // jti → { userId, issuedAt }

/* ── Demo user store (replace with MongoDB in production) ─────────────── */
const USERS = [
  {
    id: 'u1',
    email: 'pastor@hicc.org',
    // bcrypt hash of 'demo123' (rounds=12)
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8go.0pREea',
    name: 'Pastor Bolaji Idowu',
    role: 'senior_pastor',
    branchId: 'lekki',
  },
  {
    id: 'u2',
    email: 'gbagada@hicc.org',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8go.0pREea',
    name: 'Pastor Emeka Nwosu',
    role: 'branch_pastor',
    branchId: 'gbagada',
  },
]

/* ── Validation schemas ────────────────────────────────────────────────── */
const loginSchema = z.object({
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(6).max(128),
})

/* ── POST /api/auth/login ─────────────────────────────────────────────── */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = USERS.find(u => u.email === email)

    // SECURITY: Always run bcrypt.compare even if user not found.
    // This ensures identical response time whether email exists or not,
    // preventing user enumeration via timing attacks.
    const DUMMY_HASH = '$2a$12$invalidhashpaddingtomatchbcryptlength00000000000000000000'
    const hashToCheck = user ? user.passwordHash : DUMMY_HASH
    const valid = await bcrypt.compare(password, hashToCheck)

    if (!user || !valid) {
      // Generic message — never reveal which field was wrong
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      })
    }

    // Issue access token (15 min)
    const accessJti  = uuidv4()
    const refreshJti = uuidv4()

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, branchId: user.branchId, jti: accessJti },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m', issuer: 'hicc-api', audience: 'hicc-client', algorithm: 'HS256' }
    )

    const refreshToken = jwt.sign(
      { sub: user.id, jti: refreshJti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d', issuer: 'hicc-api', audience: 'hicc-client', algorithm: 'HS256' }
    )

    // Store refresh jti for rotation tracking
    refreshTokenStore.set(refreshJti, { userId: user.id, issuedAt: Date.now() })

    // Set refresh token as httpOnly Secure SameSite=Strict cookie (not accessible to JS)
    res.cookie('hicc_rt', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
      path:     '/api/auth',  // Scoped — not sent to other endpoints
    })

    res.json({
      status: 'success',
      data: {
        accessToken,
        user: {
          id:       user.id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          branchId: user.branchId,
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

/* ── POST /api/auth/refresh ───────────────────────────────────────────── */
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.hicc_rt
    if (!token) {
      return res.status(401).json({ status:'error', message:'No refresh token.' })
    }

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'], issuer: 'hicc-api', audience: 'hicc-client',
    })

    // SECURITY: Token rotation — check that this jti was issued by us
    if (!refreshTokenStore.has(payload.jti)) {
      // Possible token replay — the token was already rotated or explicitly revoked
      res.clearCookie('hicc_rt', { path: '/api/auth' })
      return res.status(401).json({ status:'error', message:'Token reuse detected. Please sign in again.' })
    }

    // Revoke old refresh jti and issue new one (rotation)
    refreshTokenStore.delete(payload.jti)

    const user = USERS.find(u => u.id === payload.sub)
    if (!user) return res.status(401).json({ status:'error', message:'User not found.' })

    const newAccessJti  = uuidv4()
    const newRefreshJti = uuidv4()

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, branchId: user.branchId, jti: newAccessJti },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m', issuer: 'hicc-api', audience: 'hicc-client', algorithm: 'HS256' }
    )

    const newRefreshToken = jwt.sign(
      { sub: user.id, jti: newRefreshJti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', issuer: 'hicc-api', audience: 'hicc-client', algorithm: 'HS256' }
    )

    refreshTokenStore.set(newRefreshJti, { userId: user.id, issuedAt: Date.now() })

    res.cookie('hicc_rt', newRefreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth',
    })

    res.json({ status: 'success', data: { accessToken } })
  } catch (err) {
    next(err)
  }
})

/* ── POST /api/auth/logout ────────────────────────────────────────────── */
router.post('/logout', requireAuth, (req, res) => {
  // Revoke the access token's jti
  if (req.user?.jti) revokedTokens.add(req.user.jti)

  // Clear the refresh cookie
  res.clearCookie('hicc_rt', { path: '/api/auth' })

  res.json({ status: 'success', message: 'Signed out successfully.' })
})

/* ── GET /api/auth/me ─────────────────────────────────────────────────── */
router.get('/me', requireAuth, (req, res) => {
  const user = USERS.find(u => u.id === req.user.sub)
  if (!user) return res.status(404).json({ status:'error', message:'User not found.' })

  res.json({
    status: 'success',
    data: { id: user.id, name: user.name, email: user.email, role: user.role, branchId: user.branchId },
  })
})

module.exports = router
