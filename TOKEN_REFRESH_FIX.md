# Token Refresh Fix

## Problem

The billing subscription endpoint was failing after ~1 hour with:
```
Error: Instance token expired - refresh not implemented
```

This affected ALL users (both free and paid) because access tokens expire after 1 hour and weren't being refreshed.

## Root Cause

The `getInstanceToken()` function in `tokenHelper.ts` was checking if the token was expired but throwing an error instead of refreshing it.

## Solution

Implemented automatic token refresh in `getInstanceToken()` using the same OAuth2 client_credentials flow that's already working in `WixStoresClient`.

### Changes Made

**backend/src/wix/tokenHelper.ts**
- Added token refresh logic to `getInstanceToken()`
- Checks if token is expired (with 5-minute buffer)
- If expired, calls Wix OAuth2 endpoint with:
  - `grant_type: 'client_credentials'`
  - `client_id: WIX_APP_ID`
  - `client_secret: WIX_APP_SECRET`
  - `instanceId: <instance-id>`
- Updates database with new token
- Returns fresh token

### How It Works

1. **Check Expiration**
   - Compares current time with `token_expires_at`
   - Uses 5-minute buffer to refresh proactively

2. **Refresh Token**
   - Calls `POST https://www.wixapis.com/oauth2/token`
   - Uses client_credentials grant with instanceId
   - Gets new access token (valid for 1 hour)

3. **Update Database**
   - Saves new access token
   - Updates expiration time
   - Keeps instance token as refresh token

4. **Return Token**
   - Returns fresh token to caller
   - Caller can now make Wix API calls

## Benefits

✅ **Billing page works indefinitely** - no more "token expired" errors
✅ **Automatic refresh** - happens transparently when needed
✅ **Proactive refresh** - 5-minute buffer prevents race conditions
✅ **Works for all users** - free and paid subscriptions
✅ **Consistent with existing code** - uses same flow as WixStoresClient

## Testing

### Before Fix
1. Wait 1 hour after app installation
2. Visit billing page
3. See error: "Instance token expired"
4. Subscription status not displayed

### After Fix
1. Wait 1 hour after app installation
2. Visit billing page
3. Token automatically refreshes
4. Subscription status displays correctly
5. No errors

### Continuous Use
- Token refreshes every hour automatically
- Users never see token expiration errors
- Billing page always works

## Technical Details

### Token Lifecycle
- **Initial token**: Obtained during app installation (provision)
- **Expiration**: 1 hour (3600 seconds)
- **Refresh**: Automatic when expired or within 5 minutes of expiry
- **Storage**: Saved in `app_instances` table

### OAuth2 Flow
```
POST https://www.wixapis.com/oauth2/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "your-app-id",
  "client_secret": "your-app-secret",
  "instanceId": "instance-id-here"
}

Response:
{
  "access_token": "new-token-here",
  "expires_in": 3600
}
```

### Database Update
```sql
UPDATE app_instances
SET 
  access_token = 'new-token',
  token_expires_at = NOW() + INTERVAL '3600 seconds'
WHERE instance_id = 'instance-id'
```

## Impact

This fix ensures the billing integration works reliably for all users, regardless of how long they've had the app installed. No more token expiration errors!
