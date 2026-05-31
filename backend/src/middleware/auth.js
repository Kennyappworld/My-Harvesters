'use strict'
const jwt = require('jsonwebtoken')
const ROLES = { member:1, unit_head:2, branch_pastor:3, senior_pastor:4, super_admin:5 }
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ status:'error', message:'Authentication required.' })
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_ACCESS_SECRET, { algorithms:['HS256'], issuer:'hicc-api', audience:'hicc-users' })
    req.user = { id:decoded.sub, email:decoded.email, role:decoded.role, branchId:decoded.branchId, name:decoded.name }
    next()
  } catch (err) {
    if (err.name==='TokenExpiredError') return res.status(401).json({ status:'error', code:'TOKEN_EXPIRED', message:'Session expired.' })
    return res.status(401).json({ status:'error', message:'Invalid token.' })
  }
}
const requireRole = (min) => (req, res, next) => {
  if ((ROLES[req.user?.role]||0) < (ROLES[min]||99)) return res.status(403).json({ status:'error', message:`Requires role: ${min}.` })
  next()
}
const requireBranchAccess = (req, res, next) => {
  if ((ROLES[req.user?.role]||0) >= ROLES['senior_pastor']) return next()
  const target = req.params.branchId || req.query.branchId || req.body.branchId
  if (target && target !== req.user?.branchId) return res.status(403).json({ status:'error', message:'Access denied: own branch only.' })
  next()
}
module.exports = { authenticate, requireRole, requireBranchAccess, ROLES }
