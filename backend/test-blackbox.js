const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;
let testBookingId = null;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  log('\n=== BLACK BOX TESTS - CheckinHQ ===\n', 'blue');
  
  try {
    // Test 1: User Registration
    log('Test 1: User Registration with Trial', 'yellow');
    try {
      const registerData = {
        email: `test_${Date.now()}@blackbox.com`,
        password: 'Test123!@#',
        businessName: 'Blackbox Test Tours',
        businessType: 'tours',
        preferredCurrency: 'USD'
      };
      
      const registerRes = await axios.post(`${API_URL}/auth/register`, registerData);
      
      if (registerRes.status === 201 && 
          registerRes.data.token && 
          registerRes.data.user.trialExpiresAt &&
          registerRes.data.user.subscriptionStatus === 'trial') {
        log('✓ Registration successful with trial setup', 'green');
        authToken = registerRes.data.token;
        testUserId = registerRes.data.user.id;
        passed++;
      } else {
        log('✗ Registration missing trial fields', 'red');
        failed++;
      }
    } catch (error) {
      log(`✗ Registration failed: ${error.response?.data?.error || error.message}`, 'red');
      failed++;
    }
    
    // Test 2: Login
    log('\nTest 2: User Login', 'yellow');
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'test_1738270872000@blackbox.com',
        password: 'Test123!@#'
      });
      
      if (loginRes.status === 200 && loginRes.data.token) {
        log('✓ Login successful', 'green');
        if (!authToken) authToken = loginRes.data.token;
        passed++;
      }
    } catch (error) {
      log(`✗ Login failed: ${error.response?.data?.error || error.message}`, 'red');
      failed++;
    }
    
    // Test 3: Subscription Status Check
    log('\nTest 3: Check Subscription Status', 'yellow');
    try {
      const subRes = await axios.get(`${API_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (subRes.data.hasActiveAccess && subRes.data.daysRemaining > 0) {
        log(`✓ Subscription active - ${subRes.data.daysRemaining} days remaining`, 'green');
        passed++;
      } else {
        log('✗ Subscription check failed', 'red');
        failed++;
      }
    } catch (error) {
      log(`✗ Subscription status failed: ${error.response?.data?.error || error.message}`, 'red');
      failed++;
    }
    
    // Test 4: Create Booking with Currency
    log('\nTest 4: Create Booking with Currency Support', 'yellow');
    try {
      const bookingData = {
        guestName: 'John Blackbox',
        phoneNumber: '+256700000000',
        checkInDate: '2026-02-15',
        checkOutDate: '2026-02-20',
        propertyDestination: 'Murchison Falls Safari',
        status: 'Inquiry',
        currency: 'UGX',
        totalAmount: 2000000,
        depositAmount: 500000,
        notes: 'Blackbox test booking'
      };
      
      const createRes = await axios.post(`${API_URL}/bookings`, bookingData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (createRes.status === 201 && createRes.data.booking.currency === 'UGX') {
        log('✓ Booking created with currency support', 'green');
        testBookingId = createRes.data.booking.id;
        passed++;
      }
    } catch (error) {
      log(`✗ Booking creation failed: ${error.response?.data?.error || error.message}`, 'red');
      failed++;
    }
    
    // Test 5: Deposit Validation
    log('\nTest 5: Deposit Validation (Deposit > Total)', 'yellow');
    try {
      const invalidBooking = {
        guestName: 'Invalid Deposit',
        phoneNumber: '+256700000001',
        checkInDate: '2026-03-01',
        checkOutDate: '2026-03-05',
        propertyDestination: 'Test Location',
        totalAmount: 1000,
        depositAmount: 2000 // Invalid: exceeds total
      };
      
      const invalidRes = await axios.post(`${API_URL}/bookings`, invalidBooking, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      log('✗ Should have rejected invalid deposit', 'red');
      failed++;
    } catch (error) {
      if (error.response?.status === 400) {
        log('✓ Deposit validation working (rejected deposit > total)', 'green');
        passed++;
      } else {
        log('✗ Unexpected error on validation', 'red');
        failed++;
      }
    }
    
    // Test 6: Get Dashboard
    log('\nTest 6: Dashboard Load Performance', 'yellow');
    try {
      const startTime = Date.now();
      const dashboardRes = await axios.get(`${API_URL}/bookings/dashboard/today`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const loadTime = Date.now() - startTime;
      
      if (dashboardRes.status === 200 && loadTime < 2000) {
        log(`✓ Dashboard loaded in ${loadTime}ms (< 2000ms)`, 'green');
        passed++;
      } else {
        log(`⚠ Dashboard slow: ${loadTime}ms`, 'yellow');
        failed++;
      }
    } catch (error) {
      log(`✗ Dashboard failed: ${error.response?.data?.error || error.message}`, 'red');
      failed++;
    }
    
    // Test 7: Get All Bookings
    log('\nTest 7: List All Bookings', 'yellow');
    try {
      const listRes = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (listRes.status === 200 && Array.isArray(listRes.data.bookings)) {
        log(`✓ Retrieved ${listRes.data.bookings.length} bookings`, 'green');
        passed++;
      }
    } catch (error) {
      log(`✗ List bookings failed: ${error.message}`, 'red');
      failed++;
    }
    
    // Test 8: Update Booking
    log('\nTest 8: Update Booking Currency', 'yellow');
    try {
      if (testBookingId) {
        const updateRes = await axios.put(`${API_URL}/bookings/${testBookingId}`, {
          currency: 'USD',
          totalAmount: 500,
          depositAmount: 200
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (updateRes.data.booking.currency === 'USD') {
          log('✓ Booking currency updated successfully', 'green');
          passed++;
        }
      } else {
        log('⊘ Skipped - no test booking created', 'yellow');
      }
    } catch (error) {
      log(`✗ Update failed: ${error.message}`, 'red');
      failed++;
    }
    
    // Test 9: Analytics (Host)
    log('\nTest 9: Host Analytics', 'yellow');
    try {
      const analyticsRes = await axios.get(`${API_URL}/analytics/host`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (analyticsRes.status === 200 && analyticsRes.data.analytics) {
        log('✓ Host analytics loaded', 'green');
        passed++;
      }
    } catch (error) {
      log(`✗ Analytics failed: ${error.message}`, 'red');
      failed++;
    }
    
    // Test 10: Unauthorized Access
    log('\nTest 10: Unauthorized Access Protection', 'yellow');
    try {
      await axios.get(`${API_URL}/bookings`);
      log('✗ Should have blocked unauthorized access', 'red');
      failed++;
    } catch (error) {
      if (error.response?.status === 401) {
        log('✓ Unauthorized access properly blocked', 'green');
        passed++;
      }
    }
    
    // Test 11: Admin Route Protection
    log('\nTest 11: Admin Route Protection', 'yellow');
    try {
      await axios.get(`${API_URL}/analytics/admin`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log('✗ Non-admin should not access admin routes', 'red');
      failed++;
    } catch (error) {
      if (error.response?.status === 403) {
        log('✓ Admin route properly protected', 'green');
        passed++;
      }
    }
    
    // Test 12: Delete Booking
    log('\nTest 12: Delete Booking', 'yellow');
    try {
      if (testBookingId) {
        const deleteRes = await axios.delete(`${API_URL}/bookings/${testBookingId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (deleteRes.status === 200) {
          log('✓ Booking deleted successfully', 'green');
          passed++;
        }
      } else {
        log('⊘ Skipped - no test booking to delete', 'yellow');
      }
    } catch (error) {
      log(`✗ Delete failed: ${error.message}`, 'red');
      failed++;
    }
    
  } catch (error) {
    log(`\n✗ Fatal error: ${error.message}`, 'red');
  }
  
  // Summary
  log('\n=== TEST SUMMARY ===', 'blue');
  log(`Total Tests: ${passed + failed}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`, 
      passed === (passed + failed) ? 'green' : 'yellow');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
axios.get(`${API_URL.replace('/api', '')}/health`)
  .then(() => {
    log('✓ Server is running, starting tests...\n', 'green');
    runTests();
  })
  .catch(() => {
    log('✗ Server not running! Start backend with: npm run dev', 'red');
    process.exit(1);
  });
