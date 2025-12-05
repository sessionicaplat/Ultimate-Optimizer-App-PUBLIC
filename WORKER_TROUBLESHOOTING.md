# Worker Troubleshooting Guide

## Problem
Jobs are being created but not processed. No product data is being sent to OpenAI for optimization.

## Changes Made

### 1. Enhanced Worker Logging
Added detailed logging to track worker activity:
- Worker initialization
- Pending job checks
- Item claiming and processing
- OpenAI API key validation

### 2. Fixed Worker Flag Logic
Changed the `hasPendingJobs` flag behavior:
- **Before**: Flag was reset after every check, even if items existed
- **After**: Flag only resets when NO items are found
- This ensures the worker keeps checking while items are pending

### 3. Added Environment Validation
Worker now checks for `OPENAI_API_KEY` on startup and logs a warning if missing.

## What to Check on Render

### 1. Check Render Logs for Worker Startup
Look for these log messages when the server starts:
```
[Worker] Starting background job worker...
[Worker] OpenAI API key is configured
[Worker] Initializing pending jobs flag...
[Worker] Initialized with X pending item(s), flag set to: true/false
[Worker] Background job worker started successfully
```

**If you DON'T see these logs**, the worker isn't starting at all.

### 2. Check for Worker Activity
When you create a job, you should see:
```
[Worker] Notified of new jobs, setting flag to true
[Worker] Checking for pending items...
[Worker] Claimed X item(s) for processing
[Worker] Processing item X (product: Y, attribute: Z)
```

**If you DON'T see these logs**, the worker is idle.

### 3. Verify Environment Variables on Render
Go to your Render dashboard → Environment tab and verify:
- `OPENAI_API_KEY` is set (should start with `sk-`)
- `DATABASE_URL` is set
- `WIX_APP_ID` is set
- `WIX_APP_SECRET` is set

### 4. Run Diagnostic Scripts
You can run these scripts on Render to diagnose issues:

```bash
# Check worker status and database state
node backend/check-worker-status.js

# Manually test worker with one item
node backend/test-worker-manually.js
```

## Common Issues

### Issue 1: OPENAI_API_KEY Missing
**Symptom**: Worker starts but fails when processing items
**Solution**: Add `OPENAI_API_KEY` to Render environment variables

### Issue 2: Worker Not Starting
**Symptom**: No `[Worker]` logs in Render
**Solution**: Check for errors during server startup, verify database connection

### Issue 3: Items Stuck in PENDING
**Symptom**: Items created but never move to RUNNING
**Solution**: 
- Check if worker is running (look for logs)
- Verify `notifyJobCreated()` is being called
- Check database connection

### Issue 4: Items Move to RUNNING but Never Complete
**Symptom**: Items stuck in RUNNING status
**Solution**:
- Check for errors in worker logs
- Verify Wix API credentials are valid
- Check OpenAI API key is valid
- Look for rate limiting or API errors

## Next Steps

1. **Deploy the updated code** to Render
2. **Check the logs** immediately after deployment for worker startup messages
3. **Create a test job** and watch the logs for worker activity
4. **If still not working**, run the diagnostic scripts to identify the issue

## Expected Behavior

When everything is working correctly:
1. User creates a job → `[Worker] Notified of new jobs`
2. Worker checks database → `[Worker] Checking for pending items...`
3. Worker claims items → `[Worker] Claimed X item(s)`
4. Worker processes each item:
   - Fetches product from Wix
   - Calls OpenAI for optimization
   - Saves result to database
5. Worker updates job status → `[Worker] Marked X job(s) as DONE`
