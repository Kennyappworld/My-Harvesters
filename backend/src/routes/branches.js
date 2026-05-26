'use strict'
const express = require('express')
const { requireAuth, requireRole, requireBranchAccess } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

const BRANCHES = [
  { id: 'lekki',   name: 'Lekki HQ',       pastor: 'Pastor Bolaji Idowu',  country: 'NG', city: 'Lagos',        members: 18400, attendance: 15800, founded: 2003 },
  { id: 'gbagada', name: 'Gbagada',         pastor: 'Pastor Emeka Nwosu',   country: 'NG', city: 'Lagos',        members: 12300, attendance: 10500, founded: 2007 },
  { id: 'ikeja',   name: 'Ikeja',           pastor: 'Pastor Amaka Obi',     country: 'NG', city: 'Lagos',        members: 9800,  attendance: 8400,  founded: 2009 },
  { id: 'anthony', name: 'Anthony Village', pastor: 'Pastor Segun Oladele', country: 'NG', city: 'Lagos',        members: 5200,  attendance: 4400,  founded: 2012 },
  { id: 'abuja',   name: 'Abuja',           pastor: 'Pastor Chidi Eze',     country: 'NG', city: 'Abuja',        members: 11600, attendance: 9900,  founded: 2010 },
  { id: 'ph',      name: 'Port Harcourt',   pastor: 'Pastor Funmi Adeyemi', country: 'NG', city: 'PH',           members: 8700,  attendance: 7400,  founded: 2011 },
  { id: 'ibadan',  name: 'Ibadan',          pastor: 'Pastor Yemi Afolabi',  country: 'NG', city: 'Ibadan',       members: 7100,  attendance: 6100,  founded: 2013 },
  { id: 'london',  name: 'London UK',       pastor: 'Pastor Tunde Williams',country: 'UK', city: 'London',       members: 5400,  attendance: 4700,  founded: 2015 },
  { id: 'houston', name: 'Houston USA',     pastor: 'Pastor Kemi Adeleke',  country: 'US', city: 'Houston TX',   members: 4900,  attendance: 4200,  founded: 2016 },
]

/* ── GET /api/branches ──────────────────────────────────────────────────── */
router.get('/', requireRole('branch_pastor'), (req, res) => {
  const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
  const branches = isSenior
    ? BRANCHES
    : BRANCHES.filter(b => b.id === req.user.branchId)

  res.json({ status: 'success', data: { branches, total: branches.length } })
})

/* ── GET /api/branches/:branchId ────────────────────────────────────────── */
router.get('/:branchId', requireRole('branch_pastor'), requireBranchAccess, (req, res) => {
  const branch = BRANCHES.find(b => b.id === req.params.branchId)
  if (!branch) return res.status(404).json({ status: 'error', message: 'Branch not found.' })

  const attendanceRate = Math.round((branch.attendance / branch.members) * 100)
  const growthYoY      = 8.4 // would come from DB in production

  res.json({
    status: 'success',
    data: {
      ...branch,
      attendanceRate,
      growthYoY,
      services: [
        { day: 'Sunday', time: '8:00 AM', label: 'First Service' },
        { day: 'Sunday', time: '10:30 AM', label: 'Second Service' },
        { day: 'Wednesday', time: '6:00 PM', label: 'Midweek' },
      ],
    },
  })
})

/* ── GET /api/branches/:branchId/summary ────────────────────────────────── */
router.get('/:branchId/summary', requireRole('unit_head'), requireBranchAccess, (req, res) => {
  const branch = BRANCHES.find(b => b.id === req.params.branchId)
  if (!branch) return res.status(404).json({ status: 'error', message: 'Branch not found.' })

  res.json({
    status: 'success',
    data: {
      branchId:   branch.id,
      branchName: branch.name,
      members:    branch.members,
      attendance: branch.attendance,
    },
  })
})

module.exports = router
