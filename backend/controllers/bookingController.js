const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const BookingNote = require('../models/BookingNote');

/**
 * Booking Controller
 * Handles all booking CRUD operations
 */

/**
 * Create a new booking
 * POST /api/bookings
 */
exports.createBooking = [
  // Validation
  body('guestName').trim().notEmpty(),
  body('phoneNumber').trim().notEmpty(),
  body('checkInDate').notEmpty().isISO8601().toDate(),
  body('checkOutDate').notEmpty().isISO8601().toDate(),
  body('propertyDestination').trim().notEmpty(),
  body('status').optional().isIn(['Inquiry', 'Quoted', 'Deposit Paid', 'Confirmed', 'Checked In', 'Checked Out']),
  body('currency').optional().isIn(['USD', 'UGX', 'KES', 'TZS', 'EUR', 'GBP']),
  body('totalAmount').optional().isFloat({ min: 0 }),
  body('depositAmount').optional().isFloat({ min: 0 }).custom((value, { req }) => {
    if (value && req.body.totalAmount && parseFloat(value) > parseFloat(req.body.totalAmount)) {
      throw new Error('Deposit amount cannot exceed total amount');
    }
    return true;
  }),
  body('notes').optional().trim(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const booking = await Booking.create(req.userId, req.body);

      // Add initial note if provided
      if (req.body.notes) {
        await BookingNote.create(booking.id, req.body.notes);
      }

      res.status(201).json({ booking });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
];

/**
 * Get all bookings for current user
 * GET /api/bookings
 */
exports.getAllBookings = async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.checkInDate) {
      filters.checkInDate = req.query.checkInDate;
    }
    if (req.query.checkOutDate) {
      filters.checkOutDate = req.query.checkOutDate;
    }

    const bookings = await Booking.findAllByUser(req.userId, filters);
    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

/**
 * Get single booking
 * GET /api/bookings/:id
 */
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id, req.userId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get notes for this booking
    const notes = await BookingNote.findByBookingId(booking.id);

    res.json({ booking, notes });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
};

/**
 * Update a booking
 * PUT /api/bookings/:id
 */
exports.updateBooking = [
  // Validation (all fields optional for update)
  body('guestName').optional().trim().notEmpty(),
  body('phoneNumber').optional().trim().notEmpty(),
  body('checkInDate').optional().isISO8601().toDate(),
  body('checkOutDate').optional().isISO8601().toDate(),
  body('propertyDestination').optional().trim().notEmpty(),
  body('status').optional().isIn(['Inquiry', 'Quoted', 'Deposit Paid', 'Confirmed', 'Checked In', 'Checked Out']),
  body('currency').optional().isIn(['USD', 'UGX', 'KES', 'TZS', 'EUR', 'GBP']),
  body('totalAmount').optional().isFloat({ min: 0 }),
  body('depositAmount').optional().isFloat({ min: 0 }).custom((value, { req }) => {
    if (value && req.body.totalAmount && parseFloat(value) > parseFloat(req.body.totalAmount)) {
      throw new Error('Deposit amount cannot exceed total amount');
    }
    return true;
  }),
  body('notes').optional().trim(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const booking = await Booking.update(req.params.id, req.userId, req.body);
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({ booking });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  }
];

/**
 * Delete a booking
 * DELETE /api/bookings/:id
 */
exports.deleteBooking = async (req, res) => {
  try {
    const result = await Booking.delete(req.params.id, req.userId);
    
    if (!result) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

/**
 * Update last contacted timestamp (when WhatsApp is opened)
 * POST /api/bookings/:id/contact
 */
exports.markContacted = async (req, res) => {
  try {
    const booking = await Booking.updateLastContacted(req.params.id, req.userId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Mark contacted error:', error);
    res.status(500).json({ error: 'Failed to update contact time' });
  }
};

/**
 * Add a note to a booking
 * POST /api/bookings/:id/notes
 */
exports.addNote = [
  body('noteText').trim().notEmpty(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify booking belongs to user
      const booking = await Booking.findById(req.params.id, req.userId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const note = await BookingNote.create(req.params.id, req.body.noteText);
      res.status(201).json({ note });
    } catch (error) {
      console.error('Add note error:', error);
      res.status(500).json({ error: 'Failed to add note' });
    }
  }
];

/**
 * Get dashboard data (Today view)
 * GET /api/bookings/dashboard/today
 */
exports.getDashboard = async (req, res) => {
  try {
    const [arrivals, checkouts, followUps, paymentsPending] = await Promise.all([
      Booking.getTodaysArrivals(req.userId),
      Booking.getTodaysCheckouts(req.userId),
      Booking.getFollowUpsNeeded(req.userId),
      Booking.getPaymentsPending(req.userId)
    ]);

    res.json({
      dashboard: {
        arrivalsToday: arrivals,
        checkoutsToday: checkouts,
        followUpsNeeded: followUps,
        paymentsPending: paymentsPending
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};
