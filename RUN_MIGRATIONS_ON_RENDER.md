# Run Database Migrations on Render

Your database tables don't exist yet. You need to run the migrations on Render.

## Quick Fix: Run via Render Shell

1. Go to https://dashboard.render.com
2. Click on your **Web Service** (ultimate-optimizer-app)
3. Click **"Shell"** in the left sidebar
4. Run these commands:

```bash
cd backend
npm run migrate
```

You should see output like:
```
> backend@1.0.0 migrate
> node-pg-migrate up

Running migration 1730000000000_initial-schema.js
✓ Migration 1730000000000_initial-schema.js completed
```

5. Refresh your app in the Wix dashboard - products should now load!

## Alternative: Auto-run migrations on deploy

To automatically run migrations on every deployment:

### Option A: Update Render Build Command

1. Go to Render Dashboard → Your Web Service → Settings
2. Find "Build Command"
3. Change from:
   ```
   npm install && npm run build
   ```
   To:
   ```
   npm install && npm run build && cd backend && npm run migrate
   ```
4. Click "Save Changes"

### Option B: Add to Start Command

1. Go to Render Dashboard → Your Web Service → Settings  
2. Find "Start Command"
3. Change from:
   ```
   npm start
   ```
   To:
   ```
   cd backend && npm run migrate && cd .. && npm start
   ```
4. Click "Save Changes"

## Verify Migrations Ran

After running migrations, you can verify by checking the Render logs. You should see:
- ✅ No more "relation app_instances does not exist" errors
- ✅ Products and collections loading successfully

## Troubleshooting

If migrations fail:

1. **Check DATABASE_URL is set**: Render → Environment → DATABASE_URL should exist
2. **Check database is running**: Render → PostgreSQL service should be "Available"
3. **Check migration files exist**: `backend/migrations/` should have migration files
4. **Manual SQL**: If all else fails, you can run the SQL directly in Render's PostgreSQL dashboard

The migration SQL is in: `backend/migrations/1730000000000_initial-schema.js`
