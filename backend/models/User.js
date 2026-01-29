const pool = require('../database/db');

/**
 * User Model
 * Handles all database operations for users
 */
class User {
  /**
   * Create a new user
   */
  static async create({ email, passwordHash, businessName }) {
    const query = `
      INSERT INTO users (email, password_hash, business_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, business_name, created_at
    `;
    const result = await pool.query(query, [email, passwordHash, businessName]);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT id, email, business_name, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update user profile
   */
  static async update(id, { businessName }) {
    const query = `
      UPDATE users 
      SET business_name = $1
      WHERE id = $2
      RETURNING id, email, business_name, updated_at
    `;
    const result = await pool.query(query, [businessName, id]);
    return result.rows[0];
  }
}

module.exports = User;
