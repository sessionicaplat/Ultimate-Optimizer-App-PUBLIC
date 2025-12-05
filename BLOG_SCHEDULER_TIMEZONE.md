# Blog Scheduler Timezone Handling

## Overview
The blog scheduler uses **UTC (Coordinated Universal Time)** for all database storage and comparisons, while displaying times in the **user's local timezone** in the UI.

## How It Works

### Frontend (User's Local Timezone)
1. **Date/Time Input**: User selects date and time using HTML5 date/time inputs
   - These inputs use the user's browser/system timezone
   - Example: User in PST selects "Dec 25, 2024 at 10:00 AM PST"

2. **Conversion to UTC**: When adding to schedule, the local datetime is converted to UTC
   ```typescript
   const localDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
   const utcDateTime = localDateTime.toISOString(); // Converts to UTC
   ```
   - Example: "Dec 25, 2024 10:00 AM PST" → "2024-12-25T18:00:00.000Z" (UTC)

3. **Display**: When showing scheduled times, UTC is converted back to local
   ```typescript
   new Date(blog.scheduledDate).toLocaleString(undefined, {
     dateStyle: 'medium',
     timeStyle: 'short'
   })
   ```
   - Shows: "Dec 25, 2024, 10:00 AM" (in user's timezone)

### Backend (UTC)
1. **Storage**: All `scheduled_date` values stored in PostgreSQL as UTC timestamps
   - Column type: `TIMESTAMP` (stores UTC)
   - Example: `2024-12-25 18:00:00` (UTC)

2. **Worker Comparison**: Every minute, checks for due blogs
   ```sql
   SELECT * FROM scheduled_blogs 
   WHERE status = 'SCHEDULED' 
   AND scheduled_date <= NOW() AT TIME ZONE 'UTC'
   ```
   - `NOW()` returns current UTC time
   - Compares UTC to UTC

3. **Execution**: When `scheduled_date <= current UTC time`, blog generation starts

## Timezone Indicator
The UI displays the user's timezone for clarity:
```
All times are in your local timezone (America/Los_Angeles)
```

## Example Scenarios

### Scenario 1: User in PST (UTC-8)
- User schedules: "Jan 1, 2025 at 9:00 AM"
- Stored in DB: "2025-01-01 17:00:00 UTC"
- Worker triggers: When UTC time reaches 17:00:00
- User sees execution: At their 9:00 AM PST

### Scenario 2: User in EST (UTC-5)
- User schedules: "Jan 1, 2025 at 12:00 PM"
- Stored in DB: "2025-01-01 17:00:00 UTC"
- Worker triggers: When UTC time reaches 17:00:00
- User sees execution: At their 12:00 PM EST

### Scenario 3: User in Tokyo (UTC+9)
- User schedules: "Jan 2, 2025 at 2:00 AM"
- Stored in DB: "2025-01-01 17:00:00 UTC"
- Worker triggers: When UTC time reaches 17:00:00
- User sees execution: At their 2:00 AM JST

## Debugging

### Check Current Times
```sql
-- Current UTC time in database
SELECT NOW() AT TIME ZONE 'UTC';

-- Scheduled blogs with time comparison
SELECT 
  id,
  scheduled_date,
  NOW() AT TIME ZONE 'UTC' as current_utc,
  scheduled_date <= NOW() AT TIME ZONE 'UTC' as is_due
FROM scheduled_blogs
WHERE status = 'SCHEDULED';
```

### Worker Logs
The worker logs include timestamps for debugging:
```
[Blog Scheduler Worker] Checking for due blogs at 2024-12-25T18:00:00.000Z
[Blog Scheduler Worker] Found 3 due scheduled blogs
[Blog Scheduler DB] Due blogs found: [
  { id: 1, scheduled_date: '2024-12-25T17:00:00.000Z', now: '2024-12-25T18:00:00.000Z' }
]
```

## Important Notes

1. **Worker Frequency**: Checks every 60 seconds (1 minute)
   - Blogs may execute up to 59 seconds after scheduled time
   - This is normal and expected behavior

2. **Daylight Saving Time**: Automatically handled by JavaScript Date API
   - User's browser handles DST transitions
   - UTC storage is unaffected by DST

3. **Server Timezone**: Server timezone doesn't matter
   - All comparisons use UTC
   - PostgreSQL `NOW()` returns UTC
   - Worker uses UTC for all operations

4. **Migration Considerations**: 
   - Database column is `TIMESTAMP` (not `TIMESTAMPTZ`)
   - All values treated as UTC
   - No timezone conversion needed in database

## Testing

To test timezone handling:

1. **Schedule a blog 2 minutes in the future**
2. **Check worker logs** to see when it picks up the blog
3. **Verify execution** happens at the correct local time

Example test:
```javascript
// In browser console (PST timezone)
const now = new Date();
const in2min = new Date(now.getTime() + 2 * 60000);
console.log('Local time:', in2min.toLocaleString());
console.log('UTC time:', in2min.toISOString());
// Schedule blog with this time and watch worker logs
```

## Troubleshooting

### Blog not executing at scheduled time?
1. Check worker is running: Look for `[Blog Scheduler Worker] Starting...` in logs
2. Check scheduled time in database: `SELECT scheduled_date FROM scheduled_blogs WHERE id = X;`
3. Compare to current UTC: `SELECT NOW() AT TIME ZONE 'UTC';`
4. Check worker logs for "Checking for due blogs" messages

### Time showing incorrectly in UI?
1. Verify browser timezone: `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. Check stored UTC value in database
3. Verify conversion: `new Date('2024-12-25T18:00:00.000Z').toLocaleString()`

### Worker not picking up due blogs?
1. Restart the backend server to restart the worker
2. Check database query: Run the `getDueScheduledBlogs()` query manually
3. Verify blog status is 'SCHEDULED' (not 'PROCESSING' or other)
