const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL connection pool
 * Manages database connections efficiently
 */

// Use DATABASE_URL if available (Railway/production), otherwise use individual config (local)
let poolConfig;

if (process.env.DATABASE_URL) {
  // Production: Use DATABASE_URL from Railway/hosting platform
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log('📡 Using DATABASE_URL for connection');
} else {
  // Local development: Use individual config from .env
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'checkinhq',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log('💻 Using local database configuration');
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

module.exports = pool;
