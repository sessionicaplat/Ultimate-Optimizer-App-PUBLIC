# Pricing Plans API 403 Error - Permissions Fix

## Problem

Getting 403 Forbidden error when calling Pricing Plans Orders API:

```
Error listing member orders: SDKError: {"message": "","details": {"applicationError": {"description": "","code": 403}}}
```

## Root Cause

Your Wix app doesn't have the required permissions to access the Pricing Plans Orders API. This is a **Wix app configuration issue**, not a code issue.

## Solution: Add Pricing Plans Permissions

### Step 1: Go to Wix Developers Dashboard

1. Visit [Wix Developers Dashboard](https://dev.wix.com/)
2. Log in with your Wix account
3. Select your app: **Ultimate Optimizer**

### Step 2: Add Pricing Plans Permissions

1. In your app dashboard, look for one of these sections:
   - **"Permissions"**
   - **"OAuth"**
   - **"App Settings"** → **"Permissions"**

2. Find **"Pricing Plans"** in the list of available permissions

3. Enable the following permissions:
   - ✅ **Read Pricing Plans** or **Read Orders** (`pricing-plans.orders.read`)
   - ✅ **Manage Pricing Plans** or **Manage Orders** (`pricing-plans.orders.manage`)
   - ✅ **Perform Member Actions** (if available)

### Step 3: Save Changes

1. Click **"Save"** or **"Update"** to save the permission changes
2. Note: Some changes may require app review/approval

### Step 4: Reinstall the App

After adding permissions, you **must** reinstall the app:

1. Go to your Wix test site dashboard
2. Navigate to **Apps** → **Manage Apps**
3. Find **Ultimate Optimizer**
4. Click **"Remove"** or **"Uninstall"**
5. Reinstall the app from:
   - Wix App Market (if published)
   - Or your development environment
6. This triggers a new OAuth flow with updated permissions

### Step 5: Test Again

1. Open the app
2. Navigate to the Test Cancellation page
3. Try to load orders again
4. Should now work without 403 errors

## What the Code Does Now

The code has been updated to provide helpful error messages when permissions are missing:

### Backend Response (403)
```json
{
  "error": "Pricing Plans API permissions not configured",
  "message": "Your Wix app needs Pricing Plans permissions to access orders.",
  "details": {
    "required_permissions": [
      "pricing-plans.orders.read",
      "pricing-plans.orders.manage"
    ],
    "instructions": "Go to Wix Developers Dashboard → Your App → Permissions..."
  }
}
```

### Frontend Display
The UI now shows a clear, formatted error message with step-by-step instructions when permissions are missing.

## Alternative: Mock Data for Testing

If you can't configure permissions right now, you can temporarily use mock data:

### Option 1: Return Mock Orders

Update `backend/src/routes/orders.ts`:

```typescript
// Temporary mock data for testing UI
const mockOrders = [
  {
    _id: 'mock-order-1',
    planName: 'Pro Plan',
    planDescription: 'Professional features',
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    planPrice: '29.99',
    lastPaymentStatus: 'PAID',
    type: 'ONLINE',
    pricing: {
      prices: [{
        price: {
          currency: 'USD',
          total: '29.99'
        }
      }]
    }
  }
];

// In the route handler, before the API call:
if (process.env.USE_MOCK_ORDERS === 'true') {
  return res.json({
    orders: mockOrders,
    total: mockOrders.length
  });
}
```

Then set in Render: `USE_MOCK_ORDERS=true`

## Verification

### Check Permissions are Applied

1. **In Wix Dashboard:**
   - Go to your app settings
   - Check that Pricing Plans permissions are enabled
   - Status should show "Active" or "Approved"

2. **Test the API:**
   ```bash
   # Should return orders or empty array (not 403)
   curl https://your-app.onrender.com/api/orders/member/active \
     -H "X-Wix-Instance: your-instance-token"
   ```

3. **Check App Instance:**
   - Reinstall should have updated the OAuth token
   - New token includes pricing plans scope

## Troubleshooting

### Still Getting 403 After Adding Permissions

**Possible Causes:**
1. ❌ App not reinstalled after permission changes
2. ❌ Permissions not saved in Wix dashboard
3. ❌ App requires review/approval for new permissions
4. ❌ Using old access token (before permissions were added)

**Solutions:**
1. ✅ Completely uninstall and reinstall the app
2. ✅ Check Wix dashboard shows permissions as "Active"
3. ✅ Wait for approval if required
4. ✅ Clear browser cache and cookies
5. ✅ Check access token in database has new scope

### Can't Find Pricing Plans Permissions

**If Pricing Plans is not listed:**
1. Your app type might not support it
2. Try searching for "Orders" or "Subscriptions"
3. Check Wix documentation for your app type
4. Contact Wix support for guidance

### Permissions Require Review

Some permissions require Wix review:
1. Submit app for review in Wix dashboard
2. Wait for approval (can take 1-3 business days)
3. Use mock data in the meantime

## Related Documentation

- [Wix Pricing Plans API](https://dev.wix.com/docs/sdk/api-reference/pricing-plans/orders)
- [Wix App Permissions](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/self-hosted-apps/authentication/oauth#permissions)
- [OAuth Scopes](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/self-hosted-apps/authentication/oauth#oauth-scopes)

## Summary

**The Issue:** 403 Forbidden = Missing Pricing Plans permissions

**The Fix:**
1. Add permissions in Wix Developers Dashboard
2. Reinstall the app on your test site
3. Test again

**Code Changes:** ✅ Already updated to show helpful error messages

**Next Steps:** Configure permissions in Wix dashboard, then reinstall the app
