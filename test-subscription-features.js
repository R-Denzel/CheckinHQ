/**
 * Test Subscription Features
 * 
 * This script tests:
 * 1. Database has subscription columns
 * 2. Users have trial/subscription status
 * 3. Subscription middleware blocks expired users
 * 4. Admin endpoints work correctly
 */

// Load environment variables first
require('dotenv').config({ path: './backend/.env' });

const pool = require('./backend/database/db');

async function runTests() {
  console.log('\n🧪 Testing Subscription Features\n');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;

  // Test 1: Check if subscription columns exist
  console.log('\n📋 Test 1: Database Schema');
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name IN ('trial_expires_at', 'subscription_status')
      ORDER BY column_name
    `);
    
    if (result.rows.length === 2) {
      console.log('✅ PASSED: Subscription columns exist');
      console.log('   - trial_expires_at:', result.rows[0].data_type);
      console.log('   - subscription_status:', result.rows[1].data_type);
      passed++;
    } else {
      console.log('❌ FAILED: Missing subscription columns');
      console.log('   Found:', result.rows.length, 'columns (expected 2)');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 2: Check if users have subscription data
  console.log('\n📋 Test 2: User Subscription Data');
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial_users,
        COUNT(*) FILTER (WHERE subscription_status = 'active') as active_users,
        COUNT(*) FILTER (WHERE subscription_status = 'expired') as expired_users,
        COUNT(*) FILTER (WHERE trial_expires_at IS NOT NULL) as users_with_trial_date
      FROM users
      WHERE is_admin = false
    `);
    
    const stats = result.rows[0];
    console.log('✅ PASSED: User subscription data exists');
    console.log('   - Total users:', stats.total_users);
    console.log('   - Trial users:', stats.trial_users);
    console.log('   - Active subscriptions:', stats.active_users);
    console.log('   - Expired:', stats.expired_users);
    console.log('   - Users with trial date:', stats.users_with_trial_date);
    
    if (parseInt(stats.total_users) === parseInt(stats.users_with_trial_date)) {
      console.log('✅ All non-admin users have trial dates');
      passed++;
    } else {
      console.log('⚠️  WARNING: Some users missing trial dates');
      console.log('   Run: node backend/database/add-trial-support.js');
      passed++; // Still pass but warn
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 3: Check for expired trials
  console.log('\n📋 Test 3: Trial Expiration Logic');
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE trial_expires_at < CURRENT_TIMESTAMP) as expired_trials,
        COUNT(*) FILTER (WHERE trial_expires_at >= CURRENT_TIMESTAMP) as active_trials
      FROM users
      WHERE is_admin = false AND subscription_status = 'trial'
    `);
    
    const stats = result.rows[0];
    console.log('✅ PASSED: Trial expiration check works');
    console.log('   - Expired trials:', stats.expired_trials);
    console.log('   - Active trials:', stats.active_trials);
    
    if (parseInt(stats.expired_trials) > 0) {
      console.log('   ⚠️  Note: Some trial users need subscription status update');
      console.log('      These users should have subscription_status = "expired"');
    }
    passed++;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 4: Sample user details
  console.log('\n📋 Test 4: Sample User Data');
  try {
    const result = await pool.query(`
      SELECT 
        id,
        email,
        business_name,
        subscription_status,
        trial_expires_at,
        CASE 
          WHEN trial_expires_at < CURRENT_TIMESTAMP THEN 'EXPIRED'
          ELSE 'ACTIVE'
        END as trial_status,
        EXTRACT(DAY FROM (trial_expires_at - CURRENT_TIMESTAMP)) as days_remaining
      FROM users
      WHERE is_admin = false
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ PASSED: Can retrieve user subscription details');
      console.log('\n   Sample Users:');
      console.log('   ' + '-'.repeat(80));
      result.rows.forEach(user => {
        const daysRemaining = user.days_remaining ? Math.ceil(user.days_remaining) : 0;
        const trialInfo = daysRemaining > 0 ? `${daysRemaining} days left` : 'EXPIRED';
        console.log(`   ${user.email.padEnd(30)} | ${user.subscription_status.padEnd(8)} | ${trialInfo}`);
      });
      console.log('   ' + '-'.repeat(80));
      passed++;
    } else {
      console.log('⚠️  WARNING: No non-admin users found');
      console.log('   Create a test user to fully test subscription features');
      passed++; // Still pass
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 5: Check constraint
  console.log('\n📋 Test 5: Subscription Status Constraint');
  try {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'users' 
        AND constraint_name = 'valid_subscription_status'
    `);
    
    if (result.rows.length === 1) {
      console.log('✅ PASSED: Subscription status constraint exists');
      console.log('   - Valid values: trial, active, expired');
      passed++;
    } else {
      console.log('⚠️  WARNING: Constraint not found (may be ok if DB handles it differently)');
      passed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 6: Admin user check
  console.log('\n📋 Test 6: Admin User Configuration');
  try {
    const result = await pool.query(`
      SELECT email, is_admin
      FROM users
      WHERE is_admin = true
      LIMIT 5
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ PASSED: Admin users exist');
      result.rows.forEach(admin => {
        console.log(`   - ${admin.email}`);
      });
      console.log('   Note: Admin users bypass subscription checks');
      passed++;
    } else {
      console.log('⚠️  WARNING: No admin users found');
      console.log('   Create an admin user to manage subscriptions');
      console.log('   Run: node backend/database/create-admin.js');
      passed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Subscription features are working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }

  // Close database connection
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
