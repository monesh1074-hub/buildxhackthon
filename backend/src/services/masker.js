const crypto = require('crypto');

/**
 * Generate a short deterministic token for a sensitive value
 */
function generateToken(category, value) {
  const hash = crypto.createHash('sha256').update(value).digest('hex').substring(0, 8);
  return `[TOKEN_${category}_${hash.toUpperCase()}]`;
}

/**
 * Partially mask an email: e.g. john.doe@example.com -> j***e@example.com
 */
function maskEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED_EMAIL]';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const maskedLocal = `${local[0]}${'*'.repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Partially mask a phone number: e.g. +1-555-123-4567 -> +1-***-***-4567
 */
function maskPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

/**
 * Partially mask a credit card: e.g. 4111 2222 3333 4444 -> ****-****-****-4444
 */
function maskCreditCard(card) {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 4) return '****-****-****-****';
  const last4 = digits.slice(-4);
  return `****-****-****-${last4}`;
}

/**
 * Partially mask an SSN: e.g. 123-45-6789 -> ***-**-6789
 */
function maskSSN(ssn) {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return '***-**-****';
  const last4 = digits.slice(-4);
  return `***-**-${last4}`;
}

/**
 * Partially mask an Account Number or IBAN
 */
function maskAccountNumber(account) {
  const clean = account.trim();
  if (clean.length <= 4) return '****';
  const last4 = clean.slice(-4);
  return `${'*'.repeat(Math.max(4, clean.length - 4))}${last4}`;
}

/**
 * Partially mask an API Key or secret
 */
function maskApiKey(key) {
  if (key.length <= 6) return '********';
  const prefix = key.slice(0, 3);
  return `${prefix}${'*'.repeat(Math.min(12, key.length - 3))}`;
}

/**
 * Partially mask an IPv4 address: e.g. 192.168.1.100 -> 192.168.***.***
 */
function maskIpAddress(ip) {
  const octets = ip.split('.');
  if (octets.length !== 4) return '***.***.***.***';
  return `${octets[0]}.${octets[1]}.***.***`;
}

/**
 * Format a single sensitive value based on masking mode
 */
function formatMaskedValue(value, category, mode = 'partial') {
  if (mode === 'redaction') {
    return `[REDACTED_${category}]`;
  }

  if (mode === 'tokenization') {
    return generateToken(category, value);
  }

  // Default: Partial masking
  switch (category) {
    case 'EMAIL':
      return maskEmail(value);
    case 'PHONE':
      return maskPhone(value);
    case 'CREDIT_CARD':
      return maskCreditCard(value);
    case 'SSN':
      return maskSSN(value);
    case 'ACCOUNT_NUMBER':
      return maskAccountNumber(value);
    case 'API_KEY':
      return maskApiKey(value);
    case 'IP_ADDRESS':
      return maskIpAddress(value);
    default:
      return value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : '****';
  }
}

/**
 * Mask all detected sensitive entities in input text
 * Replaces values from right to left so earlier indices remain valid
 */
function applyMasking(text, detections, mode = 'partial') {
  if (!text || detections.length === 0) {
    return {
      sanitizedText: text,
      replacements: []
    };
  }

  // Make sure detections are sorted from end to start for non-destructive replacement
  const sorted = [...detections].sort((a, b) => b.start - a.start);
  let result = text;
  const replacements = [];

  for (const item of sorted) {
    const originalValue = item.matchedValue;
    const maskedValue = formatMaskedValue(originalValue, item.category, mode);

    // Replace in text
    result = result.substring(0, item.start) + maskedValue + result.substring(item.end);

    replacements.unshift({
      category: item.category,
      severity: item.severity,
      ruleName: item.ruleName,
      maskedValue,
      originalLength: originalValue.length,
      start: item.start,
      end: item.start + maskedValue.length
    });
  }

  return {
    sanitizedText: result,
    replacements
  };
}

module.exports = {
  applyMasking,
  formatMaskedValue,
  generateToken
};

