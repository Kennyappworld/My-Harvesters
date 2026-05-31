'use strict'
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500
  res.status(status).json({
    status: 'error',
    message: status < 500 ? err.message : 'An unexpected error occurred.',
    ...(process.env.NODE_ENV==='development' && status>=500 && { stack: err.stack }),
  })
}
module.exports = { errorHandler }
