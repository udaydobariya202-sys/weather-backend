const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../lib/auth');
const {
  getUserByGoogleId,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser
} = require('../lib/supabase');

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', async (req, res) => {
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
    const user = await getUserById(userId);

    if (!user) {
      if (decoded.role === 'admin') {
        return res.json({
          success: true,
          data: {
            id: 'admin-id-123',
            email: decoded.email,
            name: 'Admin',
            avatar_url: null,
            company_name: null,
            diesel_price: null,
            is_admin: true,
          },
          error: null,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(404).json({
        success: false,
        data: null,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: user,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile (company name, diesel price)
 * Body: { company_name, diesel_price }
 */
router.put('/profile', async (req, res) => {
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
    const { company_name, diesel_price } = req.body;

    const updates = {};
    if (company_name !== undefined) updates.company_name = company_name;
    if (diesel_price !== undefined) updates.diesel_price = parseFloat(diesel_price);

    const updatedUser = await updateUser(userId, updates);

    res.json({
      success: true,
      data: updatedUser,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (req.user?.role === 'admin') {
      return res.json({
        success: true,
        data: {
          id: 'admin-id-123',
          email: req.user.email,
          ...req.body,
          is_admin: true,
        },
        error: null,
        timestamp: new Date().toISOString()
      });
    }

    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/users/google-auth
 * Handle Google OAuth login/register
 * Body: { google_id, email, name, avatar_url }
 */
router.post('/google-auth', async (req, res) => {
  try {
    const { google_id, email, name, avatar_url } = req.body;

    if (!google_id || !email) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'google_id and email are required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user exists by google_id
    let user = await getUserByGoogleId(google_id);

    // If not found, check by email
    if (!user) {
      user = await getUserByEmail(email);
      
      // If user exists by email but not google_id, update with google_id
      if (user) {
        user = await updateUser(user.id, { google_id });
      }
    }

    // If still not found, create new user
    if (!user) {
      const userData = {
        google_id,
        email,
        name: name || null,
        avatar_url: avatar_url || null,
        company_name: null,
        diesel_price: 90.00
      };
      
      user = await createUser(userData);
    } else {
      // Update last_active
      user = await updateUser(user.id, { last_active: new Date().toISOString() });
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          company_name: user.company_name,
          diesel_price: user.diesel_price
        }
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in Google auth:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
