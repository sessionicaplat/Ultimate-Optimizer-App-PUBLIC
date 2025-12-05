# Quick Fix: Run This Now

## The Problem
```
error: column "catalog_version" of relation "app_instances" does not exist
```

## The Solution (2 minutes)

### On Render Dashboard:

1. **Open your backend service**
2. **Click "Shell" tab**
3. **Run this command:**
   ```bash
   npm run migrate
   ```
4. **Wait for "Migration completed successfully"**
5. **Done!** The app will work immediately.

### Alternative: Manual SQL

If the migration command doesn't work, run this SQL on your database:

```sql
ALTER TABLE app_instances ADD COLUMN IF NOT EXISTS catalog_version text;
```

## What This Does

Adds a column to store whether each site uses Wix Catalog V1 or V3.

## After Running

Your V1 site will immediately start working:
- ✅ Products will load
- ✅ No more 428 errors
- ✅ Catalog version cached for performance

## Verification

Check logs after running migration. You should see:
```
[AppInstances] Updated catalog version for {instanceId}: V1
```

Instead of:
```
catalog_version column doesn't exist yet - skipping update
```

## That's It!

The code is already deployed and working. It just needs the database column to exist.
