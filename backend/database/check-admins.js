/**
 * Check Admin Users
 * Verify which users have admin privileges
 */

const pool = require('./db');

async function checkAdmins() {
  try {
    const result = await pool.query('SELECT id, email, business_name, is_admin FROM users ORDER BY created_at DESC');
    
    console.log('\n📋 All Users in Database:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Business: ${user.business_name}`);
      console.log(`   Is Admin: ${user.is_admin === true ? '✅ YES' : '❌ NO'}`);
      console.log(`   ID: ${user.id}`);
      console.log('   ───────────────────────────────────────────────────');
    });
    
    const admins = result.rows.filter(u => u.is_admin === true);
    console.log(`\n✅ Total users: ${result.rows.length}`);
    console.log(`🔐 Admin users: ${admins.length}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmins();
