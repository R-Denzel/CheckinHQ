const pool = require('./db');

/**
 * Verify database schema
 */
async function verifySchema() {
  try {
    console.log('Checking database schema...\n');
    
    // Check users table columns
    const usersColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if trial columns exist
    const hasTrialExpires = usersColumns.rows.some(c => c.column_name === 'trial_expires_at');
    const hasSubscriptionStatus = usersColumns.rows.some(c => c.column_name === 'subscription_status');
    
    console.log('\nTrial system status:');
    console.log(`  trial_expires_at: ${hasTrialExpires ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  subscription_status: ${hasSubscriptionStatus ? '✓ EXISTS' : '✗ MISSING'}`);
    
    if (!hasTrialExpires || !hasSubscriptionStatus) {
      console.log('\n⚠️  Trial columns missing! Run: node database/add-trial-support.js');
    } else {
      console.log('\n✅ Trial system is properly configured');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifySchema();
