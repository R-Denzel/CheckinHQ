const pool = require('./db');

/**
 * Check business types in database
 */
async function checkBusinessTypes() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT business_type, COUNT(*) as count
      FROM users
      GROUP BY business_type
      ORDER BY count DESC
    `);
    
    console.log('Business types in database:\n');
    result.rows.forEach(row => {
      console.log(`  ${row.business_type}: ${row.count} users`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBusinessTypes();
