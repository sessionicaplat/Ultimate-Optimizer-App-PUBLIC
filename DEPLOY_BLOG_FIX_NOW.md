# Deploy Blog Fix - Quick Start

## TL;DR

Fixed blog authentication by removing token caching. Deploy now and verify Wix permissions.

## Deploy in 3 Steps

### 1. Deploy Code (2 minutes)

```bash
git add .
git commit -m "Fix blog generation authentication - remove token caching"
git push origin main
```

Render auto-deploys in ~2-3 minutes.

### 2. Verify Wix Permissions (1 minute)

1. Go to https://dev.wix.com/apps
2. Select your app → **Permissions**
3. Ensure **Blog - Draft Posts** = **Manage**
4. Save if changed

### 3. Reinstall App (1 minute)

If you changed permissions:
1. In Wix site: Apps → Manage Apps
2. Remove your app
3. Reinstall from your app URL

## Test

1. Go to Blog Generator in your app
2. Select a product
3. Generate ideas → Select one → Generate post
4. Check Wix Blog dashboard for draft post

## Expected Result

✅ Blog post created successfully
✅ No authentication errors
✅ Draft visible in Wix dashboard

## If It Fails

See `BLOG_FIX_SUMMARY.md` for detailed troubleshooting.

## What Was Fixed

- Removed token caching in blog worker
- Now uses fresh tokens for every API call
- Matches working pattern from Product/Image Optimizer

## Files Changed

- `backend/src/workers/blogGenerationWorker.ts`

## Build Status

✅ TypeScript compilation successful
✅ No diagnostics errors
✅ Ready to deploy

---

**Deploy now**: `git push origin main`
