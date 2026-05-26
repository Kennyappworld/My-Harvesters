'use strict'
const jwt = require('jsonwebtoken')

/**
 * Role hierarchy — higher number = more access.
 * Strictly ascending: never grant permissions by skipping levels.
 */
const ROLE_LEVEL = {
  member:         1,
  unit_head:      2,
  branch_pastor:  3,
  senior_pastor:  4,
  super_admin:    5,
}

/**
 * In-memory token revocation store (jti).
 * In production: replace with Redis SET with TTL matching token expiry.
 */
const revokedTokens = new Set()

/**
 * requireAuth — verifies the JWT access token from Authorization header.
 * Algorithm pinned to HS256 to prevent alg:none or RS256 downgrade attacks.
 */
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ status:'error', message:'Authentication required.' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],           // Pin algorithm — never allow 'none'
      issuer:     'hicc-api',
      audience:   'hicc-client',
    })

    // Check if token has been revoked (logout, password reset, etc.)
    if (revokedTokens.has(payload.jti)) {
      return res.status(401).json({ status:'error', message:'Token has been revoked.' })
    }

    req.user = payload
    next()
  } catch (err) {
    next(err)  // Caught by global error handler → returns 401
  }
}

/**
 * requireRole(minRole) — middleware factory.
 * Denies access if the authenticated user's role level is below the minimum.
 */
const requireRole = (minRole) => (req, res, next) => {
  const userLevel = ROLE_LEVEL[req.user?.role] || 0
  const minLevel  = ROLE_LEVEL[minRole] || 999
  if (userLevel < minLevel) {
    return res.status(403).json({
      status: 'error',
      message: `Access denied. Required role: ${minRole}.`,
    })
  }
  next()
}

/**
 * requireBranchAccess — ensures a branch_pastor can only access their own branch.
 * Senior pastors and super admins can access any branch.
 */
const requireBranchAccess = (req, res, next) => {
  const userRole   = req.user?.role
  const userBranch = req.user?.branchId
  const paramBranch = req.params.branchId || req.query.branchId

  // Senior pastor and above can access any branch
  if (['senior_pastor','super_admin'].includes(userRole)) return next()

  // Others must match their own branch
  if (paramBranch && paramBranch !== userBranch) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only access your own branch data.',
    })
  }
  next()
}

module.exports = { requireAuth, requireRole, requireBranchAccess, revokedTokens, ROLE_LEVEL }
