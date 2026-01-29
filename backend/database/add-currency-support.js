const pool = require('./db');

/**
 * Add currency support to database
 * Adds currency columns to users and bookings tables
 */
async function addCurrencySupport() {
  try {
    console.log('Adding currency support to database...');
    
    // Add preferred_currency to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD';
    `);
    console.log('✓ Added preferred_currency to users table');
    
    // Add currency to bookings table
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
    `);
    console.log('✓ Added currency to bookings table');
    
    // Add currency constraint
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'valid_currency'
        ) THEN
          ALTER TABLE bookings 
          ADD CONSTRAINT valid_currency 
          CHECK (currency IN ('USD', 'UGX', 'KES', 'TZS', 'EUR', 'GBP'));
        END IF;
      END $$;
    `);
    console.log('✓ Added currency constraint to bookings');
    
    // Add user currency constraint
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'valid_user_currency'
        ) THEN
          ALTER TABLE users 
          ADD CONSTRAINT valid_user_currency 
          CHECK (preferred_currency IN ('USD', 'UGX', 'KES', 'TZS', 'EUR', 'GBP'));
        END IF;
      END $$;
    `);
    console.log('✓ Added currency constraint to users');
    
    // Add performance index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_last_contacted 
      ON bookings(last_contacted_at);
    `);
    console.log('✓ Added performance index on last_contacted_at');
    
    console.log('\n✅ Currency support migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addCurrencySupport();
