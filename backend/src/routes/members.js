'use strict'
const express = require('express')
const { authenticate, requireRole } = require('../middleware/auth')
const router = express.Router()
router.use(authenticate)
router.get('/', requireRole('unit_head'), (req,res) => res.json({ status:'success', data:[], message:'Connect to your database' }))
module.exports = router
