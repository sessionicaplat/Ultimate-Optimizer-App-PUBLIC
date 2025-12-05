# Credit Sync Fix - Preserving Accumulated Credits

## Problem

Users' credits were not updating immediately after payment because `syncInstanceCredits()` was destroying accumulated credits by resetting them to the plan's base amount.

### Example of the Bug:
1. User upgrades from Free (200 credits) → Starter
2. Webhook correctly calculates: 200 + 1000 = **1200 credits** ✅
3. Database updated to 1200 ✅
4. `syncInstanceCredits()` gets called ❌
5. Credits reset to 1000 (plan's base amount) ❌
6. User loses 200 accumulated credits ❌

## Root Cause

The `syncInstanceCredits()` function was designed to reset credits to the plan's base amount, which conflicts with the persistent credit system where credits should accumulate.

```typescript
// OLD PROBLEMATIC CODE:
await syncInstanceCredits(instanceId); // ❌ Destroys accumulated credits
```

## Solution Implemented

### 1. Removed syncInstanceCredits() Calls

Removed all calls to `syncInstanceCredits()` from:
- ✅ `backend/src/routes/billing.ts` - Sync credits endpoint
- ✅ `backend/src/routes/imageOptimization.ts` - Image optimization provisioning
- ✅ `backend/src/routes/provision.ts` - Dashboard provisioning

### 2. Use updateInstancePlan() Instead

All credit updates now use `updateInstancePlan()` which:
- ✅ Preserves accumulated credits
- ✅ Adds new plan credits on upgrade
- ✅ Keeps existing credits on downgrade
- ✅ Handles all plan changes correctly

```typescript
// NEW CORRECT CODE:
await updateInstancePlan(instanceId, planId); // ✅ Preserves accumulated credits
```

### 3. Added Warning to syncInstanceCredits()

Added deprecation warning and documentation to prevent future misuse:

```typescript
/**
 * ⚠️ WARNING: This function DESTROYS accumulated credits!
 * 
 * ❌ DO NOT USE after plan changes or webhooks
 * ❌ DO NOT USE in normal operation
 * ✅ ONLY USE for emergency admin fixes
 * 
 * @deprecated Use updateInstancePlan() instead
 */
```

## Changes Made

### backend/src/routes/billing.ts
- Changed sync endpoint to always use `updateInstancePlan()`
- Removed `syncInstanceCredits()` call that was destroying credits
- Now preserves accumulated credits even when plan is unchanged

### backend/src/routes/imageOptimization.ts
- Removed `syncInstanceCredits()` call after provisioning
- Added comment explaining that `upsertAppInstance()` already sets correct default credits

### backend/src/routes/provision.ts
- Removed `syncInstanceCredits()` call after provisioning
- Added comment explaining credits are already correct from `upsertAppInstance()`

### backend/src/db/appInstances.ts
- Added comprehensive warning documentation to `syncInstanceCredits()`
- Marked function as `@deprecated`
- Explained when it should and shouldn't be used

## Testing

After this fix:

1. ✅ User upgrades from Free → Starter
   - Expected: 200 + 1000 = 1200 credits
   - Result: 1200 credits (preserved)

2. ✅ User upgrades from Starter → Pro
   - Expected: 1200 + 5000 = 6200 credits
   - Result: 6200 credits (preserved)

3. ✅ User clicks "Sync Credits" button
   - Expected: Credits remain unchanged
   - Result: Credits preserved (no reset)

4. ✅ Credits update immediately after payment
   - Cache-control headers prevent browser caching
   - No sync function to destroy accumulated credits

## Benefits

- ✅ Credits update immediately after payment
- ✅ Accumulated credits are preserved
- ✅ Persistent credit system works as designed
- ✅ Users never lose credits
- ✅ Upgrades add credits correctly
- ✅ Downgrades preserve credits correctly

## Related Files

- `backend/src/routes/billing.ts` - Billing webhook and sync endpoint
- `backend/src/routes/imageOptimization.ts` - Image optimization provisioning
- `backend/src/routes/provision.ts` - Dashboard provisioning
- `backend/src/routes/me.ts` - Credit balance endpoint (cache headers added)
- `backend/src/db/appInstances.ts` - Credit management functions

## Documentation

See also:
- `PERSISTENT_CREDIT_SYSTEM.md` - How the credit system works
- `backend/src/routes/me.ts` - Cache-control headers for fresh data
