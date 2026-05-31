'use strict'
const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { z }   = require('zod')
const { v4: uuid } = require('uuid')
const { authenticate } = require('../middleware/auth')
const router = express.Router()

// Input validation schemas
const LoginSchema = z.object({
  email:    z.string().email().max(254).toLowerCase().trim(),
  password: z.string().min(8).max(128),
})

// Demo users — bcrypt hash of 'demo123' (cost factor 12)
const USERS = [
  { id:'usr_01', email:'pastor@hicc.org',           name:'Pastor Bolaji Idowu',  role:'senior_pastor',  branchId:'lekki',
    hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAosPZ3o5v2Yx4Ky' },
  { id:'usr_02', email:'pastor.ikeja@hicc.org',      name:'Pastor Kanmi Adeyemi', role:'branch_pastor',  branchId:'ikeja',
    hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAosPZ3o5v2Yx4Ky' },
  { id:'usr_03', email:'pastor.london@hicc.org',     name:'Pastor James Osei',    role:'branch_pastor',  branchId:'london',
    hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAosPZ3o5v2Yx4Ky' },
]

// In-memory refresh token revocation store (use Redis in production)
const revokedJtis = new Set()
const refreshStore = new Map() // jti → userId

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, branchId: user.branchId, name: user.name },
    process.env.JWT_ACCESS_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '15m', algorithm: 'HS256', issuer: 'hicc-api', audience: 'hicc-users' }
  )
}

function signRefresh(userId) {
  const jti = uuid()
  const token = jwt.sign(
    { sub: userId, jti },
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    { expiresIn: '7d', algorithm: 'HS256', issuer: 'hicc-api' }
  )
  refreshStore.set(jti, userId)
  return { token, jti }
}

function setRefreshCookie(res, token) {
  res.cookie('hicc_rt', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/api/auth',
  })
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ status:'error', message:'Validation failed.', errors: parsed.error.flatten() })

    const { email, password } = parsed.data
    const user = USERS.find(u => u.email === email)

    // Always run bcrypt — constant-time prevents user enumeration (A07)
    const dummyHash = '$2a$12$invalidhashpaddingtopreventimenumerationsideattack000000'
    const ok = await bcrypt.compare(password, user?.hash || dummyHash)

    if (!user || !ok) {
      // Generic message — don't reveal whether email exists
      return res.status(401).json({ status:'error', message:'Invalid email or password.' })
    }

    const access = signAccess(user)
    const { token: refresh } = signRefresh(user.id)
    setRefreshCookie(res, refresh)

    res.json({ status:'success', data: {
      accessToken: access,
      expiresIn: 900,
      user: { id:user.id, email:user.email, name:user.name, role:user.role, branchId:user.branchId },
    }})
  } catch (err) { next(err) }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.hicc_rt || req.body?.refreshToken
    if (!token) return res.status(401).json({ status:'error', message:'Refresh token required.' })

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production', {
        algorithms: ['HS256'], issuer: 'hicc-api',
      })
    } catch {
      return res.status(401).json({ status:'error', code:'REFRESH_EXPIRED', message:'Session expired. Please log in again.' })
    }

    if (revokedJtis.has(decoded.jti) || !refreshStore.has(decoded.jti)) {
      return res.status(401).json({ status:'error', message:'Token revoked. Please log in again.' })
    }

    // Rotate — delete old, issue new
    refreshStore.delete(decoded.jti)
    const user = USERS.find(u => u.id === decoded.sub)
    if (!user) return res.status(401).json({ status:'error', message:'User not found.' })

    const newAccess = signAccess(user)
    const { token: newRefresh } = signRefresh(user.id)
    setRefreshCookie(res, newRefresh)

    res.json({ status:'success', data: { accessToken: newAccess, expiresIn: 900 } })
  } catch (err) { next(err) }
})

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  const token = req.cookies?.hicc_rt
  if (token) {
    try {
      const decoded = jwt.decode(token)
      if (decoded?.jti) { revokedJtis.add(decoded.jti); refreshStore.delete(decoded.jti) }
    } catch {}
  }
  res.clearCookie('hicc_rt', { path:'/api/auth' })
  res.json({ status:'success', message:'Logged out.' })
})

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ status:'success', data: { user: req.user } })
})

module.exports = router
