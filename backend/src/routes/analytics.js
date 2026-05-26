'use strict'
const express = require('express')
const { requireAuth, requireRole, requireBranchAccess } = require('../middleware/auth')

const router = express.Router()

// All analytics routes require authentication
router.use(requireAuth)

/* ── Shared church data (mirrors frontend lib/data.ts) ──────────────────── */
const BRANCHES = [
  { id: 'lekki',    name: 'Lekki HQ',        country: 'NG' },
  { id: 'gbagada',  name: 'Gbagada',          country: 'NG' },
  { id: 'ikeja',    name: 'Ikeja',            country: 'NG' },
  { id: 'anthony',  name: 'Anthony Village',  country: 'NG' },
  { id: 'abuja',    name: 'Abuja',            country: 'NG' },
  { id: 'ph',       name: 'Port Harcourt',    country: 'NG' },
  { id: 'ibadan',   name: 'Ibadan',           country: 'NG' },
  { id: 'london',   name: 'London UK',        country: 'UK' },
  { id: 'houston',  name: 'Houston USA',      country: 'US' },
]

const MONTHLY_NEW_MEMBERS = {
  lekki:   [312, 298, 341, 289, 367],
  gbagada: [198, 210, 187, 225, 243],
  ikeja:   [156, 167, 178, 145, 189],
  anthony: [87,  92,  78,  95,  103],
  abuja:   [203, 215, 198, 234, 267],
  ph:      [134, 128, 145, 152, 168],
  ibadan:  [98,  105, 112, 89,  127],
  london:  [67,  71,  58,  74,  82],
  houston: [43,  48,  51,  44,  59],
}

const RETENTION_DATA = {
  lekki:   { m3: 89, m6: 82, m12: 74, atRisk: 312 },
  gbagada: { m3: 86, m6: 79, m12: 71, atRisk: 198 },
  ikeja:   { m3: 84, m6: 77, m12: 68, atRisk: 234 },
  anthony: { m3: 91, m6: 85, m12: 78, atRisk: 89  },
  abuja:   { m3: 88, m6: 81, m12: 73, atRisk: 178 },
  ph:      { m3: 83, m6: 75, m12: 66, atRisk: 267 },
  ibadan:  { m3: 80, m6: 72, m12: 63, atRisk: 312 },
  london:  { m3: 92, m6: 87, m12: 81, atRisk: 45  },
  houston: { m3: 94, m6: 89, m12: 83, atRisk: 31  },
}

const FUNNEL_WEEKS = [
  { week: 'May 18', visitors: 847, returned: 423, smallGroup: 187, members: 94 },
  { week: 'May 11', visitors: 791, returned: 398, smallGroup: 172, members: 87 },
  { week: 'May 4',  visitors: 823, returned: 412, smallGroup: 181, members: 91 },
  { week: 'Apr 27', visitors: 756, returned: 378, smallGroup: 165, members: 83 },
  { week: 'Apr 20', visitors: 812, returned: 406, smallGroup: 179, members: 90 },
  { week: 'Apr 13', visitors: 734, returned: 367, smallGroup: 161, members: 81 },
  { week: 'Apr 6',  visitors: 789, returned: 395, smallGroup: 174, members: 88 },
  { week: 'Mar 30', visitors: 698, returned: 349, smallGroup: 153, members: 77 },
]

const CHURN_REASONS = [
  { reason: 'Relocation',          pct: 34, priority: 'Low',    action: 'Transfer letter to nearest branch' },
  { reason: 'Work/Schedule',       pct: 28, priority: 'Medium', action: 'Promote online church & midweek options' },
  { reason: 'Felt Disconnected',   pct: 19, priority: 'High',   action: 'Assign pastoral care follow-up within 2 weeks' },
  { reason: 'Doctrinal Concerns',  pct: 9,  priority: 'High',   action: 'Schedule one-on-one with branch pastor' },
  { reason: 'Family Reasons',      pct: 6,  priority: 'Low',    action: 'Maintain connection via prayer chain' },
  { reason: 'Other',               pct: 4,  priority: 'Low',    action: 'Log and monitor for patterns' },
]

/* ── GET /api/analytics/overview ────────────────────────────────────────── */
router.get('/overview', requireRole('branch_pastor'), (req, res) => {
  const totalMembers    = 83400
  const weeklyAttendance = 71200
  const retentionRate   = 81
  const monthlyNewTotal = 1605
  const goneQuietCount  = 4840

  res.json({
    status: 'success',
    data: {
      totalMembers,
      weeklyAttendance,
      attendanceRate: Math.round((weeklyAttendance / totalMembers) * 100),
      retentionRate,
      monthlyNewMembers: monthlyNewTotal,
      goneQuietCount,
      branchCount: BRANCHES.length,
    },
  })
})

/* ── GET /api/analytics/growth ──────────────────────────────────────────── */
router.get('/growth', requireRole('unit_head'), requireBranchAccess, (req, res) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
  const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
  const branches = isSenior
    ? BRANCHES
    : BRANCHES.filter(b => b.id === req.user.branchId)

  const data = branches.map(branch => ({
    branchId:   branch.id,
    branchName: branch.name,
    country:    branch.country,
    monthly:    months.map((month, i) => ({
      month,
      newMembers: MONTHLY_NEW_MEMBERS[branch.id]?.[i] ?? 0,
    })),
    mayTotal: MONTHLY_NEW_MEMBERS[branch.id]?.[4] ?? 0,
  }))

  res.json({ status: 'success', data: { months, branches: data } })
})

/* ── GET /api/analytics/retention ──────────────────────────────────────── */
router.get('/retention', requireRole('branch_pastor'), requireBranchAccess, (req, res) => {
  const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
  const branches = isSenior
    ? BRANCHES
    : BRANCHES.filter(b => b.id === req.user.branchId)

  const data = branches.map(branch => ({
    branchId:   branch.id,
    branchName: branch.name,
    ...RETENTION_DATA[branch.id],
  }))

  const avgM12 = Math.round(data.reduce((s, b) => s + b.m12, 0) / data.length)
  const totalAtRisk = data.reduce((s, b) => s + b.atRisk, 0)

  res.json({ status: 'success', data: { branches: data, avgRetention12m: avgM12, totalAtRisk } })
})

/* ── GET /api/analytics/funnel ──────────────────────────────────────────── */
router.get('/funnel', requireRole('branch_pastor'), (req, res) => {
  res.json({ status: 'success', data: { weeks: FUNNEL_WEEKS } })
})

/* ── GET /api/analytics/cohort ──────────────────────────────────────────── */
router.get('/cohort', requireRole('branch_pastor'), requireBranchAccess, (req, res) => {
  const isSenior = ['senior_pastor', 'super_admin'].includes(req.user.role)
  const branches = isSenior
    ? BRANCHES
    : BRANCHES.filter(b => b.id === req.user.branchId)

  const data = branches
    .map(branch => ({ branchId: branch.id, branchName: branch.name, ...RETENTION_DATA[branch.id] }))
    .sort((a, b) => b.m12 - a.m12)

  res.json({ status: 'success', data: { branches: data } })
})

/* ── GET /api/analytics/churn ───────────────────────────────────────────── */
router.get('/churn', requireRole('senior_pastor'), (req, res) => {
  res.json({ status: 'success', data: { reasons: CHURN_REASONS } })
})

module.exports = router
