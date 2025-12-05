# Credits Assignment - Permanent Fix Implementation

## Overview

This document describes the permanent fix implemented to ensure credits are always correctly assigned based on the user's subscription plan.

## Problem Summary

Users on paid plans (Starter, Pro, Scale) were stuck with 100 credits (Free plan allocation) instead of receiving their plan's full credit allocation (1,000, 5,000, or 25,000 credits).

## Root Cause

The issue occurred because:
1. Initial provisioning always set `credits_total = 100` (hardcoded default)
2. Billing webhooks sometimes failed to fire or update credits
3. The `updateInstancePlan()` function had overly complex logic that could prevent updates

## Permanent Fix Implementation

### 1. Simplified `updateInstancePlan()` Function

**File:** `backend/src/db/appInstances.ts`

**Changes:**
- Removed complex downgrade preservation logic
- Now always sets `credits_total` to match the plan's `monthly_credits`
- Resets `credits_used_month` to 0 for fresh start
- Added detailed logging for audit trail

**Benefits:**
- Predictable behavior
- Always syncs credits with plan
- Easier to debug

### 2. Added Credit Sync Functions

**File:** `backend/src/db/appInstances.ts`

**New Functions:**

#### `syncInstanceCredits(instanceId: string)`
- Syncs a single instance's credits with their plan
- Used during provisioning and manual sync
- Logs all changes

#### `syncAllInstanceCredits()`
- Syncs all instances in the database
- Returns count of updated instances
- Used by periodic sync task

### 3. Automatic Sync During Provisioning

**File:** `backend/src/routes/provision.ts`

**Changes:**
- After provisioning, automatically calls `syncInstanceCredits()`
- Ensures credits are correct even if webhook hasn't fired yet
- Catches instances that were created before subscription purchase

### 4. Periodic Credit Sync Task

**File:** `backend/src/tasks/creditSync.ts` (NEW)

**Features:**
- Runs every 6 hours automatically
- Syncs all instances with mismatched credits
- Catches any missed webhook updates
- Logs all sync operations

**Schedule:**
- Runs immediately on server startup
- Then every 6 hours continuously

### 5. Manual Sync Endpoint

**File:** `backend/src/routes/billing.ts`

**New Endpoint:** `POST /api/billing/sync-credits`

**Features:**
- Allows users to manually trigger credit sync
- Authenticated endpoint (requires valid instance token)
- Returns updated credit information
- Useful for immediate fixes

### 6. Server Integration

**File:** `backend/src/server.ts`

**Changes:**
- Imports and starts `creditSyncScheduler` on server startup
- Runs alongside existing credit reset scheduler
- Logs scheduler status

### 7. Frontend Sync Button

**File:** `frontend/src/pages/BillingCredits.tsx`

**New Feature:**
- "🔄 Sync Credits" button in Credit Usage card
- Calls the manual sync endpoint
- Shows loading state during sync
- Refreshes data after successful sync
- User-friendly error handling

## How It Works

### Automatic Sync Flow

```
Server Startup
    ↓
Start Credit Sync Scheduler
    ↓
Run Immediately
    ↓
Check All Instances
    ↓
Update Mismatched Credits
    ↓
Wait 6 Hours
    ↓
Repeat
```

### Provisioning Flow

```
User Installs App
    ↓
POST /api/provision
    ↓
Create/Update Instance (default 100 credits)
    ↓
Sync Credits with Plan
    ↓
Credits Now Match Subscription
```

### Webhook Flow

```
User Purchases Plan
    ↓
Wix Sends Webhook
    ↓
POST /api/webhooks/billing
    ↓
updateInstancePlan(instanceId, planId)
    ↓
Credits Updated to Plan Allocation
```

### Manual Sync Flow

```
User Clicks "Sync Credits"
    ↓
POST /api/billing/sync-credits
    ↓
syncInstanceCredits(instanceId)
    ↓
Credits Updated
    ↓
UI Refreshes
```

## Testing the Fix

### 1. Run Immediate Fix

For existing instances with incorrect credits:

```bash
cd backend
node fix-credits-sync.js
```

This one-time script will fix all existing instances.

### 2. Verify Fix

```bash
cd backend
node check-credits-issue.js
```

Should show no mismatches.

### 3. Test New Installations

1. Install the app on a test site
2. Check credits (should be 100 for free plan)
3. Purchase a paid plan
4. Wait for webhook or click "Sync Credits"
5. Credits should update to plan allocation

### 4. Test Manual Sync

1. Go to Billing & Credits page
2. Click "🔄 Sync Credits" button
3. Should see success message
4. Credits should match current plan

### 5. Monitor Logs

Check server logs for sync operations:

```
[CreditSync] Running credit sync task...
[CreditSync] Successfully synced credits for X instance(s)
```

## Deployment Steps

### 1. Deploy Backend Changes

```bash
git add backend/src/db/appInstances.ts
git add backend/src/routes/provision.ts
git add backend/src/routes/billing.ts
git add backend/src/tasks/creditSync.ts
git add backend/src/server.ts
git commit -m "Fix: Permanent credit assignment fix with auto-sync"
git push
```

### 2. Deploy Frontend Changes

```bash
git add frontend/src/pages/BillingCredits.tsx
git commit -m "Add manual credit sync button"
git push
```

### 3. Run One-Time Fix Script

After deployment, run the fix script to correct existing instances:

```bash
# On production server
cd backend
node fix-credits-sync.js
```

### 4. Verify Deployment

1. Check server logs for scheduler startup
2. Test manual sync button in UI
3. Verify credits display correctly

## Monitoring

### What to Monitor

1. **Credit Sync Logs**
   - Check for sync operations every 6 hours
   - Look for instances being updated

2. **Webhook Logs**
   - Verify webhooks are being received
   - Check for successful plan updates

3. **User Reports**
   - Monitor for credit-related support tickets
   - Should decrease significantly

### Log Examples

**Successful Sync:**
```
[CreditSync] Running credit sync task...
✅ Synced credits for instance abc123: 100 → 5000
[CreditSync] Successfully synced credits for 1 instance(s)
```

**No Sync Needed:**
```
[CreditSync] Running credit sync task...
[CreditSync] All instances already have correct credits
```

**Webhook Update:**
```
Updating instance plan: {
  instanceId: 'abc123',
  oldPlan: 'free',
  newPlan: 'pro',
  oldCreditsTotal: 100,
  newCreditsTotal: 5000,
  oldCreditsUsed: 0,
  newCreditsUsed: 0
}
✅ Instance plan updated: pro with 5000 credits
```

## Benefits of This Fix

### 1. Multiple Safety Nets

- ✅ Provisioning sync (immediate)
- ✅ Webhook updates (real-time)
- ✅ Periodic sync (every 6 hours)
- ✅ Manual sync button (on-demand)

### 2. Self-Healing

- System automatically corrects mismatches
- No manual intervention needed
- Catches missed webhooks

### 3. User Control

- Users can manually sync if needed
- Immediate feedback
- No waiting for support

### 4. Audit Trail

- All sync operations logged
- Easy to debug issues
- Track credit changes

### 5. Simplified Logic

- Predictable behavior
- Easier to maintain
- Fewer edge cases

## Rollback Plan

If issues occur, rollback is simple:

1. **Revert Code Changes:**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Stop Sync Scheduler:**
   - Remove `startCreditSyncScheduler()` from server.ts
   - Redeploy

3. **Remove Sync Button:**
   - Revert frontend changes
   - Redeploy frontend

## Future Enhancements

### Potential Improvements

1. **Webhook Retry Logic**
   - Store failed webhooks
   - Retry automatically

2. **Credit History Table**
   - Track all credit changes
   - Show history in UI

3. **Admin Dashboard**
   - View all instances
   - Manually adjust credits
   - Bulk operations

4. **Alerts**
   - Email when credits mismatch detected
   - Slack notifications for sync operations

5. **Analytics**
   - Track sync frequency
   - Identify webhook reliability issues
   - Monitor credit usage patterns

## Support

### Common Issues

**Q: Credits still showing 100 after upgrade**
A: Click the "🔄 Sync Credits" button or wait up to 6 hours for automatic sync.

**Q: Sync button not working**
A: Check browser console for errors. Verify authentication token is valid.

**Q: Credits reset to 100 unexpectedly**
A: Check if subscription was canceled. Verify webhook logs.

### Debug Commands

```bash
# Check current state
node backend/check-credits-issue.js

# Fix all instances
node backend/fix-credits-sync.js

# Check server logs
tail -f logs/server.log | grep CreditSync
```

## Conclusion

This permanent fix ensures credits are always correctly assigned through multiple redundant mechanisms:

1. **Immediate sync** during provisioning
2. **Real-time updates** via webhooks
3. **Periodic sync** every 6 hours
4. **Manual sync** button for users

The system is now self-healing and requires no manual intervention for credit assignment issues.
