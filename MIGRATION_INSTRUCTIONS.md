# Database Migration Required

## Issue
The `catalog_version` column doesn't exist in your production database yet, causing this error:
```
error: column "catalog_version" of relation "app_instances" does not exist
```

## Solution
Run the database migration to add the column.

## Steps to Fix

### Option 1: Run Migration on Render (Recommended)

1. **Go to your Render dashboard**
2. **Navigate to your backend service**
3. **Go to the Shell tab**
4. **Run the migration command:**
   ```bash
   npm run migrate
   ```

### Option 2: Run Migration Locally (if you have DB access)

If you have direct access to the production database:

```bash
cd backend
npm run migrate
```

### Option 3: Manual SQL (if needed)

If migrations don't work, you can run this SQL directly on your database:

```sql
-- Add catalog_version column
ALTER TABLE app_instances
ADD COLUMN IF NOT EXISTS catalog_version text;

-- Add comment for documentation
COMMENT ON COLUMN app_instances.catalog_version IS 'Wix Stores Catalog version: V1 or V3';
```

## What the Migration Does

The migration file `backend/migrations/1730000011000_add-catalog-version.js` adds:
- A new `catalog_version` column to the `app_instances` table
- Type: `text` (nullable)
- Values: `'V1'` or `'V3'`
- Used to cache which Wix Stores Catalog version each site uses

## After Migration

Once the migration runs:
1. The error will disappear
2. The app will detect catalog versions on first use
3. Subsequent requests will use the cached version
4. V1 sites will work correctly!

## Verification

After running the migration, check the logs. You should see:
```
[AppInstances] Updated catalog version for {instanceId}: V1
```

Instead of:
```
catalog_version column doesn't exist yet - skipping update
```

## Graceful Degradation

The code has been updated to handle the missing column gracefully:
- If the column doesn't exist, it logs a warning but continues
- The app will still detect V1 vs V3 (just won't cache it)
- Once you run the migration, caching will work automatically

## Migration File Location

`backend/migrations/1730000011000_add-catalog-version.js`
