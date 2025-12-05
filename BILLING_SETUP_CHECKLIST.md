# Billing Setup Checklist

## Quick Setup Guide for Real Wix Billing Integration

### ✅ What's Already Done

- [x] Wix SDK billing module integrated
- [x] Token helper for OAuth2 authentication
- [x] Real checkout URL generation endpoint
- [x] Subscription data fetching endpoint
- [x] Frontend updated to use real APIs
- [x] Webhook handling for plan updates
- [x] Database schema for plans and credits

### 🔧 What You Need to Do

#### 1. Get Wix Product IDs (Required)

**Where to find them:**
1. Go to https://dev.wix.com/
2. Select your app
3. Navigate to **Monetization** → **Plans**
4. Copy the **Product ID** for each plan (UUID format)

**Example Product IDs:**
```
Free:    00000000-0000-0000-0000-000000000000 (or skip if not needed)
Starter: e8f429d4-0a6a-468f-8044-87f519a53202
Pro:     b0f808c3-c8be-4cda-b6d2-74a11536d7bd
Scale:   a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### 2. Add Environment Variables to Render

**Go to Render Dashboard:**
1. Select your backend service
2. Click **Environment** tab
3. Add these variables:

```bash
# Required - Already set
WIX_APP_ID=<your-app-id>
WIX_APP_SECRET=<your-app-secret>
WIX_PUBLIC_KEY=<your-public-key>

# New - Add these with your Wix product IDs
WIX_PRODUCT_ID_STARTER=<paste-starter-product-id>
WIX_PRODUCT_ID_PRO=<paste-pro-product-id>
WIX_PRODUCT_ID_SCALE=<paste-scale-product-id>

# Optional - Only if free plan has a product ID
WIX_PRODUCT_ID_FREE=<paste-free-product-id>
```

4. Click **Save Changes**
5. Render will automatically redeploy

#### 3. Verify External Pricing Page Setup

**In Wix Developer Dashboard:**
1. Go to **Monetization** → **Pricing**
2. Ensure **External pricing page** is selected
3. URL should be: `https://ultimate-optimizer-app.onrender.com`
4. Save if needed

#### 4. Test the Integration

**Test 1: Check Environment Variables**
```bash
# Should show all variables are SET
curl https://ultimate-optimizer-app.onrender.com/health
```

**Test 2: Generate Upgrade URL**
```bash
# Should return real Wix checkout URL
curl -X GET \
  'https://ultimate-optimizer-app.onrender.com/api/billing/upgrade-url?planId=starter' \
  -H 'X-Wix-Instance: <your-test-instance-token>'
```

Expected response:
```json
{
  "url": "https://www.wix.com/apps/upgrade/order-checkout?token=...",
  "planId": "starter",
  "productId": "e8f429d4-0a6a-468f-8044-87f519a53202"
}
```

**Test 3: Complete Test Purchase**
1. Open your app in a test Wix site
2. Go to Billing & Credits page
3. Click "Upgrade" on any plan
4. Should redirect to Wix checkout
5. Complete test purchase (will be $0 in test mode)
6. Verify plan updates in your app

**Test 4: Check Webhook**
```bash
# Check Render logs for:
# - "Billing webhook event received"
# - "Invoice status: PAID"
# - "Updating instance plan"
```

### 🎯 Success Criteria

Your billing integration is working when:

- [ ] Upgrade button redirects to real Wix checkout page
- [ ] Checkout URL contains `wix.com/apps/upgrade/order-checkout`
- [ ] Test purchase completes successfully
- [ ] Webhook updates plan in database
- [ ] Billing page shows correct plan after purchase
- [ ] Credits display correctly
- [ ] No errors in Render logs

### 🐛 Common Issues

#### Issue: "Failed to generate upgrade URL"

**Check:**
- [ ] `WIX_APP_ID` and `WIX_APP_SECRET` are set
- [ ] External pricing page is configured in Wix
- [ ] Product IDs are correct UUIDs
- [ ] App has billing permissions enabled

**Fix:**
```bash
# Verify environment variables in Render
# Check Render logs for specific error message
# Ensure Wix dashboard billing is enabled
```

#### Issue: Checkout URL returns 404

**Check:**
- [ ] Product IDs match exactly (case-sensitive)
- [ ] Plans are published in Wix dashboard
- [ ] URL is used within 48 hours
- [ ] External pricing page is enabled

**Fix:**
```bash
# Double-check product IDs in Wix dashboard
# Ensure plans are in "Published" state
# Generate new URL if expired
```

#### Issue: Plan doesn't update after purchase

**Check:**
- [ ] Webhook URL is configured correctly
- [ ] Webhook events are subscribed
- [ ] `WIX_PUBLIC_KEY` is set correctly
- [ ] Database connection is working

**Fix:**
```bash
# Check webhook logs in Render
# Verify webhook URL in Wix dashboard
# Test webhook manually from Wix
```

### 📚 Documentation

- **Implementation Details**: See `BILLING_SDK_IMPLEMENTATION.md`
- **Webhook Setup**: See `WIX_BILLING_WEBHOOK_FIX.md`
- **General Billing**: See `WIX_BILLING_SETUP_GUIDE.md`

### 🚀 Deployment

After adding environment variables:

1. **Automatic Deployment**
   - Render redeploys automatically when env vars change
   - Wait for deployment to complete (~2-3 minutes)

2. **Verify Deployment**
   ```bash
   # Check service is running
   curl https://ultimate-optimizer-app.onrender.com/health
   ```

3. **Test Immediately**
   - Open app in Wix site
   - Try upgrade flow
   - Monitor Render logs

### ✨ Optional Enhancements

After basic setup works:

- [ ] Add subscription display on dashboard
- [ ] Show billing history
- [ ] Add downgrade/cancellation flow
- [ ] Implement usage-based charges
- [ ] Add billing notifications
- [ ] Create admin billing dashboard

### 🎉 You're Done!

Once all checkboxes are complete, your billing integration is live and ready for production!

**Next Steps:**
1. Test with real users
2. Monitor webhook events
3. Track subscription metrics
4. Optimize user experience
