# Blog Scheduler Timezone Fix

## Problem
Campaigns were not running at their scheduled times because:
1. Frontend was sending dates in local timezone format without proper UTC conversion
2. Backend was comparing mixed timezone values
3. No timezone indicator for users

## Solution Implemented

### 1. Frontend UTC Conversion
**File**: `frontend/src/pages/BlogScheduler.tsx`

Changed from:
```typescript
const dateTime = `${scheduledDate}T${scheduledTime}:00`;
onAddToSchedule(idea, dateTime);
```

To:
```typescript
const localDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
const utcDateTime = localDateTime.toISOString(); // Converts to UTC
onAddToSchedule(idea, utcDateTime);
```

**Result**: All scheduled dates are now properly converted to UTC before sending to backend.

### 2. Backend UTC Comparison
**File**: `backend/src/db/blogScheduler.ts`

Enhanced the query:
```sql
SELECT * FROM scheduled_blogs 
WHERE status = 'SCHEDULED' AND scheduled_date <= NOW() AT TIME ZONE 'UTC'
ORDER BY scheduled_date ASC
LIMIT 10
```

Added debug logging to track due blogs.

### 3. Worker Logging
**File**: `backend/src/workers/blogSchedulerWorker.ts`

Added timestamp logging:
```typescript
const currentTime = new Date().toISOString();
console.log(`[Blog Scheduler Worker] Checking for due blogs at ${currentTime}`);
```

**Result**: Better visibility into when worker checks for due blogs.

### 4. User Timezone Display
**Files**: 
- `frontend/src/pages/BlogScheduler.tsx`
- `frontend/src/pages/Campaigns.tsx`

Added timezone indicator:
```typescript
<p className="timezone-info">
  All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
</p>
```

Improved date display:
```typescript
new Date(blog.scheduledDate).toLocaleString(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
})
```

**Result**: Users see their local timezone and formatted dates.

## How It Works Now

### User Flow
1. User selects date/time in their local timezone (e.g., "Dec 25, 2024 at 10:00 AM PST")
2. Frontend converts to UTC (e.g., "2024-12-25T18:00:00.000Z")
3. Backend stores UTC timestamp in database
4. Worker checks every minute if `scheduled_date <= current UTC time`
5. When due, worker creates blog generation
6. UI displays times back in user's local timezone

### Example
- **User in Los Angeles (PST, UTC-8)**
  - Schedules: "Jan 1, 2025 at 9:00 AM"
  - Stored as: "2025-01-01T17:00:00.000Z" (UTC)
  - Executes: When UTC time reaches 17:00:00
  - User sees: "Jan 1, 2025, 9:00 AM" (their local time)

- **User in New York (EST, UTC-5)**
  - Schedules: "Jan 1, 2025 at 12:00 PM"
  - Stored as: "2025-01-01T17:00:00.000Z" (UTC)
  - Executes: When UTC time reaches 17:00:00
  - User sees: "Jan 1, 2025, 12:00 PM" (their local time)

## Testing

### Quick Test
1. Schedule a blog 2-3 minutes in the future
2. Watch backend logs for:
   ```
   [Blog Scheduler Worker] Checking for due blogs at 2024-12-25T18:00:00.000Z
   [Blog Scheduler Worker] Found 1 due scheduled blogs
   [Blog Scheduler Worker] Created blog generation X for scheduled blog Y
   ```
3. Verify blog generation starts at the correct time

### Database Check
```sql
-- See all scheduled blogs with UTC times
SELECT 
  id,
  scheduled_date,
  NOW() AT TIME ZONE 'UTC' as current_utc,
  scheduled_date <= NOW() AT TIME ZONE 'UTC' as is_due,
  status
FROM scheduled_blogs
WHERE status = 'SCHEDULED'
ORDER BY scheduled_date;
```

## Important Notes

1. **Worker runs every 60 seconds** - Blogs may execute up to 59 seconds after scheduled time
2. **All times stored in UTC** - Database uses UTC, no timezone conversion needed
3. **UI shows local time** - JavaScript automatically converts UTC to user's timezone
4. **DST handled automatically** - Browser handles daylight saving time transitions
5. **Server timezone irrelevant** - All operations use UTC

## Deployment

After deploying these changes:
1. Restart the backend server to restart the worker
2. Existing scheduled blogs will work correctly (already in UTC if created after this fix)
3. New scheduled blogs will use proper UTC conversion
4. Users will see timezone indicator in UI

## Monitoring

Check logs for these messages:
- `[Blog Scheduler Worker] Starting...` - Worker started successfully
- `[Blog Scheduler Worker] Checking for due blogs at...` - Worker running (every minute)
- `[Blog Scheduler Worker] Found X due scheduled blogs` - Due blogs detected
- `[Blog Scheduler Worker] Created blog generation...` - Blog generation started

If blogs aren't executing:
1. Verify worker is running (check for "Starting..." message)
2. Check scheduled_date in database is in the past (UTC)
3. Verify status is 'SCHEDULED' (not 'PROCESSING' or other)
4. Check worker logs for errors
