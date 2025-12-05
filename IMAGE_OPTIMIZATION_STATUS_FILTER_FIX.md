# Image Optimization - Status Filter Fix

## Problem

When the frontend tried to fetch ongoing jobs with multiple statuses, it failed with a PostgreSQL error:

```
error: invalid input value for enum job_status: "PENDING,RUNNING"
```

The API call was:
```
GET /api/image-optimization/jobs?status=PENDING,RUNNING
```

## Root Cause

The `getImageOptimizationJobs` function was treating the status parameter as a single value:

```typescript
// ❌ BEFORE (Wrong)
if (status) {
  queryText += ` AND status = $2`;
  params.push(status.toUpperCase());
}
```

When the frontend passed `"PENDING,RUNNING"`, PostgreSQL tried to match it as a single enum value, which doesn't exist.

## Solution

Updated the function to handle comma-separated status values using SQL `IN` clause:

```typescript
// ✅ AFTER (Correct)
if (status) {
  // Handle comma-separated status values (e.g., "PENDING,RUNNING")
  const statuses = status.split(',').map(s => s.trim().toUpperCase());
  const placeholders = statuses.map((_, i) => `$${i + 2}`).join(', ');
  queryText += ` AND status IN (${placeholders})`;
  params.push(...statuses);
}
```

### How It Works

1. **Split the string:** `"PENDING,RUNNING"` → `["PENDING", "RUNNING"]`
2. **Create placeholders:** `["$2", "$3"]` → `"$2, $3"`
3. **Build query:** `WHERE instance_id = $1 AND status IN ($2, $3)`
4. **Pass parameters:** `[instanceId, "PENDING", "RUNNING"]`

### Example Queries

**Single status:**
```
GET /api/image-optimization/jobs?status=DONE
SQL: WHERE instance_id = $1 AND status IN ($2)
Params: [instanceId, "DONE"]
```

**Multiple statuses:**
```
GET /api/image-optimization/jobs?status=PENDING,RUNNING
SQL: WHERE instance_id = $1 AND status IN ($2, $3)
Params: [instanceId, "PENDING", "RUNNING"]
```

**No status filter:**
```
GET /api/image-optimization/jobs
SQL: WHERE instance_id = $1 ORDER BY created_at DESC
Params: [instanceId]
```

## Testing

### Before Fix:
```
GET /api/image-optimization/jobs?status=PENDING,RUNNING
❌ 500 Internal Server Error
Error: invalid input value for enum job_status: "PENDING,RUNNING"
```

### After Fix:
```
GET /api/image-optimization/jobs?status=PENDING,RUNNING
✅ 200 OK
Returns: { jobs: [...] }
```

## Impact

This fix allows the frontend pages to properly filter jobs:

- **Ongoing Page:** Fetches jobs with `status=PENDING,RUNNING`
- **Completed Page:** Fetches jobs with `status=DONE`
- **All Jobs:** Fetches without status filter

## Files Changed

- `backend/src/db/imageOptimization.ts` - Updated `getImageOptimizationJobs` function

## Status

✅ **Fixed and Ready to Deploy**

The ongoing and completed pages will now work correctly.

---

**Issue:** PostgreSQL enum error with comma-separated statuses  
**Fix:** Parse comma-separated values and use SQL IN clause  
**Status:** Resolved ✅
