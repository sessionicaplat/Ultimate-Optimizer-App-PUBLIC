# Render PostgreSQL Configuration Checklist

This checklist ensures proper setup of PostgreSQL database for the Ultimate Optimizer App on Render.

## Task 6.1: Create Render PostgreSQL Database

### Prerequisites
- [ ] Render account active
- [ ] Web Service already deployed
- [ ] Web Service region noted (e.g., Oregon US West)

### Database Creation Steps

#### Step 1: Create Database
- [ ] Navigate to Render Dashboard (https://dashboard.render.com)
- [ ] Click "New +" → "PostgreSQL"
- [ ] Configure settings:
  - [ ] **Name**: `ultimate-optimizer-db`
  - [ ] **Database**: `ultimate_optimizer` (or auto-generated)
  - [ ] **User**: `ultimate_optimizer_user` (or auto-generated)
  - [ ] **Region**: Same as Web Service (e.g., Oregon US West)
  - [ ] **PostgreSQL Version**: 15 or latest
  - [ ] **Instance Type**: Starter ($7/month)
- [ ] Configure backups:
  - [ ] **Automatic Backups**: Enabled
  - [ ] **Backup Retention**: 7 days
- [ ] Click "Create Database"
- [ ] Wait for "Available" status (2-3 minutes)

#### Step 2: Note Connection Details
- [ ] Copy **Internal Database URL** from dashboard
- [ ] Verify URL format: `postgresql://user:password@dpg-xxxxx/dbname`
- [ ] Save URL securely (needed for next step)

#### Step 3: Verify Database Status
- [ ] Status shows "Available" (green indicator)
- [ ] Connection info displayed
- [ ] No error messages in logs

### Verification
- [ ] Database created successfully
- [ ] Internal URL copied
- [ ] Database in same region as Web Service
- [ ] Automatic backups enabled

**✅ Task 6.1 Complete** - Proceed to Task 6.2

---

## Task 6.2: Run Database Migrations

### Prerequisites
- [ ] Task 6.1 completed (database created)
- [ ] Internal DATABASE_URL available
- [ ] Migration files exist in `backend/migrations/`

### Environment Variable Configuration

#### Step 1: Add DATABASE_URL to Web Service
- [ ] Go to Web Service dashboard
- [ ] Click "Environment" tab
- [ ] Choose connection method:

**Option A: Automatic (Recommended)**
- [ ] Scroll to "Add from Database" section
- [ ] Select `ultimate-optimizer-db` from dropdown
- [ ] Click "Add Connection"
- [ ] Verify `DATABASE_URL` appears in environment variables

**Option B: Manual**
- [ ] Click "Add Environment Variable"
- [ ] **Key**: `DATABASE_URL`
- [ ] **Value**: Paste internal database URL
- [ ] Click "Save Changes"

#### Step 2: Verify Environment Variable
- [ ] `DATABASE_URL` visible in Environment tab
- [ ] URL format correct (postgresql://...)
- [ ] No typos in variable name

### Migration Script Configuration

#### Step 3: Update Build Command
- [ ] Go to Web Service dashboard
- [ ] Click "Settings" tab
- [ ] Find "Build Command" field
- [ ] Update to:
  ```bash
  npm install && npm run build && cd backend && npm run migrate
  ```
- [ ] Click "Save Changes"

**Alternative**: Keep original build command and run migrations manually (see below)

### Deploy and Run Migrations

#### Step 4: Trigger Deployment
Choose one method:

**Option A: Automatic Deploy**
- [ ] Make a small change (e.g., update README)
- [ ] Commit and push to main branch:
  ```bash
  git add .
  git commit -m "Configure PostgreSQL"
  git push origin main
  ```
- [ ] Render auto-deploys

**Option B: Manual Deploy**
- [ ] Go to Web Service dashboard
- [ ] Click "Manual Deploy" button
- [ ] Select "Deploy latest commit"
- [ ] Click "Deploy"

#### Step 5: Monitor Migration Execution
- [ ] Watch deployment logs in real-time
- [ ] Look for migration output:
  ```
  > backend@1.0.0 migrate
  > node-pg-migrate up
  
  === 1730000000000_initial-schema: migrating =====
  === 1730000000000_initial-schema: migrated (0.234s) =====
  ```
- [ ] Verify no error messages
- [ ] Wait for "Live" status

### Verification Steps

#### Step 6: Verify Tables Created
- [ ] Go to Web Service dashboard
- [ ] Click "Shell" tab
- [ ] Run test command:
  ```bash
  cd backend
  npm run db:test
  ```
- [ ] Verify output shows:
  - [ ] ✓ Connection successful
  - [ ] ✓ Migrations table exists
  - [ ] ✓ Applied migrations: 1
  - [ ] ✓ Application tables found (5 tables)
  - [ ] ✓ Plans seeded (4 plans)

#### Step 7: Verify via PostgreSQL Shell
- [ ] Go to PostgreSQL database dashboard
- [ ] Click "Shell" tab
- [ ] Run: `\dt`
- [ ] Verify tables exist:
  - [ ] app_instances
  - [ ] jobs
  - [ ] job_items
  - [ ] plans
  - [ ] publish_logs
  - [ ] pgmigrations
- [ ] Run: `SELECT * FROM plans;`
- [ ] Verify 4 plans seeded:
  - [ ] free (100 credits)
  - [ ] starter (1000 credits)
  - [ ] pro (5000 credits)
  - [ ] scale (25000 credits)

#### Step 8: Verify Indexes Created
- [ ] In PostgreSQL shell, run: `\di`
- [ ] Verify indexes exist:
  - [ ] idx_app_instances_site_host
  - [ ] idx_app_instances_credits_reset
  - [ ] idx_jobs_instance_status
  - [ ] idx_jobs_created_at
  - [ ] idx_job_items_job_id
  - [ ] idx_job_items_status
  - [ ] idx_job_items_product
  - [ ] idx_publish_logs_instance
  - [ ] idx_publish_logs_product

#### Step 9: Test API Database Connection
- [ ] Test health endpoint:
  ```bash
  curl https://your-app-name.onrender.com/health
  ```
- [ ] Verify response includes database status
- [ ] No connection errors in logs

### Verification
- [ ] DATABASE_URL environment variable set
- [ ] Migrations ran successfully
- [ ] All tables created
- [ ] All indexes created
- [ ] Plans seeded correctly
- [ ] API can connect to database
- [ ] No errors in deployment logs

**✅ Task 6.2 Complete** - Database fully configured!

---

## Troubleshooting

### Issue: Migration Fails - Connection Refused
**Symptoms**: "ECONNREFUSED" or "Connection refused" errors

**Solutions**:
- [ ] Verify DATABASE_URL is set in environment variables
- [ ] Check database status is "Available" (not "Creating")
- [ ] Ensure database and web service in same region
- [ ] Use internal URL, not external
- [ ] Wait 5 minutes after database creation, then retry

### Issue: Migration Fails - Permission Denied
**Symptoms**: "permission denied" or "must be owner" errors

**Solutions**:
- [ ] Verify using database owner credentials
- [ ] Check DATABASE_URL includes correct username
- [ ] Connect via PSQL shell to verify permissions: `\du`

### Issue: Migration Fails - Table Already Exists
**Symptoms**: "relation already exists" errors

**Solutions**:
- [ ] Check migration history: `SELECT * FROM pgmigrations;`
- [ ] If partial migration, rollback and reapply:
  ```bash
  cd backend
  npm run migrate:down
  npm run migrate
  ```

### Issue: DATABASE_URL Not Found
**Symptoms**: "DATABASE_URL is not defined" errors

**Solutions**:
- [ ] Verify environment variable in Web Service "Environment" tab
- [ ] Check spelling (case-sensitive: DATABASE_URL)
- [ ] Restart web service after adding variable
- [ ] Redeploy application

### Issue: Build Command Fails
**Symptoms**: Build fails during migration step

**Solutions**:
- [ ] Verify build command syntax is correct
- [ ] Check backend/package.json has "migrate" script
- [ ] Try manual migration instead (see alternative method)
- [ ] Check deployment logs for specific error

### Alternative: Manual Migration
If automatic migration in build command fails:

1. **Keep original build command**:
   ```bash
   npm install && npm run build
   ```

2. **Run migration manually after deployment**:
   - [ ] Go to Web Service dashboard
   - [ ] Click "Shell" tab
   - [ ] Run:
     ```bash
     cd backend
     npm run migrate
     ```

3. **Verify migration success**:
   - [ ] Run: `npm run db:test`
   - [ ] Check for success messages

---

## Post-Configuration Checklist

### Database Health
- [ ] Database status: Available
- [ ] Backups: Enabled (daily)
- [ ] Connections: Active and stable
- [ ] No errors in database logs

### Application Health
- [ ] Web Service status: Live
- [ ] Health check: Passing
- [ ] Database connection: Working
- [ ] No errors in application logs

### Environment Variables
- [ ] NODE_ENV=production
- [ ] PORT=3000
- [ ] DATABASE_URL=postgresql://... (set)
- [ ] WIX_APP_ID (placeholder for now)
- [ ] WIX_APP_SECRET (placeholder for now)

### Database Schema
- [ ] 6 tables created (including pgmigrations)
- [ ] 9 indexes created
- [ ] 2 ENUM types created
- [ ] 4 plans seeded
- [ ] Foreign keys configured
- [ ] Cascade deletes working

### Documentation
- [ ] DATABASE_URL noted securely
- [ ] Database name recorded
- [ ] Region confirmed
- [ ] Backup schedule understood

---

## Success Criteria

All items below must be checked:

- [x] Task 6.1: PostgreSQL database created on Render
- [x] Task 6.2: Migrations ran successfully
- [ ] DATABASE_URL environment variable configured
- [ ] All tables and indexes created
- [ ] Plans seeded with 4 subscription tiers
- [ ] API can connect to database
- [ ] Health check passes
- [ ] No errors in logs

**When all items checked: Task 6 is COMPLETE! ✅**

---

## Next Steps

After completing Task 6:

1. ✅ Database infrastructure ready
2. ⏭️ **Task 7**: Implement Wix instance authentication
   - Create instance token verification middleware
   - Implement OAuth callback handler
3. ⏭️ **Task 8**: Register Wix app and configure extensions
   - Create Wix self-hosted app
   - Update WIX_APP_ID and WIX_APP_SECRET
   - Add Dashboard Page extension

---

## Reference Documents

- **Detailed Setup Guide**: `RENDER_POSTGRESQL_SETUP.md`
- **Database Schema**: `backend/DATABASE_SETUP.md`
- **Migration Summary**: `backend/MIGRATION_SETUP_SUMMARY.md`
- **Environment Variables**: `ENVIRONMENT_VARIABLES.md`
- **Render Deployment**: `RENDER_DEPLOYMENT.md`

## Support Resources

- Render PostgreSQL Docs: https://render.com/docs/databases
- Render Support: https://render.com/support
- node-pg-migrate: https://github.com/salsita/node-pg-migrate
- PostgreSQL Docs: https://www.postgresql.org/docs/
