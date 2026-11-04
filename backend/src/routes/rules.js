const express = require('express');
const router = express.Router();
const dbAdapter = require('../config/dbAdapter');

/**
 * GET /api/rules
 */
router.get('/', async (req, res) => {
  try {
    const rules = await dbAdapter.getAllRules();
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
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await dbAdapter.toggleRule(id);
    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST /api/rules
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, severity = 'HIGH', pattern, description } = req.body;

    if (!name || !category || !pattern) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, category, and regex pattern are required' }
      });
    }

    try {
      new RegExp(pattern);
    } catch {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid regular expression pattern syntax' }
      });
    }

    const created = await dbAdapter.createRule({ name, category, severity, pattern, description });
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
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbAdapter.deleteRule(id);
    res.status(200).json({ success: true, message: 'Rule removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
