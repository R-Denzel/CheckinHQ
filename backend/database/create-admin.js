/**
 * Create Admin User
 * Run this script to create your first admin account
 * 
 * Usage: node database/create-admin.js
 */

const bcrypt = require('bcryptjs');
const pool = require('./db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n🔐 Create Admin Account\n');

    const email = await question('Admin Email: ');
    const password = await question('Admin Password: ');
    const businessName = await question('Business Name (e.g., "CheckinHQ Admin"): ');

    if (!email || !password || !businessName) {
      console.error('❌ All fields are required');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin user
    const query = `
      INSERT INTO users (email, password_hash, business_name, business_type, is_admin)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, business_name, is_admin
    `;

    const result = await pool.query(query, [
      email.toLowerCase().trim(),
      passwordHash,
      businessName,
      'airbnb', // Default to airbnb type
      true      // is_admin = true
    ]);

    const admin = result.rows[0];

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Business Name: ${admin.business_name}`);
    console.log(`Is Admin: ${admin.is_admin}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Access admin dashboard at: http://localhost:8080/admin/login\n');

  } catch (error) {
    if (error.code === '23505') {
      console.error('❌ Error: Email already exists');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
