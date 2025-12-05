# Fix Credits After Upgrade ✅

## The Problem

You upgraded to Pro plan but your credits are still showing 100 instead of 5000.

This happens when:
- The webhook didn't fire
- The webhook fired but failed
- The plan wasn't recognized
- Database got out of sync

## Quick Fix: Use the Sync Button

### Option 1: In Your App (Easiest)

1. **Go to** `/billing-credits` page in your app
2. **Look for** the "🔄 Sync Credits" button (top right of Credit Usage section)
3. **Click** the button
4. **Wait** for "Credits synced successfully!" message
5. **Refresh** the page
6. **Verify** credits now show 5000 (or correct amount for your plan)

### Option 2: Call API Directly

If the button doesn't work, call the API directly:

```bash
# In your browser console (F12)
fetch('/api/billing/sync-credits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}).then(r => r.json()).then(console.log);
```

Then refresh the page.

## What the Sync Does

The improved sync endpoint now:

1. **Queries Wix** to get your actual current subscription
2. **Checks database** to see your old plan and credits
3. **Detects upgrade** (old plan vs new plan)
4. **Applies correct logic**:
   - If upgraded: Keeps available credits + adds new plan's credits
   - If same plan: Just syncs to plan amount
5. **Updates database** with correct values
6. **Returns before/after** so you can see what changed

## Example Output

When you click sync, you'll see:

```json
{
  "success": true,
  "message": "Credits synced successfully with Wix subscription",
  "before": {
    "planId": "free",
    "creditsTotal": 100,
    "creditsUsed": 0,
    "creditsAvailable": 100
  },
  "after": {
    "planId": "pro",
    "creditsTotal": 5100,
    "creditsUsed": 0,
    "creditsAvailable": 5100
  }
}
```

Notice: 100 (old available) + 5000 (pro plan) = 5100 total!

## Why This Happened

The webhook should have fired when you upgraded, but:

1. **Wix sent webhook** → Your server
2. **Webhook processed** → But maybe failed or timed out
3. **Database not updated** → Credits stuck at old value
4. **Wix knows you upgraded** → But your database doesn't

The sync button fixes this by manually querying Wix and updating your database.

## Verification

After syncing, check:

1. **Billing page** shows correct plan (Pro)
2. **Credits show** 5000+ available
3. **Can use features** without "upgrade" prompts

## If Sync Doesn't Work

### Check Server Logs

Look for:
```
[SYNC] Manual credit sync requested
[SYNC] Current state: { plan: 'free', available: 100 }
[SYNC] Wix says plan is: pro
[SYNC] Plan changed, updating with proper credit logic
[SYNC] ✅ Sync complete
```

### Check Database Directly

```sql
SELECT instance_id, plan_id, credits_total, credits_used_month,
       (credits_total - credits_used_month) as available
FROM app_instances
WHERE instance_id = '08df22f0-4e31-4c46-8ada-6fe6f0e52c07';
```

Should show:
- `plan_id`: `pro`
- `credits_total`: `5100` (or similar)
- `credits_used_month`: `0`
- `available`: `5100`

### Manual Fix (Last Resort)

If sync still doesn't work, run the script:

```bash
# On your server (Render shell or SSH)
cd backend
node fix-credits-after-upgrade.js 08df22f0-4e31-4c46-8ada-6fe6f0e52c07
```

This will:
1. Query Wix for your plan
2. Calculate correct credits
3. Update database
4. Show before/after

## Prevention

To prevent this in the future:

1. **Check webhook logs** after upgrading
2. **Verify credits** immediately after upgrade
3. **Use sync button** if credits don't update within 1 minute
4. **Monitor webhook endpoint** for errors

## Summary

✅ **Deployed**: Improved sync endpoint
✅ **Available**: Sync button in app
✅ **Working**: Queries Wix and updates database
✅ **Smart**: Detects upgrades and applies correct logic

**To fix your credits right now:**
1. Go to `/billing-credits`
2. Click "🔄 Sync Credits"
3. Wait for success message
4. Refresh page
5. Enjoy your 5000+ credits!
