const { evaluateExposure } = require('./exposureDetector');
const { maskFingerprintForPublic } = require('./dataFingerprint');

/**
 * Timeline Builder Service
 *
 * Reconstructs accurate chronological sequences of sensitive data flows across
 * microservices, linking parents, hops, and state changes without fabricating missing steps.
 */

/**
 * Builds a chronological investigation timeline from raw lineage events.
 *
 * @param {Array} events - Lineage events for a trace or incident
 * @param {Object} servicesMap - Service metadata lookup map
 * @returns {Object} Structured timeline with chronological hops, gaps, and node graph
 */
function buildChronologicalTimeline(events = [], servicesMap = {}) {
  if (!events || events.length === 0) {
    return {
      totalHops: 0,
      startTime: null,
      endTime: null,
      durationMs: 0,
      timeline: [],
      graphNodes: [],
      graphEdges: [],
      hasGaps: false,
      gapsCount: 0
    };
  }

  // 1. Sort strictly by timestamp ascending
  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const startTime = sorted[0].timestamp;
  const endTime = sorted[sorted.length - 1].timestamp;
  const durationMs = Math.max(0, new Date(endTime).getTime() - new Date(startTime).getTime());

  let gapsCount = 0;
  const enrichedTimeline = [];
  const nodesMap = new Map();
  const edges = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;

    const sourceInfo = servicesMap[current.source_service] || {
      service_name: current.source_service,
      service_type: 'INTERNAL_SERVICE',
      trust_level: 'TRUSTED'
    };

    const destInfo = servicesMap[current.destination_service] || {
      service_name: current.destination_service,
      service_type: 'INTERNAL_SERVICE',
      trust_level: 'TRUSTED'
    };

    // Evaluate exposure at this step
    const exposureEval = evaluateExposure(current, destInfo);

    // Compute hop latency from previous event if available
    let hopDeltaMs = 0;
    if (prev) {
      hopDeltaMs = Math.max(0, new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime());
    }

    // Check for architectural gaps (e.g. current source does not match previous destination)
    let isDiscontinuousGap = false;
    if (prev && prev.destination_service !== current.source_service && current.parent_event_id !== prev.event_id) {
      isDiscontinuousGap = true;
      gapsCount++;
    }

    // Register Graph Nodes
    if (!nodesMap.has(current.source_service)) {
      nodesMap.set(current.source_service, {
        id: current.source_service,
        name: current.source_service,
        type: sourceInfo.service_type || 'INTERNAL_SERVICE',
        trustLevel: sourceInfo.trust_level || 'TRUSTED',
        eventsCount: 1,
        hasExposure: false
      });
    } else {
      nodesMap.get(current.source_service).eventsCount++;
    }

    if (!nodesMap.has(current.destination_service)) {
      nodesMap.set(current.destination_service, {
        id: current.destination_service,
        name: current.destination_service,
        type: destInfo.service_type || 'INTERNAL_SERVICE',
        trustLevel: destInfo.trust_level || 'TRUSTED',
        eventsCount: 1,
        hasExposure: exposureEval.isExposure
      });
    } else {
      const node = nodesMap.get(current.destination_service);
      node.eventsCount++;
      if (exposureEval.isExposure) node.hasExposure = true;
    }

    // Register Graph Edge
    edges.push({
      id: `edge-${current.event_id}`,
      source: current.source_service,
      target: current.destination_service,
      action: current.action,
      dataCategory: current.data_category,
      isExposure: exposureEval.isExposure,
      exposureStatus: exposureEval.exposureStatus,
      timestamp: current.timestamp,
      direction: current.direction
    });

    enrichedTimeline.push({
      stepNumber: i + 1,
      eventId: current.event_id,
      parentEventId: current.parent_event_id || null,
      traceId: current.trace_id,
      timestamp: current.timestamp,
      hopDeltaMs,
      sourceService: current.source_service,
      sourceTrustLevel: sourceInfo.trust_level,
      destinationService: current.destination_service,
      destinationTrustLevel: destInfo.trust_level,
      apiRoute: current.api_route || '/api',
      direction: current.direction || 'REQUEST',
      dataCategory: current.data_category,
      fieldIdentifier: current.field_identifier || 'unspecified',
      publicFingerprint: maskFingerprintForPublic(current.fingerprint),
      action: current.action,
      exposureStatus: exposureEval.exposureStatus,
      isExposure: exposureEval.isExposure,
      severity: exposureEval.severity,
      policyId: current.policy_id || exposureEval.policyId || null,
      policyName: exposureEval.policyName || null,
      explanation: exposureEval.reason,
      isDiscontinuousGap,
      metadata: typeof current.metadata === 'string' ? safeParseJson(current.metadata) : current.metadata || {}
    });
  }

  return {
    totalHops: enrichedTimeline.length,
    startTime,
    endTime,
    durationMs,
    hasGaps: gapsCount > 0,
    gapsCount,
    timeline: enrichedTimeline,
    graphNodes: Array.from(nodesMap.values()),
    graphEdges: edges
  };
}

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

module.exports = {
  buildChronologicalTimeline
};

