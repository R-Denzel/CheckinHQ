const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

/**
 * Authentication Routes
 */

// Register new user
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Get current user profile (protected)
router.get('/me', authMiddleware, authController.getProfile);

module.exports = router;
