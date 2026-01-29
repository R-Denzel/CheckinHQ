const pool = require('../database/db');

/**
 * BookingNote Model
 * Manages notes timeline for bookings
 */
class BookingNote {
  /**
   * Add a note to a booking
   */
  static async create(bookingId, noteText) {
    const query = `
      INSERT INTO booking_notes (booking_id, note_text)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [bookingId, noteText]);
    return result.rows[0];
  }

  /**
   * Get all notes for a booking
   */
  static async findByBookingId(bookingId) {
    const query = `
      SELECT * FROM booking_notes
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [bookingId]);
    return result.rows;
  }

  /**
   * Delete a note
   */
  static async delete(noteId) {
    const query = 'DELETE FROM booking_notes WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [noteId]);
    return result.rows[0];
  }
}

module.exports = BookingNote;
