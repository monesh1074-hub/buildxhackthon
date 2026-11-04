const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const dbAdapter = require('../config/dbAdapter');

/**
 * GET /api/database/status
 */
router.get('/status', (req, res) => {
  try {
    const status = dbAdapter.getDatabaseStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/database/test-supabase
 * Accepts connectionString (PostgreSQL transaction pooler URI) or url + key
 */
router.post('/test-supabase', async (req, res) => {
  try {
    const { connectionString, url, key } = req.body;
    const result = await dbAdapter.testConnection({ connectionString, url, key });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/database/configure-supabase
 */
router.post('/configure-supabase', async (req, res) => {
  try {
    const { connectionString, url, key } = req.body;
    const result = await dbAdapter.setConnectionConfig({ connectionString, url, key });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/database/schema-sql
 */
router.get('/schema-sql', (req, res) => {
  try {
    const sqlPath = path.join(__dirname, '..', '..', '..', 'supabase_schema.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      return res.status(200).json({ success: true, sql });
    }
    res.status(404).json({ success: false, error: { message: 'supabase_schema.sql not found on disk' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
