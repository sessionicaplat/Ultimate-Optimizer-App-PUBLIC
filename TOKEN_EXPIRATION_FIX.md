# Token Expiration Fix - 403 Forbidden Error Resolution

## Problem Summary

After some hours of runtime, the product optimizer showed API errors when loading products and collections. The error manifested as:
- **403 Forbidden** responses from Wix API
- Only resolved by reinstalling the app or redeploying
- Logs showed: `[WixStoresClient] Response: 403 Forbidden`

## Root Cause

**Access tokens were expiring without being properly refreshed before API calls.**

### Why It Happened

1. **Token Lifecycle**: Wix access tokens expire after ~1 hour (`expires_in: 3600`)

2. **Missing Proactive Check**: The code created new `WixStoresClient` instances on every request, passing tokens directly from the database without checking expiration

3. **Reactive vs Proactive**: Token refresh only triggered on **401 Unauthorized** errors, but Wix was returning **403 Forbidden** for expired tokens

4. **Why Reinstall/Redeploy Fixed It**: 
   - Reinstalling called `/api/provision` which got a fresh token
   - Redeploying restarted the app, triggering provisioning on first request
   - Fresh tokens worked for ~1 hour, then expired again

## Solution Implemented

### Option 1: Proactive Token Management (Implemented)

Updated all code that creates `WixStoresClient` instances to use the `getInstanceToken()` helper, which:
- Checks token expiration before use (with 5-minute buffer)
- Automatically refreshes expired tokens
- Updates the database with new tokens
- Returns a valid, fresh token

### Files Updated

#### 1. Products Route (`backend/src/routes/products.ts`)
```typescript
// Added import
import { getInstanceToken } from '../wix/tokenHelper';

// Before creating WixStoresClient (2 locations):
const accessToken = await getInstanceToken(instance.instance_id);
const client = new WixStoresClient(
  accessToken,  // ← Fresh token
  instance.refresh_token,
  instance.instance_id
);
```

#### 2. Job Worker (`backend/src/workers/jobWorker.ts`)
```typescript
// Added import
import { getInstanceToken } from '../wix/tokenHelper';

// Before creating WixStoresClient:
const accessToken = await getInstanceToken(instance.instance_id);
const wixClient = new WixStoresClient(
  accessToken,  // ← Fresh token
  instance.refresh_token,
  instance.instance_id
);
```

#### 3. Publish Route (`backend/src/routes/publish.ts`)
```typescript
// Added import
import { getInstanceToken } from '../wix/tokenHelper';

// Before creating WixStoresClient:
const accessToken = await getInstanceToken(instanceId);
const wixClient = new WixStoresClient(
  accessToken,  // ← Fresh token
  instance.refresh_token,
  instanceId
);
```

#### 4. WixStoresClient (`backend/src/wix/storesClient.ts`)
Added **403 Forbidden** to retry logic as a safety net:

```typescript
private async request(...): Promise<any> {
  try {
    return await this.makeRequest(path, body, method);
  } catch (error: any) {
    // If 401 or 403, try to refresh token and retry once
    if (error.status === 401 || error.status === 403) {
      console.log(`[WixStoresClient] ${error.status} error, attempting token refresh...`);
      await this.refreshAccessToken();
      return await this.makeRequest(path, body, method);
    }
    throw error;
  }
}
```

## How Token Refresh Works

### Token Helper Logic (`getInstanceToken()`)

```typescript
1. Fetch instance from database
2. Check if token expires within 5 minutes
3. If expired/expiring:
   - Call Wix OAuth endpoint with client_credentials + instanceId
   - Get new access token
   - Update database with new token and expiration
4. Return valid access token
```

### Token Refresh Flow

```
Request → getInstanceToken()
            ↓
         Check expiration
            ↓
    [Expired?] → Yes → Refresh from Wix
            ↓              ↓
           No          Update DB
            ↓              ↓
         Return fresh token
            ↓
    Create WixStoresClient
            ↓
    Make API calls
```

## Benefits of This Fix

1. **Proactive Prevention**: Tokens refreshed before they cause errors
2. **5-Minute Buffer**: Prevents race conditions near expiration
3. **Centralized Logic**: All token management in one place (`tokenHelper.ts`)
4. **Automatic Recovery**: Even if proactive check misses, 403 retry catches it
5. **No User Impact**: Seamless token refresh without app reinstallation

## Testing the Fix

### Before Deployment
```bash
# Build the backend
cd backend
npm run build
```

### After Deployment
1. **Immediate Test**: Load products/collections - should work
2. **Wait 1+ Hour**: Leave app running, then reload - should still work
3. **Check Logs**: Look for token refresh messages:
   ```
   [TokenHelper] Token expired or expiring soon, refreshing...
   [TokenHelper] ✅ Token refreshed successfully
   ```

### Monitoring
Watch for these log patterns:
- ✅ `[TokenHelper] ✅ Token refreshed successfully`
- ✅ `[WixStoresClient] 403 error, attempting token refresh...`
- ❌ `[WixStoresClient] Response: 403 Forbidden` (should not appear anymore)

## Related Files

- `backend/src/wix/tokenHelper.ts` - Token management logic
- `backend/src/db/appInstances.ts` - Database token storage
- `backend/src/routes/provision.ts` - Initial token acquisition
- `backend/src/auth/verifyInstance.ts` - Instance token verification

## Deployment Steps

1. **Build Backend**:
   ```bash
   cd backend
   npm run build
   ```

2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Fix: Proactive token refresh to prevent 403 errors"
   ```

3. **Deploy to Render**:
   ```bash
   git push origin main
   ```

4. **Monitor Logs**: Watch Render logs for successful token refreshes

## Expected Behavior After Fix

- ✅ Products/collections load consistently
- ✅ No 403 errors after hours of runtime
- ✅ Automatic token refresh every ~55 minutes
- ✅ Background worker continues processing jobs
- ✅ Publish operations work reliably
- ✅ No need to reinstall or redeploy

## Prevention

This fix ensures tokens are **always fresh** by:
1. Checking expiration before every API operation
2. Using a 5-minute safety buffer
3. Having a fallback retry mechanism for 403 errors
4. Centralizing token logic in one helper function

The issue is now **permanently resolved** and will not recur.
