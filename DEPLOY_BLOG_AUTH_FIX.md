# Deploy Blog Authentication Fix

## What Was Fixed

Fixed the blog generation authentication issue where draft posts couldn't be created due to stale token caching.

## Changes Made

1. **Removed token caching** in blog worker to ensure fresh tokens for every API call
2. **Aligned with working patterns** from Product Optimizer and Image Optimizer

## Deploy Steps

### 1. Build and Test Locally (Optional)

```bash
cd backend
npm run build
```

### 2. Commit and Push

```bash
git add backend/src/workers/blogGenerationWorker.ts
git add BLOG_AUTHENTICATION_FIX.md
git add DEPLOY_BLOG_AUTH_FIX.md
git commit -m "Fix blog generation authentication - remove token caching"
git push origin main
```

### 3. Render Auto-Deploy

Render will automatically:
- Detect the push
- Build the backend
- Deploy the new version
- Restart the worker

Monitor at: https://dashboard.render.com

### 4. Verify Deployment

Check Render logs for:
```
[Blog Worker] Starting...
[Blog Worker] Started successfully
```

### 5. Test Blog Generation

1. Go to your Wix site with the app installed
2. Navigate to Blog Generator
3. Select a product
4. Generate blog ideas
5. Select an idea
6. Generate the blog post

Expected logs:
```
[Blog Worker] Processing generation X
[Blog Worker] Generating content for X
[Blog Worker] Generated content for X
[Blog Worker] Generating image for X
[Blog Worker] Creating draft post for X
[TokenHelper] ✅ Token refreshed successfully
[Blog Worker] Completed generation X, draft post: <POST_ID>
```

## If Still Failing

### Check Wix App Permissions

1. Go to https://dev.wix.com/apps
2. Select your app
3. Go to **Permissions**
4. Ensure **Blog - Draft Posts** is set to **Manage**
5. Save changes

### Force Re-authentication

If permissions were just added, reinstall the app:

1. In Wix site dashboard, go to Apps
2. Find your app
3. Click "Remove"
4. Reinstall from your app URL or Wix App Market

This will generate new tokens with the updated permissions.

## Rollback (If Needed)

If something goes wrong:

```bash
git revert HEAD
git push origin main
```

Render will auto-deploy the previous version.

## Success Criteria

✅ Blog generation completes without authentication errors
✅ Draft posts appear in Wix Blog dashboard
✅ Logs show successful token refresh
✅ No UNAUTHENTICATED errors in Render logs

## Next Steps

After successful deployment:
1. Test with multiple products
2. Verify image generation works
3. Check credit deduction is working
4. Test the full blog workflow end-to-end
