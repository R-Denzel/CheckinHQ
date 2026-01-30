#!/usr/bin/env node

/**
 * Deployment Diagnostics
 * Run this to check your deployed app
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function diagnose() {
  console.log('\n🔍 CheckinHQ Deployment Diagnostics\n');
  
  const backendUrl = await ask('Enter your Railway backend URL (e.g., https://your-app.up.railway.app): ');
  const frontendUrl = await ask('Enter your Vercel frontend URL (e.g., https://your-app.vercel.app): ');
  
  console.log('\n--- Checking Deployment ---\n');
  
  // Test 1: Backend Health
  console.log('1. Testing backend health endpoint...');
  try {
    const response = await fetch(`${backendUrl}/health`);
    const data = await response.json();
    console.log('✅ Backend is running:', data);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    console.log('   → Check Railway logs');
  }
  
  // Test 2: Database Connection
  console.log('\n2. Testing database connection...');
  try {
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test_${Date.now()}@diagnostic.com`,
        password: 'Test123!@#',
        businessName: 'Diagnostic Test',
        businessType: 'airbnb'
      })
    });
    
    if (response.status === 201) {
      console.log('✅ Database connected and working');
    } else if (response.status === 500) {
      console.log('❌ Database error - migrations not run');
      console.log('   → Run migrations on Railway (see instructions below)');
    } else {
      const data = await response.json();
      console.log('⚠️  Unexpected response:', data);
    }
  } catch (error) {
    console.log('❌ Registration test failed:', error.message);
  }
  
  // Test 3: CORS
  console.log('\n3. Testing CORS configuration...');
  console.log(`   Backend expects: ${frontendUrl}`);
  console.log('   → Check FRONTEND_URL in Railway env vars');
  
  console.log('\n--- Common Issues & Fixes ---\n');
  
  console.log('Issue 1: "Database error" or "relation does not exist"');
  console.log('Fix: Run migrations on Railway database:');
  console.log('   1. Go to Railway → Your Project → PostgreSQL');
  console.log('   2. Click "Data" tab → "Query"');
  console.log('   3. Copy paste schema from backend/database/schema.sql');
  console.log('   4. Run the query');
  console.log('   OR connect locally:');
  console.log('   psql $DATABASE_URL < backend/database/schema.sql\n');
  
  console.log('Issue 2: CORS errors in browser console');
  console.log('Fix: Check Railway environment variables:');
  console.log(`   FRONTEND_URL=${frontendUrl}`);
  console.log('   (No trailing slash)\n');
  
  console.log('Issue 3: "Cannot find module" errors');
  console.log('Fix: Ensure Railway is building from correct directory:');
  console.log('   Settings → Root Directory = "backend"\n');
  
  console.log('Issue 4: Frontend shows blank page');
  console.log('Fix: Check Vercel environment variable:');
  console.log(`   VITE_API_URL=${backendUrl}/api`);
  console.log('   Then redeploy Vercel\n');
  
  console.log('\n--- Quick Fix Steps ---\n');
  console.log('1. Railway Environment Variables:');
  console.log('   NODE_ENV=production');
  console.log('   JWT_SECRET=<random-string>');
  console.log(`   FRONTEND_URL=${frontendUrl}`);
  console.log('   DATABASE_URL=<auto-set-by-railway>\n');
  
  console.log('2. Vercel Environment Variables:');
  console.log(`   VITE_API_URL=${backendUrl}/api\n`);
  
  console.log('3. Run Database Migrations:');
  console.log('   Option A: Railway Data tab → Query → Run schema.sql');
  console.log('   Option B: Connect locally and run:');
  console.log('     set DATABASE_URL=<railway-database-url>');
  console.log('     cd backend');
  console.log('     node database/migrate.js');
  console.log('     node database/add-trial-support.js\n');
  
  rl.close();
}

diagnose().catch(console.error);
