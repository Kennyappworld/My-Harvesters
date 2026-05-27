'use strict'
const express = require('express')
const { z } = require('zod')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

/* ── Channel definitions ────────────────────────────────────────────────── */
// minRole: minimum role to access this channel type
const CHANNEL_TYPES = {
  unit:         { label: 'Unit Chat',           minRole: 'member',        description: 'Chat within your ministry unit' },
  peer:         { label: 'Peer Cross-Branch',   minRole: 'unit_head',     description: 'Unit heads across all branches' },
  leadership:   { label: 'Leadership Council',  minRole: 'branch_pastor', description: 'Branch pastors & above' },
  broadcast:    { label: 'HQ Broadcast',        minRole: 'senior_pastor', description: 'Org-wide announcements from HQ' },
}

const ROLE_LEVEL = { member: 1, unit_head: 2, branch_pastor: 3, senior_pastor: 4, super_admin: 5 }

/* ── In-memory message store ────────────────────────────────────────────── */
const CHANNELS = [
  { id: 'ch-kidhouse-lekki',   type: 'unit',       name: 'KidsHouse — Lekki',      branchId: 'lekki',   unit: 'KidsHouse' },
   { id: 'ch-stirhouse-lekki',  type: 'unit',       name: 'StirHouse — Lekki',       branchId: 'lekki',   unit: 'StirHouse' },
  { id: 'ch-unitheads',        type: 'peer',       name: 'Unit Heads Network',      branchId: null,      unit: null },
  { id: 'ch-kidhouse-heads',   type: 'peer',       name: 'KidsHouse Leaders — All', branchId: null,      unit: 'KidsHouse' },
  { id: 'ch-pastors',          type: 'leadership', name: 'Pastors Council',         branchId: null,      unit: null },
  { id: 'ch-hq-broadcast',     type: 'broadcast',  name: 'HQ Announcements',        branchId: null,      unit: null },
]

const MESSAGES = {
  'ch-unitheads': [
    { id: 'msg1', channelId: 'ch-unitheads', authorId: 'u2', authorName: 'Pastor Emeka Nwosu', text: 'Reminder: Unit head quarterly review is this Friday at 3pm via Zoom.', ts: Date.now() - 3600000 },
    { id: 'msg2', channelId: 'ch-unitheads', authorId: 'u1', authorName: 'Pastor Bolaji Idowu', text: 'Great job everyone on the first-timer connection drive last Sunday. Numbers are up 18%!', ts: Date.now() - 1800000 },
  ],
  'ch-pastors': [
    { id: 'msg3', channelId: 'ch-pastors', authorId: 'u1', authorName: 'Pastor Bolaji Idowu', text: 'Monthly leadership call: Tuesday 7pm WAT. Please bring your branch report.', ts: Date.now() - 7200000 },
  ],
  'ch-hq-broadcast': [
    { id: 'msg4', channelId: 'ch-hq-broadcast', authorId: 'u1', authorName: 'Pastor Bolaji Idowu', text: 'Annual Convention 2026 dates confirmed: July 18-20. All branches begin registration this Sunday.', ts: Date.now() - 86400000 },
  ],
}

/* helper: does this user have access to this channel? */
const canAccess = (user, channel) => {
  const userLevel = ROLE_LEVEL[user.role] || 0
  const minLevel  = ROLE_LEVEL[CHANNEL_TYPES[channel.type]?.minRole] || 999

  if (userLevel < minLevel) return false

  // Unit channels: only accessible to same branch + same unit
  if (channel.type === 'unit') {
    if (channel.branchId && channel.branchId !== user.branchId) return false
    // unit check would use user.unit in a real DB
  }

  return true
}

/* ── GET /api/chat/channels ─────────────────────────────────────────────── */
router.get('/channels', (req, res) => {
  const accessible = CHANNELS.filter(ch => canAccess(req.user, ch))
  res.json({ status: 'success', data: { channels: accessible } })
})

/* ── GET /api/chat/channels/:channelId/messages ─────────────────────────── */
router.get('/channels/:channelId/messages', (req, res) => {
  const channel = CHANNELS.find(c => c.id === req.params.channelId)
  if (!channel) return res.status(404).json({ status: 'error', message: 'Channel not found.' })
  if (!canAccess(req.user, channel)) return res.status(403).json({ status: 'error', message: 'Access denied.' })

  const msgs = (MESSAGES[channel.id] || []).slice(-50) // last 50 messages
  res.json({ status: 'success', data: { channelId: channel.id, messages: msgs } })
})

/* ── POST /api/chat/channels/:channelId/messages ────────────────────────── */
const msgSchema = z.object({
  text: z.string().min(1).max(2000).trim(),
})

router.post('/channels/:channelId/messages', async (req, res, next) => {
  try {
    const channel = CHANNELS.find(c => c.id === req.params.channelId)
    if (!channel) return res.status(404).json({ status: 'error', message: 'Channel not found.' })
    if (!canAccess(req.user, channel)) return res.status(403).json({ status: 'error', message: 'Access denied.' })

    // Broadcast channels: only senior_pastor+ can post
    if (channel.type === 'broadcast' && (ROLE_LEVEL[req.user.role] || 0) < ROLE_LEVEL['senior_pastor']) {
      return res.status(403).json({ status: 'error', message: 'Only senior leadership can post to broadcast channels.' })
    }

    const { text } = msgSchema.parse(req.body)

    const newMsg = {
      id:         `msg-${Date.now()}`,
      channelId:  channel.id,
      authorId:   req.user.sub,
      authorName: req.user.name || 'Unknown',
      text,
      ts:         Date.now(),
    }

    if (!MESSAGES[channel.id]) MESSAGES[channel.id] = []
    MESSAGES[channel.id].push(newMsg)

    res.status(201).json({ status: 'success', data: newMsg })
  } catch (err) { next(err) }
})

module.exports = router
