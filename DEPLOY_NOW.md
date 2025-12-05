# Deploy Now - Quick Start Guide

This guide helps you deploy the Ultimate Optimizer App to Render right now.

## Prerequisites Checklist

Before you begin, ensure:

- [ ] You have a GitHub account
- [ ] You have a Render account (sign up at https://render.com)
- [ ] This code is in a GitHub repository
- [ ] You've tested the app locally: `npm run build && npm start`

## Step 1: Push Code to GitHub

If you haven't already pushed your code:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Render deployment"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/ultimate-optimizer-app.git

# Push to main branch
git push -u origin main
```

**✅ Checkpoint**: Verify your code is visible on GitHub

## Step 2: Create Render Web Service

### 2.1 Connect to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** button (top right)
3. Select **"Web Service"**
4. Click **"Connect account"** to link GitHub (if not already connected)
5. Find and select your repository: `ultimate-optimizer-app`
6. Click **"Connect"**

### 2.2 Configure Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `ultimate-optimizer-app` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node backend/dist/server.js` |
| **Instance Type** | `Starter` |

### 2.3 Advanced Settings

Click **"Advanced"** and configure:

**Health Check:**
- Path: `/health`
- Interval: 30 seconds

**Environment Variables:**

Click "Add Environment Variable" for each:

```
NODE_ENV=production
PORT=3000
NODE_VERSION=18
WIX_APP_ID=PLACEHOLDER_APP_ID
WIX_APP_SECRET=PLACEHOLDER_APP_SECRET
```

**✅ Checkpoint**: All settings configured

## Step 3: Deploy

1. Click **"Create Web Service"** at the bottom
2. Render will start building your app
3. Watch the logs in real-time

**Expected build time**: 2-5 minutes

### Build Process

You should see:
```
==> Cloning from https://github.com/...
==> Running build command: npm install && npm run build
==> Installing dependencies...
==> Building backend...
==> Building frontend...
==> Build successful!
==> Starting service: node backend/dist/server.js
==> Server running on port 3000
==> Your service is live at https://ultimate-optimizer-app.onrender.com
```

**✅ Checkpoint**: Status shows "Live" (green)

## Step 4: Verify Deployment

### 4.1 Note Your URL

Render assigns a URL like:
```
https://ultimate-optimizer-app.onrender.com
```

Copy this URL - you'll need it!

### 4.2 Automated Verification

Run the verification script:

**On macOS/Linux:**
```bash
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh https://your-app-name.onrender.com
```

**On Windows (PowerShell):**
```powershell
.\scripts\verify-deployment.ps1 https://your-app-name.onrender.com
```

Expected output:
```
🚀 Verifying deployment at: https://your-app-name.onrender.com

📋 Testing API Endpoints
========================
Testing Health endpoint... ✅ PASS (HTTP 200)
Testing Health JSON response... ✅ PASS (Valid JSON)
Testing Products API... ✅ PASS (Valid JSON)
Testing Collections API... ✅ PASS (Valid JSON)
Testing Instance info API... ✅ PASS (Valid JSON)
Testing Jobs list API... ✅ PASS (Valid JSON)

🎨 Testing Dashboard Pages
===========================
Testing Dashboard page... ✅ PASS (HTTP 200)
Testing Root redirect... ✅ PASS (HTTP 200)

📊 Summary
==========
✅ All tests passed!
```

### 4.3 Manual Verification

Open your browser and test:

1. **Health Endpoint**
   - URL: `https://your-app-name.onrender.com/health`
   - Expected: `{"status":"ok","timestamp":"..."}`

2. **Dashboard**
   - URL: `https://your-app-name.onrender.com/dashboard`
   - Expected: React dashboard loads

3. **Test Navigation**
   - Click "Product Optimizer" → Page loads
   - Click "Ongoing Queue" → Page loads
   - Click "Completed Jobs" → Page loads
   - Click "Billing & Credits" → Page loads

4. **Check Browser Console**
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Should see no red errors

**✅ Checkpoint**: All pages load without errors

## Step 5: Test API Endpoints

Use curl or your browser:

```bash
# Test products endpoint
curl https://your-app-name.onrender.com/api/products

# Test collections endpoint
curl https://your-app-name.onrender.com/api/collections

# Test me endpoint
curl https://your-app-name.onrender.com/api/me

# Test jobs endpoint
curl https://your-app-name.onrender.com/api/jobs
```

All should return JSON with mock data.

**✅ Checkpoint**: All API endpoints return data

## Troubleshooting

### Build Fails

**Error**: "npm ci requires package-lock.json"
```bash
# Solution 1: Change build command in Render to use npm install
# Build Command: npm install && npm run build

# Solution 2: Ensure package-lock.json is NOT in .gitignore
# Remove package-lock.json from .gitignore, then:
git add package-lock.json
git commit -m "Add package-lock.json for Render deployment"
git push
```

**Error**: "Cannot find module"
```bash
# Solution: Verify all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

**Error**: TypeScript compilation errors
```bash
# Solution: Fix errors locally first
npm run build
# Fix any errors, then commit and push
```

### Service Won't Start

**Error**: "Port already in use"
- This shouldn't happen on Render (they manage ports)
- Check that you're using `process.env.PORT || 3000`

**Error**: "Cannot find dist/server.js"
```bash
# Solution: Verify build command includes backend build
# Build command should be: npm install && npm run build
```

### Health Check Fails

**Error**: Service shows "Unhealthy"
1. Check Render logs for errors
2. Verify `/health` endpoint returns 200
3. Ensure server starts successfully

### Dashboard 404

**Error**: Dashboard page not found
1. Verify frontend build succeeded
2. Check `frontend/dist` folder was created
3. Verify static file serving in `server.ts`

### API Returns Errors

**Error**: API endpoints return 500
1. Check Render logs for stack traces
2. Verify environment variables are set
3. Test endpoints locally first

## Success Criteria

You've successfully deployed when:

- ✅ Render status shows "Live"
- ✅ Health endpoint returns 200
- ✅ Dashboard loads in browser
- ✅ All 4 pages render correctly
- ✅ Navigation works between pages
- ✅ API endpoints return mock data
- ✅ No console errors in browser
- ✅ Verification script passes all tests

## What's Working Now

At this stage (Phase 1), you have:

- ✅ Fully functional dashboard UI
- ✅ All pages rendering correctly
- ✅ Navigation working
- ✅ API returning mock data
- ✅ Health monitoring
- ✅ Auto-deploy on push to main

## What's NOT Working Yet

These will be added in later phases:

- ❌ Real Wix authentication (Phase 2)
- ❌ Database persistence (Phase 2)
- ❌ Real product data from Wix (Phase 3)
- ❌ Job processing (Phase 4)
- ❌ OpenAI integration (Phase 4)
- ❌ Publishing to Wix (Phase 5)
- ❌ Billing integration (Phase 5)

## Next Steps

1. **Document Your Deployment**
   - Save your Render URL
   - Note the deployment date
   - Share with your team

2. **Test Auto-Deploy**
   ```bash
   # Make a small change
   echo "# Deployment test" >> README.md
   git add README.md
   git commit -m "Test auto-deploy"
   git push
   
   # Watch Render dashboard - should auto-deploy
   ```

3. **Proceed to Phase 2**
   - Set up PostgreSQL database
   - Implement Wix authentication
   - Create real Wix app

## Support

- **Render Issues**: https://render.com/docs
- **Build Errors**: Check Render logs
- **App Issues**: Check browser console
- **Questions**: Open GitHub issue

## Congratulations! 🎉

You've successfully deployed the Ultimate Optimizer App to Render!

Your app is now live at: `https://your-app-name.onrender.com`

**Task 4 Complete** ✅
