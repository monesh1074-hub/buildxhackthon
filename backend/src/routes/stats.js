const express = require('express');
const router = express.Router();
const dbAdapter = require('../config/dbAdapter');

/**
 * GET /api/stats
 */
router.get('/', async (req, res) => {
  try {
    const stats = await dbAdapter.getDashboardStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message }
    });
  }
});

module.exports = router;
