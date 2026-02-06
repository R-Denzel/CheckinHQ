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

// Email verification
router.post('/verify-email', authController.verifyEmail);

// Resend verification email (protected)
router.post('/resend-verification', authMiddleware, authController.resendVerification);

// Password reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
