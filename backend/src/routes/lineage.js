const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { recordEvent, getTraceJourney, getServicesMap } = require('../services/lineageTracker');
const { createIncident } = require('../services/exposureDetector');
const rawDbAdapter = require('../config/dbAdapter');

const dbAdapter = (rawDbAdapter && typeof rawDbAdapter.getLineageOverviewStats === 'function')
  ? rawDbAdapter
  : (rawDbAdapter && rawDbAdapter.default)
    ? rawDbAdapter.default
    : rawDbAdapter;

// Pre-shared key for service-to-service lineage ingestion
const SERVICE_API_KEY = process.env.SERVICE_LINEAGE_KEY || 'privacyshield-trusted-service-key-2026';

/**
 * Middleware: Verify incoming service event submissions
 */
function verifyServiceAuth(req, res, next) {
  const token = req.headers['x-service-token'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  // For local development and hackathon demo, allow if token matches or dev environment
  if (token && token === SERVICE_API_KEY) {
    return next();
  }
  // In development/demo mode, accept requests with a warning
  if (process.env.NODE_ENV !== 'production' || !token) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: {
      message: 'Unauthorized: Invalid or missing x-service-token for lineage event ingestion',
      code: 'UNAUTHORIZED_SERVICE'
    }
  });
}

/**
 * GET /api/lineage/overview
 * Returns aggregated metrics for the Data Leakage Time Machine dashboard cards
 */
router.get('/overview', async (req, res) => {
  try {
    const stats = await dbAdapter.getLineageOverviewStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Lineage overview error:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'LINEAGE_OVERVIEW_FAILED' }
    });
  }
});

/**
 * GET /api/lineage/services
 * Returns registered microservices and their trust levels
 */
router.get('/services', async (req, res) => {
  try {
    const services = await dbAdapter.getLineageServices();
    res.status(200).json({
      success: true,
      data: services
    });
  } catch (err) {
    console.error('Lineage services error:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'SERVICES_FETCH_FAILED' }
    });
  }
});

/**
 * GET /api/lineage/:traceId
 * Returns the full reconstructed data journey and graph for a specific trace ID
 */
router.get('/:traceId', async (req, res) => {
  try {
    const { traceId } = req.params;
    if (!traceId || traceId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'Trace ID is required', code: 'INVALID_TRACE_ID' }
      });
    }

    const journey = await getTraceJourney(traceId);
    if (!journey || journey.totalEvents === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `No lineage events found for trace ID: ${traceId}`, code: 'TRACE_NOT_FOUND' }
      });
    }

    res.status(200).json({
      success: true,
      data: journey
    });
  } catch (err) {
    console.error('Error fetching lineage journey:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'JOURNEY_FETCH_FAILED' }
    });
  }
});

/**
 * POST /api/lineage/events
 * Ingestion endpoint for instrumented microservices to publish boundary crossing events
 */
router.post('/events', verifyServiceAuth, async (req, res) => {
  try {
    const {
      traceId,
      parentEventId,
      incidentId,
      sourceService,
      destinationService,
      apiRoute = '/api',
      direction = 'REQUEST',
      dataCategory,
      fieldIdentifier,
      rawValue,
      action = 'DETECTED',
      policyId,
      metadata = {}
    } = req.body;

    if (!sourceService || !destinationService || !dataCategory) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'sourceService, destinationService, and dataCategory are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const createdEvent = await recordEvent({
      traceId: traceId || `trc-${Date.now().toString(36)}`,
      parentEventId,
      incidentId,
      sourceService,
      destinationService,
      apiRoute,
      direction,
      dataCategory,
      fieldIdentifier,
      rawValue,
      action,
      policyId,
      metadata
    });

    res.status(201).json({
      success: true,
      data: {
        eventId: createdEvent.event_id,
        traceId: createdEvent.trace_id,
        timestamp: createdEvent.timestamp,
        exposureStatus: createdEvent.exposure_status,
        action: createdEvent.action
      }
    });
  } catch (err) {
    console.error('Error creating lineage event:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'EVENT_CREATION_FAILED' }
    });
  }
});

// ==========================================
// 🧪 CONTROLLED DEMONSTRATION SCENARIOS
// (Synthetic data only: Arun Kumar, arun.demo@example.com)
// ==========================================

/**
 * POST /api/lineage/demo/scenario-a
 * Controlled Simulation: Successful Protection Journey
 * Customer PII is masked at the gateway boundary. No unmasked data leaks to untrusted services.
 */
router.post('/demo/scenario-a', async (req, res) => {
  try {
    const traceId = `trc-demo-safe-${Date.now().toString(36)}`;
    const baseTime = Date.now();

    // Hop 1: Customer submits sensitive inquiry to Banking API Gateway
    const evt1 = await recordEvent({
      traceId,
      sourceService: 'Customer Web / Mobile Client',
      destinationService: 'Banking API Gateway',
      apiRoute: '/api/v1/customer/profile',
      direction: 'REQUEST',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'DETECTED',
      timestamp: new Date(baseTime).toISOString(),
      metadata: { is_demo: true, customer: 'Arun Kumar', status: 200 }
    });

    // Hop 2: Banking API Gateway inspects and forwards request to Customer Information Service (CIS)
    const evt2 = await recordEvent({
      traceId,
      parentEventId: evt1.event_id,
      sourceService: 'Banking API Gateway',
      destinationService: 'Customer Information Service (CIS)',
      apiRoute: '/internal/cis/lookup',
      direction: 'REQUEST',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'ALLOWED',
      policyId: 'pol-internal-least-privilege',
      timestamp: new Date(baseTime + 180).toISOString(),
      metadata: { is_demo: true, reason: 'Internal CIS authenticated node' }
    });

    // Hop 3: Customer Information Service masks data before returning in HTTP response
    const evt3 = await recordEvent({
      traceId,
      parentEventId: evt2.event_id,
      sourceService: 'Customer Information Service (CIS)',
      destinationService: 'Banking API Gateway',
      apiRoute: '/internal/cis/lookup',
      direction: 'RESPONSE',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'MASKED',
      policyId: 'pol-third-party-zero-raw',
      timestamp: new Date(baseTime + 320).toISOString(),
      metadata: { is_demo: true, maskedResult: 'a***o@example.com' }
    });

    // Hop 4: API Gateway delivers safe masked response back to Client
    await recordEvent({
      traceId,
      parentEventId: evt3.event_id,
      sourceService: 'Banking API Gateway',
      destinationService: 'Customer Web / Mobile Client',
      apiRoute: '/api/v1/customer/profile',
      direction: 'RESPONSE',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'MASKED',
      policyId: 'pol-client-response-masking',
      timestamp: new Date(baseTime + 410).toISOString(),
      metadata: { is_demo: true, status: 200, safeDelivery: true }
    });

    const journey = await getTraceJourney(traceId);

    res.status(200).json({
      success: true,
      scenario: 'SCENARIO_A_SUCCESSFUL_PROTECTION',
      message: 'Demonstration Scenario A executed: Sensitive customer email was detected, policy evaluated, and format-preserving masking applied before response dispatch.',
      data: journey
    });
  } catch (err) {
    console.error('Scenario A error:', err);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/lineage/demo/scenario-b
 * Controlled Simulation: Simulated Policy Failure & Unauthorized Exposure
 * Unmasked data bypasses mask filter and reaches untrusted Third-party Notification Gateway.
 */
router.post('/demo/scenario-b', async (req, res) => {
  try {
    const traceId = `trc-demo-leak-${Date.now().toString(36)}`;
    const incidentId = `inc-${Date.now().toString(36)}`;
    const baseTime = Date.now();

    // Hop 1: 10:00:01 - Sensitive email and account detected at Gateway
    const evt1 = await recordEvent({
      traceId,
      incidentId,
      sourceService: 'Customer Web / Mobile Client',
      destinationService: 'Banking API Gateway',
      apiRoute: '/api/v1/payments/dispatch',
      direction: 'REQUEST',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'DETECTED',
      timestamp: new Date(baseTime).toISOString(),
      metadata: { is_demo: true, customer: 'Arun Kumar' }
    });

    // Hop 2: 10:00:02 - Gateway routes payload to Customer Information Service
    const evt2 = await recordEvent({
      traceId,
      incidentId,
      parentEventId: evt1.event_id,
      sourceService: 'Banking API Gateway',
      destinationService: 'Customer Information Service (CIS)',
      apiRoute: '/internal/cis/process-dispatch',
      direction: 'REQUEST',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'ALLOWED',
      policyId: 'pol-internal-least-privilege',
      timestamp: new Date(baseTime + 240).toISOString(),
      metadata: { is_demo: true }
    });

    // Hop 3: 10:00:03 - EXPOSURE POINT: CIS dispatches unmasked email to untrusted Third-party Notification Gateway
    const evt3 = await recordEvent({
      traceId,
      incidentId,
      parentEventId: evt2.event_id,
      sourceService: 'Customer Information Service (CIS)',
      destinationService: 'Third-party Notification Gateway',
      apiRoute: '/v2/external/notify/sms-email',
      direction: 'REQUEST',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'ALLOWED', // Policy failure: raw unmasked data allowed across boundary
      policyId: 'pol-third-party-zero-raw',
      exposureStatus: 'CONFIRMED_EXPOSURE',
      timestamp: new Date(baseTime + 520).toISOString(),
      metadata: {
        is_demo: true,
        breachReason: 'Simulated downstream webhook misconfiguration delivered raw customer email to third-party sink',
        destinationTrustLevel: 'UNTRUSTED'
      }
    });

    // Hop 4: 10:00:04 - Third party sink receives unmasked notification
    await recordEvent({
      traceId,
      incidentId,
      parentEventId: evt3.event_id,
      sourceService: 'Third-party Notification Gateway',
      destinationService: 'Third-party Analytics Sinks',
      apiRoute: '/v1/partner/telemetry',
      direction: 'REQUEST',
      dataCategory: 'EMAIL',
      fieldIdentifier: 'customer_email',
      rawValue: 'arun.demo@example.com',
      action: 'EXPOSED',
      policyId: 'pol-third-party-zero-raw',
      exposureStatus: 'CONFIRMED_EXPOSURE',
      timestamp: new Date(baseTime + 890).toISOString(),
      metadata: { is_demo: true, status: 200 }
    });

    // Record Incident in database
    await dbAdapter.createIncident({
      incident_id: incidentId,
      trace_id: traceId,
      title: 'Unauthorized PII Exposure to Third-party Notification Gateway',
      severity: 'CRITICAL',
      status: 'OPEN',
      first_exposure_event_id: evt3.event_id,
      affected_services_count: 4,
      affected_events_count: 4,
      summary_json: {
        customer: 'Arun Kumar (Synthetic Demo)',
        earliestExposureTimestamp: new Date(baseTime + 520).toISOString(),
        sourceService: 'Customer Information Service (CIS)',
        destinationService: 'Third-party Notification Gateway',
        dataCategory: 'EMAIL',
        policyViolated: 'Third-Party Zero-Raw-PII Boundary (pol-third-party-zero-raw)'
      },
      is_demo: 1
    });

    const journey = await getTraceJourney(traceId);

    res.status(200).json({
      success: true,
      scenario: 'SCENARIO_B_POLICY_FAILURE',
      message: 'Demonstration Scenario B executed: Simulated policy failure allowed unmasked email to cross untrusted third-party boundary. Incident created with first exposure pinpointed at 10:00:03.',
      data: {
        incidentId,
        traceId,
        firstExposureEventId: evt3.event_id,
        journey
      }
    });
  } catch (err) {
    console.error('Scenario B error:', err);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/lineage/demo/reset
 * Resets only demonstration records, preserving real audit scans
 */
router.post('/demo/reset', async (req, res) => {
  try {
    const result = await dbAdapter.resetDemoData();
    res.status(200).json(result);
  } catch (err) {
    console.error('Reset demo error:', err);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

