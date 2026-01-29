const pool = require('./db');

/**
 * Add performance indexes to speed up queries
 */
async function addIndexes() {
  try {
    console.log('Adding performance indexes...\n');
    
    // Index for filtering bookings by user_id (most common query)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id 
      ON bookings(user_id);
    `);
    console.log('✓ Added index on bookings.user_id');
    
    // Index for filtering by check-in date
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_checkin 
      ON bookings(check_in_date);
    `);
    console.log('✓ Added index on bookings.check_in_date');
    
    // Index for filtering by status
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status 
      ON bookings(status);
    `);
    console.log('✓ Added index on bookings.status');
    
    // Composite index for dashboard queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_checkin_checkout 
      ON bookings(user_id, check_in_date, check_out_date);
    `);
    console.log('✓ Added composite index on bookings(user_id, check_in_date, check_out_date)');
    
    console.log('\n✅ All performance indexes added!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addIndexes();