# Complete Setup - Action Items

## 🎯 You're Almost Done!

The code is ready. Just complete these 3 steps to activate Wix-hosted billing.

---

## Step 1: Get Your Wix App ID (2 minutes)

1. Open [dev.wix.com](https://dev.wix.com) in your browser
2. Click on your app (Ultimate Optimizer)
3. In the left sidebar, click **Settings**
4. Click **App Info**
5. Find **App ID** - it looks like: `12345678-1234-1234-1234-123456789abc`
6. Copy this ID

---

## Step 2: Update Environment Variables (3 minutes)

### Local Development

Open `frontend/.env` and replace:
```bash
VITE_WIX_APP_ID=your-wix-app-id
```

With your actual App ID:
```bash
VITE_WIX_APP_ID=12345678-1234-1234-1234-123456789abc
```

### Production

Open `frontend/.env.production` and replace:
```bash
VITE_WIX_APP_ID=your-wix-app-id
```

With your actual App ID:
```bash
VITE_WIX_APP_ID=12345678-1234-1234-1234-123456789abc
```

### Render Dashboard (for production deployment)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Select your **frontend** service
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `VITE_WIX_APP_ID`
   - **Value:** `12345678-1234-1234-1234-123456789abc` (your actual ID)
6. Click **Save Changes**
7. Render will automatically redeploy

---

## Step 3: Configure Wix Pricing Plans (5 minutes)

1. Go to [dev.wix.com](https://dev.wix.com)
2. Select your app
3. Click **Pricing & Plans** in the left sidebar
4. Ensure **Pricing Page** is set to **Internal** (not External)

### Create These Plans:

#### Free Plan
- **Plan Name:** Free
- **Plan ID:** `free`
- **Price:** $0.00
- **Billing Cycle:** Monthly
- **Description:** 100 credits per month
- Click **Save** and **Publish**

#### Starter Plan
- **Plan Name:** Starter
- **Plan ID:** `starter`
- **Price:** $9.00
- **Billing Cycle:** Monthly
- **Description:** 1,000 credits per month
- Click **Save** and **Publish**

#### Pro Plan
- **Plan Name:** Pro
- **Plan ID:** `pro`
- **Price:** $19.00
- **Billing Cycle:** Monthly
- **Description:** 5,000 credits per month
- Click **Save** and **Publish**

#### Scale Plan
- **Plan Name:** Scale
- **Plan ID:** `scale`
- **Price:** $49.00
- **Billing Cycle:** Monthly
- **Description:** 25,000 credits per month
- Click **Save** and **Publish**

**Important:** Make sure each plan is **Published** (not just saved as draft)

---

## ✅ Verification Steps

### Test Locally (5 minutes)

```bash
# Start frontend
cd frontend
npm run dev
```

1. Open http://localhost:5173
2. Navigate to the Credits page
3. Click "View Plans & Upgrade" button
4. You should be redirected to: `https://www.wix.com/apps/upgrade/{YOUR_APP_ID}`
5. If you see "App not found", double-check your App ID

### Test on Wix (10 minutes)

1. Install your app on a test Wix site
2. Open the app from the Wix dashboard
3. Navigate to the Credits page
4. Click "View Plans & Upgrade"
5. You should see your pricing plans
6. Select a plan (use test mode)
7. Complete checkout
8. Verify:
   - Webhook received (check backend logs)
   - Credits updated in database
   - Plan updated in app

---

## 🐛 Troubleshooting

### "App not found" when clicking upgrade
**Problem:** Wrong App ID in environment variables
**Solution:** 
1. Double-check App ID in Wix Dashboard
2. Update `.env` files
3. Restart dev server
4. For production, update Render environment variable and redeploy

### Pricing plans don't show
**Problem:** Plans not published in Wix
**Solution:**
1. Go to Wix Dashboard → Pricing & Plans
2. Click each plan
3. Click **Publish** button
4. Wait a few minutes for changes to propagate

### Button doesn't redirect
**Problem:** Environment variable not loaded
**Solution:**
1. Restart dev server after changing `.env`
2. For production, verify environment variable in Render
3. Check browser console for errors

### Credits don't update after purchase
**Problem:** Webhook not configured or not working
**Solution:**
1. Check Wix Dashboard → Webhooks
2. Ensure billing webhook URL is set
3. Check backend logs for webhook events
4. Manually sync: POST to `/api/billing/sync-credits`

---

## 📋 Quick Reference

### Environment Variables Needed

**Frontend:**
- `VITE_API_BASE` - Already configured ✅
- `VITE_WIX_APP_ID` - **You need to add this** ⚠️

**Backend:**
- `WIX_APP_ID` - Already configured ✅
- `WIX_PUBLIC_KEY` - Already configured ✅
- `WIX_PRODUCT_ID_*` - Already configured ✅

### Files Modified

- ✅ `frontend/src/pages/BillingCredits.tsx` - New simplified credits page
- ✅ `frontend/src/pages/BillingCredits.css` - Updated styles
- ✅ `frontend/.env` - Added VITE_WIX_APP_ID placeholder
- ✅ `frontend/.env.production` - Added VITE_WIX_APP_ID placeholder

### Wix URLs

- **Developer Dashboard:** https://dev.wix.com
- **Pricing Page URL:** `https://www.wix.com/apps/upgrade/{APP_ID}`
- **Manage Subscription:** `https://www.wix.com/my-account/app/{APP_ID}/{INSTANCE_ID}`

---

## 🎉 After Setup

Once everything is configured:

1. **Deploy to production:**
   ```bash
   git add .
   git commit -m "Implement Wix-hosted billing"
   git push
   ```

2. **Test on production site:**
   - Install app on test site
   - Complete a test purchase
   - Verify credits update

3. **Monitor:**
   - Check webhook logs
   - Monitor credit sync
   - Watch for errors

---

## 📚 Documentation

- **Full Implementation Guide:** `WIX_HOSTED_BILLING_IMPLEMENTATION.md`
- **Quick Setup:** `SETUP_WIX_HOSTED_BILLING.md`
- **Visual Summary:** `CREDITS_PAGE_SUMMARY.md`
- **This File:** `COMPLETE_SETUP_NOW.md`

---

## ⏱️ Time Estimate

- Step 1 (Get App ID): 2 minutes
- Step 2 (Update env vars): 3 minutes
- Step 3 (Configure plans): 5 minutes
- Testing: 15 minutes
- **Total: ~25 minutes**

---

## 🚀 Ready to Go!

After completing these 3 steps, your app will have:
- ✅ Simplified credits page
- ✅ Wix-hosted billing
- ✅ Secure checkout
- ✅ Automatic subscription management
- ✅ Less code to maintain

**Start with Step 1 above!** 👆
