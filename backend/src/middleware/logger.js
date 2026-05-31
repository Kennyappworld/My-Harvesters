'use strict'
const { v4: uuid } = require('uuid')
const requestLogger = (req, res, next) => {
  req.requestId = uuid()
  res.setHeader('X-Request-ID', req.requestId)
  next()
}
module.exports = { requestLogger }
