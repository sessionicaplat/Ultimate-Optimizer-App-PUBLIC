# Blog Worker Status Loop Fix

## Problem
The worker was stuck in an infinite loop processing the same generation repeatedly:
```
[Blog Worker] Processing generation 1
[Blog Worker] Processing generation 1
[Blog Worker] Processing generation 1
...
```

## Root Cause
After generating blog ideas, the worker set the status back to `'PENDING'`:
```typescript
await updateBlogGeneration(generationId, {
  blog_ideas: ideas,
  status: 'PENDING', // ❌ This causes it to be picked up again immediately!
});
```

Since the worker queries for `WHERE status = 'PENDING'`, it would immediately pick up the same generation again, creating an infinite loop.

## Solution
Introduced a new status: `'AWAITING_SELECTION'`

### Status Flow
1. **PENDING** → Worker picks up and starts processing
2. **GENERATING_IDEAS** → OpenAI generates 5 ideas
3. **AWAITING_SELECTION** → Ideas ready, waiting for user to select ✅ NEW
4. User selects idea → Status set back to **PENDING**
5. **GENERATING_CONTENT** → Worker generates full blog
6. **GENERATING_IMAGE** → Replicate generates image
7. **PUBLISHING** → Creates Wix draft post
8. **DONE** → Complete!

## Changes Made

### 1. Worker (`blogGenerationWorker.ts`)
```typescript
// After generating ideas
await updateBlogGeneration(generationId, {
  blog_ideas: ideas,
  status: 'AWAITING_SELECTION', // ✅ Won't be picked up again
});
```

### 2. Routes (`blogGeneration.ts`)
```typescript
// When user selects an idea
await updateBlogGeneration(id, {
  selected_idea_index: ideaIndex,
  status: 'PENDING', // ✅ Set back to PENDING so worker continues
});
```

### 3. Frontend (`OngoingBlogGeneration.tsx`)
- Added `'AWAITING_SELECTION'` to status messages
- Updated progress calculation
- Updated idea selection condition

## How It Works Now

1. **User creates generation** → Status: PENDING
2. **Worker generates ideas** → Status: AWAITING_SELECTION (stops here)
3. **User selects idea** → Status: PENDING (worker picks up again)
4. **Worker generates content** → Status: GENERATING_CONTENT
5. **Worker generates image** → Status: GENERATING_IMAGE
6. **Worker publishes** → Status: PUBLISHING
7. **Complete** → Status: DONE

## Benefits

1. ✅ **No More Infinite Loop**: Worker stops after generating ideas
2. ✅ **Clear State**: AWAITING_SELECTION clearly indicates user action needed
3. ✅ **Proper Flow**: Worker only processes when status is PENDING
4. ✅ **Better UX**: User sees "Ideas ready - please select one"

## Testing

After this fix:
- [ ] Worker generates ideas once
- [ ] Worker stops and waits
- [ ] User can select idea
- [ ] Worker continues after selection
- [ ] No infinite loops in logs
- [ ] Status updates correctly

## Database Note

The `status` column in `blog_generations` table accepts TEXT, so `'AWAITING_SELECTION'` works without migration. If you want to enforce valid statuses, you could add a CHECK constraint:

```sql
ALTER TABLE blog_generations 
ADD CONSTRAINT valid_status 
CHECK (status IN ('PENDING', 'GENERATING_IDEAS', 'AWAITING_SELECTION', 'GENERATING_CONTENT', 'GENERATING_IMAGE', 'PUBLISHING', 'DONE', 'FAILED'));
```

But this is optional - the current TEXT column works fine.
