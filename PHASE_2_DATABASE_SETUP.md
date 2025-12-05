# Phase 2: Database Setup - Quick Start Guide

This guide provides a streamlined path to complete Task 6: Configure Render PostgreSQL.

## Prerequisites

✅ Phase 1 completed:
- Web Service deployed on Render
- Dashboard UI accessible
- Health endpoint working

## Quick Setup (15 minutes)

### Step 1: Create PostgreSQL Database (5 min)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - Name: `ultimate-optimizer-db`
   - Region: **Same as your Web Service** (e.g., Oregon US West)
   - Version: 15
   - Plan: Starter
4. Click **"Create Database"**
5. Wait for "Available" status
6. **Copy the Internal Database URL** (starts with `postgresql://`)

### Step 2: Connect Database to Web Service (3 min)

1. Go to your Web Service dashboard
2. Click **"Environment"** tab
3. Scroll to **"Add from Database"**
4. Select `ultimate-optimizer-db`
5. Click **"Add Connection"**
6. Verify `DATABASE_URL` appears in environment variables

### Step 3: Update Build Command (2 min)

1. Stay in Web Service dashboard
2. Click **"Settings"** tab
3. Find **"Build Command"**
4. Update to:
   ```bash
   npm install && npm run build && cd backend && npm run migrate
   ```
5. Click **"Save Changes"**

### Step 4: Deploy and Run Migrations (5 min)

1. Click **"Manual Deploy"** button
2. Select **"Deploy latest commit"**
3. Click **"Deploy"**
4. Watch logs for migration output:
   ```
   === 1730000000000_initial-schema: migrating =====
   === 1730000000000_initial-schema: migrated (0.234s) =====
   ```
5. Wait for **"Live"** status

### Step 5: Verify Setup (2 min)

1. Click **"Shell"** tab in Web Service
2. Run:
   ```bash
   cd backend
   npm run db:test
   ```
3. Look for success messages:
   ```
   ✓ Connection successful!
   ✓ Migrations table exists
   ✓ Applied migrations: 1
   ✓ Application tables found: 5
   ✓ Plans seeded: 4
   ```

## Success Criteria

All must be true:
- ✅ Database status: "Available"
- ✅ DATABASE_URL environment variable set
- ✅ Migrations ran without errors
- ✅ 6 tables created (including pgmigrations)
- ✅ 4 plans seeded
- ✅ Health check passes

## What Was Created

### Database Tables
1. **plans** - 4 subscription tiers (Free, Starter, Pro, Scale)
2. **app_instances** - Wix app installations
3. **jobs** - Optimization job records
4. **job_items** - Individual optimization tasks
5. **publish_logs** - Audit trail
6. **pgmigrations** - Migration history

### Indexes
9 performance indexes for efficient queries

### Seed Data
- Free: 100 credits/month, $0
- Starter: 1,000 credits/month, $9
- Pro: 5,000 credits/month, $19
- Scale: 25,000 credits/month, $49

## Troubleshooting

### Migration Fails
**Error**: Connection refused
- Wait 5 minutes after database creation
- Verify DATABASE_URL is set
- Check database status is "Available"

**Error**: Permission denied
- Verify using Internal Database URL
- Check database and Web Service in same region

### DATABASE_URL Not Found
- Verify environment variable in Web Service
- Try manual addition if automatic fails
- Restart Web Service after adding

### Need Help?
See detailed guides:
- `RENDER_POSTGRESQL_SETUP.md` - Comprehensive setup
- `RENDER_POSTGRESQL_CHECKLIST.md` - Step-by-step checklist
- `backend/DATABASE_SETUP.md` - Database schema details

## Cost Update

**Before**: $7/month (Web Service only)
**After**: $14/month (Web Service + PostgreSQL)

## Next Steps

✅ **Task 6 Complete!**

Ready for:
- **Task 7**: Implement Wix instance authentication
- **Task 8**: Register Wix app and configure extensions

## Quick Reference

### Useful Commands

**Test database connection**:
```bash
cd backend && npm run db:test
```

**View tables** (PostgreSQL shell):
```sql
\dt
```

**View plans** (PostgreSQL shell):
```sql
SELECT * FROM plans;
```

**Check migration history** (PostgreSQL shell):
```sql
SELECT * FROM pgmigrations;
```

### Important URLs

- Render Dashboard: https://dashboard.render.com
- Your Web Service: `https://your-app.onrender.com`
- Health Check: `https://your-app.onrender.com/health`

### Environment Variables

Current configuration:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...  # Auto-set
WIX_APP_ID=PLACEHOLDER_APP_ID
WIX_APP_SECRET=PLACEHOLDER_APP_SECRET
```

## Documentation

- ✅ `RENDER_POSTGRESQL_SETUP.md` - Detailed setup guide
- ✅ `RENDER_POSTGRESQL_CHECKLIST.md` - Interactive checklist
- ✅ `TASK_6_SUMMARY.md` - Implementation summary
- ✅ `backend/DATABASE_SETUP.md` - Schema documentation
- ✅ `DEPLOYMENT_CHECKLIST.md` - Updated with Phase 2

**Task 6 is complete! Database infrastructure is ready for the application.**
