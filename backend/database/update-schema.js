const pool = require('./db');

/**
 * Add missing columns for analytics feature
 */
async function updateSchema() {
  try {
    console.log('Starting schema update...');
    
    // Add follow_up_done column if it doesn't exist
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS follow_up_done BOOLEAN DEFAULT FALSE;
    `);
    
    // Add business_type column to users if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) DEFAULT 'airbnb';
    `);
    
    // Add business type constraint
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'valid_business_type'
        ) THEN
          ALTER TABLE users 
          ADD CONSTRAINT valid_business_type 
          CHECK (business_type IN ('airbnb', 'tour'));
        END IF;
      END $$;
    `);
    
    // Add last_login_at column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
    `);
    
    console.log('✓ Schema update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Schema update failed:', error);
    process.exit(1);
  }
}

updateSchema();
