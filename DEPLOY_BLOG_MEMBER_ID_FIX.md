# Deploy Blog Member ID Fix - Quick Guide

## What's Fixed

Added member ID retrieval to satisfy Wix Blog API requirement that "for 3rd-party apps, memberId is a required field."

## Deploy Now

```bash
git add .
git commit -m "Fix blog post member ID requirement"
git push origin main
```

Render auto-deploys in ~2-3 minutes.

## Files Changed

- `backend/src/wix/sdkClient.ts` - Added getSiteInfo() method and updated createDraftPost()
- `backend/src/workers/blogGenerationWorker.ts` - Added member ID retrieval before creating draft

## Test After Deployment

1. Go to Blog Generator
2. Select a product
3. Generate ideas → Select one → Generate post
4. Wait for completion

## Expected Result

✅ Blog post generated successfully
✅ Draft post visible in Wix Blog dashboard
✅ No "Missing post owner information" error

## Check Logs

Look for:
```
[Blog Worker] Creating draft post for X
[Blog Worker] Got member ID: <MEMBER_ID>
[Blog Worker] Completed generation X, draft post: <POST_ID>
```

Or fallback:
```
[Blog Worker] Could not get member ID, will try without it
[Blog Worker] Completed generation X, draft post: <POST_ID>
```

## If It Still Fails

1. Check Wix app permissions (Manage Blog)
2. Reinstall app on test site
3. Check member ID in logs
4. Verify site has a valid owner

## Build Status

✅ TypeScript compilation successful
✅ No diagnostics errors
✅ Ready to deploy

---

**Deploy**: `git push origin main`
**Time**: 5 minutes total
