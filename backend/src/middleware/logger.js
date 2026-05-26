'use strict'
const { v4: uuidv4 } = require('uuid')

/**
 * Injects a unique request ID on every incoming request.
 * Used for log correlation — find all logs for one request by searching the ID.
 */
const requestLogger = (req, _res, next) => {
  req.id = uuidv4()
  next()
}

module.exports = { requestLogger }
