# Worker Status Investigation

## Current Findings

Based on the Render logs, we can confirm:

### ✅ Worker IS Running
```
[Worker] Heartbeat - cycle 30, hasPendingJobs: false
[Worker] Heartbeat - cycle 45, hasPendingJobs: false
```

### ✅ Worker IS Checking for Jobs
```
[Worker] Checking for pending items...
[Worker] No pending items found, going idle
```

### ❌ Problem: No PENDING Items Found
The worker query returns 0 rows:
```sql
WHERE status = 'PENDING'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT $1
```

## Possible Causes

1. **Items are created with wrong status** - Unlikely, schema has `default: 'PENDING'`
2. **Items are processed so fast they're already DONE** - Possible but unlikely
3. **Items are marked FAILED immediately** - Most likely
4. **Race condition** - Items change status before worker can claim them

## Theory

Looking at the logs, I see:
- Job is created
- Worker checks for pending items
- Finds 0 items
- Job shows as FAILED in UI

This suggests items are being marked as FAILED **before** the worker can process them, or **during** creation.

## New Logging Added

### Enhanced Status Updates
- Logs when jobs transition to RUNNING, DONE, or FAILED
- Shows which specific items caused a job to fail
- Displays error messages for failed items

### Enhanced Item Processing
- Logs each claimed item's details
- Step-by-step processing logs
- Full error stack traces

## Next Steps

1. **Deploy these changes**
2. **Create a new test job**
3. **Look for these specific log patterns:**

### Pattern 1: Items Created and Processed
```
[Jobs API] Notifying worker of new job...
[Worker] Notified of new jobs, setting flag to true
[Worker] Checking for pending items...
[Worker] Claimed X item(s) for processing
[Worker]   Item X: product=Y, attribute=Z
[Worker] Processing item X...
```

### Pattern 2: Items Created but Immediately Failed
```
[Jobs API] Notifying worker of new job...
[Worker] Checking for pending items...
[Worker] No pending items found
[Worker] Updating job statuses...
[Worker] Marked X job(s) as FAILED
[Worker]   Job X -> FAILED due to Y failed item(s):
[Worker]     Item X (attribute): [error message]
```

### Pattern 3: Items Never Created
```
[Jobs API] Notifying worker of new job...
[Worker] Checking for pending items...
[Worker] No pending items found
```

## Hypothesis

My current hypothesis is that the items ARE being created with PENDING status, but something is causing them to fail immediately - possibly:
- Wix API authentication error
- Product not found error
- Attribute extraction error
- OpenAI API key missing/invalid

The enhanced logging will show us exactly which error is occurring.
