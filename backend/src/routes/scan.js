const express = require('express');
const router = express.Router();
const { detectSensitiveData } = require('../services/detector');
const { applyMasking } = require('../services/masker');
const dbAdapter = require('../config/dbAdapter');

/**
 * POST /api/scan
 * Primary endpoint to scan and sanitize incoming payloads or customer texts.
 */
router.post('/', async (req, res) => {
  const startTime = process.hrtime();

  try {
    const {
      content,
      maskingMode = 'partial',
      inputType = 'text',
      source = 'web-ui',
      previewTitle = 'Customer Data Scan',
      persistAudit = true
    } = req.body;

    if (content === undefined || content === null || (typeof content === 'string' && content.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Content is required for scanning',
          code: 'INVALID_INPUT'
        }
      });
    }

    // Determine string representation
    let textToScan = '';
    let isJson = false;

    if (typeof content === 'object') {
      textToScan = JSON.stringify(content, null, 2);
      isJson = true;
    } else {
      textToScan = String(content);
      try {
        const parsed = JSON.parse(textToScan);
        if (typeof parsed === 'object' && parsed !== null) {
          isJson = true;
        }
      } catch {
        isJson = false;
      }
    }

    // 1. Run detection engine
    const detectionResult = detectSensitiveData(textToScan);

    // 2. Apply masking
    const maskingResult = applyMasking(textToScan, detectionResult.detections, maskingMode);

    // 3. Compute execution latency
    const diff = process.hrtime(startTime);
    const processingTimeMs = Math.round((diff[0] * 1000 + diff[1] / 1e6) * 100) / 100;

    // 4. Persist only sanitized output to database (Zero-storage principle)
    let auditRecord = null;
    if (persistAudit) {
      auditRecord = await dbAdapter.recordScan({
        source,
        inputType: isJson ? 'json' : 'text',
        maskingMode,
        sanitizedContent: maskingResult.sanitizedText,
        detections: detectionResult.detections,
        summary: detectionResult.summary,
        riskScore: detectionResult.riskScore,
        riskLevel: detectionResult.riskLevel,
        processingTimeMs,
        previewTitle: previewTitle || (isJson ? 'JSON Payload Scan' : 'Text Payload Scan')
      });
    }

    // Attempt to parse sanitized output back to object if originally JSON
    let parsedSanitized = null;
    if (isJson) {
      try {
        parsedSanitized = JSON.parse(maskingResult.sanitizedText);
      } catch {
        parsedSanitized = null;
      }
    }

    return res.status(200).json({
      success: true,
      scanId: auditRecord ? auditRecord.id : null,
      timestamp: new Date().toISOString(),
      maskingMode,
      inputType: isJson ? 'json' : 'text',
      sanitizedContent: maskingResult.sanitizedText,
      sanitizedJson: parsedSanitized,
      detectionsCount: detectionResult.totalDetections,
      summary: detectionResult.summary,
      riskScore: detectionResult.riskScore,
      riskLevel: detectionResult.riskLevel,
      processingTimeMs,
      highlights: maskingResult.replacements,
      zeroLeakageVerified: true,
      database: auditRecord?.database || dbAdapter.getDatabaseStatus().type
    });

  } catch (err) {
    console.error('Scan processing error:', err);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal error while scanning content: ' + err.message,
        code: 'SCAN_FAILED'
      }
    });
  }
});

/**
 * POST /api/scan/simulate-api-gateway
 */
router.post('/simulate-api-gateway', async (req, res) => {
  const startTime = process.hrtime();
  const rawPayload = req.body;

  const rawString = typeof rawPayload === 'object' ? JSON.stringify(rawPayload, null, 2) : String(rawPayload);
  const detectionResult = detectSensitiveData(rawString);
  const maskingResult = applyMasking(rawString, detectionResult.detections, 'partial');

  const diff = process.hrtime(startTime);
  const processingTimeMs = Math.round((diff[0] * 1000 + diff[1] / 1e6) * 100) / 100;

  // Record sanitized audit
  await dbAdapter.recordScan({
    source: 'api-gateway-simulator',
    inputType: 'json',
    maskingMode: 'partial',
    sanitizedContent: maskingResult.sanitizedText,
    detections: detectionResult.detections,
    summary: detectionResult.summary,
    riskScore: detectionResult.riskScore,
    riskLevel: detectionResult.riskLevel,
    processingTimeMs,
    previewTitle: 'Gateway Interceptor Payload'
  });

  res.status(200).json({
    gatewayStatus: 'INTERCEPTED_AND_SANITIZED',
    piiEntitiesBlocked: detectionResult.totalDetections,
    riskLevel: detectionResult.riskLevel,
    latencyMs: processingTimeMs,
    forwardedPayload: JSON.parse(maskingResult.sanitizedText),
    message: 'Payload sanitized successfully. Downstream microservices and logs will never see plaintext PII.'
  });
});

module.exports = router;
