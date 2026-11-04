const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/rules
 * List all detection rules (built-in and custom)
 */
router.get('/', (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM detection_rules ORDER BY is_custom ASC, category ASC').all();
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * PATCH /api/rules/:id/toggle
 * Enable or disable a detection rule
 */
router.patch('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const rule = db.prepare('SELECT * FROM detection_rules WHERE id = ?').get(id);

    if (!rule) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }

    const newStatus = rule.is_enabled === 1 ? 0 : 1;
    db.prepare('UPDATE detection_rules SET is_enabled = ? WHERE id = ?').run(newStatus, id);

    res.status(200).json({
      success: true,
      data: {
        id,
        is_enabled: newStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/rules
 * Create a new custom detection rule
 */
router.post('/', (req, res) => {
  try {
    const { name, category, severity = 'HIGH', pattern, description } = req.body;

    if (!name || !category || !pattern) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, category, and regex pattern are required' }
      });
    }

    // Validate regex syntax
    try {
      new RegExp(pattern);
    } catch {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid regular expression pattern syntax' }
      });
    }

    const ruleId = `custom-${uuidv4().slice(0, 8)}`;
    const stmt = db.prepare(`
      INSERT INTO detection_rules (id, name, category, severity, pattern, is_enabled, is_custom, description)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?)
    `);

    stmt.run(ruleId, name, category.toUpperCase(), severity.toUpperCase(), pattern, description || 'Custom detection policy');

    const created = db.prepare('SELECT * FROM detection_rules WHERE id = ?').get(ruleId);
    res.status(201).json({
      success: true,
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * DELETE /api/rules/:id
 * Delete a custom rule (built-in rules cannot be deleted)
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const rule = db.prepare('SELECT * FROM detection_rules WHERE id = ?').get(id);

    if (!rule) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }

    if (rule.is_custom !== 1) {
      return res.status(403).json({ success: false, error: { message: 'Built-in core rules cannot be deleted, but they can be toggled off.' } });
    }

    db.prepare('DELETE FROM detection_rules WHERE id = ?').run(id);
    res.status(200).json({ success: true, message: 'Custom rule removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;

