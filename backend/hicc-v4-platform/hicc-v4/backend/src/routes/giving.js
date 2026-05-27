'use strict'
const express = require('express')
const { requireAuth, requireRole, requireBranchAccess } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

/* ── Giving data (never expose individual member amounts) ───────────────── */
const GIVING_SUMMARY = {
  lekki:   { tithe: 42000000, offering: 8500000,  special: 5200000,  currency: 'NGN', givers: 9200,  faithfulPct: 78 },
  gbagada: { tithe: 28000000, offering: 5600000,  special: 3400000,  currency: 'NGN', givers: 6150,  faithfulPct: 74 },
  ikeja:   { tithe: 22000000, offering: 4400000,  special: 2700000,  currency: 'NGN', givers: 4900,  faithfulPct: 72 },
  anthony: { tithe: 11000000, offering: 2200000,  special: 1350000,  currency: 'NGN', givers: 2600,  faithfulPct: 71 },
  abuja:   { tithe: 25000000, offering: 5000000,  special: 3100000,  currency: 'NGN', givers: 5800,  faithfulPct: 75 },
  ph:      { tithe: 18000000, offering: 3600000,  special: 2200000,  currency: 'NGN', givers: 4350,  faithfulPct: 70 },
  ibadan:  { tithe: 14000000, offering: 2800000,  special: 1700000,  currency: 'NGN', givers: 3550,  faithfulPct: 69 },
  london:  { tithe: 12000,    offering: 2400,     special: 1500,     currency: 'GBP', givers: 2700,  faithfulPct: 83 },
  houston: { tithe: 8000,     offering: 1600,     special: 1000,     currency: 'USD', givers: 2450,  faithfulPct: 85 },
}

const MONTHLY_GIVING_NGN = [98000000, 112000000, 108000000, 124000000, 142000000]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May']

/* ── GET /api/giving/overview ───────────────────────────────────────────── */
router.get('/overview', requireRole('senior_pastor'), (req, res) => {
  const totalNGN = Object.values(GIVING_SUMMARY)
    .filter(b => b.currency === 'NGN')
    .reduce((s, b) => s + b.tithe + b.offering + b.special, 0)

  const totalGBP = Object.values(GIVING_SUMMARY)
    .filter(b => b.currency === 'GBP')
    .reduce((s, b) => s + b.tithe + b.offering + b.special, 0)

  const totalUSD = Object.values(GIVING_SUMMARY)
    .filter(b => b.currency === 'USD')
    .reduce((s, b) => s + b.tithe + b.offering + b.special, 0)

  res.json({
    status: 'success',
    data: {
      totals: { NGN: totalNGN, GBP: totalGBP, USD: totalUSD },
      monthlyTrendNGN: MONTHS.map((month, i) => ({ month, total: MONTHLY_GIVING_NGN[i] })),
      yoyGrowth: 14.2,
    },
  })
})

/* ── GET /api/giving/branch/:branchId ───────────────────────────────────── */
router.get('/branch/:branchId', requireRole('branch_pastor'), requireBranchAccess, (req, res) => {
  const data = GIVING_SUMMARY[req.params.branchId]
  if (!data) return res.status(404).json({ status: 'error', message: 'Branch not found.' })

  const total = data.tithe + data.offering + data.special
  res.json({
    status: 'success',
    data: {
      branchId:   req.params.branchId,
      ...data,
      total,
      breakdown: [
        { type: 'Tithe',            amount: data.tithe,    pct: Math.round((data.tithe   / total) * 100) },
        { type: 'Offering',         amount: data.offering, pct: Math.round((data.offering/ total) * 100) },
        { type: 'Special Seed',     amount: data.special,  pct: Math.round((data.special / total) * 100) },
      ],
    },
  })
})

/* ── GET /api/giving/all-branches ───────────────────────────────────────── */
router.get('/all-branches', requireRole('senior_pastor'), (req, res) => {
  const branches = Object.entries(GIVING_SUMMARY).map(([id, data]) => ({
    branchId: id,
    total:    data.tithe + data.offering + data.special,
    currency: data.currency,
    givers:   data.givers,
    faithfulPct: data.faithfulPct,
  }))

  res.json({ status: 'success', data: { branches } })
})

module.exports = router
