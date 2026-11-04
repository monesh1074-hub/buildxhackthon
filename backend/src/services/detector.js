const db = require('../config/database');

/**
 * Luhn Algorithm validation for credit card numbers
 */
function isValidLuhn(numberStr) {
  const sanitized = numberStr.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(sanitized)) return false;

  let sum = 0;
  let alternate = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let n = parseInt(sanitized.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Fetch all enabled detection rules from database
 */
function getActiveRules() {
  try {
    const rules = db.prepare('SELECT * FROM detection_rules WHERE is_enabled = 1').all();
    return rules;
  } catch (err) {
    console.error('Error fetching detection rules:', err.message);
    return [];
  }
}

/**
 * Common sensitive JSON keys for contextual detection
 */
const SENSITIVE_JSON_KEYS = [
  { keyPattern: /^(?:password|passwd|pwd|secret|auth_token|access_token|api_key|apikey|private_key)$/i, category: 'API_KEY', severity: 'CRITICAL' },
  { keyPattern: /^(?:ssn|social_security|national_id|tax_id|aadhaar)$/i, category: 'SSN', severity: 'CRITICAL' },
  { keyPattern: /^(?:card_number|credit_card|debit_card|pan|cc_num|card_no|card)$/i, category: 'CREDIT_CARD', severity: 'CRITICAL' },
  { keyPattern: /^(?:cvv|cvc|card_security_code)$/i, category: 'CREDIT_CARD', severity: 'CRITICAL' },
  { keyPattern: /^(?:account_number|bank_account|account_no|iban|routing_number)$/i, category: 'ACCOUNT_NUMBER', severity: 'HIGH' },
  { keyPattern: /^(?:email|user_email|customer_email)$/i, category: 'EMAIL', severity: 'MEDIUM' },
  { keyPattern: /^(?:phone|phone_number|mobile|telephone|contact_no)$/i, category: 'PHONE', severity: 'MEDIUM' }
];

/**
 * Detect sensitive entities in text or JSON
 */
function detectSensitiveData(input) {
  const text = typeof input === 'object' ? JSON.stringify(input, null, 2) : String(input);
  const activeRules = getActiveRules();
  const detections = [];
  const foundSpans = [];

  function isOverlapping(start, end) {
    return foundSpans.some(span => Math.max(start, span.start) < Math.min(end, span.end));
  }

  // 1. Run database-backed regex rules
  for (const rule of activeRules) {
    try {
      const regex = new RegExp(rule.pattern, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        let value = match[0];
        let start = match.index;
        let end = start + value.length;

        // If the rule has capture groups (e.g. for API keys prefix), isolate the actual key value
        if (match[1] && rule.category === 'API_KEY') {
          const subIndex = value.indexOf(match[1]);
          start = start + subIndex;
          value = match[1];
          end = start + value.length;
        }

        // Avoid overlapping with already detected spans
        if (!isOverlapping(start, end) && value.trim().length > 0) {
          foundSpans.push({ start, end });
          detections.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity,
            matchedValue: value,
            start,
            end
          });
        }
      }
    } catch (err) {
      console.warn(`Invalid regex pattern in rule ${rule.name}:`, err.message);
    }
  }

  // 2. Contextual JSON Key detection
  for (const item of SENSITIVE_JSON_KEYS) {
    const cleanPattern = item.keyPattern.source.replace(/[\^\$]/g, '');
    const jsonFieldRegex = new RegExp(`"([^"]*(?:${cleanPattern})[^"]*)"\\s*:\\s*(?:"([^"]+)"|(\\d+))`, 'gi');
    let match;

    while ((match = jsonFieldRegex.exec(text)) !== null) {
      const keyMatched = match[1];
      const valMatched = match[2] || match[3];
      if (!valMatched) continue;

      const fullMatch = match[0];
      // Locate the value portion only (ignoring key name)
      const valIndex = fullMatch.lastIndexOf(valMatched);
      const start = match.index + valIndex;
      const end = start + valMatched.length;

      if (!isOverlapping(start, end)) {
        foundSpans.push({ start, end });
        detections.push({
          ruleId: `contextual-${item.category.toLowerCase()}`,
          ruleName: `Contextual Field: "${keyMatched}"`,
          category: item.category,
          severity: item.severity,
          matchedValue: valMatched,
          start,
          end
        });
      }
    }
  }

  // Sort detections by position in text
  detections.sort((a, b) => a.start - b.start);

  // Group summary by category
  const summaryByCategory = {};
  let totalDetections = 0;
  let highestSeverity = 'LOW';
  const severityWeights = { LOW: 1, MEDIUM: 3, HIGH: 6, CRITICAL: 10 };
  let severityScoreSum = 0;

  for (const d of detections) {
    totalDetections++;
    if (!summaryByCategory[d.category]) {
      summaryByCategory[d.category] = {
        category: d.category,
        count: 0,
        severity: d.severity
      };
    }
    summaryByCategory[d.category].count++;

    const currentWeight = severityWeights[d.severity] || 1;
    severityScoreSum += currentWeight;

    if (currentWeight > (severityWeights[highestSeverity] || 1)) {
      highestSeverity = d.severity;
    }
  }

  // Calculate normalized risk score (0 - 100)
  const riskScore = Math.min(100, Math.round(severityScoreSum * 8));

  return {
    detections,
    totalDetections,
    summary: Object.values(summaryByCategory),
    highestSeverity,
    riskScore,
    riskLevel: riskScore >= 70 ? 'CRITICAL' : riskScore >= 40 ? 'HIGH' : riskScore >= 15 ? 'MEDIUM' : 'LOW'
  };
}

module.exports = {
  detectSensitiveData,
  isValidLuhn,
  getActiveRules
};
