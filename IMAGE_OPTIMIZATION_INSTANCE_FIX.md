# Image Optimization - Instance Not Found Fix

## Problem

When users tried to create an image optimization job, they received errors:
1. First error: `"App instance not found"`
2. Second error: `502 Bad Gateway` with logs showing:
   - `[ImageOptimization] Instance undefined not found`
   - `[ImageOptimization] Token elevation failed: 400`

## Root Causes

### Issue 1: Instance Not in Database
The logs showed:
```
[verifyInstance] ✅ Signature verified, instanceId: a326af78-b871-4752-8e4d-5cb21b88a3fe
Executed query {text: 'SELECT * FROM app_instances WHERE instance_id = $1', duration: 24, rows: 0}
```

The instance was being verified successfully, but it didn't exist in the database.

### Issue 2: Wrong Variable Access
The code was using:
```typescript
const instanceId = (req as any).instanceId; // ❌ Wrong - returns undefined
```

Instead of:
```typescript
const { instanceId } = req.wixInstance!; // ✅ Correct
```

This caused `instanceId` to be `undefined`, which then caused the Wix OAuth call to fail with a 400 error.

## Solution

Two fixes were applied:

### Fix 1: Correct Variable Access

**Changed in all three routes:**
```typescript
// ❌ BEFORE (Wrong)
const instanceId = (req as any).instanceId;

// ✅ AFTER (Correct)
const { instanceId } = req.wixInstance!;
```

This ensures `instanceId` is properly extracted from the verified Wix instance data.

### Fix 2: Auto-Provision Instance

**File:** `backend/src/routes/imageOptimization.ts`

**Before:**
```typescript
// Check credits
const instance = await getAppInstance(instanceId);
if (!instance) {
  return res.status(404).json({ error: 'App instance not found' });
}
```

**After:**
```typescript
// Check credits - get or create instance
let instance = await getAppInstance(instanceId);
if (!instance) {
  // Instance not provisioned yet - provision it now
  console.log(`[ImageOptimization] Instance ${instanceId} not found, provisioning...`);
  
  // Get elevated token from Wix
  // Create instance in database
  // Sync credits with subscription plan
  // Retry getting instance
  
  console.log(`[ImageOptimization] Instance ${instanceId} provisioned successfully`);
}
```

## How It Works

When an instance is not found, the route now:

1. **Detects missing instance** - Checks if instance exists in database
2. **Gets elevated token** - Calls Wix OAuth endpoint with client credentials
3. **Creates instance** - Inserts into `app_instances` table
4. **Syncs credits** - Fetches subscription plan and assigns credits
5. **Continues processing** - Proceeds with image optimization job creation

## Benefits

- ✅ No more "App instance not found" errors
- ✅ Seamless user experience
- ✅ Automatic provisioning on first use
- ✅ No manual intervention required
- ✅ Consistent with other routes

## Testing

### Before Fix:
```
1. User opens app for first time
2. Goes to Image Optimization
3. Selects images and creates job
4. ❌ Error: "App instance not found"
```

### After Fix:
```
1. User opens app for first time
2. Goes to Image Optimization
3. Selects images and creates job
4. ✅ Instance auto-provisioned
5. ✅ Job created successfully
6. ✅ Redirected to ongoing page
```

## Deployment

This fix is already deployed. No additional steps needed.

### Verify Fix:

1. Check logs for successful provisioning:
```
[ImageOptimization] Instance xxx not found, provisioning...
[ImageOptimization] Instance xxx provisioned successfully
```

2. Verify job creation works:
```
[ImageOptimization] Created job X for Y images
```

## Related Files

- `backend/src/routes/imageOptimization.ts` - Main fix
- `backend/src/routes/provision.ts` - Reference implementation
- `backend/src/db/appInstances.ts` - Database functions

## Prevention

This pattern should be used in all routes that require an app instance:

```typescript
// Standard pattern for all routes
let instance = await getAppInstance(instanceId);
if (!instance) {
  // Auto-provision logic here
  instance = await getAppInstance(instanceId);
  if (!instance) {
    return res.status(500).json({ error: 'Failed to provision' });
  }
}
```

## Status

✅ **Fixed and Deployed**

Users can now create image optimization jobs without encountering errors.

## Summary of Changes

1. ✅ Fixed `instanceId` extraction in POST `/api/image-optimization`
2. ✅ Fixed `instanceId` extraction in GET `/api/image-optimization/jobs`
3. ✅ Fixed `instanceId` extraction in GET `/api/image-optimization/jobs/:jobId`
4. ✅ Added auto-provisioning logic for first-time users
5. ✅ Proper error handling and logging

---

**Issues:** 
- Instance undefined (variable access error)
- Token elevation failed 400 (caused by undefined instanceId)
- App instance not found (missing provisioning)

**Fixes:** 
- Correct variable access pattern
- Auto-provision on first use

**Status:** Resolved ✅
