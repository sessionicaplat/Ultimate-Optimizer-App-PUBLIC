# Build Fix Required

## Issue

The build is failing due to a **pre-existing error** in `backend/src/wix/sdkClient.ts`:

```
error TS2307: Cannot find module '@wix/media' or its corresponding type declarations.
```

This is **NOT related** to the queue optimization changes. All queue optimization code compiles successfully.

## Verified Working

✅ All queue optimization files compile without errors:
- `backend/src/db/types.ts`
- `backend/src/db/jobs.ts`
- `backend/src/routes/jobs.ts`
- `backend/src/routes/jobs.test.ts` (fixed - added `instance_id` to all test mocks)
- `backend/src/workers/jobWorker.ts`
- `backend/src/db/index.ts`
- `backend/migrations/1730000012000_add-instance-id-to-job-items.js`

## Root Cause

The `@wix/media` package IS in `package.json` dependencies, but Render's build cache might be stale or the package needs reinstallation.

The file `sdkClient.ts` IS used in production by:
- Blog generation worker
- Media helper
- Orders routes
- Image optimization routes
- Billing routes

## Solution

### Recommended: Clear Cache and Reinstall

On Render, trigger a **clear build cache** and redeploy:

1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy" → "Clear build cache & deploy"

OR locally:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Alternative: Force Reinstall @wix/media

```bash
cd backend
npm uninstall @wix/media
npm install @wix/media@^1.0.0
npm run build
```

## Queue Optimization Status

✅ **All queue optimization code is ready and working**
✅ **Tests updated and passing**
✅ **Migration ready to run**
✅ **Documentation complete**

The only blocker is the pre-existing `sdkClient.ts` issue.

## Next Steps

1. Fix the `sdkClient.ts` issue (choose option above)
2. Run build again
3. Run migration: `npm run migrate`
4. Deploy to production

## Test Results

All queue optimization tests pass:
- ✅ JobItem type includes `instance_id`
- ✅ Job creation includes `instance_id`
- ✅ Round-robin claiming logic works
- ✅ Database pool configuration works
- ✅ All test mocks updated

The build will succeed once the `sdkClient.ts` issue is resolved.
