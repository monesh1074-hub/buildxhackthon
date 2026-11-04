const express = require('express');
const router = express.Router();
const rawDbAdapter = require('../config/dbAdapter');
const dbAdapter = (rawDbAdapter && typeof rawDbAdapter.getScanHistory === 'function')
  ? rawDbAdapter
  : (rawDbAdapter && rawDbAdapter.default && typeof rawDbAdapter.default.getScanHistory === 'function')
    ? rawDbAdapter.default
    : (rawDbAdapter && rawDbAdapter.dbAdapter)
      ? rawDbAdapter.dbAdapter
      : rawDbAdapter;

/**
 * GET /api/history
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const search = req.query.search || '';
    const riskLevel = req.query.riskLevel || '';

    const history = await dbAdapter.getScanHistory({ limit, offset, search, riskLevel });
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/**
 * GET /api/history/verify-zero-leakage
 */
router.get('/verify-zero-leakage', async (req, res) => {
  try {
    const result = await dbAdapter.verifyZeroStorage();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/history/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const scan = await dbAdapter.getScanById(req.params.id);
    if (!scan) {
      return res.status(404).json({
        success: false,
        error: { message: 'Scan record not found' }
      });
    }
    res.status(200).json({
      success: true,
      data: scan
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/**
 * DELETE /api/history/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await dbAdapter.deleteScan(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Scan record deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/**
 * DELETE /api/history
 */
router.delete('/', async (req, res) => {
  try {
    await dbAdapter.clearAllHistory();
    res.status(200).json({
      success: true,
      message: 'All scan history purged successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message }
    });
  }
});

module.exports = router;
