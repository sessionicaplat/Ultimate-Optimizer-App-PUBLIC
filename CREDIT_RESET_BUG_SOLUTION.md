# Credit Reset Bug - Complete Solution

## 🎯 ROOT CAUSE CONFIRMED

The credit reset bug is caused by **`startCreditSyncScheduler()`** which runs every 6 hours and calls `syncAllInstanceCredits()`.

### The Smoking Gun:

**File:** `backend/src/server.ts` (Line ~137)
```typescript
// Start credit sync scheduler (runs every 6 hours)
startCreditSyncScheduler();
```

**File:** `backend/src/tasks/creditSync.ts`
```typescript
export function startCreditSyncScheduler(): void {
  const intervalMs = 6 * 60 * 60 * 1000; // 6 hours
  
  // Run immediately on startup  ❌ THIS IS THE BUG!
  runCreditSyncTask();
  
  // Then run every 6 hours
  setInterval(runCreditSyncTask, intervalMs);
}
```

**File:** `backend/src/tasks/creditSync.ts`
```typescript
export async function runCreditSyncTask(): Promise<void> {
  const syncCount = await syncAllInstanceCredits(); // ❌ DESTROYS ACCUMULATED CREDITS!
}
```

**File:** `backend/src/db/appInstances.ts`
```typescript
export async function syncAllInstanceCredits(): Promise<number> {
  const result = await query(
    `
    UPDATE app_instances ai
    SET credits_total = p.monthly_credits,  // ❌ RESETS TO BASE AMOUNT!
        updated_at = now()
    FROM plans p
    WHERE ai.plan_id = p.id
      AND ai.credits_total != p.monthly_credits
    `
  );
}
```

---

## 💥 WHAT HAPPENS

### On Server Restart:

1. **Server starts** → `server.ts` runs
2. **Scheduler starts** → `startCreditSyncScheduler()` called
3. **Immediate sync** → `runCreditSyncTask()` runs **immediately**
4. **Credits destroyed** → `syncAllInstanceCredits()` resets all credits to base plan amounts
5. **User loses accumulated credits** → 1,200 credits → 1,000 credits (200 lost!)

### Every 6 Hours:

The same thing happens automatically, destroying accumulated credits for ALL users!

---

## 🛠️ THE FIX

### Solution 1: Remove the Scheduler (Recommended)

The scheduler is **unnecessary and harmful**. The webhook system already handles credit updates correctly.

**Changes needed:**

#### 1. Remove scheduler startup from `backend/src/server.ts`:

```typescript
// BEFORE:
import { startCreditSyncScheduler } from './tasks/creditSync';

// Start credit sync scheduler (runs every 6 hours)
startCreditSyncScheduler();

// AFTER:
// Remove the import
// Remove the function call
```

#### 2. Delete or deprecate `backend/src/tasks/creditSync.ts`:

```typescript
/**
 * @deprecated DO NOT USE - This scheduler destroys accumulated credits!
 * 
 * The webhook system (backend/src/routes/billing.ts) already handles
 * credit updates correctly. This scheduler was added to "fix" missed
 * webhooks, but it actually causes more problems than it solves.
 * 
 * If you need to manually sync credits for a specific instance,
 * use the /api/billing/sync-credits endpoint instead.
 */
export function startCreditSyncScheduler(): void {
  throw new Error('Credit sync scheduler is deprecated - use webhook system instead');
}
```

#### 3. Deprecate dangerous functions in `backend/src/db/appInstances.ts`:

```typescript
/**
 * ⚠️ DANGER: This function DESTROYS accumulated credits!
 * 
 * @deprecated DO NOT USE - Use updateInstancePlan() instead
 * 
 * This function resets credits_total to the plan's base monthly_credits,
 * which removes any accumulated/rolled-over credits.
 * 
 * For normal credit management, use:
 * - updateInstancePlan() - Preserves accumulated credits
 * - /api/billing/sync-credits endpoint - Safe manual sync
 */
export async function syncInstanceCredits(instanceId: string): Promise<void> {
  throw new Error('syncInstanceCredits() is deprecated - use updateInstancePlan() instead');
}

/**
 * ⚠️ DANGER: This function DESTROYS accumulated credits for ALL users!
 * 
 * @deprecated DO NOT USE
 */
export async function syncAllInstanceCredits(): Promise<number> {
  throw new Error('syncAllInstanceCredits() is deprecated and dangerous');
}
```

---

### Solution 2: Fix the Scheduler (Alternative)

If you want to keep the scheduler for some reason, fix it to preserve accumulated credits:

#### Change `backend/src/tasks/creditSync.ts`:

```typescript
import { query } from '../db';

/**
 * Credit verification task that checks for instances with incorrect credits
 * WITHOUT destroying accumulated credits
 */
export async function runCreditVerificationTask(): Promise<void> {
  try {
    console.log('[CreditVerification] Checking for credit mismatches...');
    
    // Find instances where credits don't match expected values
    const result = await query(
      `
      SELECT 
        ai.instance_id,
        ai.plan_id,
        ai.credits_total,
        ai.credits_used_month,
        p.monthly_credits,
        (ai.credits_total - ai.credits_used_month) as available
      FROM app_instances ai
      JOIN plans p ON ai.plan_id = p.id
      WHERE ai.credits_total < p.monthly_credits
        AND ai.credits_used_month = 0
      `
    );
    
    if (result.rows.length > 0) {
      console.warn('[CreditVerification] Found instances with suspiciously low credits:');
      result.rows.forEach(row => {
        console.warn(`  - ${row.instance_id} (${row.plan_id}): ${row.credits_total} total (expected >= ${row.monthly_credits})`);
      });
      console.warn('[CreditVerification] These may need manual investigation');
    } else {
      console.log('[CreditVerification] All instances have reasonable credit balances');
    }
  } catch (error) {
    console.error('[CreditVerification] Error:', error);
  }
}

/**
 * Start the credit verification scheduler
 * Runs every 6 hours to detect credit issues WITHOUT modifying them
 */
export function startCreditVerificationScheduler(): void {
  const intervalMs = 6 * 60 * 60 * 1000; // 6 hours
  
  console.log('[CreditVerification] Scheduler started. Running every 6 hours.');
  
  // Run immediately on startup
  runCreditVerificationTask();
  
  // Then run every 6 hours
  setInterval(runCreditVerificationTask, intervalMs);
}
```

This version **detects** problems without **causing** them.

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Remove the Scheduler

1. Edit `backend/src/server.ts`
2. Remove the import: `import { startCreditSyncScheduler } from './tasks/creditSync';`
3. Remove the call: `startCreditSyncScheduler();`

### Step 2: Deprecate Dangerous Functions

1. Edit `backend/src/db/appInstances.ts`
2. Add `throw new Error()` to `syncInstanceCredits()`
3. Add `throw new Error()` to `syncAllInstanceCredits()`

### Step 3: Deploy

1. Commit changes
2. Push to Render
3. Server restarts
4. Credits are preserved! ✅

### Step 4: Verify

1. Check logs for any errors about deprecated functions
2. Monitor credit balances after restart
3. Verify accumulated credits are preserved

---

## 🧪 TESTING

### Before Fix:
```
1. User has 1,200 credits (200 free + 1,000 starter)
2. Server restarts
3. Scheduler runs immediately
4. syncAllInstanceCredits() resets to 1,000
5. User loses 200 credits ❌
```

### After Fix:
```
1. User has 1,200 credits (200 free + 1,000 starter)
2. Server restarts
3. No scheduler runs
4. Credits remain 1,200 ✅
```

---

## 🎯 WHY THIS HAPPENED

### The Original Intent:

The scheduler was added to "fix" instances that might have missed webhook updates.

### The Problem:

The scheduler used `syncAllInstanceCredits()` which **resets** credits instead of **preserving** them.

### The Correct Approach:

- Webhooks handle credit updates correctly via `updateInstancePlan()`
- Manual sync endpoint `/api/billing/sync-credits` also uses `updateInstancePlan()`
- No scheduler is needed!

---

## 📊 IMPACT

### Users Affected:
- **All users** who upgraded from free to paid plans
- **All users** with accumulated credits
- Happens **every 6 hours** and **on every server restart**

### Credit Loss Examples:
- Free (200) → Starter (1,000) = 1,200 total → **Reset to 1,000** (200 lost)
- Starter (1,000) → Pro (5,000) = 6,000 total → **Reset to 5,000** (1,000 lost)
- Pro (5,000) → Scale (25,000) = 30,000 total → **Reset to 25,000** (5,000 lost)

---

## ✅ VERIFICATION

After deploying the fix, verify:

1. **No scheduler logs:**
   ```
   # Should NOT see:
   [CreditSync] Running credit sync task...
   [CreditSync] Successfully synced credits for X instance(s)
   ```

2. **Credits preserved after restart:**
   ```
   # Check database before restart:
   SELECT instance_id, plan_id, credits_total, credits_used_month 
   FROM app_instances;
   
   # Restart server
   
   # Check database after restart:
   SELECT instance_id, plan_id, credits_total, credits_used_month 
   FROM app_instances;
   
   # Values should be IDENTICAL
   ```

3. **Webhooks still work:**
   ```
   # Upgrade a plan
   # Check logs for:
   💰 Invoice status updated webhook received
   📈 UPGRADE: starter → pro
   Available: 1000 + New: 5000 = Total: 6000
   ✅ Instance plan updated: pro with 6000 available credits
   ```

---

## 🚀 SUMMARY

**Problem:** Scheduler runs every 6 hours and on server restart, destroying accumulated credits

**Root Cause:** `startCreditSyncScheduler()` → `syncAllInstanceCredits()` → Resets credits to base plan amount

**Solution:** Remove the scheduler entirely - webhooks already handle credit updates correctly

**Impact:** All users with accumulated credits will stop losing them on server restarts

**Effort:** 5 minutes to remove 3 lines of code

**Risk:** None - the scheduler was causing problems, not solving them
