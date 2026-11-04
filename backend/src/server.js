const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Initialize database & adapter
require('./config/database');
const rawDbAdapter = require('./config/dbAdapter');
const dbAdapter = (rawDbAdapter && typeof rawDbAdapter.getDatabaseStatus === 'function')
  ? rawDbAdapter
  : (rawDbAdapter && rawDbAdapter.default && typeof rawDbAdapter.default.getDatabaseStatus === 'function')
    ? rawDbAdapter.default
    : (rawDbAdapter && rawDbAdapter.dbAdapter)
      ? rawDbAdapter.dbAdapter
      : rawDbAdapter;

const privacyLogger = require('./middleware/privacyLogger');
const errorHandler = require('./middleware/errorHandler');

const scanRoutes = require('./routes/scan');
const historyRoutes = require('./routes/history');
const statsRoutes = require('./routes/stats');
const rulesRoutes = require('./routes/rules');
const samplesRoutes = require('./routes/samples');
const databaseRoutes = require('./routes/database');
const lineageRoutes = require('./routes/lineage');
const incidentsRoutes = require('./routes/incidents');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*', // Allow development frontend
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply PrivacyShield zero-leakage logger to all incoming requests
app.use(privacyLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = dbAdapter.getDatabaseStatus();
  res.status(200).json({
    status: 'ONLINE',
    service: 'PrivacyShield Zero-Leakage Engine',
    version: '1.0.0-hackathon',
    timestamp: new Date().toISOString(),
    database: dbStatus.type === 'SUPABASE' ? 'Supabase Online PostgreSQL' : 'SQLite (WAL Mode Active)',
    databaseType: dbStatus.type,
    isSupabaseOnline: dbStatus.isOnline,
    zeroStorageGuaranteed: true
  });
});

// Mount API routes
app.use('/api/scan', scanRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/samples', samplesRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/lineage', lineageRoutes);
app.use('/api/incidents', incidentsRoutes);

// Serve built frontend assets if dist folder exists
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve SPA frontend for non-API requests
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
  });
}

// 404 Handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.url}`,
      code: 'NOT_FOUND'
    }
  });
});

// Central Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  const dbStatus = dbAdapter.getDatabaseStatus();
  console.log(`=======================================================`);
  console.log(`🛡️  PrivacyShield Backend Active on http://localhost:${PORT}`);
  console.log(`🔒 Zero-Leakage Logging Active: Plaintext PII is masked`);
  console.log(`📁 Database Mode: ${dbStatus.type === 'SUPABASE' ? 'Supabase Online Cloud' : 'SQLite (WAL Mode)'}`);
  if (fs.existsSync(frontendDistPath)) {
    console.log(`🌐 React UI Dashboard served at http://localhost:${PORT}`);
  }
  console.log(`=======================================================`);
});

module.exports = app;
