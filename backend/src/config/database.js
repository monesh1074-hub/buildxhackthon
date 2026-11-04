const path = require('path');
const fs = require('fs');

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

function createMemoryFallbackDb() {
  const memoryScans = [];
  const memoryDetections = [];
  const memoryRules = JSON.parse(JSON.stringify(seedRules));

  return {
    exec: () => {},
    pragma: () => {},
    prepare: (sql) => {
      const lower = sql.toLowerCase();
      return {
        run: (...args) => {
          if (lower.includes('insert into scans')) {
            const [id, source, input_type, masking_mode, sanitized_content, total_detections, risk_score, risk_level, processing_time_ms, preview_title] = args;
            memoryScans.unshift({
              id,
              timestamp: new Date().toISOString(),
              source,
              input_type,
              masking_mode,
              sanitized_content,
              total_detections,
              risk_score,
              risk_level,
              processing_time_ms,
              preview_title
            });
          } else if (lower.includes('insert into scan_detections')) {
            const [scan_id, category, severity, count, rule_name] = args;
            memoryDetections.push({ id: memoryDetections.length + 1, scan_id, category, severity, count, rule_name });
          } else if (lower.includes('update detection_rules')) {
            const [status, id] = args;
            const r = memoryRules.find(x => x.id === id);
            if (r) r.is_enabled = status;
          } else if (lower.includes('insert into detection_rules')) {
            const item = typeof args[0] === 'object' ? args[0] : { id: args[0], name: args[1], category: args[2], severity: args[3], pattern: args[4], description: args[7] };
            memoryRules.push({ ...item, is_enabled: 1, is_custom: 1 });
          } else if (lower.includes('delete from scan_detections')) {
            if (args[0]) {
              const idx = memoryDetections.findIndex(d => d.scan_id === args[0]);
              if (idx !== -1) memoryDetections.splice(idx, 1);
            } else {
              memoryDetections.length = 0;
            }
          } else if (lower.includes('delete from scans')) {
            if (args[0]) {
              const idx = memoryScans.findIndex(s => s.id === args[0]);
              if (idx !== -1) memoryScans.splice(idx, 1);
            } else {
              memoryScans.length = 0;
            }
          }
          return { changes: 1 };
        },
        get: (...args) => {
          if (lower.includes('select count(*) as count from detection_rules')) {
            return { count: memoryRules.length };
          }
          if (lower.includes('select count(*) as count from scans')) {
            return { count: memoryScans.length };
          }
          if (lower.includes('select count(*) as count from scan_detections')) {
            return { count: memoryDetections.length };
          }
          if (lower.includes('select * from scans where id =')) {
            return memoryScans.find(s => s.id === args[0]) || null;
          }
          if (lower.includes('select * from detection_rules where id =')) {
            return memoryRules.find(r => r.id === args[0]) || null;
          }
          if (lower.includes('coalesce(sum(total_detections)')) {
            const total = memoryScans.reduce((acc, s) => acc + (s.total_detections || 0), 0);
            return { count: total };
          }
          if (lower.includes('coalesce(avg(processing_time_ms)')) {
            const avg = memoryScans.length ? memoryScans.reduce((acc, s) => acc + (s.processing_time_ms || 0), 0) / memoryScans.length : 0;
            return { avgTime: avg };
          }
          return { count: 0 };
        },
        all: (...args) => {
          if (lower.includes('from detection_rules')) {
            if (lower.includes('is_enabled = 1')) return memoryRules.filter(r => r.is_enabled === 1 || r.is_enabled === true);
            return memoryRules;
          }
          if (lower.includes('from scan_detections where scan_id =')) {
            return memoryDetections.filter(d => d.scan_id === args[0]);
          }
          if (lower.includes('from scans')) {
            return memoryScans.slice(0, 50);
          }
          return [];
        }
      };
    },
    transaction: (fn) => (...args) => fn(...args)
  };
}

function initDatabase(sqliteInstance) {
  sqliteInstance.exec(`
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

  const existingRulesCount = sqliteInstance.prepare('SELECT COUNT(*) as count FROM detection_rules').get();
  if (existingRulesCount.count === 0) {
    const insertRule = sqliteInstance.prepare(`
      INSERT INTO detection_rules (id, name, category, severity, pattern, is_enabled, is_custom, description)
      VALUES (@id, @name, @category, @severity, @pattern, @is_enabled, @is_custom, @description)
    `);

    const insertMany = sqliteInstance.transaction((rules) => {
      for (const rule of rules) insertRule.run(rule);
    });

    insertMany(seedRules);
  }
}

let db;
try {
  const Database = require('better-sqlite3');
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  let dataDir = isVercel ? '/tmp' : path.join(__dirname, '..', '..', 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (e) {
    dataDir = '/tmp';
  }

  const dbPath = path.join(dataDir, 'privacyshield.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initDatabase(db);
} catch (err) {
  console.warn('[PrivacyShield Database] Native SQLite driver unavailable, operating in memory-store mode:', err.message);
  db = createMemoryFallbackDb();
}

module.exports = db;
