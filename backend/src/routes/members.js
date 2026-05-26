'use strict'
const express = require('express')
const { z } = require('zod')
const { requireAuth, requireRole, requireBranchAccess } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

/* ── In-memory member store (replace with MongoDB) ──────────────────────── */
const MEMBERS = [
  { id: 'm1', name: 'Adaeze Okonkwo',  email: 'adaeze@example.com', branchId: 'lekki',   role: 'member',    unit: 'KidsHouse',      stage: 3, joinDate: '2023-03-15', active: true  },
  { id: 'm2', name: 'Emeka Nwachukwu', email: 'emeka@example.com',  branchId: 'gbagada', role: 'unit_head', unit: 'StirHouse',       stage: 4, joinDate: '2021-08-20', active: true  },
  { id: 'm3', name: 'Kemi Adeyemi',    email: 'kemi@example.com',   branchId: 'ikeja',   role: 'member',    unit: 'Workforce',       stage: 2, joinDate: '2024-01-10', active: true  },
  { id: 'm4', name: 'Tunde Olatunji',  email: 'tunde@example.com',  branchId: 'lekki',   role: 'member',    unit: 'Next Level',      stage: 1, joinDate: '2024-04-22', active: false },
  { id: 'm5', name: 'Ngozi Eze',       email: 'ngozi@example.com',  branchId: 'abuja',   role: 'member',    unit: 'Growth Track',    stage: 3, joinDate: '2022-11-05', active: true  },
  { id: 'm6', name: 'Seun Adeleke',    email: 'seun@example.com',   branchId: 'ph',      role: 'member',    unit: 'Online Church',   stage: 2, joinDate: '2023-07-18', active: true  },
  { id: 'm7', name: 'Chidi Obi',       email: 'chidi@example.com',  branchId: 'ibadan',  role: 'unit_head', unit: 'KidsHouse',       stage: 4, joinDate: '2020-05-30', active: true  },
  { id: 'm8', name: 'Funmi Balogun',   email: 'funmi@example.com',  branchId: 'london',  role: 'member',    unit: 'StirHouse',       stage: 3, joinDate: '2023-02-14', active: true  },
  { id: 'm9', name: 'Dayo Williams',   email: 'dayo@example.com',   branchId: 'houston', role: 'member',    unit: 'Workforce',       stage: 2, joinDate: '2024-03-01', active: true  },
]

const PASSPORTS = {
  m1: { givingFaithfulness: 92, prayerActivity: 78, servingMonths: 14, milestones: ['Growth Track L2', 'Small Group Leader', 'Served 12 Sundays'] },
  m2: { givingFaithfulness: 98, prayerActivity: 91, servingMonths: 36, milestones: ['Growth Track L4', 'Unit Head', 'HSAP Graduate', 'Served 50 Sundays'] },
  m3: { givingFaithfulness: 75, prayerActivity: 62, servingMonths: 5,  milestones: ['Growth Track L2'] },
  m4: { givingFaithfulness: 40, prayerActivity: 22, servingMonths: 1,  milestones: [] },
  m5: { givingFaithfulness: 88, prayerActivity: 84, servingMonths: 21, milestones: ['Growth Track L3', 'Small Group Member', 'Served 24 Sundays'] },
}

/* ── GET /api/members ───────────────────────────────────────────────────── */
router.get('/', requireRole('unit_head'), (req, res) => {
  const { branch, search, active, page = '1', limit = '20' } = req.query
  const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)

  let results = [...MEMBERS]

  // Branch filter: non-senior roles can only see their own branch
  if (!isSenior) {
    results = results.filter(m => m.branchId === req.user.branchId)
  } else if (branch) {
    results = results.filter(m => m.branchId === branch)
  }

  if (search) {
    const q = search.toLowerCase()
    results = results.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    )
  }

  if (active !== undefined) {
    results = results.filter(m => m.active === (active === 'true'))
  }

  const pageNum  = Math.max(1, parseInt(page, 10))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
  const start    = (pageNum - 1) * limitNum
  const paginated = results.slice(start, start + limitNum)

  // Never return passwordHash or sensitive fields
  const safe = paginated.map(({ ...m }) => m)

  res.json({
    status: 'success',
    data: {
      members: safe,
      pagination: { page: pageNum, limit: limitNum, total: results.length, pages: Math.ceil(results.length / limitNum) },
    },
  })
})

/* ── GET /api/members/:id ───────────────────────────────────────────────── */
router.get('/:id', requireRole('unit_head'), (req, res) => {
  const member = MEMBERS.find(m => m.id === req.params.id)
  if (!member) return res.status(404).json({ status: 'error', message: 'Member not found.' })

  // Branch access control
  const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
  if (!isSenior && member.branchId !== req.user.branchId) {
    return res.status(403).json({ status: 'error', message: 'Access denied.' })
  }

  const passport = PASSPORTS[member.id] || { givingFaithfulness: 0, prayerActivity: 0, servingMonths: 0, milestones: [] }

  res.json({ status: 'success', data: { ...member, passport } })
})

/* ── GET /api/members/gone-quiet ────────────────────────────────────────── */
router.get('/report/gone-quiet', requireRole('branch_pastor'), (req, res) => {
  const inactive = MEMBERS.filter(m => !m.active)
  const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
  const filtered = isSenior ? inactive : inactive.filter(m => m.branchId === req.user.branchId)

  res.json({ status: 'success', data: { count: filtered.length, members: filtered } })
})

/* ── POST /api/members (create) ─────────────────────────────────────────── */
const createSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email().max(254).toLowerCase(),
  branchId: z.string().max(50),
  unit:     z.string().max(50).optional(),
})

router.post('/', requireRole('branch_pastor'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body)

    // Branch pastors can only add to their own branch
    const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
    if (!isSenior && data.branchId !== req.user.branchId) {
      return res.status(403).json({ status: 'error', message: 'Cannot add members to another branch.' })
    }

    const newMember = {
      id:       `m${Date.now()}`,
      ...data,
      role:     'member',
      stage:    1,
      joinDate: new Date().toISOString().slice(0, 10),
      active:   true,
    }
    MEMBERS.push(newMember)

    res.status(201).json({ status: 'success', data: newMember })
  } catch (err) { next(err) }
})

/* ── PATCH /api/members/:id ─────────────────────────────────────────────── */
const updateSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  unit:     z.string().max(50).optional(),
  stage:    z.number().int().min(1).max(5).optional(),
  active:   z.boolean().optional(),
}).strict()

router.patch('/:id', requireRole('branch_pastor'), async (req, res, next) => {
  try {
    const idx = MEMBERS.findIndex(m => m.id === req.params.id)
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'Member not found.' })

    const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
    if (!isSenior && MEMBERS[idx].branchId !== req.user.branchId) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' })
    }

    const updates = updateSchema.parse(req.body)
    MEMBERS[idx] = { ...MEMBERS[idx], ...updates }

    res.json({ status: 'success', data: MEMBERS[idx] })
  } catch (err) { next(err) }
})

module.exports = router
