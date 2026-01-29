const pool = require('../database/db');

/**
 * Booking Model
 * Handles all database operations for bookings
 */
class Booking {
  /**
   * Create a new booking
   */
  static async create(userId, bookingData) {
    const query = `
      INSERT INTO bookings (
        user_id, guest_name, phone_number, check_in_date, check_out_date,
        property_destination, status, total_amount, deposit_amount, notes, last_contacted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      userId,
      bookingData.guestName,
      bookingData.phoneNumber,
      bookingData.checkInDate,
      bookingData.checkOutDate,
      bookingData.propertyDestination,
      bookingData.status || 'Inquiry',
      bookingData.totalAmount || 0,
      bookingData.depositAmount || 0,
      bookingData.notes || null,
      new Date() // last_contacted_at set to now
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get all bookings for a user
   */
  static async findAllByUser(userId, filters = {}) {
    let query = 'SELECT * FROM bookings WHERE user_id = $1';
    const values = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.checkInDate) {
      query += ` AND check_in_date = $${paramIndex}`;
      values.push(filters.checkInDate);
      paramIndex++;
    }

    if (filters.checkOutDate) {
      query += ` AND check_out_date = $${paramIndex}`;
      values.push(filters.checkOutDate);
      paramIndex++;
    }

    query += ' ORDER BY check_in_date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get single booking by ID (with user ownership check)
   */
  static async findById(bookingId, userId) {
    const query = 'SELECT * FROM bookings WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [bookingId, userId]);
    return result.rows[0];
  }

  /**
   * Update a booking
   */
  static async update(bookingId, userId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    const allowedFields = [
      'guest_name', 'phone_number', 'check_in_date', 'check_out_date',
      'property_destination', 'status', 'total_amount', 'deposit_amount', 'notes'
    ];

    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(bookingId, userId);
    const query = `
      UPDATE bookings
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update last contacted timestamp
   */
  static async updateLastContacted(bookingId, userId) {
    const query = `
      UPDATE bookings
      SET last_contacted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [bookingId, userId]);
    return result.rows[0];
  }

  /**
   * Delete a booking
   */
  static async delete(bookingId, userId) {
    const query = 'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [bookingId, userId]);
    return result.rows[0];
  }

  /**
   * Get today's arrivals
   */
  static async getTodaysArrivals(userId) {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = $1 AND check_in_date = CURRENT_DATE
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get today's checkouts
   */
  static async getTodaysCheckouts(userId) {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = $1 AND check_out_date = CURRENT_DATE
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get bookings needing follow-up (not contacted in 48 hours and not checked out)
   */
  static async getFollowUpsNeeded(userId) {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = $1
        AND status NOT IN ('Checked Out')
        AND (
          last_contacted_at IS NULL 
          OR last_contacted_at < NOW() - INTERVAL '48 hours'
        )
      ORDER BY last_contacted_at ASC NULLS FIRST
      LIMIT 20
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get bookings with pending payments
   */
  static async getPaymentsPending(userId) {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = $1
        AND status IN ('Quoted', 'Deposit Paid', 'Confirmed')
        AND (deposit_amount < total_amount OR deposit_amount IS NULL)
      ORDER BY check_in_date ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Booking;
