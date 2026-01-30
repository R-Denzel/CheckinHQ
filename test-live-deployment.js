#!/usr/bin/env node

const https = require('https');

const BACKEND_URL = 'https://checkinhq-backend-production.up.railway.app';
const FRONTEND_URL = 'https://checkinhq.vercel.app';

console.log('🔍 Testing CheckinHQ Live Deployment\n');
console.log('Backend:', BACKEND_URL);
console.log('Frontend:', FRONTEND_URL);
console.log('━'.repeat(60), '\n');

// Helper to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testHealthEndpoint() {
  console.log('1️⃣ Testing Backend Health Endpoint');
  console.log('   GET /health\n');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    
    if (response.status === 200 && response.json?.status === 'ok') {
      console.log('   ✅ Backend is UP and responding');
      console.log('   Response:', JSON.stringify(response.json, null, 2));
      return true;
    } else {
      console.log('   ❌ Backend returned unexpected response');
      console.log('   Status:', response.status);
      console.log('   Body:', response.body);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Backend is DOWN or unreachable');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testRegistration() {
  console.log('\n2️⃣ Testing Registration Endpoint');
  console.log('   POST /api/auth/register\n');
  
  const testData = JSON.stringify({
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    businessName: 'Test Business',
    businessType: 'airbnb'
  });
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData),
        'Origin': FRONTEND_URL
      },
      body: testData
    });
    
    console.log('   Status:', response.status);
    
    if (response.status === 201) {
      console.log('   ✅ Registration works!');
      console.log('   Response:', JSON.stringify(response.json, null, 2));
      return true;
    } else if (response.status === 500 && response.body.includes('relation')) {
      console.log('   ❌ DATABASE MIGRATION NEEDED');
      console.log('   Error:', response.json?.error || response.body);
      console.log('\n   💡 Fix: Run the database migrations');
      console.log('      1. Get DATABASE_URL from Railway');
      console.log('      2. Run: run-railway-migrations.bat');
      return false;
    } else if (response.status === 0 || !response.status) {
      console.log('   ❌ CORS ERROR - Frontend cannot reach backend');
      console.log('   💡 Fix: Check FRONTEND_URL in Railway matches exactly:');
      console.log('      ' + FRONTEND_URL);
      return false;
    } else {
      console.log('   ⚠️ Unexpected response');
      console.log('   Body:', response.body);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Request failed');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\n3️⃣ Testing CORS Configuration');
  console.log('   OPTIONS /api/auth/register\n');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    
    const allowOrigin = response.headers['access-control-allow-origin'];
    const allowMethods = response.headers['access-control-allow-methods'];
    
    console.log('   Status:', response.status);
    console.log('   Access-Control-Allow-Origin:', allowOrigin);
    console.log('   Access-Control-Allow-Methods:', allowMethods);
    
    if (allowOrigin === FRONTEND_URL || allowOrigin === '*') {
      console.log('   ✅ CORS is properly configured');
      return true;
    } else {
      console.log('   ❌ CORS mismatch!');
      console.log('   💡 Fix: Set FRONTEND_URL in Railway to:');
      console.log('      ' + FRONTEND_URL);
      return false;
    }
  } catch (error) {
    console.log('   ⚠️ Could not test CORS');
    console.log('   Error:', error.message);
    return false;
  }
}

// Main test execution
(async () => {
  const healthOk = await testHealthEndpoint();
  const registrationOk = await testRegistration();
  const corsOk = await testCORS();
  
  console.log('\n' + '━'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('━'.repeat(60));
  console.log('Backend Health:    ', healthOk ? '✅ OK' : '❌ FAILED');
  console.log('Registration:      ', registrationOk ? '✅ OK' : '❌ FAILED');
  console.log('CORS Config:       ', corsOk ? '✅ OK' : '❌ FAILED');
  console.log('━'.repeat(60), '\n');
  
  if (healthOk && registrationOk && corsOk) {
    console.log('🎉 ALL TESTS PASSED! Your deployment is working!\n');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for fixes.\n');
  }
})();
