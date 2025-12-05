# Blog Worker Infinite Loop Fix

## Issue
The blog generation worker was stuck in an infinite loop, constantly querying the database with:
```
[Blog Worker] Generation 1 not found
```

## Root Cause
The `processBlogGeneration` function was calling `getBlogGeneration(generationId, '')` with an empty string for `instance_id`. 

The `getBlogGeneration` function requires both `id` and `instance_id` to find a record:
```typescript
SELECT * FROM blog_generations
WHERE id = $1 AND instance_id = $2
```

Since `instance_id = ''` never matches any record, it always returned `null`, causing the worker to:
1. Not find the generation
2. Return early
3. Immediately try again
4. Loop infinitely

## Fix Applied

Changed the worker to query directly without the `instance_id` check, since the worker has access to all generations:

### Before (Broken)
```typescript
const generation = await getBlogGeneration(generationId, '');
```

### After (Fixed)
```typescript
const generationResult = await query(
  `SELECT * FROM blog_generations WHERE id = $1`,
  [generationId]
);
const generation = generationResult.rows[0];
```

## Why This Works

1. **Worker Context**: The background worker processes all generations regardless of instance, so it doesn't need instance_id filtering
2. **Direct Query**: Bypasses the instance_id check that's meant for API routes
3. **Proper Access**: Worker still validates the instance exists when fetching instance data

## Files Modified

- `backend/src/workers/blogGenerationWorker.ts`
  - Removed `getBlogGeneration` import
  - Added `query` import from `../db/index`
  - Changed generation lookup to direct SQL query

## Testing

After this fix:
1. ✅ Worker finds pending generations
2. ✅ Processes them without looping
3. ✅ Generates blog ideas successfully
4. ✅ No more infinite database queries

## Prevention

For future workers:
- Workers should use direct queries when processing all records
- API helper functions with instance_id checks are for user-facing routes only
- Always test worker loops with actual data to catch infinite loops early
