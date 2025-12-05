# Task 6: Configure Render PostgreSQL - User Instructions

## What This Task Does

Task 6 sets up the PostgreSQL database on Render and runs migrations to create all the tables, indexes, and seed data needed for the Ultimate Optimizer App.

## Prerequisites

Before starting, ensure:
- ✅ Phase 1 is complete (Web Service deployed)
- ✅ You have access to Render Dashboard
- ✅ Your Web Service is running and accessible

## Time Required

⏱️ **15 minutes total**
- 5 min: Create database
- 3 min: Connect to Web Service
- 2 min: Update build command
- 5 min: Deploy and verify

## Step-by-Step Instructions

### Task 6.1: Create Render PostgreSQL Database

#### 1. Create the Database

1. Log in to https://dashboard.render.com
2. Click the **"New +"** button (top right)
3. Select **"PostgreSQL"**

#### 2. Configure Database Settings

Fill in these settings:

| Setting | Value | Notes |
|---------|-------|-------|
| **Name** | `ultimate-optimizer-db` | Database service name |
| **Database** | `ultimate_optimizer` | Auto-generated, can customize |
| **User** | `ultimate_optimizer_user` | Auto-generated, can customize |
| **Region** | Same as Web Service | **CRITICAL**: Must match! |
| **PostgreSQL Version** | `15` | Or latest available |
| **Instance Type** | `Starter` | $7/month |

**Important**: The region MUST match your Web Service region (e.g., if your Web Service is in "Oregon US West", select the same).

#### 3. Configure Backups

In the "Advanced" section:
- ✅ **Automatic Backups**: Enabled (default)
- **Backup Retention**: 7 days (default for Starter)

#### 4. Create Database

1. Review your settings
2. Click **"Create Database"**
3. Wait 2-3 minutes for provisioning
4. Status will change to **"Available"** (green)

#### 5. Copy Connection URL

Once created:
1. You'll see the database dashboard
2. Find **"Internal Database URL"**
3. **Copy this URL** (starts with `postgresql://`)
4. Save it temporarily (you'll need it in the next step)

**Example URL format**:
```
postgresql://ultimate_optimizer_user:password123@dpg-abc123/ultimate_optimizer
```

✅ **Task 6.1 Complete!**

---

### Task 6.2: Run Database Migrations

#### 1. Connect Database to Web Service

**Option A: Automatic Connection (Recommended)**

1. Go to your **Web Service** dashboard (not the database)
2. Click the **"Environment"** tab
3. Scroll down to **"Add from Database"** section
4. Select `ultimate-optimizer-db` from the dropdown
5. Click **"Add Connection"**
6. Verify `DATABASE_URL` appears in the environment variables list

**Option B: Manual Connection (If Option A doesn't work)**

1. Go to your **Web Service** dashboard
2. Click the **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Enter:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL you copied
5. Click **"Save Changes"**

#### 2. Update Build Command

1. Stay in your Web Service dashboard
2. Click the **"Settings"** tab
3. Find the **"Build Command"** field
4. Update it to:
   ```bash
   npm install && npm run build && cd backend && npm run migrate
   ```
5. Click **"Save Changes"**

This ensures migrations run automatically on every deployment.

#### 3. Deploy and Run Migrations

**Option A: Manual Deploy (Recommended for first time)**

1. In your Web Service dashboard
2. Click the **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Click **"Deploy"**

**Option B: Automatic Deploy**

1. Make any small change to your code (e.g., update a comment)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Configure PostgreSQL"
   git push origin main
   ```
3. Render will automatically deploy

#### 4. Monitor Migration Execution

1. Watch the deployment logs in real-time
2. Look for migration output (scroll through the logs):
   ```
   > backend@1.0.0 migrate
   > node-pg-migrate up
   
   === 1730000000000_initial-schema: migrating =====
   === 1730000000000_initial-schema: migrated (0.234s) =====
   ```
3. Wait for **"Live"** status (green indicator)
4. Verify no error messages

#### 5. Verify Database Setup

**From Web Service Shell**:

1. In your Web Service dashboard
2. Click the **"Shell"** tab
3. Run this command:
   ```bash
   cd backend
   npm run db:test
   ```

**Expected Output**:
```
✓ Connection successful!
✓ Migrations table exists
✓ Applied migrations: 1
✓ Application tables found:
  - app_instances
  - job_items
  - jobs
  - plans
  - publish_logs
✓ Plans seeded:
  - Free (free): 100 credits/month
  - Starter (starter): 1000 credits/month
  - Pro (pro): 5000 credits/month
  - Scale (scale): 25000 credits/month
```

If you see all checkmarks (✓), everything is working correctly!

**Optional: Verify via PostgreSQL Shell**:

1. Go to your **PostgreSQL database** dashboard
2. Click the **"Shell"** tab
3. Run:
   ```sql
   \dt
   ```
4. You should see 6 tables listed
5. Run:
   ```sql
   SELECT * FROM plans;
   ```
6. You should see 4 subscription plans

✅ **Task 6.2 Complete!**

---

## Success Checklist

Verify all items are complete:

- [ ] PostgreSQL database created on Render
- [ ] Database status shows "Available"
- [ ] DATABASE_URL environment variable set in Web Service
- [ ] Build command updated to include migrations
- [ ] Deployment completed successfully
- [ ] Migration output visible in logs
- [ ] `npm run db:test` shows all checkmarks
- [ ] 6 tables created (app_instances, jobs, job_items, plans, publish_logs, pgmigrations)
- [ ] 4 plans seeded (Free, Starter, Pro, Scale)
- [ ] Health check still passes

## What Was Created

### Database Tables
1. **plans** - Subscription tiers (4 rows)
2. **app_instances** - Wix app installations
3. **jobs** - Optimization job records
4. **job_items** - Individual optimization tasks
5. **publish_logs** - Audit trail for published changes
6. **pgmigrations** - Migration history

### Subscription Plans
- **Free**: 100 credits/month, $0
- **Starter**: 1,000 credits/month, $9
- **Pro**: 5,000 credits/month, $19
- **Scale**: 25,000 credits/month, $49

### Performance Indexes
9 indexes created for efficient database queries

## Troubleshooting

### Problem: "Connection refused" during migration

**Solution**:
1. Wait 5 minutes after database creation (it may still be initializing)
2. Verify DATABASE_URL is set in Web Service environment variables
3. Check database status is "Available" (not "Creating")
4. Ensure database and Web Service are in the same region

### Problem: "Permission denied" errors

**Solution**:
1. Verify you're using the Internal Database URL (not External)
2. Check the URL includes the correct username
3. Ensure database and Web Service are in the same Render account

### Problem: "Table already exists" errors

**Solution**:
1. Migrations may have partially run
2. From Web Service shell, run:
   ```bash
   cd backend
   npm run migrate:down
   npm run migrate
   ```

### Problem: DATABASE_URL not found

**Solution**:
1. Verify the environment variable is set (check spelling: `DATABASE_URL`)
2. Try manual addition if automatic connection didn't work
3. Restart Web Service after adding the variable
4. Redeploy the application

### Problem: Migration doesn't run during deployment

**Solution**:
1. Verify build command includes `&& cd backend && npm run migrate`
2. Check deployment logs for any errors
3. Try running migration manually from Web Service shell:
   ```bash
   cd backend
   npm run migrate
   ```

## Cost Update

**Before Task 6**: $7/month (Web Service only)
**After Task 6**: $14/month (Web Service + PostgreSQL)

## Documentation

For more detailed information, see:

- **Quick Start**: `PHASE_2_DATABASE_SETUP.md` (15-minute guide)
- **Comprehensive Guide**: `RENDER_POSTGRESQL_SETUP.md` (detailed setup)
- **Interactive Checklist**: `RENDER_POSTGRESQL_CHECKLIST.md` (step-by-step)
- **Schema Details**: `backend/DATABASE_SETUP.md` (database documentation)
- **Task Summary**: `TASK_6_SUMMARY.md` (implementation details)

## Next Steps

After completing Task 6:

✅ **Database infrastructure is ready!**

Next tasks:
- **Task 7**: Implement Wix instance authentication
- **Task 8**: Register Wix app and configure extensions

## Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review the detailed guides in the documentation
3. Check Render logs for specific error messages
4. Verify all environment variables are set correctly
5. Ensure database and Web Service are in the same region

## Support Resources

- **Render Documentation**: https://render.com/docs/databases
- **Render Support**: https://render.com/support
- **Render Community**: https://community.render.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Congratulations! Task 6 is complete. Your database is configured and ready for the application to use.**
