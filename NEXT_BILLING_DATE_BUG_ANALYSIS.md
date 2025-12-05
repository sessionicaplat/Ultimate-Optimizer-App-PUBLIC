# Next Billing Date Bug - Analysis

## 🐛 THE PROBLEM

User subscribed on November 15, 2025, but the billing page shows:
```
Next billing cycle: December 1, 2025  ❌ Wrong! (only 16 days)
```

Should show:
```
Next billing cycle: December 15, 2025  ✅ Correct! (30 days)
```

---

## 🔍 ROOT CAUSE

The issue is in the `/api/me` endpoint logic that determines which date to return.

### Current Logic (backend/src/routes/me.ts):

```typescript
// Determine the correct reset date:
// - For paid subscriptions: use next_billing_date (30-day cycle)
// - For free plan: use credits_reset_on (calendar month)
const resetDate = instance.next_billing_date 
  ? instance.next_billing_date.toISOString()
  : instance.credits_reset_on.toISOString();
```

This logic is **correct**, but the problem is that `next_billing_date` might be **NULL** in the database!

---

## 🔎 WHY IS next_billing_date NULL?

### Scenario 1: User Upgraded Before Migration

If a user upgraded to a paid plan **before** the `next_billing_date` column was added:

1. User upgraded on November 15
2. Database set: `subscription_start_date = 2025-11-15`
3. Database set: `next_billing_date = NULL` (column didn't exist yet)
4. Migration added `next_billing_date` column
5. But existing paid users still have `next_billing_date = NULL`!

### Scenario 2: "SAME PLAN" Logic Issue

When `updateInstancePlan()` is called with the same plan (e.g., during sync):

```typescript
// backend/src/db/appInstances.ts - Line ~330
else {
  // SAME PLAN: Keep everything as is
  newCreditsTotal = currentInstance.credits_total;
  newCreditsUsed = currentInstance.credits_used_month;
  // ❌ nextBillingDate is NOT set here!
  console.log(`↔️  SAME PLAN: ${planId}`);
}
```

The `nextBillingDate` variable is initialized to `null` at the top:
```typescript
let nextBillingDate: Date | null = null;
```

So when the "SAME PLAN" path is taken, `nextBillingDate` stays `null` and gets written to the database!

---

## 📊 THE FLOW

### What Happens:

```
1. User upgrades from Free to Starter on Nov 15
   → subscription_start_date = 2025-11-15
   → next_billing_date = 2025-12-15 ✅

2. Server restarts or sync runs
   → Calls updateInstancePlan('starter')
   → Database already has plan_id = 'starter'
   → Takes "SAME PLAN" path
   → nextBillingDate = null ❌
   → Updates database with next_billing_date = NULL ❌

3. User visits billing page
   → /api/me checks: instance.next_billing_date
   → It's NULL!
   → Falls back to: instance.credits_reset_on
   → Returns: December 1, 2025 ❌
```

---

## ✅ THE SOLUTION

### Fix 1: Preserve next_billing_date in "SAME PLAN" Case

**File:** `backend/src/db/appInstances.ts`

**Current Code:**
```typescript
else {
  // SAME PLAN: Keep everything as is
  newCreditsTotal = currentInstance.credits_total;
  newCreditsUsed = currentInstance.credits_used_month;
  // ❌ nextBillingDate stays null
}
```

**Fixed Code:**
```typescript
else {
  // SAME PLAN: Keep everything as is
  newCreditsTotal = currentInstance.credits_total;
  newCreditsUsed = currentInstance.credits_used_month;
  // ✅ Preserve existing next_billing_date
  nextBillingDate = currentInstance.next_billing_date || null;
}
```

---

### Fix 2: Calculate next_billing_date if Missing

For users who upgraded before the migration, we need to calculate `next_billing_date` from `subscription_start_date`.

**File:** `backend/src/db/appInstances.ts`

**Add this logic before the if/else chain:**

```typescript
// If user has a paid plan but no next_billing_date, calculate it
if (planId !== 'free' && subscriptionStartDate && !currentInstance.next_billing_date) {
  // Calculate next billing date as 30 days from subscription start
  const startTime = subscriptionStartDate.getTime();
  const now = Date.now();
  const daysSinceStart = Math.floor((now - startTime) / (24 * 60 * 60 * 1000));
  const cyclesPassed = Math.floor(daysSinceStart / 30);
  const nextCycleStart = new Date(startTime + (cyclesPassed + 1) * 30 * 24 * 60 * 60 * 1000);
  nextBillingDate = nextCycleStart;
  
  console.log(`🔧 Calculated missing next_billing_date: ${nextBillingDate.toISOString()}`);
}
```

---

### Fix 3: Fallback in /api/me Endpoint

As an additional safety measure, calculate the date on the fly if it's missing.

**File:** `backend/src/routes/me.ts`

**Current Code:**
```typescript
const resetDate = instance.next_billing_date 
  ? instance.next_billing_date.toISOString()
  : instance.credits_reset_on.toISOString();
```

**Enhanced Code:**
```typescript
// Determine the correct reset date
let resetDate: string;

if (instance.next_billing_date) {
  // Use existing next_billing_date
  resetDate = instance.next_billing_date.toISOString();
} else if (instance.plan_id !== 'free' && instance.subscription_start_date) {
  // Calculate next_billing_date from subscription_start_date
  const startTime = instance.subscription_start_date.getTime();
  const now = Date.now();
  const daysSinceStart = Math.floor((now - startTime) / (24 * 60 * 60 * 1000));
  const cyclesPassed = Math.floor(daysSinceStart / 30);
  const nextCycleStart = new Date(startTime + (cyclesPassed + 1) * 30 * 24 * 60 * 60 * 1000);
  resetDate = nextCycleStart.toISOString();
  
  console.log(`🔧 Calculated next_billing_date on-the-fly: ${resetDate}`);
} else {
  // Fall back to calendar month for free plan
  resetDate = instance.credits_reset_on.toISOString();
}
```

---

## 🎯 RECOMMENDED APPROACH

Implement **all three fixes** for maximum reliability:

1. **Fix 1** - Prevents the bug from happening in the future
2. **Fix 2** - Fixes existing users with missing next_billing_date
3. **Fix 3** - Provides immediate fix without waiting for database update

---

## 🧪 TESTING

### Test Case 1: New User Upgrade

```
1. User on free plan
2. Upgrade to Starter on Nov 15
3. Check database: next_billing_date should be 2025-12-15
4. Check billing page: Should show "Next billing cycle: December 15, 2025"
```

### Test Case 2: Existing User with NULL next_billing_date

```
1. User upgraded before migration (next_billing_date = NULL)
2. Has subscription_start_date = 2025-11-15
3. Sync runs or server restarts
4. Fix 2 calculates: next_billing_date = 2025-12-15
5. Check billing page: Should show "Next billing cycle: December 15, 2025"
```

### Test Case 3: Same Plan Sync

```
1. User on Starter plan
2. next_billing_date = 2025-12-15
3. Sync runs with same plan
4. Fix 1 preserves: next_billing_date = 2025-12-15
5. Check billing page: Should still show "Next billing cycle: December 15, 2025"
```

---

## 📝 SUMMARY

**Problem:** Users see calendar month (Dec 1) instead of their actual billing cycle (Dec 15)

**Root Cause:** 
- "SAME PLAN" logic doesn't preserve `next_billing_date`
- Sets it to `null` in database
- API falls back to `credits_reset_on` (calendar month)

**Solution:**
1. Preserve `next_billing_date` in "SAME PLAN" case
2. Calculate missing `next_billing_date` from `subscription_start_date`
3. Add fallback calculation in API endpoint

**Impact:** All paid users will see correct billing cycle dates

**Files to Change:**
- `backend/src/db/appInstances.ts` (Fixes 1 & 2)
- `backend/src/routes/me.ts` (Fix 3)
