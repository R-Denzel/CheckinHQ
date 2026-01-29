const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

/**
 * Booking Routes
 * All routes require authentication and active subscription
 */

// Dashboard - Today view
router.get('/dashboard/today', authMiddleware, checkSubscription, bookingController.getDashboard);

// CRUD operations
router.post('/', authMiddleware, checkSubscription, bookingController.createBooking);
router.get('/', authMiddleware, checkSubscription, bookingController.getAllBookings);
router.get('/:id', authMiddleware, checkSubscription, bookingController.getBooking);
router.put('/:id', authMiddleware, checkSubscription, bookingController.updateBooking);
router.delete('/:id', authMiddleware, checkSubscription, bookingController.deleteBooking);

// Contact tracking
router.post('/:id/contact', authMiddleware, checkSubscription, bookingController.markContacted);

// Notes
router.post('/:id/notes', authMiddleware, checkSubscription, bookingController.addNote);

module.exports = router;
