# Billing SDK Implementation - Solution 2

## Overview

This implementation replaces the mock billing UI with real Wix Billing API integration using the Wix SDK approach (Solution 2). The system now fetches actual subscription data from Wix and generates real checkout URLs.

## What Was Implemented

### 1. Extended WixSDKClient (`backend/src/wix/sdkClient.ts`)

Added billing module integration:
- **`getCheckoutUrl(productId, options)`** - Generates real Wix checkout URLs using `billing.getUrl()`
- **`getPurchaseHistory()`** - Fetches subscription history using `billing.getPurchaseHistory()`

### 2. Created Token Helper (`backend/src/wix/tokenHelper.ts`)

New utility for OAuth2 authentication:
- **`getElevatedToken()`** - Gets app-level access token using client credentials flow
- **`getInstanceToken()`** - Gets site-specific token from database (for future use)

### 3. Updated Billing Routes (`backend/src/routes/billing.ts`)

#### `/api/billing/upgrade-url` (Updated)
- Now calls real Wix Billing API via SDK
- Maps internal plan IDs to Wix product IDs
- Returns actual checkout URL valid for 48 hours
- Supports test mode in development

#### `/api/billing/subscription` (New)
- Fetches current subscription from Wix
- Returns plan details, billing cycle, price
- Falls back to free plan if no purchases found

### 4. Updated Frontend (`frontend/src/pages/BillingCredits.tsx`)

- Now fetches from both `/api/me` (credits) and `/api/billing/subscription` (plan)
- Merges data to show accurate subscription status
- Gracefully handles API failures

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  BillingCredits.tsx                                         │
│  - Displays plan & credits                                  │
│  - Upgrade button                                           │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP Requests
             │
┌────────────▼────────────────────────────────────────────────┐
│                    Backend (Express)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ /api/billing/upgrade-url                            │  │
│  │ - Maps plan ID → Wix product ID                     │  │
│  │ - Gets elevated token                               │  │
│  │ - Calls WixSDKClient.getCheckoutUrl()               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ /api/billing/subscription                           │  │
│  │ - Gets elevated token                               │  │
│  │ - Calls WixSDKClient.getPurchaseHistory()           │  │
│  │ - Returns current subscription                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ WixSDKClient                                        │  │
│  │ - billing.getUrl()                                  │  │
│  │ - billing.getPurchaseHistory()                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ TokenHelper                                         │  │
│  │ - OAuth2 client credentials flow                   │  │
│  │ - Returns elevated access token                    │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Wix SDK API Calls
             │
┌────────────▼────────────────────────────────────────────────┐
│                    Wix APIs                                 │
│  - POST /oauth2/token (get access token)                   │
│  - POST /apps/v1/checkout (get checkout URL)               │
│  - GET /apps/v1/checkout/history (get purchases)           │
└─────────────────────────────────────────────────────────────┘
```

## Required Configuration

### Environment Variables

You need to add Wix product IDs to your Render environment:

```bash
# Optional: Map internal plan IDs to Wix product IDs
# If not set, uses plan ID as product ID
WIX_PRODUCT_ID_FREE=basic
WIX_PRODUCT_ID_STARTER=starter
WIX_PRODUCT_ID_PRO=pro
WIX_PRODUCT_ID_SCALE=scale
```

### How to Get Wix Product IDs

1. Go to [Wix Developers Dashboard](https://dev.wix.com/)
2. Select your app
3. Navigate to **Monetization** → **Plans**
4. Each plan has a **Product ID** (UUID format)
5. Copy these IDs and add them to Render environment variables

**Example:**
```
WIX_PRODUCT_ID_STARTER=e8f429d4-0a6a-468f-8044-87f519a53202
```

## Data Flow

### Upgrade Flow

1. **User clicks "Upgrade" button**
2. **Frontend** calls `/api/billing/upgrade-url?planId=starter`
3. **Backend**:
   - Maps `starter` → Wix product ID
   - Gets elevated token via OAuth2
   - Creates WixSDKClient with token
   - Calls `billing.getUrl(productId, options)`
   - Returns real checkout URL
4. **Frontend** redirects to Wix checkout page
5. **User completes purchase**
6. **Wix** sends webhook to `/api/webhooks/billing`
7. **Backend** updates database with new plan

### Subscription Display Flow

1. **Page loads**
2. **Frontend** calls both:
   - `/api/me` → Gets credits from database
   - `/api/billing/subscription` → Gets plan from Wix
3. **Backend** (`/api/billing/subscription`):
   - Gets elevated token
   - Calls `billing.getPurchaseHistory()`
   - Returns most recent purchase
4. **Frontend** displays merged data

## Key Features

### ✅ Real Wix Integration
- Uses official Wix SDK
- Calls actual Billing APIs
- No more mock URLs

### ✅ Consistent with Existing Code
- Same pattern as products/stores integration
- Uses WixSDKClient class
- Follows established architecture

### ✅ Proper Authentication
- OAuth2 client credentials flow
- Elevated tokens for app-level operations
- Secure token management

### ✅ Error Handling
- Graceful fallbacks
- Detailed error logging
- User-friendly error messages

### ✅ Test Mode Support
- Automatic test mode in development
- Real charges only in production
- Safe testing environment

## Testing

### 1. Test Upgrade URL Generation

```bash
# Call the endpoint
curl -X GET \
  'https://ultimate-optimizer-app.onrender.com/api/billing/upgrade-url?planId=starter' \
  -H 'X-Wix-Instance: <your-instance-token>'
```

Expected response:
```json
{
  "url": "https://www.wix.com/apps/upgrade/order-checkout?token=...",
  "planId": "starter",
  "productId": "e8f429d4-0a6a-468f-8044-87f519a53202"
}
```

### 2. Test Subscription Fetch

```bash
curl -X GET \
  'https://ultimate-optimizer-app.onrender.com/api/billing/subscription' \
  -H 'X-Wix-Instance: <your-instance-token>'
```

Expected response:
```json
{
  "planId": "starter",
  "planName": "Starter",
  "status": "active",
  "billingCycle": "MONTHLY",
  "price": 9,
  "currency": "USD",
  "dateCreated": "2025-10-31T..."
}
```

### 3. Test Frontend Integration

1. Open your app in a Wix site
2. Navigate to Billing & Credits page
3. Verify plan displays correctly
4. Click "Upgrade" button
5. Verify redirect to Wix checkout page
6. Complete test purchase
7. Verify plan updates after webhook

## Troubleshooting

### Issue: "Failed to get elevated token"

**Cause**: OAuth2 authentication failed

**Solutions**:
1. Verify `WIX_APP_ID` is set correctly
2. Verify `WIX_APP_SECRET` is set correctly
3. Check Render logs for specific error
4. Ensure credentials match Wix dashboard

### Issue: "Failed to generate upgrade URL"

**Cause**: Wix Billing API call failed

**Solutions**:
1. Verify external pricing page is configured in Wix dashboard
2. Check that product IDs exist in Wix
3. Ensure app has billing permissions
4. Review Wix API error in logs

### Issue: Checkout URL returns 404

**Cause**: Invalid product ID or expired URL

**Solutions**:
1. Verify product IDs in environment variables
2. Check that plans are published in Wix
3. Ensure URL is used within 48 hours
4. Test with correct Wix product ID format

### Issue: Subscription shows "free" when user has paid plan

**Cause**: Purchase history API not returning data

**Solutions**:
1. Verify webhook successfully updated database
2. Check that purchase completed in Wix
3. Review purchase history API response in logs
4. Ensure user is authenticated correctly

## What's Still Mock vs Real

### ✅ Now Real (Fixed)
- Upgrade URL generation → Calls Wix API
- Checkout redirect → Goes to real Wix checkout
- Subscription display → Fetches from Wix (optional)

### ✅ Already Real (Working)
- Credits tracking → Stored in database
- Webhook handling → Updates database on purchase
- Plan storage → Synced via webhooks

### 📋 Still Hardcoded (By Design)
- Plan details (name, price, features) → Displayed from PLANS array
  - **Why**: UI consistency and performance
  - **Note**: Actual plan comes from Wix, just displayed with local data

## Next Steps

### Required Before Production

1. **Add Wix Product IDs to Render**
   - Get product IDs from Wix dashboard
   - Add as environment variables
   - Redeploy service

2. **Test Complete Flow**
   - Test upgrade URL generation
   - Complete test purchase
   - Verify webhook updates database
   - Confirm subscription display

3. **Configure Success URL**
   - Update success URL in code if needed
   - Should redirect back to your app

### Optional Enhancements

1. **Add Subscription Caching**
   - Cache purchase history for performance
   - Refresh on webhook events

2. **Add Downgrade Support**
   - Handle plan downgrades
   - Implement cancellation flow

3. **Add Usage Tracking**
   - Track API usage for metered billing
   - Implement usage-based charges

4. **Add Billing History Page**
   - Show past invoices
   - Display payment history

## References

- [Wix Billing API Documentation](https://dev.wix.com/docs/rest/app-management/app-billing)
- [Wix SDK Documentation](https://dev.wix.com/docs/sdk)
- [OAuth2 Client Credentials Flow](https://dev.wix.com/docs/build-apps/developer-tools/authentication/oauth-2-0)
- [External Pricing Page Setup](https://dev.wix.com/docs/build-apps/build-your-app/pricing-plans/set-up-an-external-pricing-page)

## Summary

The billing system now uses real Wix APIs instead of mock implementations:
- Upgrade button generates actual Wix checkout URLs
- Subscription data can be fetched from Wix (optional)
- Credits continue to work from database (correct approach)
- Webhooks keep everything in sync
- Ready for production with proper product ID configuration
