const pool = require('./db');

/**
 * Give all existing users 30 more days of trial
 */
async function extendTrials() {
  try {
    console.log('Extending trials for all users...\n');
    
    const result = await pool.query(`
      UPDATE users 
      SET 
        trial_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days',
        subscription_status = 'trial'
      WHERE is_admin = false
      RETURNING id, email, trial_expires_at, subscription_status
    `);
    
    console.log(`✅ Extended trials for ${result.rows.length} users\n`);
    
    result.rows.forEach(user => {
      console.log(`${user.email}`);
      console.log(`  Expires: ${user.trial_expires_at}`);
      console.log(`  Status: ${user.subscription_status}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extendTrials();
