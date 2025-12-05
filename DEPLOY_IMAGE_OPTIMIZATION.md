# Deploy Image Optimization Feature

## Pre-Deployment Checklist

### ✅ Code Review
- [x] All TypeScript files compile without errors
- [x] No linting warnings
- [x] All imports are correct
- [x] Database schema is valid
- [x] API routes are properly secured
- [x] Worker starts automatically

### ✅ Dependencies
- [x] `replicate` package installed in backend
- [x] All other dependencies up to date
- [x] No security vulnerabilities

### ✅ Environment Variables
- [ ] `REPLICATE_API_TOKEN` set in production
- [ ] Token is valid and active
- [ ] Token has sufficient credits/quota

### ✅ Database
- [ ] Migration file created
- [ ] Migration tested locally (if possible)
- [ ] Backup plan in place

### ✅ Documentation
- [x] Technical documentation complete
- [x] Setup guide written
- [x] API reference documented
- [x] Troubleshooting guide included

## Deployment Steps

### Step 1: Prepare Environment

#### On Render.com Dashboard:
1. Go to your Web Service
2. Click "Environment" tab
3. Add new environment variable:
   - Key: `REPLICATE_API_TOKEN`
   - Value: `r8_your_replicate_token_here` (get from https://replicate.com/account/api-tokens)
4. Click "Save Changes"

#### Verify Other Variables:
- `DATABASE_URL` ✓
- `WIX_APP_ID` ✓
- `WIX_APP_SECRET` ✓
- `OPENAI_API_KEY` ✓
- `NODE_ENV=production` ✓

### Step 2: Deploy Code

#### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Add image optimization feature with Replicate AI"
git push origin main
```

Render will automatically:
1. Pull latest code
2. Install dependencies (including `replicate`)
3. Run migrations
4. Build frontend
5. Start server with worker

#### Option B: Manual Deploy
1. Go to Render Dashboard
2. Click "Manual Deploy"
3. Select "Deploy latest commit"

### Step 3: Monitor Deployment

Watch the deployment logs for:

```
✓ Installing dependencies...
✓ Running migrations...
✓ Building frontend...
✓ Starting server...
[ImageOptWorker] Starting image optimization worker...
[ImageOptWorker] Worker started (checking every 30 seconds)
```

### Step 4: Verify Migration

Check that new tables exist:

```sql
-- Connect to your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('image_optimization_jobs', 'image_optimization_items');
```

Should return:
- `image_optimization_jobs`
- `image_optimization_items`

### Step 5: Test the Feature

#### Basic Test:
1. Open your app: `https://your-app.onrender.com/dashboard`
2. Navigate to "Image Optimization"
3. Select a product
4. Choose 1 image
5. Add prompt: "Make background white"
6. Click "Optimize Images"
7. Verify:
   - Credits deducted
   - Job created
   - Redirected to ongoing page

#### Monitor Progress:
1. Watch ongoing page
2. Verify job appears
3. Wait for status to change: PENDING → RUNNING → DONE
4. Check completed page
5. View before/after comparison

#### Check Logs:
```bash
# On Render Dashboard, view logs
# Look for:
[ImageOptWorker] Found X pending items to process
[Replicate] Starting image optimization
[Replicate] Image optimization completed
[ImageOptWorker] Successfully optimized item X
```

### Step 6: Verify Credits

1. Check user credits before optimization
2. Create job with 2 images (20 credits)
3. Verify credits decreased by 20
4. Check database:
```sql
SELECT credits_total, credits_used_month 
FROM app_instances 
WHERE instance_id = 'your_instance_id';
```

## Post-Deployment Verification

### ✅ Functional Tests

- [ ] Can create optimization job
- [ ] Credits are deducted correctly
- [ ] Job appears in ongoing page
- [ ] Worker processes items
- [ ] Status updates in real-time
- [ ] Completed jobs show results
- [ ] Before/After comparison works
- [ ] Modal viewer works
- [ ] Failed items show errors
- [ ] Navigation works correctly

### ✅ Error Handling Tests

- [ ] Try with insufficient credits → Shows error
- [ ] Try with > 10 images → Shows error
- [ ] Try with empty prompt → Shows error
- [ ] Try with invalid image URL → Item fails gracefully
- [ ] Check error messages are user-friendly

### ✅ Performance Tests

- [ ] Worker processes items within expected time
- [ ] No memory leaks
- [ ] Database queries are efficient
- [ ] Frontend updates smoothly
- [ ] No console errors

### ✅ Integration Tests

- [ ] Works with existing product optimizer
- [ ] Credits system integrates correctly
- [ ] Billing integration works
- [ ] Multi-tenant isolation works
- [ ] Wix authentication works

## Monitoring Setup

### Key Metrics to Track

1. **Job Success Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'DONE') as successful,
     COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
     COUNT(*) as total
   FROM image_optimization_jobs;
   ```

2. **Average Processing Time**
   ```sql
   SELECT 
     AVG(EXTRACT(EPOCH FROM (finished_at - created_at))) as avg_seconds
   FROM image_optimization_jobs
   WHERE status = 'DONE';
   ```

3. **Credit Usage**
   ```sql
   SELECT 
     SUM(total_images * 15) as total_credits_used
   FROM image_optimization_jobs
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

4. **Replicate API Usage**
   - Check Replicate dashboard
   - Monitor costs
   - Track API calls

### Set Up Alerts

1. **High Failure Rate**
   - Alert if > 20% of jobs fail
   - Check Replicate API status
   - Review error logs

2. **Slow Processing**
   - Alert if jobs take > 5 minutes
   - Check worker is running
   - Verify Replicate API response times

3. **High Costs**
   - Monitor Replicate spending
   - Set budget alerts
   - Track usage trends

## Rollback Plan

If something goes wrong:

### Quick Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Database Rollback
```bash
# If migration causes issues
npm run migrate:down
```

### Disable Feature
```javascript
// In server.ts, comment out:
// startImageOptimizationWorker();
```

## Common Issues & Solutions

### Issue: Worker Not Starting
**Symptoms:** Jobs stay in PENDING forever

**Solutions:**
1. Check server logs for errors
2. Verify `startImageOptimizationWorker()` is called
3. Restart server
4. Check database connection

### Issue: Replicate API Errors
**Symptoms:** All items fail with API errors

**Solutions:**
1. Verify `REPLICATE_API_TOKEN` is set correctly
2. Check token is active on Replicate dashboard
3. Verify account has credits
4. Check Replicate API status page

### Issue: Images Not Loading
**Symptoms:** Blank images or 404 errors

**Solutions:**
1. Check image URLs are publicly accessible
2. Verify CORS settings
3. Test URLs in browser
4. Check Wix media permissions

### Issue: High Costs
**Symptoms:** Unexpected Replicate charges

**Solutions:**
1. Review usage on Replicate dashboard
2. Check for stuck jobs processing repeatedly
3. Verify worker delay settings
4. Consider rate limiting

## Success Criteria

Deployment is successful when:

- ✅ All tests pass
- ✅ Worker is running
- ✅ Jobs process successfully
- ✅ Credits are tracked correctly
- ✅ No errors in logs
- ✅ Users can complete full workflow
- ✅ Performance is acceptable
- ✅ Costs are within budget

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch logs
   - Check error rates
   - Monitor costs

2. **Gather User Feedback**
   - How's the UX?
   - Are prompts working well?
   - Any confusion?

3. **Optimize**
   - Adjust worker settings if needed
   - Improve prompts
   - Add features based on feedback

4. **Document Learnings**
   - What worked well?
   - What could be improved?
   - Any surprises?

## Support Contacts

- **Replicate Support:** support@replicate.com
- **Replicate Docs:** https://replicate.com/docs
- **Replicate Status:** https://status.replicate.com

## Deployment Checklist Summary

- [ ] Environment variables set
- [ ] Code deployed
- [ ] Migration ran successfully
- [ ] Worker started
- [ ] Basic test passed
- [ ] Credits working
- [ ] Monitoring set up
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan ready

---

**Ready to deploy!** 🚀

Once deployed, announce to your team and start monitoring. Good luck!
