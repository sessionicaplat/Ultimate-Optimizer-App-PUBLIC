# Billing System Deployment Checklist

## Pre-Deployment

### 1. Database Migration
- [ ] Review migration file: `backend/migrations/20251115000000_add_subscription_tracking.js`
- [ ] Backup production database
- [ ] Run migration in development: `npm run migrate up`
- [ ] Verify columns added: `subscription_start_date`, `next_billing_date`
- [ ] Verify index created: `idx_app_instances_next_billing`

### 2. Environment Variables
- [ ] Verify `WIX_APP_ID` is set
- [ ] Verify `WIX_APP_SECRET` is set
- [ ] Verify `WIX_PUBLIC_KEY` is set
- [ ] Verify `WIX_PRODUCT_ID_STARTER` is set
- [ ] Verify `WIX_PRODUCT_ID_PRO` is set
- [ ] Verify `WIX_PRODUCT_ID_SCALE` is set

### 3. Wix Developer Dashboard Configuration
- [ ] Go to https://dev.wix.com
- [ ] Select your app
- [ ] Navigate to **Pricing & Plans**
- [ ] Verify all 4 plans exist (Free, Starter, Pro, Scale)
- [ ] Verify plans are **Published** (not draft)
- [ ] Select **"Link to External Pricing Page"**
- [ ] Set URL: `https://www.wix.com/my-account/app/{appId}/{instanceId}`
- [ ] Save changes

### 4. Code Review
- [ ] Review `backend/src/db/appInstances.ts` changes
- [ ] Review `backend/src/routes/billing.ts` changes
- [ ] Review `frontend/src/pages/BillingCredits.tsx` changes
- [ ] Review `frontend/src/pages/BillingCredits.css` changes
- [ ] Run TypeScript compiler: `npm run build`
- [ ] Fix any type errors

---

## Deployment

### 5. Backend Deployment
```bash
cd backend
npm install
npm run build
npm run migrate up  # Run in production
# Deploy to your hosting platform
```

- [ ] Backend deployed successfully
- [ ] Migration ran successfully
- [ ] No errors in deployment logs
- [ ] Health check endpoint responds

### 6. Frontend Deployment
```bash
cd frontend
npm install
npm run build
# Deploy to your hosting platform
```

- [ ] Frontend deployed successfully
- [ ] No build errors
- [ ] Assets uploaded correctly
- [ ] CDN cache cleared (if applicable)

---

## Post-Deployment Testing

### 7. Basic Functionality
- [ ] Visit billing page: loads without errors
- [ ] All 4 plans are visible
- [ ] Current plan is highlighted correctly
- [ ] Credit usage card shows correct data
- [ ] No console errors in browser

### 8. Upgrade Flow (Test with Real Payment)
- [ ] Click "Upgrade" on Starter plan
- [ ] Redirects to Wix checkout
- [ ] Complete payment with test card
- [ ] Redirects back to app
- [ ] URL contains `?payment=success&plan=starter`
- [ ] "Processing payment..." message appears
- [ ] Credits update within 60 seconds
- [ ] Success message shows new balance
- [ ] Database shows correct plan and credits

### 9. Webhook Verification
- [ ] Check backend logs for webhook receipt
- [ ] Verify `PaidPlanPurchased` webhook fired
- [ ] Verify webhook lock system working
- [ ] No duplicate credit additions
- [ ] Database updated correctly

### 10. Credit Accumulation Testing
- [ ] Test upgrade from free to starter
  - Expected: 200 + 1000 = 1200 credits
- [ ] Test upgrade from starter to pro
  - Expected: Available + 5000 credits
- [ ] Test downgrade from pro to starter
  - Expected: Keep available credits
- [ ] Verify credits_used_month reset to 0 on plan change

### 11. Error Handling
- [ ] Test with invalid plan ID
- [ ] Test with expired token
- [ ] Test with network timeout
- [ ] Verify error messages are user-friendly
- [ ] Verify no crashes or white screens

### 12. UI/UX Testing
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Test on tablet
- [ ] Verify responsive design works
- [ ] Verify animations are smooth
- [ ] Verify loading states are clear

---

## Monitoring Setup

### 13. Logging
- [ ] Webhook events are logged
- [ ] Credit updates are logged
- [ ] Errors are logged with context
- [ ] Log aggregation is working (if applicable)

### 14. Alerts (Optional)
- [ ] Set up alert for failed webhooks
- [ ] Set up alert for checkout errors
- [ ] Set up alert for credit sync failures
- [ ] Set up alert for high error rate

### 15. Metrics (Optional)
- [ ] Track checkout conversion rate
- [ ] Track credit update time
- [ ] Track webhook processing time
- [ ] Track error rate

---

## Rollback Plan

### If Issues Occur

#### Option 1: Rollback Frontend Only
```bash
# Revert to previous frontend deployment
# Backend changes are backward compatible
```

#### Option 2: Rollback Database Migration
```bash
cd backend
npm run migrate down
# This removes subscription tracking columns
# App will still work with old credit logic
```

#### Option 3: Full Rollback
```bash
# Revert both frontend and backend
# Rollback database migration
# Restore from backup if needed
```

---

## Success Criteria

The deployment is successful if:

- ✅ No errors in production logs
- ✅ Users can view billing page
- ✅ Users can complete checkout
- ✅ Credits update within 60 seconds
- ✅ No duplicate credit additions
- ✅ Webhooks are processing correctly
- ✅ UI is responsive and functional
- ✅ Error handling works as expected

---

## Post-Deployment Tasks

### 16. Documentation
- [ ] Update internal wiki with new billing flow
- [ ] Update support documentation
- [ ] Train support team on new features
- [ ] Document any issues encountered

### 17. Communication
- [ ] Notify team of successful deployment
- [ ] Announce new features to users (optional)
- [ ] Update changelog
- [ ] Post in company Slack/Discord

### 18. Monitoring Period
- [ ] Monitor for 24 hours after deployment
- [ ] Check error rates hourly
- [ ] Review webhook delivery rates
- [ ] Check user feedback/support tickets

---

## Known Issues & Workarounds

### Issue: Webhook Delay
- **Symptom**: Credits take > 60 seconds to update
- **Workaround**: User can manually refresh page
- **Fix**: Polling will eventually catch the update

### Issue: Checkout Timeout
- **Symptom**: "Request timeout" error
- **Workaround**: User can try again
- **Fix**: Timeout is set to 15 seconds, should be sufficient

### Issue: Browser Cache
- **Symptom**: Old billing page still showing
- **Workaround**: Hard refresh (Ctrl+Shift+R)
- **Fix**: Clear CDN cache after deployment

---

## Emergency Contacts

- **Backend Issues**: [Your backend team contact]
- **Frontend Issues**: [Your frontend team contact]
- **Database Issues**: [Your DBA contact]
- **Wix Support**: https://dev.wix.com/support

---

## Completion

- [ ] All checklist items completed
- [ ] No critical issues found
- [ ] Monitoring is active
- [ ] Team is notified
- [ ] Documentation is updated

**Deployment Date**: _______________
**Deployed By**: _______________
**Sign-off**: _______________

---

## Notes

Use this space to document any issues, workarounds, or observations during deployment:

```
[Add your notes here]
```
