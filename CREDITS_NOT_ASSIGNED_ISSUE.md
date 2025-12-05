# Credits Not Assigned Based on Subscription Plan - Issue Analysis

## Problem Summary

User is on the **Pro plan** but only has **100 credits** available instead of the expected **5,000 credits**.

## Root Cause Analysis

After reviewing the billing and credit system, I've identified the issue:

### The Problem

When a user subscribes to a plan through Wix Billing, the credits are **not automatically updated** to match the subscription plan. Here's why:

1. **Initial Provisioning** (`backend/src/routes/provision.ts`):
   - When the app is first installed, `upsertAppInstance()` creates the instance with:
     - `plan_id = 'free'`
     - `credits_total = 100` (hardcoded default)
   
2. **Subscription Purchase Flow**:
   - User purchases Pro plan through Wix Billing
   - Wix sends webhook to `/api/webhooks/billing`
   - Webhook handler calls `updateInstancePlan(instanceId, 'pro')`
   
3. **The Bug in `updateInstancePlan()`** (`backend/src/db/appInstances.ts`):
   - The function **does** fetch the correct plan's `monthly_credits` from the database
   - It **should** update `credits_total` to match the plan
   - However, there's complex logic for preserving credits during downgrades that may be interfering

### Key Code Locations

**Provision (Initial Setup):**
```typescript
// backend/src/routes/provision.ts
await upsertAppInstance({
  instanceId,
  siteHost,
  accessToken,
  refreshToken,
  expiresIn,
});

// backend/src/db/appInstances.ts - upsertAppInstance()
// Hardcoded defaults on INSERT:
plan_id: 'free',
credits_total: 100,  // ❌ This is the problem
```

**Billing Webhook:**
```typescript
// backend/src/routes/billing.ts
async function handleSubscriptionActive(instanceId: string, planId: string) {
  await updateInstancePlan(instanceId, normalizedPlanId);
}
```

**Update Plan Function:**
```typescript
// backend/src/db/appInstances.ts
export async function updateInstancePlan(instanceId: string, planId: string) {
  // Fetches plan's monthly_credits
  const planResult = await query(
    'SELECT monthly_credits FROM plans WHERE id = $1',
    [planId]
  );
  const newCreditsTotal = planResult.rows[0].monthly_credits;
  
  // Complex logic for preserving credits during downgrades
  // May not be updating credits_total correctly for upgrades
}
```

## Possible Scenarios

### Scenario 1: Webhook Never Fired
- User purchased Pro plan but webhook was never received
- Instance still has `plan_id = 'free'` and `credits_total = 100`

### Scenario 2: Webhook Fired but Plan ID Mismatch
- Webhook received but plan ID from Wix doesn't match database
- `normalizePlanId()` function may not be mapping correctly
- Instance has `plan_id = 'pro'` but `credits_total = 100` (not updated)

### Scenario 3: updateInstancePlan() Logic Issue
- Webhook fired and plan ID matched
- But the complex downgrade preservation logic prevented the update
- Instance has `plan_id = 'pro'` but `credits_total = 100`

## Diagnostic Steps

### Step 1: Check Current Database State

Run the diagnostic script:
```bash
cd backend
node check-credits-issue.js
```

This will show:
- All plans and their credit allocations
- All instances with their current plan and credits
- Any mismatches between `credits_total` and `plan.monthly_credits`

### Step 2: Check Webhook Logs

Look for webhook events in the server logs:
```
Billing webhook event received
Invoice status: PAID
Updating instance plan
```

If these logs are missing, the webhook never fired.

### Step 3: Verify Plan ID in Database

Check what plan the instance actually has:
```sql
SELECT instance_id, plan_id, credits_total, credits_used_month 
FROM app_instances 
WHERE instance_id = '<your-instance-id>';
```

## Solutions

### Immediate Fix: Manual Credit Sync

Run the fix script to sync all instances:
```bash
cd backend
node fix-credits-sync.js
```

This will:
1. Find all instances where `credits_total` doesn't match their plan's `monthly_credits`
2. Update `credits_total` to the correct value
3. Preserve `credits_used_month` (so usage tracking remains accurate)

### Long-term Fix Options

#### Option 1: Simplify updateInstancePlan()

The current logic for preserving credits during downgrades is overly complex. Simplify it:

```typescript
export async function updateInstancePlan(instanceId: string, planId: string) {
  // Get plan details
  const planResult = await query(
    'SELECT monthly_credits FROM plans WHERE id = $1',
    [planId]
  );
  
  const newCreditsTotal = planResult.rows[0].monthly_credits;
  
  // Simple update: Always set to plan's allocation
  // Reset used credits to 0 (fresh start with new plan)
  await query(
    `UPDATE app_instances
     SET plan_id = $1,
         credits_total = $2,
         credits_used_month = 0,
         updated_at = now()
     WHERE instance_id = $3`,
    [planId, newCreditsTotal, instanceId]
  );
}
```

#### Option 2: Add Webhook Verification

Ensure webhooks are actually being received:
- Add more detailed logging
- Store webhook events in a separate table for audit trail
- Add a manual "Sync Subscription" button in the UI

#### Option 3: Periodic Sync Job

Add a scheduled task that syncs credits with plans:
```typescript
// Run daily to catch any missed webhook updates
async function syncCreditsWithPlans() {
  await query(`
    UPDATE app_instances ai
    SET credits_total = p.monthly_credits,
        updated_at = now()
    FROM plans p
    WHERE ai.plan_id = p.id
      AND ai.credits_total != p.monthly_credits
  `);
}
```

## Testing the Fix

After running the fix script:

1. **Check the database:**
   ```bash
   node check-credits-issue.js
   ```
   Should show no mismatches.

2. **Check the frontend:**
   - Refresh the Billing & Credits page
   - Should now show 5,000 total credits for Pro plan
   - Credits remaining should be: 5,000 - (credits used)

3. **Test optimization:**
   - Try optimizing a product
   - Credits should deduct correctly
   - Should have plenty of credits available

## Prevention

To prevent this issue in the future:

1. **Add validation** in `upsertAppInstance()` to check if a subscription exists
2. **Add monitoring** for webhook delivery failures
3. **Add a "Sync" button** in the UI to manually trigger credit sync
4. **Add alerts** when credits_total doesn't match plan for more than 24 hours

## Files Involved

- `backend/src/routes/provision.ts` - Initial instance creation
- `backend/src/routes/billing.ts` - Webhook handler
- `backend/src/db/appInstances.ts` - Database operations
- `backend/migrations/1730000000000_initial-schema.js` - Schema and plan definitions
- `frontend/src/pages/BillingCredits.tsx` - UI display

## Next Steps

1. Run `node backend/check-credits-issue.js` to diagnose
2. Run `node backend/fix-credits-sync.js` to fix
3. Verify in the UI that credits now show correctly
4. Consider implementing one of the long-term fixes
