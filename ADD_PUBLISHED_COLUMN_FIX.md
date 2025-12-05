# Fix: Add Published Column to job_items Table

## Problem
The application is failing with error: `column ji.published does not exist`

This is because the `job_items` table is missing the `published` column that tracks whether optimized content has been published to the store.

## Solution
Run the migration to add the `published` column to the `job_items` table.

## Steps to Fix on Render

### Option 1: Using the Shell (Recommended)

1. Go to your Render dashboard
2. Navigate to your backend service
3. Click on "Shell" tab
4. Run the following commands:

```bash
cd backend
node run-single-migration.js 1730000008000_add-published-column.js
```

### Option 2: Using the Migration Runner

If you have the full migration runner set up:

```bash
cd backend
npm run migrate up
```

### Option 3: Manual SQL (If needed)

Connect to your PostgreSQL database and run:

```sql
-- Add published column
ALTER TABLE job_items ADD COLUMN published BOOLEAN NOT NULL DEFAULT false;

-- Create index
CREATE INDEX idx_job_items_published ON job_items (published);
```

## Verification

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'job_items' AND column_name = 'published';
```

Expected output:
```
 column_name | data_type | is_nullable | column_default
-------------+-----------+-------------+----------------
 published   | boolean   | NO          | false
```

## What This Fixes

- ✅ Ongoing optimizations page will load correctly
- ✅ Completed jobs page will load correctly  
- ✅ Job details page will show correct published status
- ✅ "View details" vs "View & Publish" button logic will work
- ✅ Published items count will be tracked correctly

## Files Changed

1. `backend/migrations/1730000008000_add-published-column.js` - New migration file
2. `backend/run-single-migration.js` - Helper script to run single migrations
3. `backend/src/db/jobs.ts` - Already updated to use the published column

## After Migration

The application should work immediately after the migration completes. No restart is needed, but you may want to refresh the browser to clear any cached errors.
