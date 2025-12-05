# Publish Status & Bulk Publishing Feature

## Changes Made

### Backend Changes

**backend/src/routes/jobs.ts**
- Updated `GET /api/jobs/:id/items` endpoint to include `published` status
- Queries `publish_logs` table to check if each item has been published
- Returns `published: true/false` for each item

### Frontend Changes

**frontend/src/pages/CompletedJobs.tsx**
1. Added `published?: boolean` to `JobItem` interface
2. Updated UI to show published status:
   - Green "✓ Published" badge next to published items
   - "Published" button (disabled) for published items
   - Hide checkbox for published items (can't select for bulk publish)
3. Updated `handlePublishItem` to mark items as published in local state after successful publish
4. Updated `handleBulkPublish` to mark all successfully published items
5. Only unpublished items can be selected for bulk publishing

**frontend/src/pages/CompletedJobs.css**
- Added `.published-badge` styling (green badge with checkmark)
- Added `.publish-btn.published` styling (gray, disabled appearance)
- Added `.item-checkbox` styling

## Features

### 1. Published Status Tracking
- Items that have been published show a green "✓ Published" badge
- Published items cannot be republished (button shows "Published" and is disabled)
- Published items are excluded from bulk selection

### 2. Bulk Publishing
- Select multiple unpublished items using checkboxes
- Click "Publish Selected" to publish all at once
- Shows success/failure count after bulk publish
- Automatically marks successful items as published

### 3. Visual Feedback
- Success banner: "Content published successfully!" or "X items published successfully!"
- Error banner: Shows specific error messages or "X succeeded, Y failed"
- Publishing state: Buttons show "Publishing..." while in progress
- Published items: Gray "Published" button with disabled state

## How It Works

1. **Check Published Status**
   - When job items are fetched, backend queries `publish_logs` table
   - Matches `product_id` and `attribute` to determine if item was published
   - Returns `published: true` for items found in publish_logs

2. **Publish Item**
   - User clicks "Publish" button
   - POST to `/api/publish` with `itemIds`
   - On success, creates entry in `publish_logs` table
   - Frontend updates local state to mark item as published

3. **Bulk Publish**
   - User selects multiple items via checkboxes
   - Clicks "Publish Selected"
   - All selected items published in single API call
   - UI updates to show which items succeeded/failed

## Database Schema

The `publish_logs` table tracks published items:
```sql
CREATE TABLE publish_logs (
  id BIGSERIAL PRIMARY KEY,
  instance_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  attribute TEXT NOT NULL,
  applied_value TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## User Experience

### Before Publishing
- Item shows checkbox (can select for bulk)
- "Publish" button is blue and clickable
- "View Changes" button available

### After Publishing
- Item shows green "✓ Published" badge
- No checkbox (can't select)
- "Published" button is gray and disabled
- "View Changes" still available

### Bulk Publishing
1. Select multiple items using checkboxes
2. Banner appears: "X items selected"
3. Click "Publish Selected"
4. Success message: "X items published successfully!"
5. All published items update to show published status

## Testing

1. **Single Publish**
   - Complete a job
   - Click "Publish" on an item
   - Verify "Published" badge appears
   - Verify button changes to "Published" (disabled)
   - Refresh page - status should persist

2. **Bulk Publish**
   - Select 3-4 items
   - Click "Publish Selected"
   - Verify all items update to published status
   - Verify success message shows correct count

3. **Mixed Results**
   - If some items fail, verify error message shows counts
   - Verify only successful items marked as published

4. **Persistence**
   - Publish items
   - Refresh page
   - Verify published status persists
   - Verify can't republish same items
