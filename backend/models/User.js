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

  /**
   * Set verification token for email verification
   */
  static async setVerificationToken(id, token) {
    const query = `
      UPDATE users 
      SET verification_token = $1
      WHERE id = $2
    `;
    await pool.query(query, [token, id]);
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token) {
    const query = `
      UPDATE users 
      SET email_verified = TRUE, verification_token = NULL
      WHERE verification_token = $1
      RETURNING id, email, email_verified
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  /**
   * Set password reset token
   */
  static async setResetToken(email, token, expiry) {
    const query = `
      UPDATE users 
      SET reset_token = $1, reset_token_expiry = $2
      WHERE email = $3
      RETURNING id, email
    `;
    const result = await pool.query(query, [token, expiry, email]);
    return result.rows[0];
  }

  /**
   * Find user by reset token (if not expired)
   */
  static async findByResetToken(token) {
    const query = `
      SELECT * FROM users 
      WHERE reset_token = $1 
      AND reset_token_expiry > CURRENT_TIMESTAMP
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPasswordHash) {
    const query = `
      UPDATE users 
      SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL
      WHERE reset_token = $2 
      AND reset_token_expiry > CURRENT_TIMESTAMP
      RETURNING id, email
    `;
    const result = await pool.query(query, [newPasswordHash, token]);
    return result.rows[0];
  }
}

module.exports = User;
