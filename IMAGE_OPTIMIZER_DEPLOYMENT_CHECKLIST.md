# Image Optimizer Deployment Checklist

## Pre-Deployment Steps

### 1. Code Review ✅
- [x] Rate limiter implemented
- [x] Multi-store fairness added
- [x] Two-phase processing implemented
- [x] Event-driven triggers added
- [x] Monitoring endpoint created
- [x] Types updated (ItemStatus includes 'PROCESSING')

### 2. Database Check
The existing schema already supports the new 'PROCESSING' status:
- `image_optimization_items.status` is TEXT type
- No migration needed
- New status values will work automatically

### 3. Environment Variables
Verify these are set in your `.env`:
```bash
REPLICATE_API_TOKEN=your_token_here
REPLICATE_IMAGE_MODEL=google/nano-banana  # or your preferred model
REPLICATE_MAX_WAIT_MS=60000  # optional
REPLICATE_DEFAULT_ASPECT_RATIO=1:1  # optional
```

---

## Deployment Steps

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Build Backend
```bash
npm run build
```

### Step 3: Restart Server
```bash
# Development
npm run dev:backend

# Production
npm run start
```

### Step 4: Verify Worker Started
Check logs for:
```
[ImageOptWorker] Starting two-phase image optimization worker...
[ImageOptWorker] - Phase 1: Create predictions (every 5s)
[ImageOptWorker] - Phase 2: Poll predictions (every 3s)
[ImageOptWorker] Worker started successfully
[ReplicateRateLimiter] Initialized with 450 RPM
```

---

## Post-Deployment Testing

### Test 1: Small Batch (10 images)
1. Open Image Optimization page
2. Select a product with 10 images
3. Add prompts and submit
4. Watch logs for:
   - Job created event
   - Prediction creation (should see 10 predictions created)
   - Polling (should see status checks)
   - Completion (should complete in ~1-2 minutes)

**Expected Time:** ~1-2 minutes for 10 images

### Test 2: Medium Batch (50 images)
1. Create 5 jobs with 10 images each
2. Watch for multi-store fairness (if multiple stores)
3. Monitor rate limiter stats

**Expected Time:** ~5-7 minutes for 50 images

### Test 3: Large Batch (500 images)
1. Create multiple jobs totaling 500 images
2. Monitor system performance
3. Check rate limiter queue doesn't grow too large

**Expected Time:** ~60-70 minutes for 500 images

---

## Monitoring

### Real-Time Monitoring

**Rate Limiter Stats:**
```bash
curl http://localhost:3000/api/replicate-rate-limiter/stats
```

**Expected Response:**
```json
{
  "status": "ok",
  "rateLimiter": {
    "queueLength": 45,
    "requestsInLastMinute": 387,
    "maxRPM": 450,
    "rpmUsagePercent": 86.0
  },
  "health": {
    "queueHealthy": true,
    "rpmHealthy": true
  }
}
```

**Watch Mode:**
```bash
watch -n 5 'curl -s http://localhost:3000/api/replicate-rate-limiter/stats | jq'
```

### Log Monitoring

**Worker Logs:**
```bash
# Filter for image optimization worker
tail -f logs/app.log | grep ImageOptWorker

# Or if using console output
npm run dev:backend | grep ImageOptWorker
```

**Expected Logs:**
```
[ImageOptWorker] Creating predictions for 100 items
[ImageOptWorker] ✅ Prediction created for item 123: pred_abc123
[ImageOptWorker] Prediction creation batch complete: 100 items
[ImageOptWorker] Polling 50 predictions
[ImageOptWorker] ✅ Item 123 completed
[ImageOptWorker] Heartbeat - cycle 15 | Queue: 45 | RPM: 387/450 (86.0%)
```

---

## Health Checks

### System Health Indicators

**Healthy System:**
- ✅ Queue length < 500
- ✅ RPM usage 80-90%
- ✅ Items completing steadily
- ✅ No error spikes in logs
- ✅ Heartbeat logs every 30 seconds

**Warning Signs:**
- ⚠️ Queue length > 500
- ⚠️ RPM usage > 95%
- ⚠️ Slow completion rate
- ⚠️ Increasing error rate

**Critical Issues:**
- 🚨 Queue length > 1000
- 🚨 RPM usage stuck at 100%
- 🚨 Worker not processing
- 🚨 All items failing

### Database Health

**Check Item Status Distribution:**
```sql
SELECT status, COUNT(*) 
FROM image_optimization_items 
GROUP BY status;
```

**Expected Distribution (during processing):**
```
PENDING     | 500
PROCESSING  | 100
DONE        | 1000
FAILED      | 5
```

**Check Job Status:**
```sql
SELECT status, COUNT(*) 
FROM image_optimization_jobs 
GROUP BY status;
```

---

## Performance Validation

### Throughput Test

**Measure actual throughput:**
```sql
-- Items completed in last minute
SELECT COUNT(*) 
FROM image_optimization_items 
WHERE status = 'DONE' 
  AND updated_at > NOW() - INTERVAL '1 minute';
```

**Expected:** ~400-450 items per minute during active processing

### Latency Test

**Measure job creation to first item processing:**
```sql
SELECT 
  j.id,
  j.created_at as job_created,
  MIN(i.updated_at) as first_item_started,
  EXTRACT(EPOCH FROM (MIN(i.updated_at) - j.created_at)) as latency_seconds
FROM image_optimization_jobs j
JOIN image_optimization_items i ON i.job_id = j.id
WHERE j.created_at > NOW() - INTERVAL '1 hour'
GROUP BY j.id, j.created_at
ORDER BY j.created_at DESC
LIMIT 10;
```

**Expected:** <5 seconds latency (event-driven processing)

---

## Troubleshooting Guide

### Issue: Worker Not Starting

**Symptoms:**
- No worker logs
- Jobs stay in PENDING status

**Solutions:**
1. Check if `startImageOptimizationWorker()` is called in `server.ts`
2. Verify no errors during server startup
3. Check REPLICATE_API_TOKEN is set
4. Restart server

### Issue: Items Stuck in PROCESSING

**Symptoms:**
- Items remain PROCESSING for >5 minutes
- No completion

**Solutions:**
1. Check Replicate API status
2. Verify polling worker is running
3. Check prediction IDs on Replicate dashboard
4. Look for errors in logs

### Issue: Rate Limit Errors

**Symptoms:**
- 429 errors in logs
- Items failing with rate limit messages

**Solutions:**
1. Reduce RPM limit in `replicateRateLimiter.ts`
2. Increase polling intervals
3. Check if other services use same API key

### Issue: Queue Growing

**Symptoms:**
- Queue length increasing
- Not draining

**Solutions:**
1. Check Replicate API response times
2. Verify predictions are completing
3. Temporarily reduce batch size
4. Check for failed predictions

---

## Rollback Plan

If issues occur, rollback to previous version:

### Step 1: Revert Code
```bash
git revert HEAD
# Or restore from backup
```

### Step 2: Restart Server
```bash
npm run start
```

### Step 3: Verify Old System
- Check worker logs
- Test with small batch
- Confirm processing works

**Note:** No database migration needed, so rollback is safe

---

## Success Criteria

### Deployment Successful If:
- ✅ Worker starts without errors
- ✅ Jobs process within expected time
- ✅ Rate limiter stats show healthy usage
- ✅ No rate limit errors
- ✅ Multi-store fairness working
- ✅ Throughput ~400-450 images/minute
- ✅ Latency <5 seconds

### Performance Targets:
- **10 images:** Complete in 1-2 minutes
- **100 images:** Complete in 10-15 minutes
- **1,000 images:** Complete in 100-120 minutes
- **50,000 images:** Complete in 110-130 minutes

---

## Next Steps After Deployment

### Immediate (First 24 Hours)
1. Monitor logs for errors
2. Check rate limiter stats hourly
3. Verify job completion times
4. Test with multiple stores

### Short-term (First Week)
1. Analyze performance metrics
2. Tune batch sizes if needed
3. Adjust polling intervals if needed
4. Set up automated alerts

### Long-term (First Month)
1. Implement Prometheus metrics
2. Create Grafana dashboard
3. Set up PagerDuty/Slack alerts
4. Document any issues and solutions

---

## Support Contacts

If issues arise:
1. Check logs first
2. Review troubleshooting guide
3. Check Replicate API status
4. Review this checklist

---

## Deployment Sign-Off

- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] Server restarted successfully
- [ ] Worker started successfully
- [ ] Small batch test passed
- [ ] Medium batch test passed
- [ ] Monitoring verified
- [ ] Performance targets met
- [ ] Documentation updated

**Deployed By:** _________________
**Date:** _________________
**Version:** _________________

---

## Quick Reference

**Start Server:**
```bash
npm run dev:backend
```

**Check Stats:**
```bash
curl http://localhost:3000/api/replicate-rate-limiter/stats
```

**Watch Logs:**
```bash
tail -f logs/app.log | grep ImageOptWorker
```

**Check Database:**
```sql
SELECT status, COUNT(*) FROM image_optimization_items GROUP BY status;
```

**Expected Performance:**
- 450 images/minute
- <5 second latency
- 90% API utilization
