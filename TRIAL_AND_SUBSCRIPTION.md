# Trial & Subscription System Implementation

## Overview
CheckinHQ now includes a complete trial and subscription management system with:
- **1-month free trial** for all new users
- **Automatic access control** after trial expiration
- **Paywall UI** for expired trials
- **Admin subscription management** panel

## Database Schema Changes

### Users Table
New columns added:
- `trial_expires_at` (TIMESTAMP) - Automatically set to 30 days from registration
- `subscription_status` (VARCHAR) - Enum: 'trial', 'active', 'expired'

### Constraints
- CHECK constraint ensures valid subscription statuses
- Existing users automatically assigned trial periods based on signup date

## Backend Implementation

### 1. Middleware: checkSubscription.js
**Location:** `backend/middleware/checkSubscription.js`

**Purpose:** Protects API endpoints from users with expired trials

**Logic:**
- Admin users bypass subscription checks
- Checks if `trial_expires_at < now` AND `subscription_status != 'active'`
- Returns 403 with paywall message if access blocked
- Attaches subscription info to request object

### 2. Protected Routes
All booking and analytics routes now require active subscription:
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - View booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `POST /api/bookings/:id/contact` - Mark contacted
- `POST /api/bookings/:id/notes` - Add note
- `GET /api/bookings/dashboard/today` - Dashboard
- `GET /api/analytics/host` - Analytics

### 3. Subscription API Routes
**Location:** `backend/routes/subscription.js`

#### User Endpoints
- `GET /api/subscription/status` - Get current user's subscription info
  ```json
  {
    "subscriptionStatus": "trial",
    "trialExpiresAt": "2026-03-02T10:30:00.000Z",
    "trialExpired": false,
    "daysRemaining": 15,
    "hasActiveAccess": true
  }
  ```

#### Admin Endpoints (require admin auth)
- `POST /api/subscription/activate/:userId` - Activate subscription
- `POST /api/subscription/deactivate/:userId` - Deactivate subscription
- `GET /api/subscription/users` - List all users with subscription info

### 4. Auth Updates
Registration and login now return trial information:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "businessName": "My Hotel",
    "trialExpiresAt": "2026-03-02T10:30:00.000Z",
    "subscriptionStatus": "trial"
  }
}
```

## Frontend Implementation

### 1. PaywallDialog Component
**Location:** `frontend/src/components/PaywallDialog.vue`

**Features:**
- Displays when trial expires
- Shows trial expiration date
- Subscription status chip
- "Subscribe Now" CTA (placeholder for payment integration)
- Logout option

**Props:**
- `show` (Boolean) - Show/hide dialog
- `trialExpiresAt` (String) - ISO date string
- `subscriptionStatus` (String) - Current status

### 2. Auth Store Updates
**Location:** `frontend/src/stores/auth.js`

**New State:**
- `showPaywall` (Boolean) - Controls paywall visibility

**New Getters:**
- `trialExpiresAt` - Trial expiration date
- `subscriptionStatus` - Current subscription status
- `isTrialExpired` - Boolean, true if trial date passed
- `hasActiveAccess` - Boolean, true if admin OR active subscription OR trial not expired

**New Actions:**
- `togglePaywall(show)` - Show/hide paywall dialog

### 3. Dashboard Updates
**Location:** `frontend/src/views/DashboardView.vue`

**Features:**
- Trial banner showing days remaining (for trial users)
- "Subscribe" quick action in banner
- Automatic paywall trigger on 403 trial-expired errors
- PaywallDialog component integrated

### 4. API Service
**Location:** `frontend/src/services/api.js`

**New Subscription Methods:**
```javascript
api.subscription.getStatus()        // Get current subscription info
api.subscription.activate(userId)   // Admin: activate user
api.subscription.deactivate(userId) // Admin: deactivate user
api.subscription.getUsers()         // Admin: list all users
```

**Error Handling:**
- 403 errors with `trialExpired: true` now properly caught
- Components can handle paywall display on subscription errors

### 5. Subscription Management View
**Location:** `frontend/src/views/SubscriptionManagementView.vue`

**Admin-only page at `/admin/subscriptions`**

**Features:**
- Stats dashboard (active subscriptions, trials, expired)
- User table with subscription details
- One-click activate/deactivate buttons
- Real-time status updates
- Trial expiration tracking

**Columns:**
- Email
- Business name
- Subscription status (chip with color coding)
- Trial expiration date
- Join date
- Actions (activate/deactivate)

## Migration Instructions

### Step 1: Run Database Migration
```bash
cd backend
node database/add-trial-support.js
```

**What it does:**
- Adds `trial_expires_at` column to users
- Adds `subscription_status` column to users
- Creates CHECK constraint for valid statuses
- Updates existing users with trial periods (30 days from signup)
- Users who signed up >30 days ago: status = 'expired'
- Users who signed up <30 days ago: status = 'trial'

### Step 2: Restart Backend Server
```bash
cd backend
npm run dev
```

### Step 3: Restart Frontend Server
```bash
cd frontend
npm run dev
```

## User Experience Flow

### New User Registration
1. User registers → `subscription_status = 'trial'`
2. `trial_expires_at` set to 30 days from now
3. User sees trial banner: "Free trial - 30 days remaining"
4. Full access to all features

### During Trial Period
1. Dashboard shows countdown: "Free trial - X days remaining"
2. "Subscribe" button in trial banner
3. All features accessible

### Trial Expiration
1. User tries to access bookings → 403 error
2. Paywall dialog appears automatically
3. Message: "Your CheckinHQ trial has ended. Subscribe to keep managing bookings."
4. Options: Subscribe Now or Logout
5. All booking/analytics API calls blocked

### After Subscription
1. Admin activates subscription via admin panel
2. `subscription_status` changed to 'active'
3. User regains full access immediately
4. No more trial banner

### Admin Users
- Admins bypass all subscription checks
- Can access everything regardless of trial status
- Can manage subscriptions for all users

## Admin Management Workflow

### View All Users
1. Navigate to `/admin/subscriptions`
2. See stats: Active Subscriptions, Active Trials, Expired
3. View table of all users with subscription info

### Activate Subscription
1. Find user in table
2. Click "Activate" button
3. Status changes from 'trial'/'expired' → 'active'
4. User immediately gains access

### Deactivate Subscription
1. Find active user
2. Click "Deactivate" button
3. Status changes to 'expired'
4. User loses access on next API call

## Payment Integration (TODO)

The current implementation includes placeholder UI for payments. To integrate:

### Stripe Integration
1. Add Stripe SDK to backend
2. Create `/api/subscription/checkout` endpoint
3. Update `PaywallDialog.vue` subscribe() method to redirect to Stripe
4. Add webhook handler for successful payments
5. Auto-activate subscription on payment success

### Mobile Money Integration
1. Create `/api/subscription/mobile-money-invoice` endpoint
2. Integrate with provider (MTN Mobile Money, Airtel Money, etc.)
3. Generate invoice with payment reference
4. Update UI to show payment instructions
5. Add webhook/polling for payment confirmation
6. Auto-activate on payment success

**Recommended approach:**
```javascript
// backend/routes/subscription.js
router.post('/checkout', authMiddleware, async (req, res) => {
  const { method } = req.body // 'stripe' or 'mobile-money'
  
  if (method === 'stripe') {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      line_items: [{
        price: 'price_monthly_10usd',
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${FRONTEND_URL}/dashboard?subscription=cancelled`
    })
    return res.json({ url: session.url })
  }
  
  if (method === 'mobile-money') {
    // Generate mobile money invoice
    const invoice = await mobileMoneyProvider.createInvoice({
      amount: 10,
      currency: 'UGX',
      phoneNumber: req.body.phoneNumber
    })
    return res.json({ invoice })
  }
})

// Webhook handler
router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET)
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    // Activate subscription for customer
    await activateSubscriptionByEmail(session.customer_email)
  }
  
  res.sendStatus(200)
})
```

## Security Considerations

1. **Middleware Order:** checkSubscription runs AFTER authMiddleware
2. **Admin Bypass:** Admins always have access (prevents lockout)
3. **Token-based:** Uses existing JWT authentication
4. **Client-side Protection:** Paywall dialog prevents UI usage
5. **Server-side Protection:** API returns 403 for unauthorized access
6. **No Data Leak:** 403 response doesn't reveal booking data

## Testing Checklist

### Manual Testing

**New User Trial:**
- [ ] Register new user
- [ ] Verify `trial_expires_at` is 30 days from now
- [ ] Check trial banner shows correct days remaining
- [ ] Confirm all features accessible
- [ ] Verify subscription status in API response

**Trial Expiration Simulation:**
```sql
-- Manually expire a trial user for testing
UPDATE users 
SET trial_expires_at = CURRENT_TIMESTAMP - INTERVAL '1 day',
    subscription_status = 'expired'
WHERE email = 'test@example.com';
```
- [ ] Try to access dashboard → Paywall should appear
- [ ] Verify API calls return 403
- [ ] Check error message is user-friendly

**Admin Activation:**
- [ ] Login as admin
- [ ] Navigate to `/admin/subscriptions`
- [ ] Find expired test user
- [ ] Click "Activate"
- [ ] Verify status changes to 'active'
- [ ] Login as test user
- [ ] Confirm full access restored

**Admin Deactivation:**
- [ ] Deactivate active user
- [ ] Verify user loses access immediately

### API Testing
```bash
# Get subscription status
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/subscription/status

# Try to access bookings with expired trial
curl -H "Authorization: Bearer EXPIRED_TOKEN" http://localhost:3000/api/bookings

# Admin: Activate subscription
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/subscription/activate/USER_ID

# Admin: Get all users
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/subscription/users
```

## Configuration

### Environment Variables
None required for basic trial system. For payments:
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
MOBILE_MONEY_API_KEY=xxx
MOBILE_MONEY_API_SECRET=xxx
```

### Trial Duration
To change trial period from 30 days:

**Backend:** `backend/models/User.js`
```javascript
// Change INTERVAL '30 days' to desired duration
CURRENT_TIMESTAMP + INTERVAL '7 days'  // 1 week trial
CURRENT_TIMESTAMP + INTERVAL '90 days' // 3 month trial
```

**Migration:** `backend/database/add-trial-support.js`
```javascript
// Update both occurrences of INTERVAL '30 days'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP 
DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days');
```

## Troubleshooting

### Issue: Trial not expiring correctly
**Check:**
```sql
SELECT email, trial_expires_at, subscription_status, 
       trial_expires_at < CURRENT_TIMESTAMP as should_be_expired
FROM users;
```

### Issue: Paywall not showing
**Debug:**
1. Check browser console for errors
2. Verify `authStore.showPaywall` state
3. Check API response includes `trialExpired: true`
4. Confirm PaywallDialog component is imported

### Issue: Admin can't access subscription panel
**Check:**
```sql
SELECT email, is_admin FROM users WHERE email = 'admin@example.com';
```
Ensure `is_admin = true`

### Issue: User still has access after deactivation
**Clear cached data:**
```javascript
// In browser console
localStorage.clear()
// Then refresh page and re-login
```

## Future Enhancements

1. **Email Notifications**
   - 7 days before trial expires: "Your trial is ending soon"
   - Day of expiration: "Your trial has ended"
   - Payment success: "Welcome to CheckinHQ Pro!"

2. **Grace Period**
   - Allow 3 days past expiration before hard lock
   - Show urgent banner during grace period

3. **Analytics**
   - Track trial conversion rate
   - Monitor subscription churn
   - Revenue dashboard

4. **Tiered Plans**
   - Basic: $10/month (current)
   - Pro: $25/month (advanced analytics)
   - Enterprise: Custom pricing

5. **Annual Subscriptions**
   - Offer discount for yearly payment
   - Track subscription end date separately from trial

## Summary

✅ **Database:** trial_expires_at, subscription_status columns added
✅ **Backend:** checkSubscription middleware protecting all booking/analytics routes
✅ **Frontend:** Paywall dialog, trial banner, subscription management panel
✅ **Admin Tools:** Full user subscription management interface
✅ **API:** Complete subscription CRUD endpoints

**Ready for production** with payment integration!

Next step: Integrate Stripe or mobile money provider for actual billing.
