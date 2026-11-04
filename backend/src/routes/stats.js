const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../services/auditLogger');

/**
 * GET /api/stats
 * Real-time aggregated statistics for the cybersecurity dashboard
 */
router.get('/', (req, res) => {
  try {
    const stats = getDashboardStats();
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

