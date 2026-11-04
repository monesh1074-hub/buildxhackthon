/**
 * Exposure Detector Service
 *
 * Distinguishes confirmed leaks from normal detection and suspicious flows.
 * Identifies the exact first point of unauthorized exposure.
 */

/**
 * Standard policy rules for service trust boundaries
 */
const DEFAULT_BOUNDARY_POLICIES = {
  // Untrusted third-party services must NEVER receive raw plaintext PII
  UNTRUSTED_THIRD_PARTY: {
    id: 'pol-third-party-zero-raw',
    name: 'Third-Party Zero-Raw-PII Boundary',
    allowedActions: ['MASKED', 'TOKENIZED', 'BLOCKED'],
    prohibitedActions: ['ALLOWED', 'EXPOSED', 'UNMASKED'],
    prohibitedCategories: ['CREDIT_CARD', 'SSN', 'EMAIL', 'PHONE', 'ACCOUNT_NUMBER', 'API_KEY'],
    severity: 'CRITICAL',
    description: 'Third-party integrations and external webhooks must receive masked tokens or redacted values only.'
  },
  // Core Banking / Ledger must not expose card numbers or SSN downstream to client
  CLIENT_RESPONSE_PROTECTION: {
    id: 'pol-client-response-masking',
    name: 'Outbound Client Response Masking',
    allowedActions: ['MASKED', 'TOKENIZED', 'BLOCKED'],
    prohibitedActions: ['ALLOWED', 'EXPOSED'],
    prohibitedCategories: ['CREDIT_CARD', 'SSN', 'API_KEY'],
    severity: 'CRITICAL',
    description: 'Outbound HTTP responses to client apps must have sensitive credentials and PANs masked.'
  },
  // Internal service-to-service transfers for high-risk categories
  INTERNAL_RESTRICTED_ACCESS: {
    id: 'pol-internal-least-privilege',
    name: 'Internal Service Least Privilege',
    allowedActions: ['MASKED', 'TOKENIZED', 'ALLOWED'],
    prohibitedActions: ['EXPOSED'],
    prohibitedCategories: ['API_KEY'],
    severity: 'HIGH',
    description: 'Raw API keys and auth tokens must not cross internal service boundaries.'
  }
};

/**
 * Evaluates a single lineage event against boundary security policies.
 *
 * @param {Object} event - The lineage event record
 * @param {Object} destService - The destination service metadata
 * @returns {Object} Evaluation result with exposureStatus and severity
 */
function evaluateExposure(event, destService = null) {
  const { action, data_category, source_service, destination_service, direction } = event;
  const isDestUntrusted = destService?.trust_level === 'UNTRUSTED' || destService?.service_type === 'THIRD_PARTY';

  // Rule 1: Detection is NOT exposure. Detection inside an API Gateway or trusted service is normal.
  if (action === 'DETECTED') {
    return {
      isExposure: false,
      exposureStatus: 'NORMAL',
      severity: 'LOW',
      reason: 'Sensitive data detected at inspection boundary. Processing is within authorized perimeter.'
    };
  }

  // Rule 2: Masked or Tokenized data is safe
  if (action === 'MASKED' || action === 'TOKENIZED') {
    return {
      isExposure: false,
      exposureStatus: 'MASKED_SAFE',
      severity: 'LOW',
      reason: `Sensitive ${data_category} was transformed (${action}) before forwarding to ${destination_service}.`
    };
  }

  // Rule 3: Blocked transfers are safe
  if (action === 'BLOCKED') {
    return {
      isExposure: false,
      exposureStatus: 'BLOCKED_SAFE',
      severity: 'LOW',
      reason: `Transfer of ${data_category} was intercepted and blocked by PrivacyShield policy engine.`
    };
  }

  // Rule 4: Plaintext data reaching an untrusted destination is a CONFIRMED EXPOSURE
  if (isDestUntrusted && (action === 'ALLOWED' || action === 'EXPOSED')) {
    return {
      isExposure: true,
      exposureStatus: 'CONFIRMED_EXPOSURE',
      severity: DEFAULT_BOUNDARY_POLICIES.UNTRUSTED_THIRD_PARTY.severity,
      policyId: DEFAULT_BOUNDARY_POLICIES.UNTRUSTED_THIRD_PARTY.id,
      policyName: DEFAULT_BOUNDARY_POLICIES.UNTRUSTED_THIRD_PARTY.name,
      reason: `CONFIRMED LEAKAGE: Raw unmasked ${data_category} was transmitted from ${source_service} to untrusted destination [${destination_service}].`
    };
  }

  // Rule 5: Raw credentials or cards sent to client in response
  if (direction === 'RESPONSE' && (destination_service.toLowerCase().includes('client') || destService?.service_type === 'CLIENT') && (action === 'ALLOWED' || action === 'EXPOSED')) {
    if (['CREDIT_CARD', 'SSN', 'API_KEY'].includes(data_category)) {
      return {
        isExposure: true,
        exposureStatus: 'CONFIRMED_EXPOSURE',
        severity: 'CRITICAL',
        policyId: DEFAULT_BOUNDARY_POLICIES.CLIENT_RESPONSE_PROTECTION.id,
        policyName: DEFAULT_BOUNDARY_POLICIES.CLIENT_RESPONSE_PROTECTION.name,
        reason: `CONFIRMED LEAKAGE: Unmasked high-risk ${data_category} returned in response body to client application.`
      };
    }
  }

  // Rule 6: Internal forwarding without explicit security action
  if (action === 'EXPOSED') {
    return {
      isExposure: true,
      exposureStatus: 'CONFIRMED_EXPOSURE',
      severity: 'HIGH',
      reason: `Explicit exposure action logged for ${data_category} from ${source_service} to ${destination_service}.`
    };
  }

  // Normal flow within trusted boundary
  return {
    isExposure: false,
    exposureStatus: 'NORMAL',
    severity: 'LOW',
    reason: `Operation authorized within trusted internal boundary (${source_service} -> ${destination_service}).`
  };
}

/**
 * Scans a chronological list of events for a trace or incident and identifies
 * the earliest confirmed unauthorized exposure event.
 *
 * @param {Array} events - Chronologically sorted events
 * @param {Map|Object} servicesMap - Map of service_name -> service info
 * @returns {Object|null} First exposure metadata or null if no exposure
 */
function identifyFirstExposure(events = [], servicesMap = {}) {
  if (!events || events.length === 0) return null;

  // Sort events chronologically to guarantee earliest detection
  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const event of sorted) {
    const destInfo = servicesMap[event.destination_service] || null;
    const evalResult = evaluateExposure(event, destInfo);

    if (evalResult.isExposure && evalResult.exposureStatus === 'CONFIRMED_EXPOSURE') {
      return {
        isConfirmedExposure: true,
        firstExposureEventId: event.event_id,
        earliestTimestamp: event.timestamp,
        sourceService: event.source_service,
        destinationService: event.destination_service,
        apiRoute: event.api_route || '/api',
        dataCategory: event.data_category,
        action: event.action,
        policyId: evalResult.policyId || 'pol-boundary-violation',
        policyName: evalResult.policyName || 'Unauthorized Boundary Crossing',
        severity: evalResult.severity || 'HIGH',
        explanation: evalResult.reason,
        evidenceConfidence: 'CONFIRMED_FORENSIC_EVIDENCE'
      };
    }
  }

  // Check for suspicious anomalies (unconfirmed)
  for (const event of sorted) {
    const destInfo = servicesMap[event.destination_service] || null;
    const evalResult = evaluateExposure(event, destInfo);
    if (evalResult.exposureStatus === 'SUSPICIOUS') {
      return {
        isConfirmedExposure: false,
        firstExposureEventId: event.event_id,
        earliestTimestamp: event.timestamp,
        sourceService: event.source_service,
        destinationService: event.destination_service,
        dataCategory: event.data_category,
        action: event.action,
        severity: 'MEDIUM',
        explanation: 'Suspicious data transfer detected across service boundary without confirmation of safety masking.',
        evidenceConfidence: 'SUSPICIOUS_UNCONFIRMED'
      };
    }
  }

  return null;
}

module.exports = {
  evaluateExposure,
  identifyFirstExposure,
  DEFAULT_BOUNDARY_POLICIES
};
