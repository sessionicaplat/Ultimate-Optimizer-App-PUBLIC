# Diagnosis: Why App Shows "Free" Instead of "Pro"

## The Problem
The app is showing as "Free Plan" in the test cancellation page, but you've purchased the "Pro" plan in the Wix store.

## Root Cause Analysis

### How Plan Updates Work

1. **User Purchases Plan in Wix**
   - User goes to Wix dashboard
   - Upgrades to "Pro" plan
   - Completes payment

2. **Wix Sends Webhook**
   - Wix sends webhook to `/api/webhooks/billing`
   - Webhook contains invoice status and plan information
   - Your app processes the webhook

3. **Database Gets Updated**
   - `updateInstancePlan()` function is called
   - Updates `app_instances.plan_id` to "pro"
   - Updates `credits_total` to match the plan

### Where It's Failing

The issue is likely in **one of these places**:

#### 1. Webhook Not Received
**Check**: Did Wix send the webhook after purchase?

**Possible Causes**:
- Webhook URL not configured in Wix Developer Dashboard
- Webhook URL is incorrect
- Webhook delivery failed
- Webhook signature verification failed

**How to Check**:
```bash
# Check your server logs for:
"Billing webhook event received"
"Invoice status: PAID"
"Updating instance plan"
```

#### 2. Webhook Received But Plan Not Extracted
**Check**: Is the plan ID being extracted correctly from the webhook?

**The Code** (`billing.ts` line 133-145):
```typescript
function extractPlanId(purchasedItem: any): string | null {
  if (!purchasedItem) {
    return null;
  }
  const planName = purchasedItem.name || purchasedItem.planName || purchasedItem.id || '';
  return normalizePlanId(planName);
}
```

**Possible Issue**: The webhook data structure might not match what the code expects.

**How to Check**:
Look in logs for:
```
Event data: { ... }
```
See what fields are actually in the webhook payload.

#### 3. Plan ID Not Normalized Correctly
**Check**: Is "pro" being mapped correctly?

**The Code** (`billing.ts` line 327-348):
```typescript
function normalizePlanId(planId: string): string {
  const normalized = planId.toLowerCase().trim();
  
  const planMap: Record<string, string> = {
    'free': 'free',
    'starter': 'starter',
    'pro': 'pro',
    'scale': 'scale',
  };
  
  for (const [key, value] of Object.entries(planMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return planMap[normalized] || 'free';  // ⚠️ Defaults to 'free'
}
```

**Possible Issue**: If the webhook sends "professional" or "premium" instead of "pro", it won't match and defaults to "free".

#### 4. Database Not Updated
**Check**: Did the database update succeed?

**How to Check**:
Look in logs for:
```
✅ Instance plan updated: pro with 5000 credits
```

If you don't see this, the database update failed.

## How to Diagnose

### Step 1: Check Current Database Value
Run this query to see what's actually in the database:

```sql
SELECT instance_id, plan_id, credits_total, credits_used_month, updated_at
FROM app_instances
WHERE instance_id = 'your-instance-id';
```

**Expected**: `plan_id = 'pro'`, `credits_total = 5000`
**If Different**: Database was never updated

### Step 2: Check Server Logs
Look for these log messages after you purchased the plan:

```
✅ Found: "Billing webhook event received"
✅ Found: "Invoice status: PAID"
✅ Found: "Updating instance plan"
✅ Found: "Instance plan updated successfully"
```

**If Missing**: Webhook was never received or processed

### Step 3: Check Webhook Configuration
In Wix Developer Dashboard:

1. Go to your app
2. Find "Webhooks" section
3. Check if webhook URL is configured:
   - URL: `https://your-app.onrender.com/api/webhooks/billing`
   - Event: `onPurchasedItemInvoiceStatusUpdated`
   - Status: Active

**If Not Configured**: Wix isn't sending webhooks to your app

### Step 4: Check Webhook Payload
If webhook was received, check what data it contains:

Look in logs for:
```
Event data: { ... }
```

Check if it contains:
- `name` field with plan name
- `planName` field
- `id` field
- Any field that indicates "pro"

## Solutions

### Solution 1: Webhook Not Configured
**Fix**: Configure webhook in Wix Developer Dashboard

1. Go to https://dev.wix.com/
2. Select your app
3. Go to Webhooks section
4. Add webhook:
   - URL: `https://ultimate-optimizer-app.onrender.com/api/webhooks/billing`
   - Event: Billing events
5. Save

### Solution 2: Webhook Failed to Process
**Fix**: Check webhook signature verification

The webhook might be failing signature verification. Check logs for:
```
Webhook processing error: ...
```

### Solution 3: Plan Name Doesn't Match
**Fix**: Update `normalizePlanId()` function to handle your actual plan names

If Wix sends "professional" instead of "pro", update the mapping:
```typescript
const planMap: Record<string, string> = {
  'free': 'free',
  'starter': 'starter',
  'pro': 'pro',
  'professional': 'pro',  // Add this
  'scale': 'scale',
};
```

### Solution 4: Manual Fix (Temporary)
**Fix**: Manually update the database

```sql
UPDATE app_instances
SET plan_id = 'pro',
    credits_total = 5000,
    credits_used_month = 0
WHERE instance_id = 'your-instance-id';
```

Or use the sync endpoint:
```bash
curl -X POST https://your-app.onrender.com/api/billing/sync-credits \
  -H "X-Wix-Instance: your-instance-token"
```

## What to Check Right Now

1. **Check your Render logs** for webhook activity
2. **Check your database** to see current plan_id value
3. **Check Wix Developer Dashboard** for webhook configuration
4. **Try the manual sync endpoint** to see if it fixes it

## Most Likely Cause

Based on the code, the most likely cause is:

**Webhook was never received or processed**

This means:
- Webhook URL not configured in Wix
- Or webhook delivery failed
- Or webhook signature verification failed

The database still has `plan_id = 'free'` because it was never updated after purchase.

## Next Steps

1. Check Render logs for webhook activity
2. If no webhook logs, configure webhook in Wix Developer Dashboard
3. If webhook logs exist but plan not updated, check the webhook payload structure
4. As a temporary fix, manually update the database or use the sync endpoint
