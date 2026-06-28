const express = require('express');
const router = express.Router();
const { verifyToken } = require('../lib/auth');
const {
  getAnalyticsOverview,
  getAllUsers,
  getAllInvoices,
  logAnalyticsEvent
} = require('../lib/supabase');

/**
 * GET /api/analytics/overview
 * Get analytics overview for authenticated user
 * Returns: { totalInvoices, totalRevenue, collectedAmount, pendingAmount, totalContacts, totalTools, recentInvoices, monthlyRevenue }
 */
router.get('/overview', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }

    const userId = decoded.id || decoded.sub;
    const overview = await getAnalyticsOverview(userId);

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
router.get('/users', async (req, res) => {
  try {
    // Note: In production, you should add admin role verification here
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
router.get('/invoices', async (req, res) => {
  try {
    // Note: In production, you should add admin role verification here
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
