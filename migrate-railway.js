/**
 * Run Trial Migration on Railway
 * This script connects directly using DATABASE_URL from Railway
 */

const { Pool } = require('pg');

async function addTrialSupport() {
  // Use DATABASE_URL from Railway environment
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    console.log('Make sure you are running this with: railway run node migrate-railway.js');
    process.exit(1);
  }

  console.log('Connecting to Railway database...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Railway requires SSL
    }
  });

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
    const result = await pool.query(`
      UPDATE users 
      SET trial_expires_at = created_at + INTERVAL '30 days',
          subscription_status = CASE 
            WHEN created_at + INTERVAL '30 days' > CURRENT_TIMESTAMP THEN 'trial'
            ELSE 'expired'
          END
      WHERE trial_expires_at IS NULL
      RETURNING id, email, subscription_status;
    `);
    
    console.log(`✓ Updated ${result.rowCount} existing users with trial period`);
    
    if (result.rows.length > 0) {
      console.log('\nUpdated users:');
      result.rows.forEach(user => {
        console.log(`  - ${user.email}: ${user.subscription_status}`);
      });
    }
    
    console.log('\n✅ Railway migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addTrialSupport();
