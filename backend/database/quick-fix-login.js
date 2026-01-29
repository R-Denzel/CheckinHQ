const pool = require('./db');

/**
 * Quick fix for login/dashboard issues
 * This ensures all users can log in and access the app
 */
async function quickFix() {
  try {
    console.log('Running quick fix for login/dashboard issues...\n');
    
    // Check if trial columns exist
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('trial_expires_at', 'subscription_status')
    `);
    
    if (columns.rows.length < 2) {
      console.log('⚠️  Trial columns missing. Adding them now...');
      
      // Add trial_expires_at
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
      `);
      console.log('✓ Added trial_expires_at');
      
      // Add subscription_status
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';
      `);
      console.log('✓ Added subscription_status');
      
      // Add constraint
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
      console.log('✓ Added constraint');
    }
    
    // Give all users 30-day trial
    const result = await pool.query(`
      UPDATE users 
      SET 
        trial_expires_at = COALESCE(trial_expires_at, CURRENT_TIMESTAMP + INTERVAL '30 days'),
        subscription_status = COALESCE(subscription_status, 'trial')
      WHERE trial_expires_at IS NULL OR subscription_status IS NULL
      RETURNING email;
    `);
    
    if (result.rows.length > 0) {
      console.log(`\n✓ Fixed ${result.rows.length} user(s)`);
    } else {
      console.log('\n✓ All users already have trial access');
    }
    
    console.log('\n✅ Quick fix completed! Users should be able to log in now.');
    console.log('   Please restart the backend server: npm run dev\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

quickFix();
