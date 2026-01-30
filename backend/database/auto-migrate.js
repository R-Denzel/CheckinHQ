/**
 * Auto-run database migrations on startup
 * Add this to server.js before starting the server
 */

const pool = require('./db');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Add trial columns
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial'
    `);
    
    // Add constraint
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_status') THEN
          ALTER TABLE users ADD CONSTRAINT valid_subscription_status 
          CHECK (subscription_status IN ('trial', 'active', 'expired'));
        END IF;
      END $$;
    `);
    
    // Update existing users
    const result = await pool.query(`
      UPDATE users 
      SET trial_expires_at = COALESCE(trial_expires_at, created_at + INTERVAL '30 days'),
          subscription_status = COALESCE(subscription_status, 
            CASE WHEN created_at + INTERVAL '30 days' > CURRENT_TIMESTAMP THEN 'trial' ELSE 'expired' END)
      WHERE trial_expires_at IS NULL OR subscription_status IS NULL
      RETURNING id
    `);
    
    console.log(`✅ Migrations complete! Updated ${result.rowCount} users`);
  } catch (error) {
    // Ignore "already exists" errors
    if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
      console.error('⚠️  Migration warning:', error.message);
    } else {
      console.log('✅ Migrations already applied');
    }
  }
}

module.exports = runMigrations;
