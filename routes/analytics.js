const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/auth');
const {
  getAnalyticsOverview,
  getAllUsers,
  getAllInvoices
} = require('../lib/supabase');

/**
 * GET /api/analytics/overview
 * Get analytics overview for authenticated user
 * Returns: { totalInvoices, totalRevenue, collectedAmount, pendingAmount, totalContacts, totalTools, recentInvoices, monthlyRevenue }
 */
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const overview = await getAnalyticsOverview(isAdmin ? null : userId);

    res.json({
      success: true,
      data: overview,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analytics/users
 * Get all users (for admin panel)
 */
router.get('/users', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    const users = await getAllUsers();

    res.json({
      success: true,
      data: users,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analytics/invoices
 * Get all invoices (for admin panel)
 */
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    const invoices = await getAllInvoices();

    res.json({
      success: true,
      data: invoices,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
