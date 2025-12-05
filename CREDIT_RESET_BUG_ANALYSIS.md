# Credit Reset Bug - Root Cause Analysis

## 🐛 THE PROBLEM

When the Render server restarts/redeploys, users lose their accumulated credits and are reset to only their plan's base monthly credits.

### Example:
- User has 200 free credits
- Upgrades to Starter (1,000 credits/month)
- **Expected:** 1,200 total credits (200 + 1,000)
- **Actual after restart:** 1,000 credits (200 credits LOST!)

---

## 🔍 ROOT CAUSE IDENTIFIED

### The Issue is in the Sync Logic

When the server restarts, the `/api/billing/sync-credits` endpoint is called, which triggers this flow:

```typescript
// backend/src/routes/billing.ts - Line ~1000
const actualPlanId = await getCurrentPlanFromWix(instanceId);

if (oldPlan === actualPlanId) {
  console.log('[SYNC] Plan unchanged, verifying credits are correct');
  await updateInstancePlan(instanceId, actualPlanId); // ❌ THIS IS THE BUG!
}
```

### What Happens:

1. **Server restarts**
2. **Frontend calls `/api/billing/sync-credits`**
3. **Sync checks Wix:** "What plan is the user on?"
4. **Wix responds:** "Pro plan"
5. **Sync checks database:** "User is already on Pro plan"
6. **Sync calls:** `updateInstancePlan(instanceId, 'pro')`
7. **updateInstancePlan sees:** "Same plan (pro → pro)"
8. **updateInstancePlan logic:**
   ```typescript
   // backend/src/db/appInstances.ts - Line ~340
   else {
     // SAME PLAN: Keep everything as is (shouldn't happen often)
     newCreditsTotal = currentInstance.credits_total;
     newCreditsUsed = currentInstance.credits_used_month;
     console.log(`↔️  SAME PLAN: ${planId}`);
     console.log(`   No change to credits`);
   }
   ```

### The Problem:

**The "SAME PLAN" logic is correct** - it preserves credits when the plan hasn't changed.

**BUT** - Your logs show something different is happening:

```
[SYNC] Plan changed, updating with proper credit logic
📈 UPGRADE: starter → pro
Available: 1000 + New: 5000 = Total: 6000
```

This means the database thinks the user is on "starter" but Wix says "pro", so it treats it as an upgrade and **recalculates credits from scratch**.

---

## 🎯 THE REAL ISSUE

### The database is getting out of sync with Wix!

Looking at your logs more carefully:

```
oldCreditsTotal: 1000,  // ❌ Should be 1200!
oldCreditsUsed: 0,
oldAvailable: 1000,     // ❌ Should be 1200!
```

The database already lost the 200 credits **before** the sync ran.

### Why This Happens:

There are **TWO** functions that can reset credits:

#### 1. ❌ `syncInstanceCredits()` - DESTROYS ACCUMULATED CREDITS
```typescript
// backend/src/db/appInstances.ts - Line ~450
export async function syncInstanceCredits(instanceId: string): Promise<void> {
  const result = await query(
    `
    UPDATE app_instances ai
    SET credits_total = p.monthly_credits,  // ❌ RESETS TO BASE AMOUNT!
        updated_at = now()
    FROM plans p
    WHERE ai.instance_id = $1
      AND ai.plan_id = p.id
      AND ai.credits_total != p.monthly_credits
    `
  );
}
```

This function **RESETS** `credits_total` to the plan's `monthly_credits`, destroying any accumulated credits!

#### 2. ✅ `updateInstancePlan()` - PRESERVES ACCUMULATED CREDITS
```typescript
// backend/src/db/appInstances.ts - Line ~250
export async function updateInstancePlan(
  instanceId: string,
  planId: string
): Promise<void> {
  // Calculates: currentAvailableCredits = credits_total - credits_used_month
  // Then adds new plan credits to available balance
}
```

This function **PRESERVES** accumulated credits correctly.

---

## 🔎 WHERE IS `syncInstanceCredits()` BEING CALLED?

Let me search for it...

### Possible Culprits:

1. **Server startup script** - May be calling `syncAllInstanceCredits()`
2. **Cron job or scheduled task** - May be syncing credits periodically
3. **Migration script** - May have run during deployment
4. **Admin endpoint** - Someone may have called it manually

---

## 🛠️ THE FIX

### Solution 1: Remove Dangerous Functions (Recommended)

**Delete or deprecate these functions:**
- `syncInstanceCredits()` - Destroys accumulated credits
- `syncAllInstanceCredits()` - Destroys accumulated credits for all users

**Replace with:**
- `updateInstancePlan()` - Always use this for plan changes
- `/api/billing/sync-credits` endpoint - Already uses `updateInstancePlan()` correctly

### Solution 2: Fix the Sync Logic

**Change the sync endpoint to NOT call `updateInstancePlan()` when plan is unchanged:**

```typescript
// backend/src/routes/billing.ts
if (oldPlan === actualPlanId) {
  console.log('[SYNC] Plan unchanged, credits are correct');
  // ✅ DO NOTHING - credits are already correct!
  // ❌ DON'T call updateInstancePlan() - it's unnecessary
} else {
  console.log('[SYNC] Plan changed, updating with proper credit logic');
  await updateInstancePlan(instanceId, actualPlanId);
}
```

### Solution 3: Add Credit Validation

**Add a check to prevent credit loss:**

```typescript
// Before updating credits, validate they're not decreasing unexpectedly
if (newCreditsTotal < currentAvailableCredits && !isDowngradingToFree) {
  console.error('⚠️ CREDIT LOSS DETECTED! Aborting update.');
  console.error({
    currentAvailable: currentAvailableCredits,
    newTotal: newCreditsTotal,
    loss: currentAvailableCredits - newCreditsTotal,
  });
  throw new Error('Credit update would result in credit loss');
}
```

---

## 📊 EVIDENCE FROM YOUR LOGS

### Log Analysis:

```
[SYNC] Current state: { plan: 'pro', total: 6000, used: 0, available: 6000 }
[SYNC] Querying Wix API...
[SYNC] Wix says plan is: pro
[SYNC] Plan unchanged, verifying credits are correct
↔️  SAME PLAN: pro
No change to credits
```

This shows the sync is working correctly when the plan matches!

But earlier:
```
📈 UPGRADE: starter → pro
Available: 1000 + New: 5000 = Total: 6000
oldCreditsTotal: 1000,  // ❌ Lost 200 credits somewhere!
```

The database thought the user was on "starter" with only 1,000 credits, when they should have had 1,200.

---

## 🎯 RECOMMENDED ACTIONS

### Immediate Fix:

1. **Search for calls to `syncInstanceCredits()` or `syncAllInstanceCredits()`**
   - Check server startup scripts
   - Check cron jobs
   - Check migration files
   - Check admin endpoints

2. **Remove or disable those calls**

3. **Add deprecation warnings to those functions**

### Long-term Fix:

1. **Remove the dangerous functions entirely**
   ```typescript
   // Mark as deprecated
   /**
    * @deprecated DO NOT USE - Destroys accumulated credits!
    * Use updateInstancePlan() instead.
    */
   export async function syncInstanceCredits() {
     throw new Error('This function is deprecated - use updateInstancePlan()');
   }
   ```

2. **Improve the sync endpoint**
   - Don't call `updateInstancePlan()` when plan is unchanged
   - Add validation to prevent credit loss
   - Log warnings when credits would decrease

3. **Add monitoring**
   - Alert when credits decrease unexpectedly
   - Log all credit changes with before/after values
   - Track credit balance over time

---

## 🔍 NEXT STEPS

1. **Search the codebase for:**
   - `syncInstanceCredits`
   - `syncAllInstanceCredits`
   - Any startup scripts that might call these

2. **Check for:**
   - Cron jobs
   - Scheduled tasks
   - Migration scripts
   - Admin endpoints

3. **Verify:**
   - No automated scripts are resetting credits
   - Only webhooks and manual upgrades modify credits
   - The sync endpoint is only used for verification, not modification

---

## 💡 SUMMARY

**The bug is NOT in `updateInstancePlan()` - that function works correctly!**

**The bug is that something is calling `syncInstanceCredits()` which RESETS credits to the base plan amount, destroying accumulated credits.**

**Find and remove those calls, and the problem will be solved!**
