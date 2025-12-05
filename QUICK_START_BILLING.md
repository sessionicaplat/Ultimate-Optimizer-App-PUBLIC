# Quick Start: Self-Hosted Billing Implementation

## 🚀 Get Started in 5 Minutes

This guide will help you deploy the new self-hosted billing system quickly.

---

## Step 1: Run Database Migration (1 min)

```bash
# In production environment with DATABASE_URL set
cd backend
npm run migrate up
```

This adds two columns:
- `subscription_start_date` - Tracks when user first subscribed
- `next_billing_date` - Tracks 30-day billing cycles

---

## Step 2: Configure Wix Dashboard (2 min)

1. Go to https://dev.wix.com
2. Select your app
3. Click **Pricing & Plans** in sidebar
4. Click **"Link to External Pricing Page"**
5. Enter URL: `https://www.wix.com/my-account/app/{appId}/{instanceId}`
6. Click **Save**

**Important**: Keep your pricing plans (Free, Starter, Pro, Scale) in Wix Dashboard. You need the product IDs.

---

## Step 3: Verify Environment Variables (30 sec)

Make sure these are set in your production environment:

```env
WIX_APP_ID=your-app-id
WIX_APP_SECRET=your-app-secret
WIX_PUBLIC_KEY=your-public-key

# Product IDs from Wix Dashboard
WIX_PRODUCT_ID_STARTER=starter
WIX_PRODUCT_ID_PRO=pro
WIX_PRODUCT_ID_SCALE=scale
```

---

## Step 4: Deploy (1 min)

```bash
# Deploy backend
cd backend
npm run build
# Deploy to your hosting platform

# Deploy frontend
cd ../frontend
npm run build
# Deploy to your hosting platform
```

---

## Step 5: Test (30 sec)

1. Visit your app's billing page
2. You should see all 4 plans in a grid
3. Click "Upgrade" on any plan
4. Complete checkout (use test card if available)
5. Verify you're redirected back to app
6. Verify credits update within 60 seconds

---

## ✅ That's It!

Your self-hosted billing is now live!

---

## What Changed?

### User Experience
- **Before**: Redirected to Wix pricing page → Wix thank you page → Lost
- **After**: See all plans in app → Checkout → Back to app → Credits update instantly

### Credit System
- **Before**: Credits reset on plan change
- **After**: Credits accumulate (200 + 1000 = 1200 on upgrade)

### Billing Cycles
- **Before**: Based on calendar month
- **After**: Based on subscription date (30-day cycles)

---

## Troubleshooting

### Issue: Migration fails
**Solution**: Make sure `DATABASE_URL` environment variable is set

### Issue: Checkout URL fails
**Solution**: Verify product IDs are set in environment variables

### Issue: Credits don't update
**Solution**: Check backend logs for webhook processing errors

### Issue: Redirect doesn't work
**Solution**: Verify Wix Dashboard has external pricing page URL set correctly

---

## Need More Details?

See comprehensive documentation:
- `SELF_HOSTED_BILLING_IMPLEMENTATION.md` - Full implementation guide
- `BILLING_DEPLOYMENT_CHECKLIST.md` - Detailed deployment checklist
- `BILLING_SOLUTION_SUMMARY.md` - Complete solution overview

---

## Support

If you encounter issues:
1. Check backend logs for errors
2. Check Wix Dashboard for webhook delivery
3. Verify environment variables
4. Review documentation files

---

## Success Criteria

✅ Billing page loads with all 4 plans
✅ Upgrade button redirects to Wix checkout
✅ After payment, redirects back to app
✅ Credits update within 60 seconds
✅ No duplicate credit additions
✅ UI is responsive and beautiful

---

## Rollback Plan

If something goes wrong:

```bash
# Rollback database migration
cd backend
npm run migrate down

# Revert to previous deployment
# (Frontend and backend are backward compatible)
```

---

## 🎉 Enjoy Your New Billing System!

You now have:
- ✅ Self-hosted pricing page
- ✅ Instant credit updates
- ✅ Proper credit accumulation
- ✅ Beautiful UI
- ✅ Better user experience

**Questions?** Check the documentation files or contact support.
