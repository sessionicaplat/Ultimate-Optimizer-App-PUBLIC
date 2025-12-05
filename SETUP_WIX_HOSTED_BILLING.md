# Quick Setup: Wix Hosted Billing

## ✅ Implementation Complete

The app now uses Wix's hosted pricing and checkout pages instead of in-app billing.

## 🚀 Setup Steps

### Step 1: Get Your Wix App ID

1. Go to [dev.wix.com](https://dev.wix.com)
2. Select your app
3. Go to **Settings** → **App Info**
4. Copy the **App ID** (looks like: `12345678-1234-1234-1234-123456789abc`)

### Step 2: Update Environment Variables

**Frontend `.env` file:**
```bash
VITE_WIX_APP_ID=your-actual-app-id-here
```

**Frontend `.env.production` file:**
```bash
VITE_WIX_APP_ID=your-actual-app-id-here
```

**Render Dashboard (for production):**
- Go to your frontend service on Render
- Add environment variable: `VITE_WIX_APP_ID` = `your-actual-app-id`
- Redeploy

### Step 3: Configure Wix Pricing Plans

1. Go to [dev.wix.com](https://dev.wix.com) → Your App
2. Click **Pricing & Plans** in the left sidebar
3. Ensure pricing page is set to **Internal** (not External)
4. Create these plans:

   **Free Plan:**
   - Name: Free
   - Price: $0
   - Credits: 100/month
   - Plan ID: `free`

   **Starter Plan:**
   - Name: Starter
   - Price: $9/month
   - Credits: 1,000/month
   - Plan ID: `starter`

   **Pro Plan:**
   - Name: Pro
   - Price: $19/month
   - Credits: 5,000/month
   - Plan ID: `pro`

   **Scale Plan:**
   - Name: Scale
   - Price: $49/month
   - Credits: 25,000/month
   - Plan ID: `scale`

5. **Publish** each plan

### Step 4: Test the Flow

1. **Local Testing:**
   ```bash
   cd frontend
   npm run dev
   ```
   - Navigate to `/billing`
   - Click "View Plans & Upgrade"
   - Should redirect to Wix pricing page

2. **Production Testing:**
   - Install app on a test Wix site
   - Open app from Wix dashboard
   - Go to Credits page
   - Click upgrade button
   - Should see your pricing plans
   - Complete test purchase
   - Verify credits update

## 🎯 What Users Will See

### Free Plan Users
- Credit usage dashboard
- Prominent "View Plans & Upgrade" button
- Redirects to Wix pricing page

### Paid Plan Users
- Credit usage dashboard
- "Manage Subscription" button
- Redirects to Wix billing page

## 🔄 User Flow

```
App Credits Page
    ↓
Click "Upgrade" Button
    ↓
Redirect to Wix Pricing Page
    ↓
User Selects Plan
    ↓
Wix Checkout (Secure)
    ↓
Payment Processed
    ↓
Webhook Sent to App
    ↓
Credits & Plan Updated
    ↓
User Redirected Back to App
```

## 📝 Files Changed

- ✅ `frontend/src/pages/BillingCredits.tsx` - Simplified credits page
- ✅ `frontend/src/pages/BillingCredits.css` - Updated styles
- ✅ `frontend/.env` - Added VITE_WIX_APP_ID
- ✅ `frontend/.env.production` - Added VITE_WIX_APP_ID

## 🔧 Backend (No Changes Needed)

The existing backend already supports:
- ✅ Webhook handling for purchases
- ✅ Credit sync endpoint
- ✅ Plan updates from Wix
- ✅ Database updates

## ⚠️ Important Notes

1. **Wix handles everything:**
   - Pricing display
   - Checkout process
   - Payment processing
   - Subscription management
   - Invoices and receipts

2. **Your app only:**
   - Shows credit usage
   - Provides upgrade button
   - Receives webhooks
   - Updates database

3. **No downgrade support:**
   - Users must cancel subscription first
   - Then purchase lower plan
   - This is a Wix 2025 requirement

4. **Testing mode:**
   - During development, all plans are $0.00
   - After app approval, real prices activate
   - Wix provides test coupons

## 🐛 Troubleshooting

### Upgrade button redirects to "App not found"
**Fix:** Update `VITE_WIX_APP_ID` with correct App ID from Wix Dashboard

### Pricing plans don't show on Wix page
**Fix:** Publish plans in Wix Developer Dashboard → Pricing & Plans

### Credits don't update after purchase
**Fix:** Check webhook logs in backend, ensure webhook URL is configured

### Button doesn't redirect
**Fix:** Ensure you're using `window.top.location.href` (not `window.location.href`)

## 📚 Documentation

- Full implementation guide: `WIX_HOSTED_BILLING_IMPLEMENTATION.md`
- Wix Billing API: [dev.wix.com/docs/rest/api-reference/app-management/billing](https://dev.wix.com/docs/rest/api-reference/app-management/billing)

## ✨ Benefits

- Less code to maintain
- Wix handles PCI compliance
- Familiar checkout for users
- Built-in subscription management
- Multi-currency support
- Tax calculation included
- Coupon/discount support

---

**Status:** ✅ Ready to Deploy
**Next Step:** Update `VITE_WIX_APP_ID` in environment variables
