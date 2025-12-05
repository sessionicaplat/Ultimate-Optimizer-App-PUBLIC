# Image Optimizer Migration Fix - URGENT

## Problem

The database enum `item_status` doesn't include 'PROCESSING' value, causing errors:
```
error: invalid input value for enum item_status: "PROCESSING"
```

## Solution

Run the migration to add 'PROCESSING' to the enum.

### On Render (Production)

1. **Connect to Render Shell:**
   - Go to your Render dashboard
   - Open your web service
   - Click "Shell" tab

2. **Run Migration:**
```bash
cd backend
npm run migrate
```

3. **Verify Migration:**
```bash
# Check if PROCESSING was added
psql $DATABASE_URL -c "SELECT unnest(enum_range(NULL::item_status));"
```

Expected output:
```
PENDING
RUNNING
PROCESSING
DONE
FAILED
```

4. **Restart Service:**
   - Render will auto-restart after migration
   - Or manually restart from dashboard

### Migration File

Created: `backend/migrations/1730000013000_add-processing-status.js`

This adds 'PROCESSING' status to the `item_status` enum type.

## Alternative: Temporary Fix (Use RUNNING Instead)

If you can't run the migration immediately, we can temporarily use 'RUNNING' instead of 'PROCESSING':

### Quick Fix (No Migration Needed)

Update `backend/src/workers/imageOptimizationWorker.ts`:

**Change line 121:**
```typescript
// FROM:
status: 'PROCESSING',

// TO:
status: 'RUNNING',
```

**Change line 148 (getProcessingImageOptimizationItems query):**
```typescript
// FROM:
WHERE ioi.status = 'PROCESSING'

// TO:
WHERE ioi.status = 'RUNNING'
```

This will make it work immediately but loses the distinction between "creating prediction" and "waiting for result".

## Recommended Approach

**Run the migration** - it's the proper fix and enables the full two-phase architecture.

## After Migration

1. Restart backend server
2. Test with small batch (1-2 images)
3. Verify items move through statuses:
   - PENDING → RUNNING → PROCESSING → DONE

## Verification

Check database after migration:
```sql
-- Should show PROCESSING status
SELECT unnest(enum_range(NULL::item_status));

-- Check if any items are in PROCESSING
SELECT status, COUNT(*) 
FROM image_optimization_items 
GROUP BY status;
```
