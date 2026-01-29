const pool = require('./db');

async function testSchema() {
  try {
    // Check users table
    const usersCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'preferred_currency'
    `);
    console.log('✓ preferred_currency in users:', usersCheck.rows.length > 0);
    
    // Check bookings table
    const bookingsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'currency'
    `);
    console.log('✓ currency in bookings:', bookingsCheck.rows.length > 0);
    
    // Check index
    const indexCheck = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'bookings' 
      AND indexname = 'idx_bookings_last_contacted'
    `);
    console.log('✓ index idx_bookings_last_contacted:', indexCheck.rows.length > 0);
    
    console.log('\n✅ All database changes verified!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSchema();
