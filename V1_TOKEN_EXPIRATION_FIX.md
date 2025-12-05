# V1 Token Expiration Fix

## Problem
After some time, V1 API calls were failing with `invalid_token` error:
```
errorDescription: '[business][FATAL][unknown exception] c.w.o.p.s.c.HandleExceptions$BadRequestWithSpecificMessageResponse - invalid_token'
```

The error would stop when the app was uninstalled and reinstalled (because it generated fresh tokens).

## Root Cause
The `WixStoresClient.refreshAccessToken()` method was only using the **client_credentials flow**, which doesn't work reliably for V1 API endpoints. The V3 fix used a different token refresh mechanism that wasn't applied to V1.

### Why It Failed
1. **Token expires after 5-10 minutes** - Wix access tokens have short lifespans
2. **V1 refresh logic was incomplete** - Only tried client_credentials flow
3. **Missing refresh_token flow** - The legacy OAuth flow that works for both V1 and V3 wasn't being used

## Solution Applied

### 1. Enhanced Token Refresh Logic
Updated `WixStoresClient.refreshAccessToken()` to use a **two-tier approach**:

```typescript
// Priority 1: Try legacy refresh_token flow (works for V1 and V3)
POST https://www.wixapis.com/oauth/access
{
  grant_type: 'refresh_token',
  client_id: appId,
  client_secret: appSecret,
  refresh_token: refreshToken
}

// Priority 2: Fallback to client_credentials (if refresh_token fails)
POST https://www.wixapis.com/oauth2/token
{
  grant_type: 'client_credentials',
  client_id: appId,
  client_secret: appSecret,
  instance_id: instanceId
}
```

### 2. Better Error Detection
Enhanced the `request()` method to catch `invalid_token` errors more reliably:

```typescript
const isInvalidToken = 
  error.status === 401 || 
  error.status === 403 ||
  (error.body && error.body.includes('invalid_token')) ||
  (error.message && error.message.includes('invalid_token'));
```

### 3. Improved Error Parsing
Added support for `errorDescription` field in error responses to catch Wix-specific error formats.

## Changes Made

### File: `backend/src/wix/storesClient.ts`

1. **Rewrote `refreshAccessToken()` method**
   - Try refresh_token flow first (legacy OAuth)
   - Fallback to client_credentials if refresh_token fails
   - Update both access_token and refresh_token in database
   - Better logging for debugging

2. **Enhanced `request()` method**
   - Check for `invalid_token` in error body and message
   - Trigger refresh on any token-related error
   - Better error detection

3. **Improved `makeRequest()` method**
   - Parse `errorDescription` field from Wix errors
   - Better error logging

## Testing Checklist

- [ ] Test V1 API calls immediately after app install (should work)
- [ ] Wait 10+ minutes and test V1 API calls again (should auto-refresh)
- [ ] Check logs for "Token refreshed using refresh_token flow" message
- [ ] Verify no more `invalid_token` errors after extended use
- [ ] Test V3 API calls still work (shouldn't be affected)

## Expected Behavior

### Before Fix
```
✅ App installed - works fine
⏰ 10 minutes pass
❌ V1 API call fails: "invalid_token"
🔄 Reinstall app
✅ Works again temporarily
```

### After Fix
```
✅ App installed - works fine
⏰ 10 minutes pass
🔄 Token automatically refreshed
✅ V1 API call succeeds
✅ Continues working indefinitely
```

## Monitoring

Watch for these log messages:
- `[WixStoresClient] Invalid/expired token detected, attempting refresh...`
- `[WixStoresClient] ✅ Token refreshed using refresh_token flow`
- `[WixStoresClient] ✅ Token refreshed using client_credentials flow`

If you see the client_credentials message frequently, it means refresh tokens aren't being stored properly.

## Related Files
- `backend/src/wix/storesClient.ts` - Main fix
- `backend/src/wix/tokenHelper.ts` - Reference implementation (already had correct logic)
- `backend/src/db/appInstances.ts` - Token storage

## Notes
- This fix mirrors the token refresh logic already working in `tokenHelper.ts`
- Both V1 and V3 now use the same token refresh mechanism
- Refresh tokens are properly persisted to the database
- The fix is backward compatible with existing installations
