# CheckinHQ - Bug Report & Fixes

## 🔴 High Priority Issues

### H-1: Missing Admin Route Protection
**File:** `backend/routes/analytics.js`  
**Line:** 13  
**Severity:** HIGH  

**Problem:**
The admin analytics endpoint is not protected by admin-check middleware. Any authenticated user can access admin data.

**Vulnerable Code:**
```javascript
// Current (VULNERABLE)
router.get('/admin', authMiddleware, analyticsController.getAdminAnalytics);
```

**Fix:**
```javascript
// 1. Create admin middleware in backend/middleware/isAdmin.js
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = isAdmin;

// 2. Update backend/routes/analytics.js
const isAdmin = require('../middleware/isAdmin');

router.get('/admin', authMiddleware, isAdmin, analyticsController.getAdminAnalytics);
```

---

### H-2: Email Enumeration Vulnerability
**File:** `backend/controllers/authController.js`  
**Line:** 72  
**Severity:** HIGH  

**Problem:**
Login failure logs reveal whether an email exists in the database, allowing attackers to enumerate valid user emails.

**Vulnerable Code:**
```javascript
const user = await User.findByEmail(email);
if (!user) {
  console.log('Login failed: User not found for email:', email); // ❌ LEAKS INFO
  return res.status(401).json({ error: 'Invalid email or password' });
}
```

**Fix:**
```javascript
const user = await User.findByEmail(email);
if (!user) {
  // Remove the console.log in production
  // Use generic error message only
  return res.status(401).json({ error: 'Invalid email or password' });
}

// Better: Use environment-aware logging
if (process.env.NODE_ENV === 'development') {
  console.log('Login attempt for email:', email);
}
```

---

## 🟡 Medium Priority Issues

### M-1: Deposit Amount Can Exceed Total Amount
**File:** `backend/controllers/bookingController.js`  
**Lines:** 10-15  
**Severity:** MEDIUM  

**Problem:**
No validation ensures deposit_amount <= total_amount.

**Fix:**
```javascript
// Add to validation array in createBooking and updateBooking
body('depositAmount').optional().isFloat({ min: 0 }).custom((value, { req }) => {
  if (value > (req.body.totalAmount || 0)) {
    throw new Error('Deposit amount cannot exceed total amount');
  }
  return true;
}),
```

---

### M-2: Missing Database Index
**File:** `backend/database/schema.sql`  
**Line:** Add after line 103  
**Severity:** MEDIUM  

**Problem:**
Query for follow-ups scans `last_contacted_at` without index, causing slow performance on large datasets.

**Fix:**
```sql
-- Add to schema.sql
CREATE INDEX IF NOT EXISTS idx_bookings_last_contacted ON bookings(last_contacted_at);
```

**Migration Script:**
```javascript
// backend/database/add-index.js
const pool = require('./db');

async function addIndex() {
  try {
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_last_contacted 
      ON bookings(last_contacted_at);
    `);
    console.log('✓ Index created');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

addIndex();
```

---

### M-3: Inconsistent HTTP Status Codes
**Files:** All controllers  
**Severity:** MEDIUM  

**Problem:**
All errors return 500 Internal Server Error instead of appropriate codes (400, 403, 404).

**Fix:**
```javascript
// 1. Create backend/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

// 2. Update controllers
const AppError = require('../utils/AppError');

// Use specific errors
if (!booking) {
  throw new AppError('Booking not found', 404);
}

if (booking.user_id !== req.userId) {
  throw new AppError('Forbidden', 403);
}

// 3. Update global error handler in server.js
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational 
    ? err.message 
    : 'Internal server error';
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  res.status(statusCode).json({ error: message });
});
```

---

## 🟢 Low Priority Issues

### L-1: Weak Password Requirements
**File:** `backend/controllers/authController.js`  
**Line:** 18  
**Severity:** LOW  

**Problem:**
Password only requires 6 characters with no complexity requirements.

**Fix:**
```javascript
body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain uppercase, lowercase, and number'),
```

---

### L-2: Phone Number Not Validated
**File:** `backend/controllers/bookingController.js`  
**Line:** 13  
**Severity:** LOW  

**Problem:**
Accepts any string as phone number, breaking WhatsApp links.

**Fix:**
```javascript
body('phoneNumber')
  .trim()
  .notEmpty()
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage('Phone number must be in E.164 format (e.g., +256712345678)'),
```

---

### L-3: No Rate Limiting
**File:** `backend/server.js`  
**Severity:** LOW  

**Problem:**
No rate limiting makes API vulnerable to brute force and DoS attacks.

**Fix:**
```javascript
// 1. Install package
npm install express-rate-limit

// 2. Add to server.js
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later'
});

// Apply limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

### L-4: Check-out Date Can Be Before Check-in
**File:** `backend/controllers/bookingController.js`  
**Line:** 15  
**Severity:** LOW  

**Problem:**
No backend validation that check_out_date > check_in_date.

**Fix:**
```javascript
body('checkOutDate')
  .notEmpty()
  .isISO8601()
  .toDate()
  .custom((value, { req }) => {
    const checkIn = new Date(req.body.checkInDate);
    const checkOut = new Date(value);
    if (checkOut <= checkIn) {
      throw new Error('Check-out date must be after check-in date');
    }
    return true;
  }),
```

---

## Implementation Priority

### Before Production (MUST FIX)
1. ✅ H-1: Add admin middleware
2. ✅ H-2: Remove email enumeration

### Next Sprint (SHOULD FIX)
1. ✅ M-1: Add deposit validation
2. ✅ M-2: Create database index
3. ✅ M-3: Implement proper error codes

### Future Improvements (NICE TO HAVE)
1. ⭕ L-1: Strengthen password requirements
2. ⭕ L-2: Add phone validation
3. ⭕ L-3: Implement rate limiting
4. ⭕ L-4: Add date validation

---

## Quick Fix Script

Run all high-priority fixes at once:

```bash
# 1. Create admin middleware
cat > backend/middleware/isAdmin.js << 'EOF'
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = isAdmin;
EOF

# 2. Add database index
cat > backend/database/add-index.js << 'EOF'
const pool = require('./db');

async function addIndex() {
  try {
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_last_contacted 
      ON bookings(last_contacted_at);
    `);
    console.log('✓ Index created');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

addIndex();
EOF

# 3. Run index creation
node backend/database/add-index.js
```

Then manually update:
- `backend/routes/analytics.js` (add isAdmin middleware)
- `backend/controllers/authController.js` (remove console.log on line 72)
- `backend/controllers/bookingController.js` (add deposit validation)

---

## Testing After Fixes

```bash
# Test admin route protection
curl -H "Authorization: Bearer <regular_user_token>" \
  http://localhost:3000/api/analytics/admin
# Expected: 403 Forbidden

# Test deposit validation
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"depositAmount": 100, "totalAmount": 50, ...}'
# Expected: 400 Validation Error

# Verify index exists
psql checkinhq -c "\d bookings"
# Should show idx_bookings_last_contacted in indexes
```

---

**Last Updated:** $(date)  
**Status:** All issues documented and fixes provided
