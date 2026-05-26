'use strict'
const express = require('express')
const { z } = require('zod')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

/* ── Elevation levels ───────────────────────────────────────────────────── */
// private → unit → branch → global
const LEVEL_ORDER = ['private', 'unit', 'branch', 'global']
const ELEVATE_ROLE = { unit: 'unit_head', branch: 'branch_pastor', global: 'senior_pastor' }
const ROLE_LEVEL   = { member: 1, unit_head: 2, branch_pastor: 3, senior_pastor: 4, super_admin: 5 }

/* ── In-memory prayer store ─────────────────────────────────────────────── */
let PRAYERS = [
  { id: 'p1', authorId: 'u1', authorName: 'Adaeze O.', branchId: 'lekki',   text: "Please pray for my husband job interview next week.", level: 'branch',  intercessors: 24, ts: Date.now() - 86400000 * 2 },
  { id: 'p2', authorId: 'u2', authorName: 'Emeka N.',  branchId: 'gbagada', text: 'Trusting God for complete healing in my family.', level: 'global',  intercessors: 67, ts: Date.now() - 86400000     },
  { id: 'p3', authorId: 'u1', authorName: 'Kemi A.',   branchId: 'ikeja',   text: 'Breakthrough at work — I have been believing God for a promotion.', level: 'branch', intercessors: 12, ts: Date.now() - 3600000 * 3 },
  { id: 'p4', authorId: 'u2', authorName: 'Seun A.',   branchId: 'ph',      text: 'Safe delivery for my wife — due date is June 4.', level: 'unit',  intercessors: 8, ts: Date.now() - 3600000 },
]

/* ── GET /api/prayer ────────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const { level } = req.query
  const userLevel = ROLE_LEVEL[req.user.role] || 1
  const isSenior  = userLevel >= ROLE_LEVEL['senior_pastor']

  let visible = PRAYERS.filter(p => {
    if (p.level === 'global')  return true
    if (p.level === 'branch')  return isSenior || p.branchId === req.user.branchId
    if (p.level === 'unit')    return p.branchId === req.user.branchId
    if (p.level === 'private') return p.authorId === req.user.sub
    return false
  })

  if (level) visible = visible.filter(p => p.level === level)

  // Sort: newest first
  visible.sort((a, b) => b.ts - a.ts)

  res.json({ status: 'success', data: { prayers: visible, total: visible.length } })
})

/* ── POST /api/prayer ───────────────────────────────────────────────────── */
const createSchema = z.object({
  text:  z.string().min(5).max(500).trim(),
  level: z.enum(['private', 'unit']).default('unit'),
})

router.post('/', async (req, res, next) => {
  try {
    const { text, level } = createSchema.parse(req.body)

    const newPrayer = {
      id:          `p-${Date.now()}`,
      authorId:    req.user.sub,
      authorName:  req.user.name || 'Anonymous',
      branchId:    req.user.branchId,
      text,
      level,
      intercessors: 0,
      ts:           Date.now(),
    }
    PRAYERS.push(newPrayer)

    res.status(201).json({ status: 'success', data: newPrayer })
  } catch (err) { next(err) }
})

/* ── POST /api/prayer/:id/elevate ───────────────────────────────────────── */
router.post('/:id/elevate', async (req, res) => {
  const prayer = PRAYERS.find(p => p.id === req.params.id)
  if (!prayer) return res.status(404).json({ status: 'error', message: 'Prayer request not found.' })

  const currentIdx = LEVEL_ORDER.indexOf(prayer.level)
  if (currentIdx === -1 || currentIdx >= LEVEL_ORDER.length - 1) {
    return res.status(400).json({ status: 'error', message: 'Prayer is already at the highest level.' })
  }

  const nextLevel    = LEVEL_ORDER[currentIdx + 1]
  const requiredRole = ELEVATE_ROLE[nextLevel]
  const userLevel    = ROLE_LEVEL[req.user.role] || 0
  const minLevel     = ROLE_LEVEL[requiredRole] || 999

  if (userLevel < minLevel) {
    return res.status(403).json({ status: 'error', message: `Elevating to ${nextLevel} requires role: ${requiredRole}.` })
  }

  // Branch access check: can only elevate prayers from own branch (unless senior+)
  if (!['senior_pastor','super_admin'].includes(req.user.role) && prayer.branchId !== req.user.branchId) {
    return res.status(403).json({ status: 'error', message: 'Cannot elevate prayers from another branch.' })
  }

  prayer.level = nextLevel
  prayer.elevatedBy   = req.user.sub
  prayer.elevatedAt   = Date.now()

  res.json({ status: 'success', data: prayer, message: `Prayer elevated to ${nextLevel} wall.` })
})

/* ── POST /api/prayer/:id/intercede ─────────────────────────────────────── */
router.post('/:id/intercede', (req, res) => {
  const prayer = PRAYERS.find(p => p.id === req.params.id)
  if (!prayer) return res.status(404).json({ status: 'error', message: 'Prayer not found.' })

  prayer.intercessors += 1
  res.json({ status: 'success', data: { intercessors: prayer.intercessors } })
})

/* ── DELETE /api/prayer/:id ─────────────────────────────────────────────── */
router.delete('/:id', requireRole('branch_pastor'), (req, res) => {
  const idx = PRAYERS.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ status: 'error', message: 'Prayer not found.' })

  const prayer = PRAYERS[idx]
  const isSenior = ['senior_pastor','super_admin'].includes(req.user.role)

  if (!isSenior && prayer.branchId !== req.user.branchId) {
    return res.status(403).json({ status: 'error', message: 'Access denied.' })
  }

  PRAYERS.splice(idx, 1)
  res.json({ status: 'success', message: 'Prayer request removed.' })
})

module.exports = router
