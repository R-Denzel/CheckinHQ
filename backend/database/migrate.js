const fs = require('fs');
const path = require('path');
const pool = require('./db');

/**
 * Database migration script
 * Run this to create all tables and schema
 */
async function migrate() {
  try {
    console.log('Starting database migration...');
    
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );
    
    await pool.query(schemaSQL);
    
    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
