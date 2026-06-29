const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@weather.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

/**
 * POST /api/auth/login
 * Request body: { email, password }
 * Response: { success: true, token: "jwt_token", user: { id, email } }
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: 'admin-id-123',
        email
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out'
  });
});

/**
 * Middleware to verify JWT token
 */
const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

/**
 * GET /api/auth/verify
 */
router.get('/verify', verifyTokenMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: 'admin-id-123',
      email: req.user.email,
      role: req.user.role || 'admin'
    }
  });
});

module.exports = router;
