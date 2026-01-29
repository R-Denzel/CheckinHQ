const pool = require('../database/db');

/**
 * User Model
 * Handles all database operations for users
 */
class User {
  /**
   * Create a new user
   */
  static async create({ email, passwordHash, businessName, businessType, preferredCurrency }) {
    try {
      // Try with trial fields first
      const query = `
        INSERT INTO users (email, password_hash, business_name, business_type, preferred_currency, trial_expires_at, subscription_status)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + INTERVAL '30 days', 'trial')
        RETURNING id, email, business_name, business_type, preferred_currency, trial_expires_at, subscription_status, created_at
      `;
      const result = await pool.query(query, [email, passwordHash, businessName, businessType || 'airbnb', preferredCurrency || 'USD']);
      return result.rows[0];
    } catch (error) {
      // If trial columns don't exist, fall back to basic insert
      if (error.code === '42703') { // undefined_column error
        const query = `
          INSERT INTO users (email, password_hash, business_name, business_type, preferred_currency)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, business_name, business_type, preferred_currency, created_at
        `;
        const result = await pool.query(query, [email, passwordHash, businessName, businessType || 'airbnb', preferredCurrency || 'USD']);
        return result.rows[0];
      }
      throw error;
    }
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
    try {
      const query = 'SELECT id, email, business_name, business_type, is_admin, preferred_currency, trial_expires_at, subscription_status, created_at FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      // If trial columns don't exist, fall back to basic query
      if (error.code === '42703') { // undefined_column error
        const query = 'SELECT id, email, business_name, business_type, is_admin, preferred_currency, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
      }
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
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
