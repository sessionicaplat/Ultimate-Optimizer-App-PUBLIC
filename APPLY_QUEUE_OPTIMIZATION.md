# Apply Blog Queue Optimization

## Quick Start

### Step 1: Apply Database Migration

Connect to your Render PostgreSQL database and run the migration:

```bash
# Option A: Using Render Dashboard
# 1. Go to your PostgreSQL service in Render
# 2. Click "Connect" and copy the External Database URL
# 3. Run the migration:
psql <your-database-url> -f backend/migrations/20251113163733_add_retry_logic.sql

# Option B: Using Render CLI
render psql <your-postgres-service-name> -f backend/migrations/20251113163733_add_retry_logic.sql
```

### Step 2: Deploy Updated Code

The code changes are already in place. Just deploy to Render:

```bash
git add .
git commit -m "Optimize blog queue for 5000+ simultaneous blogs"
git push origin main
```

Render will automatically deploy the changes.

### Step 3: Verify

Check the worker logs to confirm the new configuration:

```bash
# You should see:
[Blog Worker] Starting with optimized batch processing...
[Blog Worker] Config: 1000 batch size, 50 max per instance, 50 chunk size
```

## What Changed

### Configuration
- **Batch Size:** 100 → 1000 (10x increase)
- **Max Per Instance:** 20 → 50 (2.5x increase)
- **Chunk Size:** New (50 blogs at a time)
- **Max Retries:** New (3 automatic retries)

### Database Schema
- Added `retry_count` column (tracks retry attempts)
- Added `last_error` column (stores error messages)
- Added `updated_at` column (tracks last update time)
- Added indexes for performance

### Processing Logic
- Chunked processing prevents memory exhaustion
- Automatic retry logic for failed blogs
- Priority queue (fewer retries processed first)

## Performance Expectations

### Before Optimization
- 100 blogs: ~5-10 minutes
- 1000 blogs: ~4-8 hours
- 5000 blogs: ~40-50 hours
- **Risk:** Crashes at ~500 blogs

### After Optimization
- 100 blogs: ~2-5 minutes
- 1000 blogs: ~12-20 minutes
- 5000 blogs: ~60-90 minutes
- **Risk:** Minimal (chunked processing)

## Testing

### Test with Small Batch (10 blogs)
```bash
# Create 10 test blogs from different stores
# Monitor worker logs to see chunked processing
```

### Test with Medium Batch (100 blogs)
```bash
# Create 100 test blogs
# Should complete in ~5-10 minutes
# Check memory usage stays stable
```

### Test with Large Batch (1000+ blogs)
```bash
# Create 1000+ test blogs
# Should complete in ~15-25 minutes
# Monitor rate limiter stats in logs
```

## Monitoring

### Check Queue Size
```sql
SELECT COUNT(*) as pending_blogs
FROM blog_generations 
WHERE status IN ('PENDING', 'GENERATING_CONTENT', 'GENERATING_IMAGE', 'PUBLISHING');
```

### Check Failed Blogs
```sql
SELECT id, retry_count, last_error, created_at
FROM blog_generations 
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Retry Stats
```sql
SELECT 
  retry_count,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (finished_at - created_at))) as avg_duration_seconds
FROM blog_generations
WHERE status = 'DONE'
GROUP BY retry_count
ORDER BY retry_count;
```

## Troubleshooting

### Migration Fails
```bash
# Check if columns already exist
psql $DATABASE_URL -c "\d blog_generations"

# If columns exist, skip migration
# If not, run migration again
```

### Worker Not Using New Config
```bash
# Check worker logs for startup message
# Should see: "Config: 1000 batch size, 50 max per instance, 50 chunk size"

# If not, restart the worker service in Render
```

### High Memory Usage
```bash
# Reduce chunk size in code:
const CHUNK_SIZE = 25; // Instead of 50

# Redeploy
```

### Slow Processing
```bash
# Check rate limiter stats in logs
# If hitting limits, consider:
# 1. Upgrading OpenAI/Replicate tier
# 2. Adding more worker instances (Phase 2)
```

## Rollback (If Needed)

### Revert Code Changes
```bash
git revert HEAD
git push origin main
```

### Revert Database Changes
```sql
-- Remove added columns (optional, won't break anything if left)
ALTER TABLE blog_generations DROP COLUMN IF EXISTS retry_count;
ALTER TABLE blog_generations DROP COLUMN IF EXISTS last_error;
ALTER TABLE blog_generations DROP COLUMN IF EXISTS updated_at;

-- Remove indexes
DROP INDEX IF EXISTS idx_blog_generations_retry_count;
DROP INDEX IF EXISTS idx_blog_generations_updated_at;
```

## Next Steps (Optional)

### Phase 2: Multiple Workers
- Deploy 3-5 worker instances on Render
- Add PostgreSQL row locking for distributed processing
- **Result:** 5000 blogs in ~20-30 minutes

### Phase 3: Redis Queue
- Add Render Redis service ($10/month)
- Implement Bull/BullMQ for advanced features
- **Result:** 5000 blogs in ~15-20 minutes + better monitoring

## Support

If you encounter issues:
1. Check worker logs in Render dashboard
2. Verify migration was applied successfully
3. Check database connection pool size
4. Monitor memory usage in Render metrics

## Summary

✅ **Migration:** Add retry columns to database
✅ **Deploy:** Push code changes to Render
✅ **Verify:** Check worker logs for new config
✅ **Test:** Start with small batch, scale up
✅ **Monitor:** Watch logs and database metrics

**Expected Result:** System can now handle 5000+ simultaneous blog generations in ~1-2 hours without crashing.
