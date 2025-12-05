# Billing Token Fix

## Issue

OAuth2 client credentials flow was failing with `invalid_request` error:
```
[TokenHelper] ❌ Failed to get elevated token: { error: 'invalid_request' }
Error: Failed to get elevated token: Request failed with status code 400
```

## Root Cause

The Wix Billing APIs (`billing.getUrl()` and `billing.getPurchaseHistory()`) require **site-specific context**, not app-level credentials. They need to know which site is making the request.

## Solution

Changed from using elevated token (OAuth2 client credentials) to using **instance token** (site-specific token stored in database):

### Before (Wrong Approach)
```typescript
// Tried to use app-level token
const accessToken = await getElevatedToken();
const wixClient = new WixSDKClient(accessToken);
```

### After (Correct Approach)
```typescript
// Use site-specific token from database
const { instanceId } = req.wixInstance!;
const accessToken = await getInstanceToken(instanceId);
const wixClient = new WixSDKClient(accessToken);
```

## Changes Made

1. **Added `verifyInstance` middleware** to billing endpoints
   - `/api/billing/upgrade-url` now requires instance token
   - `/api/billing/subscription` now requires instance token

2. **Switched to `getInstanceToken()`** instead of `getElevatedToken()`
   - Uses the access token stored in database during OAuth flow
   - Token is site-specific and has proper permissions

3. **Added instance context** to all billing API calls
   - Wix now knows which site is requesting the checkout URL
   - Purchase history is correctly scoped to the site

## Why This Works

When a user installs your app:
1. Wix OAuth flow provides site-specific tokens
2. These tokens are stored in `app_instances` table
3. These tokens have permissions for that specific site
4. Billing APIs use these tokens to identify the site

The elevated token (client credentials) is for app-level operations, not site-specific operations like billing.

## Testing

After deployment, the billing endpoints should now work:

```bash
# This should now succeed
curl -X GET \
  'https://ultimate-optimizer-app.onrender.com/api/billing/upgrade-url?planId=starter' \
  -H 'X-Wix-Instance: <your-instance-token>'
```

Expected: Real Wix checkout URL without OAuth errors

## Status

✅ Fixed and deployed
✅ Build succeeds
✅ Ready for testing

The "unable to change plan" error should now be resolved.
