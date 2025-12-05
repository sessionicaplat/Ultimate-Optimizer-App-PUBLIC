# Wix 403 Forbidden Error - Products API

## Issue
Getting 403 Forbidden errors when calling `/api/products`:
```
Wix API error: Error: Wix API error: Forbidden
status: 403
```

## Root Cause
The access token stored in the database doesn't have permission to access the Wix Stores/Catalog API. This can happen when:

1. **OAuth token expired or revoked**
2. **App permissions changed in Wix Dashboard**
3. **App needs to be reinstalled on the site**
4. **Wix Stores app not installed on the site**

## Quick Fix

### Option 1: Reinstall the App (Recommended)
1. Go to your Wix site dashboard
2. Navigate to **Apps** → **Manage Apps**
3. Find "Ultimate Optimizer App"
4. Click **Remove** or **Uninstall**
5. Reinstall the app from your test URL or App Market
6. Complete OAuth authorization flow again
7. This will generate a fresh access token with correct permissions

### Option 2: Check App Permissions in Wix Developer Dashboard
1. Go to [Wix Developers Dashboard](https://dev.wix.com/)
2. Select your app
3. Navigate to **Permissions** or **OAuth**
4. Verify these permissions are enabled:
   - ✅ **Stores - Catalog**: Read Products
   - ✅ **Stores - Catalog**: Manage Products
   - ✅ **Stores - Collections**: Read Collections
5. If you changed permissions, users must **reauthorize** the app

### Option 3: Verify Wix Stores is Installed
1. Go to your Wix site dashboard
2. Check if **Wix Stores** app is installed
3. If not, install it from Wix App Market
4. Your app requires Wix Stores to be present

## Detailed Diagnosis

### Check Access Token in Database
The logs show the token is being retrieved:
```
Executed query: SELECT * FROM app_instances WHERE instance_id = $1
rows: 1
```

But the token doesn't have the right permissions.

### Check Token Expiration
Access tokens can expire. The system should refresh them automatically, but if the refresh token is also invalid, you need to reauthorize.

### Check API Endpoint
The error occurs at:
```
WixStoresClient.getProducts()
```

This calls the Wix Catalog V3 API, which requires specific permissions.

## Prevention

### 1. Implement Token Refresh
The app should automatically refresh expired tokens. Check if `updateAccessToken()` is being called when tokens expire.

### 2. Handle 403 Errors Gracefully
Add better error handling in the products route:

```typescript
if (error.status === 403) {
  return res.status(403).json({
    error: 'Permission denied',
    message: 'Please reinstall the app to refresh permissions',
    action: 'reinstall'
  });
}
```

### 3. Add Permission Check Endpoint
Create an endpoint to verify permissions before making API calls:

```typescript
router.get('/api/permissions/check', async (req, res) => {
  // Try to make a simple API call
  // Return which permissions are working
});
```

## Testing After Fix

### 1. Reinstall App
```bash
# Visit your app installation URL
https://ultimate-optimizer-app.onrender.com/oauth/install?token=...
```

### 2. Check Products Load
```bash
# Should return products without 403 error
curl https://ultimate-optimizer-app.onrender.com/api/products \
  -H "Authorization: <instance-token>"
```

### 3. Verify in Frontend
1. Open app in Wix dashboard
2. Navigate to Product Optimizer page
3. Products should load successfully

## Common Scenarios

### Scenario 1: Just Added Billing Permissions
**Problem**: You added billing permissions to your app, which requires users to reauthorize.

**Solution**: All existing installations need to reinstall/reauthorize the app.

### Scenario 2: Token Expired
**Problem**: Access token expired and refresh failed.

**Solution**: Reinstall app to get fresh tokens.

### Scenario 3: Wix Stores Not Installed
**Problem**: Site doesn't have Wix Stores app installed.

**Solution**: Install Wix Stores on the site first.

### Scenario 4: Wrong API Version
**Problem**: Using V3 API but site only supports V1.

**Solution**: The app auto-detects this, but you can force V1 in the code if needed.

## Immediate Action Required

**For your current instance (`7f8aa3f7-6acd-4576-a6a6-20b89f19dffd`):**

1. **Reinstall the app** on your test Wix site
2. This will trigger OAuth flow again
3. New access token will be stored in database
4. Products API should work immediately

## Monitoring

Add logging to track token issues:

```typescript
// In storesClient.ts
if (error.status === 403) {
  console.error('Token permission error:', {
    instanceId,
    tokenAge: Date.now() - tokenCreatedAt,
    endpoint: url,
  });
}
```

## Related Files

- `backend/src/wix/storesClient.ts` - Makes the API calls
- `backend/src/routes/products.ts` - Products endpoint
- `backend/src/db/appInstances.ts` - Token storage
- `backend/src/routes/oauth.ts` - OAuth flow

## Status

🔴 **Action Required**: Reinstall app to refresh permissions

Once reinstalled, the 403 errors should stop immediately.
