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

const seedServices = [
  {
    id: 'svc-client',
    service_name: 'Customer Web / Mobile Client',
    service_type: 'CLIENT',
    trust_level: 'UNTRUSTED'
  },
  {
    id: 'svc-gateway',
    service_name: 'Banking API Gateway',
    service_type: 'API_GATEWAY',
    trust_level: 'TRUSTED'
  },
  {
    id: 'svc-cis',
    service_name: 'Customer Information Service (CIS)',
    service_type: 'INTERNAL_SERVICE',
    trust_level: 'TRUSTED'
  },
  {
    id: 'svc-ledger',
    service_name: 'Core Accounts & Ledger Service',
    service_type: 'INTERNAL_SERVICE',
    trust_level: 'RESTRICTED'
  },
  {
    id: 'svc-notifications',
    service_name: 'Third-party Notification Gateway',
    service_type: 'THIRD_PARTY',
    trust_level: 'UNTRUSTED'
  },
  {
    id: 'svc-analytics',
    service_name: 'Third-party Analytics Sinks',
    service_type: 'THIRD_PARTY',
    trust_level: 'UNTRUSTED'
  }
];

function createMemoryFallbackDb() {
  const memoryScans = [];
  const memoryDetections = [];
  const memoryRules = JSON.parse(JSON.stringify(seedRules));
  const memoryServices = JSON.parse(JSON.stringify(seedServices));
  const memoryLineageEvents = [];
  const memoryIncidents = [];

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
          } else if (lower.includes('insert into lineage_events')) {
            const [id, event_id, trace_id, parent_event_id, incident_id, timestamp, source_service, destination_service, api_route, direction, data_category, field_identifier, fingerprint, action, policy_id, exposure_status, metadata] = args;
            memoryLineageEvents.push({
              id,
              event_id,
              trace_id,
              parent_event_id,
              incident_id,
              timestamp: timestamp || new Date().toISOString(),
              source_service,
              destination_service,
              api_route,
              direction,
              data_category,
              field_identifier,
              fingerprint,
              action,
              policy_id,
              exposure_status,
              metadata
            });
          } else if (lower.includes('insert into leakage_incidents')) {
            const [id, incident_id, trace_id, title, severity, status, first_exposure_event_id, affected_services_count, affected_events_count, summary_json, is_demo] = args;
            memoryIncidents.unshift({
              id,
              incident_id,
              trace_id,
              title,
              severity,
              status,
              first_exposure_event_id,
              detected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              affected_services_count: affected_services_count || 1,
              affected_events_count: affected_events_count || 1,
              summary_json,
              is_demo: is_demo || 0
            });
          } else if (lower.includes('update leakage_incidents set status =')) {
            const [status, id] = args;
            const inc = memoryIncidents.find(x => x.id === id || x.incident_id === id);
            if (inc) {
              inc.status = status;
              inc.updated_at = new Date().toISOString();
            }
          } else if (lower.includes('delete from lineage_events where metadata like')) {
            const kept = memoryLineageEvents.filter(e => !e.metadata || !e.metadata.includes('"is_demo":true') && !e.metadata.includes('"is_demo": 1'));
            memoryLineageEvents.length = 0;
            memoryLineageEvents.push(...kept);
          } else if (lower.includes('delete from leakage_incidents where is_demo = 1')) {
            const kept = memoryIncidents.filter(i => i.is_demo !== 1);
            memoryIncidents.length = 0;
            memoryIncidents.push(...kept);
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
          if (lower.includes('select count(*) as count from lineage_services')) {
            return { count: memoryServices.length };
          }
          if (lower.includes('select count(*) as count from leakage_incidents')) {
            return { count: memoryIncidents.length };
          }
          if (lower.includes('select * from scans where id =')) {
            return memoryScans.find(s => s.id === args[0]) || null;
          }
          if (lower.includes('select * from leakage_incidents where id =') || lower.includes('incident_id =')) {
            return memoryIncidents.find(i => i.id === args[0] || i.incident_id === args[0]) || null;
          }
          if (lower.includes('select * from lineage_events where event_id =') || lower.includes('id =')) {
            return memoryLineageEvents.find(e => e.event_id === args[0] || e.id === args[0]) || null;
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
          if (lower.includes('from lineage_services')) {
            return memoryServices;
          }
          if (lower.includes('from lineage_events where trace_id =')) {
            return memoryLineageEvents.filter(e => e.trace_id === args[0]).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          if (lower.includes('from lineage_events where incident_id =')) {
            return memoryLineageEvents.filter(e => e.incident_id === args[0]).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          if (lower.includes('from lineage_events')) {
            return memoryLineageEvents.slice(-100);
          }
          if (lower.includes('from leakage_incidents')) {
            return memoryIncidents;
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

    CREATE TABLE IF NOT EXISTS lineage_services (
      id TEXT PRIMARY KEY,
      service_name TEXT UNIQUE NOT NULL,
      service_type TEXT NOT NULL,
      trust_level TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lineage_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      trace_id TEXT NOT NULL,
      parent_event_id TEXT,
      incident_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      source_service TEXT NOT NULL,
      destination_service TEXT NOT NULL,
      api_route TEXT DEFAULT '/api',
      direction TEXT DEFAULT 'REQUEST',
      data_category TEXT NOT NULL,
      field_identifier TEXT DEFAULT 'unspecified',
      fingerprint TEXT NOT NULL,
      action TEXT NOT NULL,
      policy_id TEXT,
      exposure_status TEXT DEFAULT 'NORMAL',
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS leakage_incidents (
      id TEXT PRIMARY KEY,
      incident_id TEXT UNIQUE NOT NULL,
      trace_id TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT DEFAULT 'HIGH',
      status TEXT DEFAULT 'OPEN',
      first_exposure_event_id TEXT,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      affected_services_count INTEGER DEFAULT 1,
      affected_events_count INTEGER DEFAULT 1,
      summary_json TEXT,
      is_demo INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_detections_scan_id ON scan_detections(scan_id);
    CREATE INDEX IF NOT EXISTS idx_detections_category ON scan_detections(category);
    CREATE INDEX IF NOT EXISTS idx_lineage_trace_id ON lineage_events(trace_id);
    CREATE INDEX IF NOT EXISTS idx_lineage_incident_id ON lineage_events(incident_id);
    CREATE INDEX IF NOT EXISTS idx_lineage_event_id ON lineage_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_lineage_timestamp ON lineage_events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_lineage_fingerprint ON lineage_events(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_incidents_trace_id ON leakage_incidents(trace_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON leakage_incidents(status);
  `);

  // Seed default detection rules
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

  // Seed default instrumented microservices
  const existingServicesCount = sqliteInstance.prepare('SELECT COUNT(*) as count FROM lineage_services').get();
  if (existingServicesCount.count === 0) {
    const insertSvc = sqliteInstance.prepare(`
      INSERT INTO lineage_services (id, service_name, service_type, trust_level)
      VALUES (@id, @service_name, @service_type, @trust_level)
    `);
    const insertManyServices = sqliteInstance.transaction((services) => {
      for (const s of services) insertSvc.run(s);
    });
    insertManyServices(seedServices);
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
