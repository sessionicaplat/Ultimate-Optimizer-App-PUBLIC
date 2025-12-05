# Render Deployment Guide

This guide walks you through deploying the Ultimate Optimizer App to Render.com.

## Prerequisites

- GitHub account with this repository pushed
- Render.com account (sign up at https://render.com)
- The code must be in a GitHub repository

## Step 1: Create Render Web Service

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com
   - Click "New +" button in the top right
   - Select "Web Service"

2. **Connect GitHub Repository**
   - Click "Connect account" if you haven't connected GitHub yet
   - Select your repository: `ultimate-optimizer-app`
   - Click "Connect"

3. **Configure Web Service Settings**

   Fill in the following settings:

   - **Name**: `ultimate-optimizer-app`
   - **Region**: `Oregon (US West)` (or your preferred region)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (monorepo root)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```
     npm install && npm run build
     ```
   - **Start Command**: 
     ```
     node backend/dist/server.js
     ```
   - **Instance Type**: `Starter` ($7/month)

4. **Configure Health Check**
   - Expand "Advanced" section
   - **Health Check Path**: `/health`
   - **Health Check Interval**: 30 seconds

5. **Set Node.js Version**
   - In "Advanced" section, add environment variable:
   - **Key**: `NODE_VERSION`
   - **Value**: `18`

## Step 2: Configure Environment Variables

In the "Environment" section, add the following environment variables:

### Required Variables

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | `3000` | Server port (Render will override with internal port) |
| `WIX_APP_ID` | `PLACEHOLDER_APP_ID` | Update after creating Wix app |
| `WIX_APP_SECRET` | `PLACEHOLDER_APP_SECRET` | Update after creating Wix app |

### Variables to Add Later

These will be added in later phases:

- `DATABASE_URL` - Added automatically when PostgreSQL is connected (Phase 2)
- `OPENAI_API_KEY` - Add when implementing AI features (Phase 4)
- `WIX_REDIRECT_URI` - Set to your Render URL + `/oauth/callback` (Phase 2)

## Step 3: Deploy

1. Click "Create Web Service" button at the bottom
2. Render will automatically:
   - Clone your repository
   - Run `npm install && npm run build`
   - Start the server with `node backend/dist/server.js`
   - Assign a public URL (e.g., `https://ultimate-optimizer-app.onrender.com`)

3. **Monitor Deployment**
   - Watch the build logs in real-time
   - Wait for "Live" status (usually 2-5 minutes)

## Step 4: Verify Deployment

Once deployment is complete:

1. **Test Health Endpoint**
   ```bash
   curl https://your-app-name.onrender.com/health
   ```
   Expected response:
   ```json
   {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
   ```

2. **Access Dashboard**
   - Open browser to: `https://your-app-name.onrender.com/dashboard`
   - You should see the React dashboard UI
   - Test navigation between pages:
     - Product Optimizer
     - Ongoing Queue
     - Completed Jobs
     - Billing & Credits

3. **Test API Endpoints**
   ```bash
   # Test products endpoint
   curl https://your-app-name.onrender.com/api/products
   
   # Test collections endpoint
   curl https://your-app-name.onrender.com/api/collections
   
   # Test me endpoint
   curl https://your-app-name.onrender.com/api/me
   ```

## Troubleshooting

### Build Fails

**Issue**: Build command fails with "npm ci requires package-lock.json"
- **Solution**: Use `npm install && npm run build` as the build command
- **Solution**: Ensure `.gitignore` does NOT include `package-lock.json`
- **Solution**: Commit `package-lock.json` to your repository

**Issue**: Build command fails with module errors
- **Solution**: Check that all dependencies are in `package.json`
- **Solution**: Run `npm install` locally to verify dependencies

**Issue**: TypeScript compilation errors
- **Solution**: Run `npm run build` locally first to catch errors
- **Solution**: Check `tsconfig.json` settings

### Server Won't Start

**Issue**: "Cannot find module" errors
- **Solution**: Verify build command includes both backend and frontend builds
- **Solution**: Check that `dist/` folders are created during build

**Issue**: Port binding errors
- **Solution**: Render automatically sets PORT - don't hardcode it
- **Solution**: Use `process.env.PORT || 3000` in server code

### Health Check Fails

**Issue**: Service shows "Unhealthy"
- **Solution**: Verify `/health` endpoint returns 200 status
- **Solution**: Check server logs for startup errors
- **Solution**: Ensure server is listening on `0.0.0.0`, not `localhost`

### Dashboard Not Loading

**Issue**: 404 errors for dashboard
- **Solution**: Verify frontend build created `dist/` folder
- **Solution**: Check static file serving path in `server.ts`
- **Solution**: Ensure catch-all route serves `index.html`

## Auto-Deploy Configuration

Render automatically deploys when you push to the `main` branch:

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Render detects the push and starts a new deployment
4. Monitor progress in Render dashboard

## Render Dashboard Features

- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and request metrics
- **Shell**: Access server shell for debugging
- **Rollback**: Revert to previous deployments
- **Manual Deploy**: Trigger deployment without pushing code

## Cost Estimate

**Current Setup** (Phase 1):
- Web Service (Starter): $7/month
- **Total**: $7/month

**After Phase 2** (with PostgreSQL):
- Web Service (Starter): $7/month
- PostgreSQL (Starter): $7/month
- **Total**: $14/month

## Next Steps

After successful deployment:

1. ✅ Note your Render URL (e.g., `https://ultimate-optimizer-app.onrender.com`)
2. ⏭️ Proceed to Phase 2: Database & Authentication
3. ⏭️ Create Wix app and update `WIX_APP_ID` and `WIX_APP_SECRET`
4. ⏭️ Add PostgreSQL database in Render
5. ⏭️ Configure OAuth callback URL

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Project Issues: [Your GitHub Issues URL]
