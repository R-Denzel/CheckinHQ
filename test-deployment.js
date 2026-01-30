// Quick deployment test
const backendUrl = 'https://checkinhq-backend-production.up.railway.app';
const frontendUrl = 'https://checkinhq.vercel.app';

console.log('Testing CheckinHQ Deployment...\n');

// Test 1: Backend Health
fetch(`${backendUrl}/health`)
  .then(res => res.json())
  .then(data => {
    console.log('✅ Backend Health:', data);
    console.log('\nNow testing registration...\n');
    
    // Test 2: Try Registration
    return fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test_${Date.now()}@example.com`,
        password: 'Test123!@#',
        businessName: 'Test Business',
        businessType: 'airbnb',
        preferredCurrency: 'USD'
      })
    });
  })
  .then(async res => {
    const data = await res.json();
    if (res.status === 201) {
      console.log('✅ Registration works!', data);
      console.log('\n🎉 Deployment is working correctly!');
    } else {
      console.log('❌ Registration failed:', res.status, data);
      
      if (data.error?.includes('relation') || data.error?.includes('does not exist')) {
        console.log('\n💡 FIX: Database migrations not run!');
        console.log('   Run this on your local machine:');
        console.log('   1. Get DATABASE_URL from Railway dashboard');
        console.log('   2. set DATABASE_URL=<your-railway-database-url>');
        console.log('   3. cd backend');
        console.log('   4. node database/migrate.js');
        console.log('   5. node database/add-trial-support.js');
      }
    }
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    console.log('\n💡 Possible issues:');
    console.log('   - Backend not deployed correctly');
    console.log('   - Check Railway logs for errors');
  });
