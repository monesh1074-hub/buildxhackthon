const { evaluateExposure } = require('./exposureDetector');

/**
 * Impact Analyzer Service
 *
 * Quantifies the operational blast radius and boundary breach impact
 * of an exposure incident without displaying original sensitive PII.
 */

function analyzeIncidentImpact(incident, events = [], servicesMap = {}) {
  const affectedServicesSet = new Set();
  const affectedRoutesSet = new Set();
  const affectedCategoriesSet = new Set();
  const confirmedLeakedDestinations = new Set();
  const unmaskedEvents = [];
  const safeMaskedEvents = [];

  let highestSeverity = incident?.severity || 'LOW';

  for (const event of events) {
    if (event.source_service) affectedServicesSet.add(event.source_service);
    if (event.destination_service) affectedServicesSet.add(event.destination_service);
    if (event.api_route) affectedRoutesSet.add(event.api_route);
    if (event.data_category) affectedCategoriesSet.add(event.data_category);

    const destInfo = servicesMap[event.destination_service] || null;
    const evaluation = evaluateExposure(event, destInfo);

    if (evaluation.isExposure && evaluation.exposureStatus === 'CONFIRMED_EXPOSURE') {
      confirmedLeakedDestinations.add(event.destination_service);
      unmaskedEvents.push({
        eventId: event.event_id,
        timestamp: event.timestamp,
        source: event.source_service,
        destination: event.destination_service,
        category: event.data_category,
        apiRoute: event.api_route,
        severity: evaluation.severity
      });
      if (evaluation.severity === 'CRITICAL') highestSeverity = 'CRITICAL';
      else if (evaluation.severity === 'HIGH' && highestSeverity !== 'CRITICAL') highestSeverity = 'HIGH';
    } else if (event.action === 'MASKED' || event.action === 'TOKENIZED' || event.action === 'BLOCKED') {
      safeMaskedEvents.push(event.event_id);
    }
  }

  // Calculate blast radius score (0 - 100)
  const isConfirmed = confirmedLeakedDestinations.size > 0 || incident?.first_exposure_event_id;
  let blastRadiusScore = 0;
  if (isConfirmed) {
    blastRadiusScore += Math.min(40, confirmedLeakedDestinations.size * 25);
    blastRadiusScore += Math.min(30, affectedCategoriesSet.size * 15);
    blastRadiusScore += Math.min(30, affectedRoutesSet.size * 10);
  } else {
    blastRadiusScore = Math.min(25, affectedServicesSet.size * 5);
  }

  return {
    incidentId: incident?.incident_id || incident?.id,
    traceId: incident?.trace_id,
    title: incident?.title || 'Data Leakage Incident Analysis',
    status: incident?.status || 'OPEN',
    overallSeverity: highestSeverity,
    blastRadiusScore: Math.min(100, blastRadiusScore),
    metrics: {
      totalEvents: events.length,
      affectedServicesCount: affectedServicesSet.size,
      affectedRoutesCount: affectedRoutesSet.size,
      affectedCategoriesCount: affectedCategoriesSet.size,
      confirmedExposedDestinationsCount: confirmedLeakedDestinations.size,
      safeMaskedEventsCount: safeMaskedEvents.length
    },
    exposureVerdict: isConfirmed ? 'CONFIRMED_DATA_EXPOSURE' : 'SUSPICIOUS_TRANSFER_MONITORED',
    affectedServices: Array.from(affectedServicesSet),
    affectedRoutes: Array.from(affectedRoutesSet),
    affectedDataCategories: Array.from(affectedCategoriesSet),
    confirmedExposedDestinations: Array.from(confirmedLeakedDestinations),
    investigationRecommendation: isConfirmed
      ? 'IMMEDIATE ACTION REQUIRED: Revoke untrusted downstream syncs and enforce gateway response masking on the offending route.'
      : 'MONITORING: Sensitive data detected within perimeter. Confirm destination authentication and verify tokenization.'
  };
}

module.exports = {
  analyzeIncidentImpact
};
