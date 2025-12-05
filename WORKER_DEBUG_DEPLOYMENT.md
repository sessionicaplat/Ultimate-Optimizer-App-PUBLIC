# Worker Debug Deployment

## Changes Made

### Enhanced Worker Logging
Added detailed logging throughout the worker to diagnose why jobs are failing immediately:

1. **Worker Heartbeat** - Logs every 30 seconds to confirm worker is running
2. **Detailed Processing Logs** - Step-by-step logging for each item:
   - Fetching job context
   - Creating Wix client
   - Fetching product from Wix
   - Extracting attribute value
   - Calling OpenAI
   - Saving results
3. **Error Stack Traces** - Full error details when failures occur
4. **Job Creation Notification** - Logs when worker is notified of new jobs

### Files Modified
- `backend/src/workers/jobWorker.ts` - Added extensive logging
- `backend/src/routes/jobs.ts` - Added logging for worker notification

### Test Scripts Created
- `backend/test-worker-process.js` - Manual test to check worker prerequisites
- `backend/check-job-items.js` - Check job items status and errors

## Deployment Steps

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Add detailed worker logging for debugging"
   git push
   ```

2. **Wait for Render to deploy** (auto-deploy should trigger)

3. **Create a new test job** from the Product Optimizer page

4. **Check Render logs** for these key messages:

### Expected Log Messages

**On Server Start:**
```
[Worker] Starting background job worker...
[Worker] OpenAI API key is configured
[Worker] Initializing pending jobs flag...
[Worker] ✅ Initialized with X pending item(s), flag set to: true/false
```

**Every 30 seconds (heartbeat):**
```
[Worker] Heartbeat - cycle X, hasPendingJobs: true/false
```

**When Job is Created:**
```
Job created: X for instance Y, credits: Z
[Jobs API] Notifying worker of new job...
[Worker] Notified of new jobs, setting flag to true
[Jobs API] Worker notified
```

**When Processing Items:**
```
[Worker] Checking for pending items...
[Worker] Claimed X item(s) for processing
[Worker] Processing item X (product: Y, attribute: Z)
[Worker] Fetching job context for item X...
[Worker] Got instance Y and job Z
[Worker] Creating Wix client for item X...
[Worker] Fetching product Y from Wix...
[Worker] Got product: [Product Name]
[Worker] Extracting attribute 'Z' from product...
[Worker] Before value length: X chars
[Worker] Calling OpenAI to optimize Z...
[Worker] Got optimized value, length: X chars
[Worker] Saving results for item X...
[Worker] ✅ Successfully processed item X
```

**If Errors Occur:**
```
[Worker] ❌ Failed to process item X: [error message]
[Worker] Error stack: [stack trace]
```

## Troubleshooting

### If No Worker Logs Appear
- Worker might be crashing on startup
- Check for database connection errors
- Verify OPENAI_API_KEY is set in Render environment variables

### If Worker Heartbeat Shows but No Processing
- Check if `hasPendingJobs` is false
- Verify job items are being created with PENDING status
- Check if `notifyJobCreated()` is being called

### If Processing Starts but Fails
- Look for the specific error message in logs
- Common issues:
  - Wix API authentication (401 errors)
  - Product not found (404 errors)
  - OpenAI API errors (rate limits, invalid key)
  - Attribute extraction errors (missing fields)

## Next Steps After Deployment

1. Monitor Render logs during job creation
2. Identify the exact point of failure
3. Fix the specific issue based on error messages
4. Consider adding retry logic for transient failures
