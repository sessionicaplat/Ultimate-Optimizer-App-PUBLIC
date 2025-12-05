# Wix Hosted Billing Implementation Guide

## Overview

This implementation uses **Option 1: Wix's Built-in Pricing Page** from the Wix 2025 Billing API documentation. The app no longer displays pricing plans or handles checkout - instead, users are redirected to Wix's hosted pricing and checkout pages.

## What Changed

### Frontend Changes

**New Credits Page** (`frontend/src/pages/BillingCredits.tsx`)
- Simplified to show only credit usage and balance
- Removed in-app plan selection and checkout UI
- Added "Upgrade" button that redirects to Wix's hosted pricing page
- Shows different CTAs for free vs paid users

**Key Features:**
- Real-time credit usage tracking
- Visual progress bar showing credit consumption
- Auto-sync with Wix on page load
- Single "Upgrade" button for all plan changes

### Backend Changes

**No changes required** - The existing backend already supports:
- Webhook handling for subscription events
- Credit sync endpoint
- Plan updates from Wix

## How It Works

### User Flow

1. **User clicks "Upgrade" button** in the Credits page
2. **App redirects to Wix pricing page**: `https://www.wix.com/apps/upgrade/{APP_ID}`
3. **Wix displays pricing plans** (configured in Wix Developer Dashboard)
4. **User selects plan and completes checkout** on Wix's secure page
5. **Wix processes payment** and handles all billing logic
6. **Wix sends webhook** to your app with purchase confirmation
7. **App updates user's plan and credits** in database
8. **User is redirected back** to your app

### Technical Flow

```
User Action → Wix Pricing Page → Wix Checkout → Payment → Webhook → Database Update
```

## Configuration Required

### 1. Wix Developer Dashboard Setup

Go to [dev.wix.com](https://dev.wix.com) → Your App → Pricing & Plans

**Create Pricing Plans:**
- Free Plan: 200 credits/month, $0
- Starter Plan: 1,000 credits/month, $9/month
- Pro Plan: 5,000 credits/month, $19/month
- Scale Plan: 25,000 credits/month, $49/month

**Important Settings:**
- Set pricing page to **Internal** (not External)
- Configure up to 4 plans (Wix limit)
- Set billing cycle to Monthly
- Enable webhooks for billing events

### 2. Environment Variables

**Frontend** (`.env` and `.env.production`):
```bash
VITE_WIX_APP_ID=your-wix-app-id
```

**Backend** (already configured):
```bash
WIX_APP_ID=your-wix-app-id
WIX_PUBLIC_KEY=your-public-key
WIX_PRODUCT_ID_STARTER=starter-plan-id
WIX_PRODUCT_ID_PRO=pro-plan-id
WIX_PRODUCT_ID_SCALE=scale-plan-id
```

### 3. Get Your Wix App ID

1. Go to [dev.wix.com](https://dev.wix.com)
2. Select your app
3. Go to **Settings** → **App Info**
4. Copy the **App ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
5. Update both frontend `.env` files with this ID

## Code Structure

### Credits Page Component

```typescript
// Simplified structure
const BillingCredits = () => {
  // Fetch credit data
  const [account, setAccount] = useState<AccountData | null>(null);
  
  // Handle upgrade click
  const handleUpgradeClick = () => {
    const wixPricingUrl = `https://www.wix.com/apps/upgrade/${appId}`;
    window.top.location.href = wixPricingUrl;
  };
  
  return (
    <>
      {/* Current Plan Card */}
      {/* Credit Usage Card */}
      {/* Upgrade CTA (for free users) */}
      {/* Manage Subscription (for paid users) */}
      {/* Tips Card */}
    </>
  );
};
```

### Key Functions

**Auto-sync credits on page load:**
```typescript
await fetchWithAuth('/api/billing/sync-credits', { method: 'POST' });
```

**Redirect to Wix pricing:**
```typescript
window.top.location.href = `https://www.wix.com/apps/upgrade/${appId}`;
```

## Benefits of This Approach

### For Development
- ✅ Less code to maintain
- ✅ No payment processing logic needed
- ✅ No PCI compliance requirements
- ✅ Wix handles all edge cases

### For Users
- ✅ Familiar Wix checkout experience
- ✅ Secure payment processing
- ✅ Automatic billing management
- ✅ Built-in invoice generation
- ✅ Easy subscription management

### For Business
- ✅ Wix handles refunds and disputes
- ✅ Multi-currency support
- ✅ Tax calculation included
- ✅ Coupon/discount support
- ✅ Subscription lifecycle management

## User Experience

### Free Plan Users
See a prominent upgrade CTA card with:
- Lightning bolt icon
- "Need More Credits?" heading
- Description of benefits
- "View Plans & Upgrade" button
- Note about Wix redirect

### Paid Plan Users
See a manage subscription card with:
- "Manage Subscription" heading
- Description
- "Manage Subscription" button
- Note about Wix redirect

### All Users See
- Current plan card (gradient background)
- Credit usage card with progress bar
- Credit statistics (remaining, used, total)
- Reset date information
- Usage tips card

## Testing

### Development Testing

1. **Test credit display:**
   ```bash
   # Start frontend
   cd frontend
   npm run dev
   
   # Navigate to /billing
   # Verify credits display correctly
   ```

2. **Test upgrade button:**
   - Click "Upgrade" or "Manage Subscription"
   - Should redirect to: `https://www.wix.com/apps/upgrade/{YOUR_APP_ID}`
   - Wix will show "App not found" if APP_ID is incorrect

3. **Test with real Wix instance:**
   - Install app on test site
   - Open app from Wix dashboard
   - Navigate to Credits page
   - Click upgrade button
   - Should see your pricing plans

### Production Testing

1. **Verify environment variables:**
   ```bash
   # Check Render dashboard
   # Ensure VITE_WIX_APP_ID is set
   ```

2. **Test full flow:**
   - Install app on test site
   - Use test credit card (Wix provides test mode)
   - Complete purchase
   - Verify webhook received
   - Verify credits updated
   - Verify plan updated

## Troubleshooting

### "App not found" on Wix pricing page
- **Cause:** Incorrect APP_ID in environment variables
- **Fix:** Double-check APP_ID in Wix Developer Dashboard

### Pricing plans not showing
- **Cause:** Plans not published in Wix Dashboard
- **Fix:** Go to Pricing & Plans → Publish each plan

### Webhook not received
- **Cause:** Webhook URL not configured
- **Fix:** Wix Dashboard → Webhooks → Add billing webhook URL

### Credits not updating after purchase
- **Cause:** Webhook handler not processing correctly
- **Fix:** Check backend logs for webhook errors

### Redirect not working
- **Cause:** Using `window.location` instead of `window.top.location`
- **Fix:** Always use `window.top.location.href` to break out of iframe

## Wix 2025 Documentation References

- **Billing API Overview:** About the Billing API
- **External Pricing Page Flow:** Sample Use Cases and Flows
- **Get URL Endpoint:** POST Get Url (for external pricing pages)
- **Webhooks:** Invoice Status Updated event
- **App Plans API:** List App Plans By App Id

## Migration from Old Implementation

If you had an in-app billing page before:

1. **Keep:** Webhook handlers, credit sync logic, database schema
2. **Remove:** Plan selection UI, checkout forms, payment processing
3. **Replace:** Billing page with new Credits page
4. **Update:** Navigation to point to Credits page
5. **Configure:** Wix pricing plans in dashboard
6. **Test:** Full upgrade flow end-to-end

## Next Steps

1. ✅ Update `VITE_WIX_APP_ID` in both `.env` files
2. ✅ Configure pricing plans in Wix Developer Dashboard
3. ✅ Set pricing page to "Internal" mode
4. ✅ Test upgrade flow on development site
5. ✅ Deploy to production
6. ✅ Test on production site
7. ✅ Monitor webhooks and credit updates

## Support

For issues with:
- **Wix Billing API:** Check [Wix Developer Docs](https://dev.wix.com/docs/rest/api-reference/app-management/billing)
- **App Implementation:** Check backend logs and webhook events
- **Credit Sync:** Use `/api/billing/sync-credits` endpoint

---

**Implementation Date:** November 4, 2025
**Wix API Version:** 2025
**Status:** ✅ Complete and Ready for Testing
