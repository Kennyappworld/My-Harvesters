'use strict'

/**
 * Global error handler.
 * SECURITY: Never exposes stack traces or internal details in production.
 * Zod validation errors are unwrapped into user-readable field errors.
 */
const errorHandler = (err, req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production'

  // Log internally with request ID for correlation
  console.error(`[ERR] reqId=${req.id} method=${req.method} path=${req.path}`, isProd ? err.message : err)

  // CORS policy violation
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ status:'error', message:'Forbidden.' })
  }

  // Zod validation errors → return field-level messages
  if (err.name === 'ZodError') {
    const errors = {}
    err.errors.forEach(e => { errors[e.path.join('.')] = e.message })
    return res.status(400).json({ status:'error', message:'Validation failed.', errors })
  }

  // JWT errors
  if (['JsonWebTokenError','TokenExpiredError','NotBeforeError'].includes(err.name)) {
    return res.status(401).json({ status:'error', message:'Invalid or expired token.' })
  }

  const statusCode = err.status || err.statusCode || 500

  res.status(statusCode).json({
    status: 'error',
    message: statusCode < 500
      ? (err.message || 'Bad request.')
      : (isProd ? 'An unexpected error occurred.' : err.message),
    // Only include stack in development
    ...(isProd ? {} : { stack: err.stack }),
  })
}

module.exports = { errorHandler }
