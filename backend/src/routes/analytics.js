'use strict'
const express = require('express')
const { authenticate, requireRole } = require('../middleware/auth')
const router = express.Router()
router.use(authenticate)

router.get('/overview', requireRole('branch_pastor'), (req, res) => {
  res.json({ status:'success', data: {
    totalMembers:83400, weeklyAttendance:71200, activeBranches:9,
    monthlyGivingNGN:142000000, newMembersMay:1810, avgRetentionPct:84.3,
    goneQuiet:4840, atRisk:2448, onlineViewers:620000,
  }})
})

router.get('/growth', requireRole('unit_head'), (req, res) => {
  const data = [
    { month:'Jan', lekki:310, gbagada:245, ikeja:190, anthony:148, abuja:162, portharcourt:112, ibadan:58, london:98,  houston:64,  total:1387 },
    { month:'Feb', lekki:288, gbagada:230, ikeja:175, anthony:139, abuja:144, portharcourt:104, ibadan:52, london:110, houston:71,  total:1313 },
    { month:'Mar', lekki:342, gbagada:271, ikeja:204, anthony:166, abuja:178, portharcourt:128, ibadan:67, london:124, houston:78,  total:1558 },
    { month:'Apr', lekki:368, gbagada:292, ikeja:218, anthony:179, abuja:191, portharcourt:141, ibadan:72, london:131, houston:84,  total:1676 },
    { month:'May', lekki:394, gbagada:314, ikeja:231, anthony:192, abuja:204, portharcourt:155, ibadan:81, london:148, houston:91,  total:1810 },
  ]
  // Scope: branch_pastor and below see only own branch
  if (['member','unit_head','branch_pastor'].includes(req.user.role)) {
    const bid = req.user.branchId
    return res.json({ status:'success', data: data.map(d => ({ month:d.month, [bid]:d[bid]||0 })) })
  }
  res.json({ status:'success', data })
})

router.get('/retention', requireRole('branch_pastor'), (req, res) => {
  res.json({ status:'success', data: {
    monthly: [
      { month:'Jan', lekki:87, gbagada:84, ikeja:79, anthony:76, abuja:78, portharcourt:75, ibadan:73, london:88, houston:86, avg:80.7 },
      { month:'Feb', lekki:88, gbagada:85, ikeja:78, anthony:77, abuja:76, portharcourt:76, ibadan:74, london:89, houston:87, avg:81.1 },
      { month:'Mar', lekki:89, gbagada:86, ikeja:80, anthony:78, abuja:79, portharcourt:78, ibadan:75, london:90, houston:88, avg:82.6 },
      { month:'Apr', lekki:90, gbagada:87, ikeja:81, anthony:79, abuja:77, portharcourt:79, ibadan:76, london:91, houston:89, avg:83.2 },
      { month:'May', lekki:92, gbagada:88, ikeja:82, anthony:80, abuja:78, portharcourt:80, ibadan:77, london:92, houston:90, avg:84.3 },
    ],
    cohorts: [
      { branch:'Lekki HQ',      id:'lekki',       r3m:92, r6m:87, r12m:79, atRisk:340,  goneQuiet:820  },
      { branch:'Gbagada',       id:'gbagada',      r3m:88, r6m:83, r12m:74, atRisk:290,  goneQuiet:640  },
      { branch:'Ikeja',         id:'ikeja',        r3m:82, r6m:76, r12m:67, atRisk:480,  goneQuiet:980  },
      { branch:'Anthony',       id:'anthony',      r3m:80, r6m:74, r12m:65, atRisk:310,  goneQuiet:590  },
      { branch:'Abuja',         id:'abuja',        r3m:78, r6m:72, r12m:63, atRisk:390,  goneQuiet:720  },
      { branch:'Port Harcourt', id:'portharcourt', r3m:80, r6m:74, r12m:65, atRisk:220,  goneQuiet:430  },
      { branch:'Ibadan',        id:'ibadan',       r3m:77, r6m:71, r12m:62, atRisk:180,  goneQuiet:310  },
      { branch:'London UK',     id:'london',       r3m:92, r6m:88, r12m:81, atRisk:140,  goneQuiet:210  },
      { branch:'Houston USA',   id:'houston',      r3m:90, r6m:85, r12m:79, atRisk:98,   goneQuiet:140  },
    ],
  }})
})

router.get('/funnel', requireRole('branch_pastor'), (req, res) => {
  res.json({ status:'success', data: [
    { week:'Apr 6',  firstTimers:710, returnedWk2:412, joinedGroup:198, becameMember:89  },
    { week:'Apr 13', firstTimers:740, returnedWk2:428, joinedGroup:211, becameMember:97  },
    { week:'Apr 20', firstTimers:768, returnedWk2:445, joinedGroup:224, becameMember:104 },
    { week:'Apr 27', firstTimers:792, returnedWk2:460, joinedGroup:236, becameMember:112 },
    { week:'May 4',  firstTimers:820, returnedWk2:480, joinedGroup:248, becameMember:118 },
    { week:'May 11', firstTimers:845, returnedWk2:494, joinedGroup:261, becameMember:124 },
    { week:'May 18', firstTimers:868, returnedWk2:512, joinedGroup:274, becameMember:131 },
    { week:'May 25', firstTimers:890, returnedWk2:528, joinedGroup:286, becameMember:139 },
  ]})
})

router.get('/churn', requireRole('senior_pastor'), (req, res) => {
  res.json({ status:'success', data: {
    reasons: [
      { reason:'Relocated',                pct:28 },
      { reason:'Joined another church',    pct:22 },
      { reason:'No small group connection',pct:19 },
      { reason:'Irregular → lapse',        pct:16 },
      { reason:'Life circumstances',       pct:10 },
      { reason:'Other',                    pct:5  },
    ],
  }})
})

module.exports = router
