# Render PostgreSQL Setup Guide

This guide walks you through creating and configuring a PostgreSQL database on Render for the Ultimate Optimizer App.

## Prerequisites

- Render account with Web Service already deployed
- Access to Render Dashboard
- Web Service URL noted (e.g., `https://ultimate-optimizer-app.onrender.com`)

## Step 1: Create PostgreSQL Database

### 1.1 Navigate to Render Dashboard

1. Log in to https://dashboard.render.com
2. Click the "New +" button in the top right
3. Select "PostgreSQL"

### 1.2 Configure Database Settings

Fill in the following settings:

- **Name**: `ultimate-optimizer-db`
- **Database**: `ultimate_optimizer` (auto-generated, can customize)
- **User**: `ultimate_optimizer_user` (auto-generated, can customize)
- **Region**: `Oregon (US West)` (MUST match your Web Service region)
- **PostgreSQL Version**: `15` (or latest available)
- **Instance Type**: `Starter` ($7/month)

### 1.3 Configure Backup Settings

In the "Advanced" section:

- **Automatic Backups**: ✅ Enabled (default)
- **Backup Retention**: `7 days` (default for Starter plan)
- **Point-in-Time Recovery**: Available on higher plans

### 1.4 Create Database

1. Review your settings
2. Click "Create Database" button
3. Wait 2-3 minutes for provisioning

### 1.5 Note Database Connection Details

Once created, you'll see the database dashboard with:

- **Status**: Available (green indicator)
- **Internal Database URL**: `postgresql://user:password@dpg-xxxxx/dbname`
- **External Database URL**: `postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/dbname`
- **PSQL Command**: For direct connection

**Important**: Copy the **Internal Database URL** - this is what your Web Service will use.

## Step 2: Connect Database to Web Service

### 2.1 Automatic Connection (Recommended)

1. Go to your Web Service dashboard
2. Click the "Environment" tab
3. Scroll to "Add from Database" section
4. Select your PostgreSQL database: `ultimate-optimizer-db`
5. Click "Add Connection"

This automatically creates the `DATABASE_URL` environment variable with the internal connection string.

### 2.2 Manual Connection (Alternative)

If automatic connection doesn't work:

1. Go to your PostgreSQL database dashboard
2. Copy the "Internal Database URL"
3. Go to your Web Service dashboard
4. Click "Environment" tab
5. Click "Add Environment Variable"
6. **Key**: `DATABASE_URL`
7. **Value**: Paste the internal database URL
8. Click "Save Changes"

### 2.3 Verify Connection

The `DATABASE_URL` should look like:
```
postgresql://ultimate_optimizer_user:password@dpg-xxxxx/ultimate_optimizer
```

**Security Note**: The internal URL is only accessible from services in the same region.

## Step 3: Update Build Command for Migrations

### 3.1 Modify Web Service Build Command

1. Go to your Web Service dashboard
2. Click "Settings" tab
3. Find "Build Command"
4. Update to:
   ```bash
   npm install && npm run build && cd backend && npm run migrate
   ```

This ensures migrations run automatically on every deployment.

### 3.2 Alternative: Manual Migration Script

If you prefer to run migrations separately, keep the original build command and add a manual migration step:

**Build Command** (unchanged):
```bash
npm install && npm run build
```

**Manual Migration** (run once after database creation):
```bash
# From Render Shell or local with DATABASE_URL
cd backend
npm run migrate
```

## Step 4: Deploy and Run Migrations

### 4.1 Trigger Deployment

Option A: **Automatic** (if auto-deploy is enabled)
- Push any change to your `main` branch
- Render will automatically deploy

Option B: **Manual Deploy**
1. Go to your Web Service dashboard
2. Click "Manual Deploy" button
3. Select "Deploy latest commit"
4. Click "Deploy"

### 4.2 Monitor Migration Execution

1. Watch the deployment logs in real-time
2. Look for migration output:
   ```
   > backend@1.0.0 migrate
   > node-pg-migrate up
   
   > Migrating files:
   > - 1730000000000_initial-schema.js
   
   === 1730000000000_initial-schema: migrating =====
   === 1730000000000_initial-schema: migrated (0.234s) =====
   ```

3. Verify "Live" status appears

### 4.3 Verify Migration Success

After deployment completes, check the logs for:

✅ **Success indicators**:
- "migrated (X.XXXs)" messages
- No error messages
- Server starts successfully
- Health check passes

❌ **Error indicators**:
- "Migration failed" messages
- Connection refused errors
- Permission denied errors

## Step 5: Verify Database Setup

### 5.1 Check Tables via Render Shell

1. Go to your Web Service dashboard
2. Click "Shell" tab
3. Run database test:
   ```bash
   cd backend
   npm run db:test
   ```

Expected output:
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

### 5.2 Check Tables via PostgreSQL Shell

1. Go to your PostgreSQL database dashboard
2. Click "Shell" tab (or use PSQL Command)
3. Run:
   ```sql
   \dt
   ```

Expected output:
```
                List of relations
 Schema |       Name        | Type  |        Owner
--------+-------------------+-------+---------------------
 public | app_instances     | table | ultimate_optimizer_user
 public | job_items         | table | ultimate_optimizer_user
 public | jobs              | table | ultimate_optimizer_user
 public | pgmigrations      | table | ultimate_optimizer_user
 public | plans             | table | ultimate_optimizer_user
 public | publish_logs      | table | ultimate_optimizer_user
```

4. Verify plans data:
   ```sql
   SELECT * FROM plans;
   ```

Expected output:
```
   id    |  name   | price_cents | monthly_credits
---------+---------+-------------+-----------------
 free    | Free    |           0 |             100
 starter | Starter |         900 |            1000
 pro     | Pro     |        1900 |            5000
 scale   | Scale   |        4900 |           25000
```

### 5.3 Test API Connection

Test that your API can connect to the database:

```bash
curl https://your-app-name.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## Troubleshooting

### Migration Fails: Connection Refused

**Issue**: Cannot connect to database during migration

**Solutions**:
1. Verify `DATABASE_URL` is set in environment variables
2. Check database status is "Available" (not "Creating")
3. Ensure database and web service are in the same region
4. Use internal database URL, not external
5. Wait a few minutes after database creation

### Migration Fails: Permission Denied

**Issue**: User doesn't have CREATE privileges

**Solutions**:
1. Verify you're using the database owner credentials
2. Check the database URL includes the correct username
3. Try connecting via PSQL shell to verify permissions:
   ```sql
   \du
   ```

### Migration Fails: Table Already Exists

**Issue**: Migration tries to create existing tables

**Solutions**:
1. Check if migrations were partially applied
2. View migration history:
   ```sql
   SELECT * FROM pgmigrations;
   ```
3. If needed, rollback and reapply:
   ```bash
   cd backend
   npm run migrate:down
   npm run migrate
   ```

### DATABASE_URL Not Found

**Issue**: Application can't find DATABASE_URL

**Solutions**:
1. Verify environment variable is set in Web Service
2. Check spelling (case-sensitive)
3. Restart web service after adding variable
4. Verify variable appears in "Environment" tab

### Connection Pool Exhausted

**Issue**: "Too many connections" errors

**Solutions**:
1. Check connection pool settings in `backend/src/db/index.ts`
2. Verify connections are being closed properly
3. Consider upgrading database plan for more connections
4. Review application for connection leaks

### Slow Query Performance

**Issue**: Database queries are slow

**Solutions**:
1. Check indexes are created (see migration file)
2. Run EXPLAIN ANALYZE on slow queries
3. Consider upgrading to higher database plan
4. Review query patterns and optimize

## Database Management

### View Connection Info

From PostgreSQL dashboard:
- **Internal URL**: For Web Service connections
- **External URL**: For local development (requires allowlist)
- **Connection Pooling**: Enabled by default

### Backup and Restore

**Automatic Backups**:
- Daily backups (7-day retention on Starter plan)
- Access from PostgreSQL dashboard → "Backups" tab
- One-click restore to new database

**Manual Backup**:
```bash
# From local machine with external URL
pg_dump $DATABASE_URL > backup.sql
```

**Restore from Backup**:
```bash
psql $DATABASE_URL < backup.sql
```

### Monitoring

From PostgreSQL dashboard:
- **Metrics**: CPU, memory, disk usage
- **Connections**: Active connection count
- **Logs**: Query logs and errors
- **Alerts**: Set up notifications for issues

### Scaling

**Upgrade Plan**:
1. Go to PostgreSQL dashboard
2. Click "Upgrade" button
3. Select higher plan (Standard, Pro, etc.)
4. Confirm upgrade

**Benefits of Higher Plans**:
- More storage
- More concurrent connections
- Better performance
- Longer backup retention
- Point-in-time recovery

## Security Best Practices

### Connection Security

✅ **DO**:
- Use internal database URL for Web Service
- Keep database in same region as Web Service
- Use environment variables for credentials
- Enable SSL/TLS (enforced by Render)

❌ **DON'T**:
- Expose database credentials in code
- Use external URL from Web Service
- Commit DATABASE_URL to Git
- Share credentials in plain text

### Access Control

- Database is private by default (not publicly accessible)
- Only services in same Render account can connect
- External access requires IP allowlist
- Use strong passwords (auto-generated by Render)

### Data Protection

- Automatic daily backups
- Encrypted at rest
- Encrypted in transit (SSL/TLS)
- Regular security updates by Render

## Cost Management

### Current Setup

- **PostgreSQL Starter**: $7/month
- **Included**:
  - 1 GB storage
  - 7-day backup retention
  - Automatic backups
  - SSL/TLS encryption

### Monitoring Usage

1. Go to PostgreSQL dashboard
2. Check "Metrics" tab
3. Monitor:
   - Storage usage
   - Connection count
   - Query performance

### Optimization Tips

- Clean up old completed jobs regularly
- Archive publish logs after 90 days
- Use indexes effectively
- Monitor slow queries

## Next Steps

After successful database setup:

1. ✅ Database created and connected
2. ✅ Migrations applied successfully
3. ✅ Tables and indexes created
4. ✅ Plans seeded with subscription tiers
5. ⏭️ Proceed to Task 7: Implement Wix instance authentication

## Reference

- Render PostgreSQL Docs: https://render.com/docs/databases
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- node-pg-migrate: https://github.com/salsita/node-pg-migrate
- Database Setup Guide: `backend/DATABASE_SETUP.md`

## Support

- Render Support: https://render.com/support
- Render Community: https://community.render.com
- PostgreSQL Help: https://www.postgresql.org/support/
