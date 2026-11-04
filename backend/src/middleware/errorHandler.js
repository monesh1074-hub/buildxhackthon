/**
 * Central Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[PrivacyShield Error]', err.message);

  // Ensure no error dump leaks raw payloads
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
}

module.exports = errorHandler;

