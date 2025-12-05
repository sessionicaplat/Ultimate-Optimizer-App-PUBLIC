# Queue Optimization Deployment Checklist

## Pre-Deployment

### 1. Review Changes
- [ ] Read `MULTI_STORE_FAIRNESS_IMPLEMENTATION.md`
- [ ] Read `QUEUE_OPTIMIZATION_SUMMARY.md`
- [ ] Understand round-robin claiming logic
- [ ] Review database migration

### 2. Backup Database
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Check Render Plan
- [ ] Verify PostgreSQL connection limit
- [ ] Note current connection usage
- [ ] Plan connection pool size

| Render Plan | Max Connections | Recommended Pool |
|-------------|-----------------|------------------|
| Free | 20 | 18 |
| Starter | 60 | 50 |
| Standard | 120 | 100 |
| Pro | 500+ | 200 |

## Deployment Steps

### Step 1: Run Migration

```bash
cd backend
npm run migrate
```

**Expected Output:**
```
Adding instance_id column to job_items...
✓ Migration completed: instance_id added to job_items
```

**Verify:**
```bash
# Check migration status
npm run migrate status

# Should show:
# 1730000012000_add-instance-id-to-job-items.js [COMPLETED]
```

### Step 2: Verify Database Changes

```bash
# Connect to database
psql $DATABASE_URL

# Check column exists
\d job_items

# Should show:
# instance_id | text | not null

# Check indexes
\di job_items*

# Should show:
# idx_job_items_instance_status_id
# idx_job_items_status_id
# idx_job_items_status (existing)
# idx_job_items_job_id (existing)
# idx_job_items_product (existing)

# Verify data integrity
SELECT COUNT(*) FROM job_items WHERE instance_id IS NULL;
# Should return: 0

# Check instance distribution
SELECT instance_id, COUNT(*) as item_count
FROM job_items
WHERE status = 'PENDING'
GROUP BY instance_id
ORDER BY item_count DESC;
```

### Step 3: Configure Environment

Create or update `.env`:

```bash
# Connection Pool Configuration
DB_POOL_MAX=50  # Adjust based on Render plan
DB_POOL_MIN=10  # 20% of max

# Existing variables
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
WIX_APP_ID=...
WIX_APP_SECRET=...
```

### Step 4: Deploy Code

```bash
# Build backend
cd backend
npm run build

# Check for errors
echo $?  # Should be 0

# Deploy to Render (or your platform)
git add .
git commit -m "Add multi-store fairness and database optimization"
git push origin main
```

### Step 5: Monitor Deployment

Watch Render logs for:

```
[DB Pool] Configuration: { max: 50, min: 10, ... }
[Worker] Starting background job worker...
[Worker] OpenAI API key is configured
[Worker] ✅ Initialized with X pending item(s)
```

## Post-Deployment Verification

### 1. Check Worker Logs

```bash
# Watch logs in real-time
render logs --tail

# Look for:
[Worker] Claimed 80 item(s) from 4 store(s) for processing
  Store 12345678...: 20 items
  Store 87654321...: 20 items
  Store abcdef12...: 20 items
  Store fedcba98...: 20 items
```

**Success Indicators:**
- ✅ Multiple stores in each batch
- ✅ Even distribution (~20 items per store)
- ✅ No errors in claiming items

### 2. Check Database Pool

```bash
# Look for pool stats every 60 seconds
[DB Pool] Stats: { total: 12, idle: 8, waiting: 0 }
```

**Healthy Metrics:**
- ✅ `waiting: 0` (no connection starvation)
- ✅ `idle > 0` (pool not exhausted)
- ✅ `total < max` (not hitting limit)

### 3. Test Multi-Store Fairness

**Test Scenario:**
1. Create job from Store A (100 products)
2. Wait 5 seconds
3. Create job from Store B (50 products)
4. Watch worker logs

**Expected Behavior:**
```
[Worker] Claimed 60 item(s) from 2 store(s) for processing
  Store A: 20 items
  Store B: 20 items
```

Both stores should appear in the same batch!

### 4. Check Rate Limiter

```bash
curl http://localhost:3000/api/rate-limiter/stats
```

**Expected Response:**
```json
{
  "status": "ok",
  "rateLimiter": {
    "queueLength": 45,
    "requestsInLastMinute": 387,
    "rpmUsagePercent": 86.0
  }
}
```

### 5. Monitor Performance

**Metrics to Track:**
- Items processed per minute (~450)
- Number of stores per batch (should be > 1)
- Connection pool usage (should be < max)
- Rate limiter queue (should drain over time)

## Rollback Plan

If issues occur:

### Option 1: Rollback Migration

```bash
cd backend
npm run migrate down

# Verify rollback
npm run migrate status
```

### Option 2: Rollback Code

```bash
git revert HEAD
git push origin main
```

### Option 3: Restore Database

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Troubleshooting

### Issue: Migration Fails

**Error:** `column "instance_id" already exists`

**Solution:**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'job_items' AND column_name = 'instance_id';

-- If exists, skip migration or drop column first
ALTER TABLE job_items DROP COLUMN instance_id;
```

### Issue: No Multi-Store Processing

**Symptoms:**
- Only one store per batch
- Logs show single store

**Check:**
```sql
-- Verify multiple stores have pending items
SELECT instance_id, COUNT(*) 
FROM job_items 
WHERE status = 'PENDING' 
GROUP BY instance_id;
```

**Solution:**
- Ensure multiple stores have submitted jobs
- Check worker is using new claiming logic
- Verify indexes exist

### Issue: Connection Pool Exhausted

**Symptoms:**
```
[DB Pool] Stats: { total: 50, idle: 0, waiting: 10 }
```

**Solution:**
1. Increase `DB_POOL_MAX` in `.env`
2. Check Render plan limits
3. Restart server

### Issue: Slow Queries

**Symptoms:**
- Worker cycle takes > 5 seconds
- Database CPU high

**Check:**
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT id FROM job_items
WHERE status = 'PENDING'
ORDER BY id
LIMIT 100;

-- Should use index
```

**Solution:**
```sql
-- Rebuild indexes if needed
REINDEX TABLE job_items;
```

## Success Criteria

### Deployment Successful If:

- [x] Migration completed without errors
- [x] All indexes created successfully
- [x] Worker starts without errors
- [x] Database pool configured correctly
- [x] Multiple stores processed concurrently
- [x] No connection pool exhaustion
- [x] Rate limiter working correctly
- [x] Processing speed maintained (~450 items/min)

### Performance Targets:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Multi-store batches | > 1 store per batch | Worker logs |
| Items per store | ~20 items | Worker logs |
| Connection pool waiting | 0 | Pool stats logs |
| Processing speed | 450 items/min | Rate limiter stats |
| Store start delay | < 2 seconds | Test with 2 stores |

## Monitoring Schedule

### First Hour
- Check logs every 5 minutes
- Monitor connection pool
- Verify multi-store processing
- Check for errors

### First Day
- Check logs every hour
- Monitor performance metrics
- Review error logs
- Adjust pool size if needed

### First Week
- Daily log review
- Performance trend analysis
- User feedback collection
- Fine-tune configuration

## Configuration Tuning

### If Single Store Dominates

**Symptom:** One store gets 80+ items per batch

**Solution:**
```typescript
// Reduce maxPerInstance
const items = await claimPendingItems(100, 10);
```

### If Too Many Small Batches

**Symptom:** Many stores with < 5 items each

**Solution:**
```typescript
// Increase maxPerInstance
const items = await claimPendingItems(150, 30);
```

### If Connection Pool Issues

**Symptom:** `waiting > 0` in pool stats

**Solution:**
```bash
# Increase pool size
DB_POOL_MAX=100
DB_POOL_MIN=20
```

## Documentation

After successful deployment:

- [ ] Update README with new features
- [ ] Document configuration options
- [ ] Add monitoring guidelines
- [ ] Create runbook for common issues
- [ ] Update API documentation

## Sign-Off

- [ ] Migration completed successfully
- [ ] Code deployed to production
- [ ] Multi-store fairness verified
- [ ] Performance metrics acceptable
- [ ] No critical errors
- [ ] Team notified of changes

**Deployed by:** _________________
**Date:** _________________
**Verified by:** _________________
**Date:** _________________

## Next Steps

After successful deployment:

1. Monitor for 24 hours
2. Collect performance metrics
3. Gather user feedback
4. Fine-tune configuration
5. Document lessons learned
6. Plan next optimizations
