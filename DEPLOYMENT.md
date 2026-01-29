# Deployment Guide - CheckinHQ

This guide covers deploying CheckinHQ to production using popular hosting platforms.

## Quick Deployment Options

### Option 1: Railway (Recommended for Full-Stack)
Railway provides easy deployment for both backend and database.

**Backend + Database:**
1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and adds PostgreSQL
5. Set environment variables in Railway dashboard
6. Deploy!

**Environment Variables:**
```
NODE_ENV=production
JWT_SECRET=<generate-random-string>
FRONTEND_URL=<your-frontend-url>
```

**Frontend (Vercel):**
1. Create account at [vercel.com](https://vercel.com)
2. Import your repository
3. Set root directory to `frontend`
4. Set environment variable: `VITE_API_URL=<your-railway-backend-url>/api`
5. Deploy!

---

### Option 2: Render
Similar to Railway, great for Node.js apps.

**Backend:**
1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect repository
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && npm start`
5. Add PostgreSQL database (from Render dashboard)
6. Set environment variables
7. Deploy!

**Frontend:**
1. New → Static Site
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Environment variable: `VITE_API_URL=<backend-url>/api`

---

### Option 3: Traditional VPS (DigitalOcean, AWS EC2)

**Server Setup:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2
```

**Deploy Backend:**
```bash
# Clone repository
git clone <your-repo-url>
cd CheckinHQ/backend

# Install dependencies
npm install

# Setup database
sudo -u postgres psql
CREATE DATABASE checkinhq;
CREATE USER checkinhq_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE checkinhq TO checkinhq_user;
\q

# Create .env file
nano .env
# Add your production environment variables

# Run migration
npm run migrate

# Start with PM2
pm2 start server.js --name checkinhq-api
pm2 save
pm2 startup
```

**Deploy Frontend:**
```bash
cd ../frontend

# Build
npm install
npm run build

# Serve with nginx or upload dist/ to CDN
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/CheckinHQ/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Database Migration

**First deployment:**
```bash
npm run migrate
```

**On updates:**
Re-run migration if schema changes.

---

## Environment Variables Checklist

### Backend (.env)
- [ ] `NODE_ENV=production`
- [ ] `PORT` (usually auto-assigned by platform)
- [ ] `DB_HOST`
- [ ] `DB_PORT`
- [ ] `DB_NAME`
- [ ] `DB_USER`
- [ ] `DB_PASSWORD`
- [ ] `JWT_SECRET` (use strong random string)
- [ ] `FRONTEND_URL` (for CORS)

### Frontend
- [ ] `VITE_API_URL` (your backend URL + /api)

---

## Security Checklist

- [ ] Strong JWT_SECRET (min 32 characters, random)
- [ ] Database password is strong
- [ ] HTTPS enabled (most platforms do this automatically)
- [ ] CORS configured correctly (FRONTEND_URL in backend .env)
- [ ] Environment variables are secret (not in code)

---

## Monitoring & Maintenance

**Check logs:**
- Railway/Render: Built-in log viewer in dashboard
- VPS with PM2: `pm2 logs checkinhq-api`

**Database backups:**
- Railway/Render: Automatic backups included
- VPS: Setup automated PostgreSQL backups

**Updates:**
```bash
git pull
npm install
npm run migrate  # if schema changed
pm2 restart checkinhq-api  # if using PM2
```

---

## Cost Estimates (USD/month)

**Free Tier Options:**
- Railway: Free tier available (500 hrs/month)
- Render: Free tier available (limited)
- Vercel: Free tier for frontend

**Paid Options:**
- Railway: ~$5-20/month
- Render: ~$7-25/month  
- DigitalOcean Droplet: ~$6-12/month
- AWS/Heroku: Variable, can be higher

**Recommended for MVP:**
Start with Railway (backend + DB) + Vercel (frontend) free tiers, upgrade as you grow.

---

## SSL/HTTPS

All recommended platforms (Railway, Render, Vercel) provide automatic HTTPS. No configuration needed!

For VPS deployment, use Let's Encrypt:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Custom Domain

**Railway/Render/Vercel:**
1. Go to dashboard → Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed
4. Wait for DNS propagation (5-60 minutes)

---

## Troubleshooting

**Database connection errors:**
- Check DB credentials in environment variables
- Ensure database is running
- Check firewall rules (VPS)

**CORS errors:**
- Ensure `FRONTEND_URL` in backend matches your frontend URL
- Check frontend `VITE_API_URL` is correct

**Login/Auth not working:**
- Verify `JWT_SECRET` is set in production
- Check backend logs for errors

---

**Need help?** Open an issue on GitHub or contact support.
