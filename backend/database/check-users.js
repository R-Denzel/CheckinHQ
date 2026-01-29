const pool = require('./db');

/**
 * Check user subscription status
 */
async function checkUsers() {
  try {
    console.log('Checking user subscription status...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        email,
        business_name,
        subscription_status,
        trial_expires_at,
        is_admin,
        CASE 
          WHEN trial_expires_at < CURRENT_TIMESTAMP THEN true 
          ELSE false 
        END as trial_expired,
        CASE
          WHEN is_admin = true THEN 'ADMIN - Has Access'
          WHEN subscription_status = 'active' THEN 'ACTIVE - Has Access'
          WHEN trial_expires_at >= CURRENT_TIMESTAMP THEN 'TRIAL - Has Access'
          ELSE 'EXPIRED - NO ACCESS'
        END as access_status
      FROM users
      ORDER BY created_at DESC
    `);
    
    console.log('Total users:', result.rows.length);
    console.log('\n--- User Details ---\n');
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Business: ${user.business_name}`);
      console.log(`   Status: ${user.subscription_status}`);
      console.log(`   Trial Expires: ${user.trial_expires_at}`);
      console.log(`   Trial Expired: ${user.trial_expired}`);
      console.log(`   Is Admin: ${user.is_admin}`);
      console.log(`   ACCESS: ${user.access_status}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
