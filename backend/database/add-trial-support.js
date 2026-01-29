const pool = require('./db');

/**
 * Add trial and subscription support
 * Adds trial_expires_at and subscription_status to users table
 */
async function addTrialSupport() {
  try {
    console.log('Adding trial and subscription support...');
    
    // Add trial_expires_at to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
    `);
    console.log('✓ Added trial_expires_at to users table');
    
    // Add subscription_status to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';
    `);
    console.log('✓ Added subscription_status to users table');
    
    // Add subscription constraint
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_status'
        ) THEN
          ALTER TABLE users 
          ADD CONSTRAINT valid_subscription_status 
          CHECK (subscription_status IN ('trial', 'active', 'expired'));
        END IF;
      END $$;
    `);
    console.log('✓ Added subscription status constraint');
    
    // Update existing users to have trial period
    await pool.query(`
      UPDATE users 
      SET trial_expires_at = created_at + INTERVAL '30 days',
          subscription_status = CASE 
            WHEN created_at + INTERVAL '30 days' > CURRENT_TIMESTAMP THEN 'trial'
            ELSE 'expired'
          END
      WHERE trial_expires_at IS NULL;
    `);
    console.log('✓ Updated existing users with trial period');
    
    console.log('\n✅ Trial and subscription migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addTrialSupport();
