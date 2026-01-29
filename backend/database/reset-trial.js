const pool = require('./db');

/**
 * Reset trial for a specific user (or all users)
 * Usage: node reset-trial.js [email]
 */
async function resetTrial() {
  try {
    const email = process.argv[2];
    
    if (email) {
      // Reset specific user
      const result = await pool.query(`
        UPDATE users 
        SET 
          trial_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days',
          subscription_status = 'trial'
        WHERE email = $1
        RETURNING email, trial_expires_at, subscription_status
      `, [email]);
      
      if (result.rows.length === 0) {
        console.log(`❌ User not found: ${email}`);
      } else {
        const user = result.rows[0];
        console.log(`✅ Trial reset for ${user.email}`);
        console.log(`   New expiration: ${user.trial_expires_at}`);
        console.log(`   Status: ${user.subscription_status}`);
      }
    } else {
      // Reset all non-admin users
      const result = await pool.query(`
        UPDATE users 
        SET 
          trial_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days',
          subscription_status = 'trial'
        WHERE is_admin = false
        RETURNING email, trial_expires_at, subscription_status
      `);
      
      console.log(`✅ Reset trial for ${result.rows.length} users`);
      result.rows.forEach(user => {
        console.log(`   - ${user.email}: expires ${user.trial_expires_at}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetTrial();
