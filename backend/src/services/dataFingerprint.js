const crypto = require('crypto');

// Cryptographic salt/key for HMAC-based correlation
// Stored outside codebase in environment variable in production
const HMAC_SECRET = process.env.FINGERPRINT_HMAC_SECRET || process.env.SUPABASE_KEY || 'privacyshield-lineage-hmac-salt-dev-2026';

/**
 * Normalizes a sensitive value prior to hashing so minor formatting variations
 * (spaces, hyphens, casing in emails) map to the same correlation fingerprint.
 */
function normalizeSensitiveValue(category, rawValue) {
  if (!rawValue) return '';
  const str = String(rawValue).trim();
  switch (category) {
    case 'EMAIL':
      return str.toLowerCase();
    case 'PHONE':
    case 'CREDIT_CARD':
    case 'SSN':
    case 'ACCOUNT_NUMBER':
      return str.replace(/[\s-]/g, '');
    default:
      return str;
  }
}

/**
 * Generates a non-reversible, keyed HMAC fingerprint for a sensitive value.
 * Original PII is never stored or recoverable from this fingerprint.
 *
 * @param {string} category - e.g. 'EMAIL', 'CREDIT_CARD', 'PHONE'
 * @param {string} rawValue - The sensitive value
 * @param {string} tenantId - Scope for tenant isolation (default: 'global')
 * @returns {string} Keyed HMAC fingerprint (e.g. 'fp_EMAIL_a9f2bc7e4d10')
 */
function generateFingerprint(category, rawValue, tenantId = 'global') {
  if (!rawValue) {
    return `fp_${category}_anonymous`;
  }
  const normalized = normalizeSensitiveValue(category, rawValue);
  const payload = `${tenantId}:${category.toUpperCase()}:${normalized}`;
  const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return `fp_${category.toUpperCase()}_${hmac.slice(0, 16)}`;
}

/**
 * Anonymizes/masks a fingerprint for public API responses so internal correlation hashes
 * are not leaked to external untrusted clients.
 *
 * @param {string} fingerprint - Full HMAC fingerprint
 * @returns {string} Obfuscated token for UI display (e.g. 'fp_EMAIL_••••4d10')
 */
function maskFingerprintForPublic(fingerprint) {
  if (!fingerprint) return 'fp_••••••••';
  const parts = fingerprint.split('_');
  if (parts.length < 3) return 'fp_••••••••';
  const hash = parts[2];
  const suffix = hash.slice(-4);
  return `fp_${parts[1]}_••••${suffix}`;
}

module.exports = {
  generateFingerprint,
  maskFingerprintForPublic,
  normalizeSensitiveValue
};

