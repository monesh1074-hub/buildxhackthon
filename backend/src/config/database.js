const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'privacyshield.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency & performance
db.pragma('journal_mode = WAL');

// Initialize schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT DEFAULT 'web-ui',
      input_type TEXT DEFAULT 'json',
      masking_mode TEXT DEFAULT 'partial',
      sanitized_content TEXT NOT NULL,
      total_detections INTEGER DEFAULT 0,
      risk_score INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'LOW',
      processing_time_ms REAL DEFAULT 0,
      preview_title TEXT DEFAULT 'Data Scan'
    );

    CREATE TABLE IF NOT EXISTS scan_detections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      rule_name TEXT NOT NULL,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS detection_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      pattern TEXT NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      is_custom INTEGER DEFAULT 0,
      description TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_detections_scan_id ON scan_detections(scan_id);
    CREATE INDEX IF NOT EXISTS idx_detections_category ON scan_detections(category);
  `);

  // Seed default detection rules if none exist
  const existingRulesCount = db.prepare('SELECT COUNT(*) as count FROM detection_rules').get();
  if (existingRulesCount.count === 0) {
    const seedRules = [
      {
        id: 'rule-email',
        name: 'Email Addresses',
        category: 'EMAIL',
        severity: 'MEDIUM',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects personal and corporate email addresses'
      },
      {
        id: 'rule-phone',
        name: 'Phone Numbers',
        category: 'PHONE',
        severity: 'MEDIUM',
        pattern: '(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects US and international telephone numbers'
      },
      {
        id: 'rule-credit-card',
        name: 'Credit / Debit Cards',
        category: 'CREDIT_CARD',
        severity: 'CRITICAL',
        pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11}|\\d{4}[-\\s]\\d{4}[-\\s]\\d{4}[-\\s]\\d{4})\\b',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects Visa, MasterCard, Amex, Discover, and format-valid card numbers'
      },
      {
        id: 'rule-ssn',
        name: 'Social Security Number (SSN)',
        category: 'SSN',
        severity: 'CRITICAL',
        pattern: '\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects US Social Security Numbers (SSN)'
      },
      {
        id: 'rule-iban',
        name: 'Bank Account / IBAN',
        category: 'ACCOUNT_NUMBER',
        severity: 'HIGH',
        pattern: '\\b[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}\\b',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects International Bank Account Numbers (IBAN)'
      },
      {
        id: 'rule-api-keys',
        name: 'API Keys & Bearer Secrets',
        category: 'API_KEY',
        severity: 'CRITICAL',
        pattern: '(?:(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|bearer)[\\s:="\\\'`]+)([A-Za-z0-9_\\-\\.]{16,64})',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects API keys, bearer tokens, and leaked credentials'
      },
      {
        id: 'rule-jwt',
        name: 'JSON Web Token (JWT)',
        category: 'API_KEY',
        severity: 'HIGH',
        pattern: 'eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects unencrypted JWT authorization session tokens'
      },
      {
        id: 'rule-ipv4',
        name: 'IPv4 Address',
        category: 'IP_ADDRESS',
        severity: 'LOW',
        pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
        is_enabled: 1,
        is_custom: 0,
        description: 'Detects public and internal IPv4 addresses'
      }
    ];

    const insertRule = db.prepare(`
      INSERT INTO detection_rules (id, name, category, severity, pattern, is_enabled, is_custom, description)
      VALUES (@id, @name, @category, @severity, @pattern, @is_enabled, @is_custom, @description)
    `);

    const insertMany = db.transaction((rules) => {
      for (const rule of rules) insertRule.run(rule);
    });

    insertMany(seedRules);
  }
}

initDatabase();

module.exports = db;

