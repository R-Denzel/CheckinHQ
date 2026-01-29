const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

/**
 * Booking Routes
 * All routes require authentication
 */

// Dashboard - Today view
router.get('/dashboard/today', authMiddleware, bookingController.getDashboard);

// CRUD operations
router.post('/', authMiddleware, bookingController.createBooking);
router.get('/', authMiddleware, bookingController.getAllBookings);
router.get('/:id', authMiddleware, bookingController.getBooking);
router.put('/:id', authMiddleware, bookingController.updateBooking);
router.delete('/:id', authMiddleware, bookingController.deleteBooking);

// Contact tracking
router.post('/:id/contact', authMiddleware, bookingController.markContacted);

// Notes
router.post('/:id/notes', authMiddleware, bookingController.addNote);

module.exports = router;
