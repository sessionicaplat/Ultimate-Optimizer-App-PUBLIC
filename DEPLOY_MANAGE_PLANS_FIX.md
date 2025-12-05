# Deploy: Wix Manage Plans URL

## ✅ Implementation Complete

Users will now be redirected to the Wix-hosted pricing plans page where they can see all your plans and manage their subscription.

## 🎯 What Was Implemented

### New Backend Endpoint
`GET /api/billing/manage-plans-url`

**What it does:**
- Decodes instance token to get `metaSiteId`
- Constructs URL: `https://manage.wix.com/app-pricing-plans/{appId}/plan?origin=preview&meta-site-id={siteId}`
- Returns the URL to frontend

### Updated Frontend
`BillingCredits.tsx`

**What changed:**
- Calls new `/api/billing/manage-plans-url` endpoint
- Redirects to Wix manage plans page
- Shows all available plans in Wix interface

## 📝 Files Changed

1. **backend/src/routes/billing.ts** - Added new endpoint
2. **frontend/src/pages/BillingCredits.tsx** - Updated redirect logic
3. **WIX_MANAGE_PLANS_URL_FIX.md** - Documentation

## 🚀 Ready to Deploy

### No Configuration Needed
All environment variables already set in Render:
- ✅ `WIX_APP_ID`
- ✅ `WIX_APP_SECRET`

### Deploy Command
```bash
git add .
git commit -m "Implement Wix manage plans URL redirect"
git push origin main
```

## ✨ Expected Result

After deployment, when users click the upgrade button:

1. Frontend calls `/api/billing/manage-plans-url`
2. Backend extracts site ID from instance token
3. Backend constructs proper Wix URL
4. User redirects to: `https://manage.wix.com/app-pricing-plans/{your-app-id}/plan?origin=preview&meta-site-id={site-id}`
5. User sees all 4 pricing plans on Wix page
6. User can select any plan and complete checkout
7. After purchase, user returns to your app

## 🧪 Testing Checklist

After deployment:

- [ ] Open app from Wix dashboard
- [ ] Navigate to Credits page
- [ ] Click "View Plans & Upgrade" button
- [ ] Should redirect to Wix manage plans page
- [ ] Should see all 4 plans (Free, Starter, Pro, Scale)
- [ ] Should be able to select a plan
- [ ] Should be able to complete checkout
- [ ] Should return to app after purchase

## 📊 URL Format

You'll be redirected to:
```
https://manage.wix.com/app-pricing-plans/9e24e724-5bdb-4658-8554-74251539a065/plan?origin=preview&meta-site-id=9f5c64e6-4e46-462a-87fd-c1ed2689852b
```

Where:
- `9e24e724-5bdb-4658-8554-74251539a065` = Your Wix App ID
- `9f5c64e6-4e46-462a-87fd-c1ed2689852b` = The specific Wix site ID

## 🎉 Benefits

- ✅ Shows all plans in one place
- ✅ Users can compare features
- ✅ Wix handles all billing
- ✅ Can manage existing subscription
- ✅ Familiar Wix interface
- ✅ No frontend env vars needed
- ✅ Secure and reliable

---

**Status:** ✅ Ready to Deploy
**Risk:** Low
**Configuration:** None needed
**Testing:** Required after deployment
