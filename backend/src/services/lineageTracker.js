const crypto = require('crypto');
const { generateFingerprint } = require('./dataFingerprint');
const { evaluateExposure, identifyFirstExposure } = require('./exposureDetector');
const { buildChronologicalTimeline } = require('./timelineBuilder');
const rawDbAdapter = require('../config/dbAdapter');

const dbAdapter = (rawDbAdapter && typeof rawDbAdapter.insertLineageEvent === 'function')
  ? rawDbAdapter
  : (rawDbAdapter && rawDbAdapter.default && typeof rawDbAdapter.default.insertLineageEvent === 'function')
    ? rawDbAdapter.default
    : rawDbAdapter;

/**
 * Lineage Tracker Service
 * Records, traces, and queries sensitive data movement across instrumented microservices.
 */

/**
 * Records an atomic lineage event for a sensitive entity crossing a service boundary.
 *
 * @param {Object} eventParams
 * @returns {Promise<Object>} Created lineage event record
 */
async function recordEvent(eventParams) {
  const {
    traceId,
    parentEventId = null,
    incidentId = null,
    sourceService = 'Banking API Gateway',
    destinationService = 'Internal Service',
    apiRoute = '/api',
    direction = 'REQUEST',
    dataCategory = 'SENSITIVE_DATA',
    fieldIdentifier = 'unspecified',
    rawValue = '',
    fingerprint = null,
    action = 'DETECTED', // 'DETECTED' | 'MASKED' | 'TOKENIZED' | 'ALLOWED' | 'BLOCKED' | 'EXPOSED'
    policyId = null,
    metadata = {}
  } = eventParams;

  const eventId = `evt-${(crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')).slice(0, 12)}`;
  const finalFingerprint = fingerprint || generateFingerprint(dataCategory, rawValue, metadata?.tenantId || 'global');

  // Evaluate exposure status automatically if not manually provided
  let exposureStatus = eventParams.exposureStatus;
  if (!exposureStatus) {
    const services = await getServicesMap();
    const destInfo = services[destinationService] || null;
    const evaluation = evaluateExposure({
      action,
      data_category: dataCategory,
      source_service: sourceService,
      destination_service: destinationService,
      direction
    }, destInfo);
    exposureStatus = evaluation.exposureStatus;
  }

  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
    event_id: eventId,
    trace_id: traceId || `trc-${Date.now().toString(36)}`,
    parent_event_id: parentEventId,
    incident_id: incidentId,
    timestamp: eventParams.timestamp || new Date().toISOString(),
    source_service: sourceService,
    destination_service: destinationService,
    api_route: apiRoute,
    direction: direction.toUpperCase(),
    data_category: dataCategory.toUpperCase(),
    field_identifier: fieldIdentifier,
    fingerprint: finalFingerprint,
    action: action.toUpperCase(),
    policy_id: policyId,
    exposure_status: exposureStatus,
    metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata
  };

  try {
    if (dbAdapter && typeof dbAdapter.insertLineageEvent === 'function') {
      await dbAdapter.insertLineageEvent(record);
    }
  } catch (err) {
    console.warn('[LineageTracker] Persistence warning:', err.message);
  }

  return record;
}

/**
 * Convenience helper to fetch a map of service_name -> service metadata
 */
async function getServicesMap() {
  try {
    if (dbAdapter && typeof dbAdapter.getLineageServices === 'function') {
      const services = await dbAdapter.getLineageServices();
      const map = {};
      for (const s of services) {
        map[s.service_name] = s;
      }
      return map;
    }
  } catch (err) {
    console.warn('[LineageTracker] Services lookup warning:', err.message);
  }
  return {};
}

/**
 * Reconstructs the complete journey of a trace ID across microservices.
 *
 * @param {string} traceId
 * @returns {Promise<Object>} Full reconstructed journey with graph & first exposure analysis
 */
async function getTraceJourney(traceId) {
  if (!traceId) {
    throw new Error('Trace ID is required');
  }

  let events = [];
  try {
    if (dbAdapter && typeof dbAdapter.getLineageEventsByTraceId === 'function') {
      events = await dbAdapter.getLineageEventsByTraceId(traceId);
    }
  } catch (err) {
    console.warn('[LineageTracker] getTraceJourney error:', err.message);
  }

  const servicesMap = await getServicesMap();
  const timelineResult = buildChronologicalTimeline(events, servicesMap);
  const firstExposure = identifyFirstExposure(events, servicesMap);

  return {
    traceId,
    totalEvents: events.length,
    hasConfirmedExposure: Boolean(firstExposure && firstExposure.isConfirmedExposure),
    firstExposure,
    timeline: timelineResult.timeline,
    graphNodes: timelineResult.graphNodes,
    graphEdges: timelineResult.graphEdges,
    durationMs: timelineResult.durationMs,
    startTime: timelineResult.startTime,
    endTime: timelineResult.endTime,
    hasGaps: timelineResult.hasGaps
  };
}

module.exports = {
  recordEvent,
  getTraceJourney,
  getServicesMap
};

