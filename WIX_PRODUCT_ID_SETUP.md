# Wix Product ID Setup Guide

## ⚠️ Important: Timeout Issue Fix

If you're getting a **"Wix Billing API timeout"** error when clicking upgrade, it's because the product IDs are not configured correctly.

---

## 🔧 How to Fix

### Step 1: Create Pricing Plans in Wix Dashboard

1. Go to https://dev.wix.com
2. Select your app
3. Click **Pricing & Plans** in the sidebar
4. Click **Add Plan** for each plan you want to offer

### Step 2: Configure Each Plan

For each plan (Starter, Pro, Scale):

1. **Plan Name**: Enter the plan name (e.g., "Starter")
2. **Billing Model**: Select "Recurring (Monthly)"
3. **Price**: Enter the price (e.g., $9 for Starter)
4. **Benefits**: Add up to 4 benefits
5. **Plan ID**: This is automatically generated - **COPY THIS!**
6. Click **Save**
7. Click **Publish** (plans must be published, not draft)

### Step 3: Get the Product IDs

After creating and publishing each plan:

1. Go to **Pricing & Plans** in your app dashboard
2. Click on each plan to view details
3. Look for the **Plan ID** or **Product ID** field
4. Copy the ID (it might look like: `starter-monthly-9` or a UUID)

### Step 4: Set Environment Variables

Add these to your `.env` file (backend):

```env
# Wix Product IDs (get these from Wix Developer Dashboard)
WIX_PRODUCT_ID_STARTER=your-actual-starter-plan-id
WIX_PRODUCT_ID_PRO=your-actual-pro-plan-id
WIX_PRODUCT_ID_SCALE=your-actual-scale-plan-id
```

**Important**: Replace `your-actual-starter-plan-id` with the actual IDs from Wix Dashboard!

### Step 5: Restart Your Backend

```bash
# If running locally
npm run dev

# If deployed on Render
# Redeploy or restart the service
```

---

## 🔍 How to Find Product IDs

### Method 1: Wix Developer Dashboard

1. Go to https://dev.wix.com
2. Select your app
3. Go to **Pricing & Plans**
4. Click on a plan
5. Look for **Plan ID** or **Product ID**

### Method 2: Using Wix API

You can also query the Wix API to list all your plans:

```javascript
import { appPlans } from '@wix/app-management';

const plans = await appPlans.listAppPlansByAppId([YOUR_APP_ID]);
console.log(plans);
```

This will show you all plan IDs.

---

## 📋 Example Configuration

Here's what your environment variables might look like:

```env
# Example - Your IDs will be different!
WIX_PRODUCT_ID_STARTER=starter-monthly-9
WIX_PRODUCT_ID_PRO=pro-monthly-19
WIX_PRODUCT_ID_SCALE=scale-monthly-49
```

Or if Wix generates UUIDs:

```env
# Example with UUIDs
WIX_PRODUCT_ID_STARTER=a1b2c3d4-e5f6-7890-abcd-ef1234567890
WIX_PRODUCT_ID_PRO=b2c3d4e5-f6g7-8901-bcde-f12345678901
WIX_PRODUCT_ID_SCALE=c3d4e5f6-g7h8-9012-cdef-123456789012
```

---

## ✅ Verification

After setting up, verify it works:

1. Check backend logs when clicking upgrade
2. Look for: `🔍 Product ID mapping:`
3. Verify `envVarValue` is not "NOT SET"
4. Verify `productId` matches your Wix Dashboard plan ID

Example log output:
```
🔍 Product ID mapping: {
  planId: 'starter',
  productId: 'starter-monthly-9',
  envVarName: 'WIX_PRODUCT_ID_STARTER',
  envVarValue: 'starter-monthly-9'
}
```

---

## 🐛 Troubleshooting

### Issue: Still getting timeout

**Possible causes:**
1. Product ID doesn't match Wix Dashboard
2. Plan is not published (still in draft)
3. Plan was deleted in Wix Dashboard
4. Wrong app ID

**Solution:**
1. Double-check product IDs in Wix Dashboard
2. Ensure plans are published
3. Restart backend after changing env vars
4. Check Wix Dashboard for any errors

### Issue: "Plan not available" error

**Cause:** Environment variable not set

**Solution:**
```bash
# Check if env var is set
echo $WIX_PRODUCT_ID_STARTER

# If empty, add to .env file
```

### Issue: Checkout URL works but redirects to wrong page

**Cause:** Success URL not configured correctly

**Solution:** The success URL is automatically set to:
```
https://www.wix.com/my-account/app/{appId}/{instanceId}?payment=success&plan={planId}
```

This should work automatically.

---

## 📝 Quick Checklist

- [ ] Created pricing plans in Wix Dashboard
- [ ] Published all plans (not draft)
- [ ] Copied product IDs from Wix Dashboard
- [ ] Set environment variables in `.env`
- [ ] Restarted backend
- [ ] Tested upgrade flow
- [ ] Verified logs show correct product IDs

---

## 🎯 Expected Behavior

After correct setup:

1. Click "Upgrade" on any plan
2. Backend logs show: `Generating checkout URL: { planId: 'starter', productId: 'starter-monthly-9', ... }`
3. Wix API responds within 5-10 seconds
4. User redirects to Wix checkout page
5. After payment, user redirects back to app
6. Credits update within 60 seconds

---

## 📞 Still Having Issues?

If you've followed all steps and still getting timeouts:

1. **Check Wix Status**: https://status.wix.com
2. **Verify App Permissions**: Ensure app has billing permissions
3. **Check Wix Dashboard**: Look for any error messages
4. **Contact Wix Support**: https://dev.wix.com/support

---

## 🔗 Useful Links

- Wix Developer Dashboard: https://dev.wix.com
- Wix Billing API Docs: https://dev.wix.com/docs/sdk/backend-modules/app-management/billing
- External Pricing Page Setup: https://dev.wix.com/docs/build-apps/launch-your-app/pricing-and-billing/set-up-an-external-pricing-page

---

**Remember**: The product IDs must match exactly what's in your Wix Developer Dashboard!
