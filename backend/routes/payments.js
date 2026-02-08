const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

/**
 * Payment Routes - Pesapal Integration
 */

// Initialize payment (protected - requires login)
router.post('/subscribe', authMiddleware, paymentController.initializePayment);

// Pesapal IPN webhook (public - Pesapal calls this)
router.get('/pesapal-ipn', paymentController.handleIPN);

// Verify payment status (protected)
router.get('/verify/:orderTrackingId', authMiddleware, paymentController.verifyPayment);

module.exports = router;
