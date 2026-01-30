# Railway Database Setup - Fix 502 Errors

## Problem
Your backend is getting 502 errors because it has no database connected.

## Solution: Add PostgreSQL Database

### Step 1: Add Database to Railway Project
1. Go to https://railway.app/dashboard
2. Click on your **CheckinHQ backend project**
3. Click **"+ New"** button (top right)
4. Select **"Database"**
5. Choose **"Add PostgreSQL"**
6. Wait for it to provision (takes ~30 seconds)

### Step 2: Connect Database to Backend
Railway should automatically:
- Create a PostgreSQL service
- Add `DATABASE_URL` variable to your backend
- Link them together

### Step 3: Verify Connection
1. Click on your **backend service**
2. Go to **"Variables"** tab
3. You should now see **`DATABASE_URL`** 
   - If you see it, perfect! ✅
   - If not, continue to Step 4

### Step 4: Manual Connection (if needed)
1. Click on the **PostgreSQL service**
2. Go to **"Variables"** tab
3. Copy the **`DATABASE_URL`** value
4. Go back to your **backend service**
5. Click **"Variables"** tab
6. Click **"+ New Variable"**
7. Name: `DATABASE_URL`
8. Value: Paste the URL you copied
9. Click **"Add"**

### Step 5: Run Database Migration
Once DATABASE_URL is set in your backend variables:

1. In Railway, click your **backend service**
2. Go to **"Settings"** tab
3. Scroll to **"Deployed Service"** section
4. Click **"Open in Terminal"** or find the terminal icon
5. In the terminal, run:
```bash
node database/add-trial-support.js
```

**OR** use the Railway CLI locally:
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Select your backend service
# Then run migration
railway run node backend/database/add-trial-support.js
```

### Step 6: Redeploy Backend
1. In Railway dashboard, click your backend service
2. Click **"Deployments"** tab
3. Click **"Deploy"** button to trigger a new deployment
4. Wait for it to complete (~2-3 minutes)

### Step 7: Test It Works
Visit your Railway backend URL + `/health`:
```
https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-01-30T..."}
```

## Alternative: Use External Database

If Railway's free tier database isn't enough, you can use:

### Option A: Neon (Free PostgreSQL)
1. Go to https://neon.tech
2. Create free account
3. Create new database
4. Copy connection string
5. Add to Railway backend variables as `DATABASE_URL`

### Option B: Supabase (Free PostgreSQL)
1. Go to https://supabase.com
2. Create free project
3. Go to Settings → Database
4. Copy "Connection string" (Transaction mode)
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Add to Railway backend variables as `DATABASE_URL`

## Verify Everything Works

After adding database and running migration:

1. **Test registration:**
   - Try registering a new user on your live site
   - Should succeed without 502 error

2. **Check variables:**
   ```
   Railway Backend Variables should have:
   - DATABASE_URL ✅
   - JWT_SECRET ✅
   - PORT (optional)
   - NODE_ENV (optional)
   - FRONTEND_URL ✅
   ```

3. **Check logs:**
   - Railway → Backend → Deployments
   - Click latest deployment
   - Look for "✓ Database connected"
   - No errors about database connection

## Still Getting 502 Errors?

Check Railway deployment logs for specific errors:
1. Railway dashboard → Backend service
2. Click "Deployments" tab
3. Click latest deployment
4. Scroll through logs to find the error
5. Look for lines starting with "Error:" or "Failed:"

Common issues:
- Missing `DATABASE_URL` variable
- Wrong database URL format
- Database migrations not run
- Database server offline
- IP whitelist blocking connection (should be disabled for Railway)

---

**TL;DR:**
1. Add PostgreSQL database to Railway project
2. Verify `DATABASE_URL` is in backend variables
3. Run migration: `node database/add-trial-support.js`
4. Redeploy backend
5. Test `/health` endpoint
