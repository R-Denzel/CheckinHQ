/**
 * Auto-run database migrations on startup
 * Add this to server.js before starting the server
 */

const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Step 1: Check if users table exists, if not create base schema
    try {
      await pool.query('SELECT 1 FROM users LIMIT 1');
      console.log('✓ Base schema exists');
    } catch (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log('📋 Creating base schema...');
        const schemaSQL = fs.readFileSync(
          path.join(__dirname, 'schema.sql'),
          'utf8'
        );
        await pool.query(schemaSQL);
        console.log('✓ Base schema created successfully');
      } else {
        throw error;
      }
    }
    
    // Step 2: Add preferred_currency column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD'
      `);
      console.log('✓ preferred_currency column added/verified');
    } catch (e) {
      console.log('⚠️ preferred_currency:', e.message);
    }
    
    // Step 3: Add trial_expires_at column separately
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
      `);
      console.log('✓ trial_expires_at column added/verified');
    } catch (e) {
      console.log('⚠️ trial_expires_at:', e.message);
    }
    
    // Add subscription_status column separately
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial'
      `);
      console.log('✓ subscription_status column added/verified');
    } catch (e) {
      console.log('⚠️ subscription_status:', e.message);
    }
    
    // Add constraint
    try {
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_status') THEN
            ALTER TABLE users ADD CONSTRAINT valid_subscription_status 
            CHECK (subscription_status IN ('trial', 'active', 'expired'));
          END IF;
        END $$;
      `);
      console.log('✓ Subscription constraint added/verified');
    } catch (e) {
      console.log('⚠️ Constraint:', e.message);
    }
    
    // Update existing users
    try {
      const result = await pool.query(`
        UPDATE users 
        SET trial_expires_at = COALESCE(trial_expires_at, created_at + INTERVAL '30 days'),
            subscription_status = COALESCE(subscription_status, 
              CASE WHEN created_at + INTERVAL '30 days' > CURRENT_TIMESTAMP THEN 'trial' ELSE 'expired' END)
        WHERE trial_expires_at IS NULL OR subscription_status IS NULL
        RETURNING id
      `);
      console.log(`✓ Updated ${result.rowCount} existing users with trial data`);
    } catch (e) {
      console.log('⚠️ Update users:', e.message);
    }
    
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('⚠️ Server will continue, but features may be limited');
  }
}

module.exports = runMigrations;
