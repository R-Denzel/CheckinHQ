const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const checkSubscription = require('../middleware/checkSubscription');

/**
 * Analytics Routes
 * All routes require authentication
 */

// Host analytics (subscription check - but admins bypass)
router.get('/host', authMiddleware, checkSubscription, analyticsController.getHostAnalytics);

// Admin analytics (admin only, no subscription check needed)
router.get('/admin', authMiddleware, isAdmin, analyticsController.getAdminAnalytics);

module.exports = router;
