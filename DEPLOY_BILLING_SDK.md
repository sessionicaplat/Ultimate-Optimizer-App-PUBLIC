# Deploy Billing SDK Integration

## Ready to Deploy ✅

The billing SDK integration is complete and ready for deployment. All code changes have been made and tested locally.

**Update**: Fixed missing `axios` dependency - deployment should now succeed.

## What Changed

### New Files
- `backend/src/wix/tokenHelper.ts` - OAuth2 token management
- `BILLING_SDK_IMPLEMENTATION.md` - Full documentation
- `BILLING_SETUP_CHECKLIST.md` - Setup guide
- `BILLING_IMPLEMENTATION_SUMMARY.md` - Summary
- `BILLING_API_REFERENCE.md` - API reference
- `DEPLOY_BILLING_SDK.md` - This file

### Modified Files
- `backend/src/wix/sdkClient.ts` - Added billing methods
- `backend/src/routes/billing.ts` - Real Wix API integration
- `frontend/src/pages/BillingCredits.tsx` - Fetch real subscription

## Deployment Steps

### 1. Commit and Push Changes

```bash
git add .
git commit -m "feat: implement real Wix Billing API integration using SDK

- Add billing module to WixSDKClient
- Create OAuth2 token helper for elevated access
- Update upgrade-url endpoint to call real Wix API
- Add subscription endpoint to fetch from Wix
- Update frontend to use real billing data
- Add comprehensive documentation"

git push origin main
```

### 2. Render Auto-Deploy

Render will automatically:
- Detect the push to main branch
- Build the backend with new code
- Build the frontend with updated component
- Deploy both services
- Run health checks

**Monitor deployment:**
1. Go to https://dashboard.render.com
2. Select your backend service
3. Watch the "Events" tab for deployment progress
4. Wait for "Deploy succeeded" message (~3-5 minutes)

### 3. Add Environment Variables

**After deployment succeeds**, add Wix product IDs:

1. Go to Render Dashboard → Your Backend Service
2. Click **Environment** tab
3. Add these variables:

```bash
WIX_PRODUCT_ID_STARTER=<your-starter-product-id-from-wix>
WIX_PRODUCT_ID_PRO=<your-pro-product-id-from-wix>
WIX_PRODUCT_ID_SCALE=<your-scale-product-id-from-wix>
```

4. Click **Save Changes**
5. Render will redeploy automatically (~2 minutes)

**Where to get product IDs:**
- Wix Developer Dashboard → Your App → Monetization → Plans
- Copy the "Product ID" (UUID format) for each plan

### 4. Verify Deployment

**Check service health:**
```bash
curl https://ultimate-optimizer-app.onrender.com/health
```

**Test upgrade URL generation:**
```bash
curl -X GET \
  'https://ultimate-optimizer-app.onrender.com/api/billing/upgrade-url?planId=starter' \
  -H 'X-Wix-Instance: <your-test-instance-token>'
```

Expected: Real Wix checkout URL in response

**Check logs:**
```bash
# In Render dashboard, go to Logs tab
# Look for:
# - "Server running on port 3001"
# - No error messages
# - Successful API calls
```

### 5. Test in Wix Site

1. Open your app in a test Wix site
2. Navigate to Billing & Credits page
3. Click "Upgrade" on any plan
4. Verify redirect to Wix checkout page
5. Complete test purchase (will be $0 in test mode)
6. Verify plan updates after purchase

## Rollback Plan

If something goes wrong:

### Option 1: Revert in Render
1. Go to Render Dashboard → Your Service
2. Click "Manual Deploy" tab
3. Select previous successful deployment
4. Click "Deploy"

### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin main
```

Render will auto-deploy the reverted code.

## Post-Deployment Checklist

- [ ] Deployment succeeded in Render
- [ ] Health check passes
- [ ] Environment variables added
- [ ] Upgrade URL generates successfully
- [ ] Checkout URL redirects to Wix
- [ ] Test purchase completes
- [ ] Webhook updates database
- [ ] Plan displays correctly
- [ ] No errors in logs

## Monitoring

### Key Metrics to Watch

**Render Logs:**
- Look for: "✅ Checkout URL generated"
- Look for: "Billing webhook event received"
- Watch for: Any error messages

**Wix Dashboard:**
- Monitor webhook delivery status
- Check for failed webhook attempts
- Verify test purchases appear

**Database:**
- Verify plan updates after purchases
- Check credits are tracked correctly
- Monitor for any data inconsistencies

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check TypeScript errors in logs |
| Service won't start | Verify environment variables |
| Upgrade URL fails | Check WIX_APP_ID and WIX_APP_SECRET |
| Checkout 404 | Verify product IDs are correct |
| Webhook fails | Check WIX_PUBLIC_KEY is set |

## Success Criteria

Deployment is successful when:

✅ All services are running
✅ No errors in logs
✅ Upgrade button generates real Wix URLs
✅ Checkout page loads correctly
✅ Test purchase completes
✅ Webhook updates database
✅ Plan displays correctly in app

## Next Steps After Deployment

1. **Test with Real Users**
   - Monitor first few purchases
   - Watch for any edge cases
   - Collect user feedback

2. **Monitor Performance**
   - Track API response times
   - Monitor webhook delivery
   - Check error rates

3. **Optimize**
   - Add caching if needed
   - Implement retry logic
   - Add more detailed logging

4. **Enhance**
   - Add billing history page
   - Implement downgrade flow
   - Add usage tracking

## Support

If you encounter issues:

1. **Check Documentation**
   - `BILLING_SDK_IMPLEMENTATION.md` - Implementation details
   - `BILLING_API_REFERENCE.md` - API reference
   - `BILLING_SETUP_CHECKLIST.md` - Setup guide

2. **Check Logs**
   - Render dashboard logs
   - Browser console errors
   - Wix webhook delivery logs

3. **Verify Configuration**
   - Environment variables in Render
   - External pricing page in Wix
   - Product IDs match exactly

## Timeline

- **Code Changes**: ✅ Complete
- **Deployment**: ~5 minutes (auto)
- **Environment Variables**: ~2 minutes (manual + auto-redeploy)
- **Testing**: ~10 minutes
- **Total**: ~20 minutes

## Ready to Deploy?

If all pre-deployment checks pass:

```bash
# Commit and push
git add .
git commit -m "feat: implement real Wix Billing API integration"
git push origin main

# Then wait for Render auto-deploy
# Then add environment variables
# Then test!
```

🚀 **Let's ship it!**
