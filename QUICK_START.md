# Subscription Features - Quick Start Guide

## ✅ What's Been Fixed

### 1. Backend Issues
- ✅ Database migration completed successfully
- ✅ All users now have trial and subscription fields
- ✅ Subscription middleware properly blocks non-subscribers
- ✅ All tests passing (6/6)

### 2. Admin Dashboard
- ✅ Now shows subscription status for all users
- ✅ Displays trial expiration dates and countdown
- ✅ Color-coded badges (Green=Active, Orange=Trial, Red=Expired)
- ✅ Toggle button to activate/deactivate subscriptions

### 3. Subscription Management
- ✅ Admin can toggle any user's subscription on/off
- ✅ Confirmation dialog before changes
- ✅ Auto-refresh after toggle

### 4. Booking Restrictions
- ✅ Non-subscribers cannot create bookings after trial expires
- ✅ Paywall dialog shows when trial expired
- ✅ Admin users bypass all restrictions

## 🚀 How to Start Using

### 1. Start the Backend
```bash
cd backend
npm start
```

The backend will run on http://localhost:3000

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:8080

### 3. Access Admin Dashboard

**Login as admin:**
- Email: robertmale@gmail.com
- Password: [your admin password]

**Navigate to Admin Dashboard:**
- Click the admin icon or go to `/admin`

### 4. Managing Subscriptions

**View Subscription Status:**
- Open Admin Dashboard
- Scroll to "Individual Host Stats" section
- See subscription column with status badges

**Activate a Subscription:**
1. Find the user in the list
2. Click "Activate" button in the Actions column
3. Confirm the action
4. User can now create bookings indefinitely

**Deactivate a Subscription:**
1. Find the user with "Active" status
2. Click "Deactivate" button
3. Confirm the action
4. User will be blocked from creating bookings

## 📊 Subscription Status Meanings

| Status | Badge Color | Meaning | Can Create Bookings? |
|--------|-------------|---------|---------------------|
| **Trial** | 🟡 Orange | Within 30-day trial period | ✅ Yes |
| **Active** | 🟢 Green | Paid subscriber or manually activated | ✅ Yes |
| **Expired** | 🔴 Red | Trial ended, no active subscription | ❌ No |

## 🧪 Testing the Features

### Run Automated Tests
```bash
node test-subscription-features.js
```

Expected output: `🎉 All tests passed!` (6/6)

### Manual Testing

**Test 1: Trial User Can Create Bookings**
1. Login as a trial user (jannie@yahoo.com or robertdenzel5@gmail.com)
2. Try creating a booking
3. Should work ✅

**Test 2: Expired User Cannot Create Bookings**
1. As admin, deactivate a user's subscription
2. Login as that user
3. Try creating a booking
4. Should see paywall dialog ❌

**Test 3: Admin Can Toggle Subscriptions**
1. Login as admin
2. Go to Admin Dashboard
3. Click "Activate" on an expired user
4. Status changes to "Active" ✅
5. Click "Deactivate"
6. Status changes back to "Expired" ✅

**Test 4: Admin Bypasses Restrictions**
1. Login as admin (robertmale@gmail.com)
2. Can create bookings regardless of subscription ✅

## 📋 Current User Status

Based on the test results:
- **Total Users**: 2
- **Trial Users**: 2 (both have 29 days remaining)
- **Active Subscriptions**: 0
- **Expired**: 0
- **Admin Users**: 1 (robertmale@gmail.com)

## 🔧 Common Tasks

### Make a User's Trial Never Expire
```sql
-- Login to database
psql -U postgres -d checkinhq

-- Set future expiration date
UPDATE users 
SET trial_expires_at = CURRENT_TIMESTAMP + INTERVAL '365 days'
WHERE email = 'user@example.com';
```

### Activate All Users (for testing)
```sql
UPDATE users 
SET subscription_status = 'active'
WHERE is_admin = false;
```

### Expire a User's Trial Immediately
```sql
UPDATE users 
SET trial_expires_at = CURRENT_TIMESTAMP - INTERVAL '1 day',
    subscription_status = 'expired'
WHERE email = 'user@example.com';
```

### Check Subscription Status via API
```bash
# Get your auth token first by logging in
# Then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/subscription/status
```

## 🎯 Next Steps (Optional)

### Recommended Enhancements:
1. **Email Notifications**
   - Send email 7 days before trial expires
   - Send email on trial expiration
   - Send email on subscription activation

2. **Payment Integration**
   - Add Stripe or PayPal
   - Auto-activate on successful payment
   - Handle subscription renewals

3. **Grace Period**
   - Allow 3 days grace after trial expires
   - Read-only access during grace period

4. **Usage Tracking**
   - Track bookings created per month
   - Display usage stats on dashboard
   - Implement tier limits (10 bookings/month for free, unlimited for paid)

## 📁 Files Changed

### Backend
- ✅ `backend/models/Analytics.js` - Added subscription fields to user stats
- ✅ `backend/routes/subscription.js` - Added toggle endpoint
- ✅ `backend/middleware/checkSubscription.js` - Improved error handling
- ✅ Database migration completed

### Frontend
- ✅ `frontend/src/views/AdminDashboardView.vue` - Added subscription column & toggle
- ✅ `frontend/src/stores/booking.js` - Added subscription error handling

### Documentation
- ✅ `SUBSCRIPTION_FEATURES.md` - Full documentation
- ✅ `QUICK_START.md` - This file
- ✅ `test-subscription-features.js` - Test suite

## ❓ Troubleshooting

**Q: Backend won't start**
- Check PostgreSQL is running: `pg_isready`
- Check .env file exists in backend folder
- Run `npm install` in backend folder

**Q: Admin dashboard doesn't show subscriptions**
- Clear browser cache
- Verify you're logged in as admin
- Check browser console for errors

**Q: Tests failing**
- Ensure PostgreSQL is running
- Check backend/.env has correct credentials
- Run migration: `node backend/database/add-trial-support.js`

**Q: User can still create bookings after expiring trial**
- Check if user is admin (admins bypass restrictions)
- Verify subscription_status in database
- Check trial_expires_at is in the past

## 📞 Support

For issues or questions:
1. Check [SUBSCRIPTION_FEATURES.md](SUBSCRIPTION_FEATURES.md) for detailed docs
2. Run test suite: `node test-subscription-features.js`
3. Check browser/server console for error messages

---

**All systems operational! 🎉**
- ✅ Database migrated
- ✅ Tests passing (6/6)
- ✅ Features implemented
- ✅ Ready to use
