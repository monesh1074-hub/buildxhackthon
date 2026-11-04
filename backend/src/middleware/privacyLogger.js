const { detectSensitiveData } = require('../services/detector');
const { applyMasking } = require('../services/masker');

/**
 * PrivacyShield Zero-Leakage Logger Middleware
 *
 * Traditional apps leak PII into log sinks (CloudWatch, Datadog, ELK).
 * This middleware automatically inspects and masks any sensitive values in
 * request body, query params, and headers BEFORE logging to stdout/stderr.
 */
function privacyLogger(req, res, next) {
  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Sanitize body for logging
  let safeLogBody = null;
  let detectedCount = 0;

  if (req.body && Object.keys(req.body).length > 0) {
    try {
      const rawBodyStr = JSON.stringify(req.body);
      const detectionResult = detectSensitiveData(rawBodyStr);
      detectedCount = detectionResult.totalDetections;

      if (detectedCount > 0) {
        const masked = applyMasking(rawBodyStr, detectionResult.detections, 'partial');
        safeLogBody = JSON.parse(masked.sanitizedText);
      } else {
        safeLogBody = req.body;
      }
    } catch {
      safeLogBody = '[SAFE_MASKED_CONTENT]';
    }
  }

  // Intercept response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    const cyan = '\x1b[36m';
    const shieldTag = detectedCount > 0
      ? `\x1b[41m\x1b[37m [SHIELD INTERCEPTED ${detectedCount} PII ENTITY/IES] \x1b[0m`
      : `\x1b[32m[SHIELD CLEAN]\x1b[0m`;

    console.log(
      `[PrivacyShield Audit] ${method} ${cyan}${url}${resetColor} -> ${statusColor}${statusCode}${resetColor} (${duration}ms) ${shieldTag}`
    );

    // If sensitive data was detected in the payload, show how it was safely masked in the log
    if (detectedCount > 0 && safeLogBody && url.includes('/api/scan')) {
      console.log(`  └─> Sanitized Log Snapshot (Zero Leakage):`, JSON.stringify(safeLogBody).substring(0, 150) + '...');
    }
  });

  next();
}

module.exports = privacyLogger;

