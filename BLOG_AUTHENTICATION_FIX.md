# Blog Generation Authentication Fix

## Problem
Blog generation was failing with `UNAUTHENTICATED: Not authenticated: UNKNOWN` error when trying to create draft posts in Wix, even though token refresh appeared to succeed.

## Root Cause
The blog worker was caching the Wix client instance, which could lead to using stale tokens. Additionally, the Wix Blog API requires specific permissions that may not have been properly configured.

## Solution Applied

### 1. Fixed Token Caching Issue
**File**: `backend/src/workers/blogGenerationWorker.ts`

**Changed from**:
```typescript
let wixClientCache: ReturnType<typeof createWixClient> | null = null;
const getAuthorizedWixClient = async (forceRefresh = false) => {
  if (forceRefresh || !wixClientCache) {
    const token = await getInstanceToken(instance.instance_id, {
      forceRefresh,
    });
    wixClientCache = createWixClient(token);
  }
  return wixClientCache;
};
```

**Changed to**:
```typescript
// Always get fresh token for each operation to avoid stale token issues
const getAuthorizedWixClient = async (forceRefresh = false) => {
  const token = await getInstanceToken(instance.instance_id, {
    forceRefresh,
  });
  return createWixClient(token);
};
```

This ensures every API call uses a fresh token, eliminating any possibility of stale token issues.

### 2. Required Wix App Permissions

Verify your app has the following permissions in the Wix Developer Dashboard:

1. Go to https://dev.wix.com/apps
2. Select your app
3. Navigate to **Permissions** section
4. Ensure these permissions are enabled:
   - **Blog - Draft Posts**: Set to **Manage**
   - **Blog - Posts**: Set to **Read** (optional, for reading published posts)

### 3. Re-authentication Required

After updating permissions, users must re-authorize your app:

**Option A: Reinstall the app**
1. Go to the Wix site
2. Uninstall your app
3. Reinstall it from the Wix App Market or your test URL

**Option B: Force token refresh** (if you have admin access)
Run this SQL to clear tokens and force re-authentication:
```sql
UPDATE app_instances 
SET token_expires_at = NOW() - INTERVAL '1 hour'
WHERE instance_id = 'YOUR_INSTANCE_ID';
```

## How It Works Now

1. **Token Request**: Worker calls `getInstanceToken(instanceId)` with optional `forceRefresh`
2. **OAuth Flow**: Token helper uses OAuth2 client credentials with instance_id:
   ```
   POST https://www.wixapis.com/oauth2/token
   {
     "grant_type": "client_credentials",
     "client_id": "<APP_ID>",
     "client_secret": "<APP_SECRET>",
     "instance_id": "<INSTANCE_ID>"
   }
   ```
3. **Instance-Specific Token**: Returns a token with permissions for that specific Wix site
4. **Blog API Call**: Uses the fresh token to create draft posts

## Testing

After deploying this fix:

1. **Test blog generation**:
   - Go to your app's Blog Generator page
   - Select a product
   - Generate blog ideas
   - Select an idea
   - Generate the blog post

2. **Check logs** for:
   ```
   [TokenHelper] ✅ Token refreshed successfully
   [Blog Worker] Creating draft post for X
   [Blog Worker] Completed generation X, draft post: <POST_ID>
   ```

3. **Verify in Wix**:
   - Go to your Wix site dashboard
   - Navigate to Blog → Posts
   - Check for the new draft post

## Deployment

```bash
# Build backend
cd backend
npm run build

# Deploy to Render
git add .
git commit -m "Fix blog generation authentication"
git push origin main
```

Render will automatically deploy the changes.

## Troubleshooting

### Still getting UNAUTHENTICATED error?

1. **Check app permissions** in Wix Developer Dashboard
2. **Verify environment variables** on Render:
   - `WIX_APP_ID`
   - `WIX_APP_SECRET`
3. **Check token in database**:
   ```sql
   SELECT instance_id, token_expires_at, 
          (token_expires_at > NOW()) as is_valid
   FROM app_instances;
   ```
4. **Force reinstall** the app on the test site

### Token refresh fails?

Check the error message:
- `invalid_grant`: Refresh token is invalid, need to reinstall app
- `invalid_client`: APP_ID or APP_SECRET is wrong
- `unauthorized_client`: App doesn't have required permissions

## Related Files
- `backend/src/workers/blogGenerationWorker.ts` - Blog generation worker
- `backend/src/wix/tokenHelper.ts` - Token management
- `backend/src/wix/sdkClient.ts` - Wix SDK client wrapper
