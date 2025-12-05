# Wix App Billing Configuration Guide

## Overview

This guide walks you through configuring Wix App Billing for the Ultimate Optimizer App. This is a **manual configuration task** that must be completed in the Wix Developer Dashboard.

**Task Reference**: 17.1 Configure Wix App Billing

## Prerequisites

- Wix Developer account with app created
- App ID and App Secret configured
- Backend deployed to Render with billing endpoints active
- Access to Wix Developer Dashboard

## Step-by-Step Configuration

### Step 1: Access Wix Developer Dashboard

1. Go to [Wix Developers](https://dev.wix.com/)
2. Sign in with your Wix account
3. Navigate to **My Apps**
4. Select your **Ultimate Optimizer App**

### Step 2: Enable App Billing

1. In your app's dashboard, navigate to **Monetization** or **Billing** section
2. Click **Enable App Billing** or **Set Up Billing**
3. Review and accept Wix's billing terms and conditions
4. Complete any required business information forms

### Step 3: Create Subscription Plans

You need to create four subscription plans with the following specifications:

#### Plan 1: Free Plan
- **Plan Name**: Free
- **Plan ID**: `free` (lowercase, no spaces)
- **Price**: $0.00 USD
- **Billing Cycle**: Monthly
- **Description**: "Get started with 100 monthly credits"
- **Features**:
  - 100 credits per month
  - AI-powered optimization
  - All product attributes
  - Multi-language support

#### Plan 2: Starter Plan
- **Plan Name**: Starter
- **Plan ID**: `starter` (lowercase, no spaces)
- **Price**: $9.00 USD
- **Billing Cycle**: Monthly
- **Description**: "Perfect for small stores with 1,000 monthly credits"
- **Features**:
  - 1,000 credits per month
  - AI-powered optimization
  - All product attributes
  - Multi-language support
  - Priority support

#### Plan 3: Pro Plan
- **Plan Name**: Pro
- **Plan ID**: `pro` (lowercase, no spaces)
- **Price**: $19.00 USD
- **Billing Cycle**: Monthly
- **Description**: "Ideal for growing stores with 5,000 monthly credits"
- **Features**:
  - 5,000 credits per month
  - AI-powered optimization
  - All product attributes
  - Multi-language support
  - Priority support

#### Plan 4: Scale Plan
- **Plan Name**: Scale
- **Plan ID**: `scale` (lowercase, no spaces)
- **Price**: $49.00 USD
- **Billing Cycle**: Monthly
- **Description**: "For large stores with 25,000 monthly credits"
- **Features**:
  - 25,000 credits per month
  - AI-powered optimization
  - All product attributes
  - Multi-language support
  - Priority support
  - Dedicated account manager

### Step 4: Configure Webhook URL

1. In the Billing/Monetization section, find **Webhooks** or **Notifications**
2. Add a new webhook endpoint
3. Set the webhook URL to:
   ```
   https://ultimateoptimizerapp.onrender.com/api/webhooks/billing
   ```
   
   **Note**: Replace `ultimateoptimizerapp.onrender.com` with your actual Render service URL

4. Select the following events to subscribe to:
   - ✅ `subscription.created` - When a user subscribes to a plan
   - ✅ `subscription.updated` - When a user changes their plan
   - ✅ `subscription.canceled` - When a user cancels their subscription

5. Save the webhook configuration

### Step 5: Test Webhook Delivery

1. Use Wix's webhook testing tool (if available)
2. Send a test webhook event
3. Verify the webhook is received by checking your Render logs:
   ```bash
   # In Render dashboard, go to Logs and look for:
   "Billing webhook received"
   ```

4. Confirm the test event is processed successfully

### Step 6: Configure Plan Metadata (Optional)

If Wix allows custom metadata for plans, add the following:

```json
{
  "credits": 100,  // or 1000, 5000, 25000
  "planId": "free" // or "starter", "pro", "scale"
}
```

This helps with debugging and ensures consistency between Wix and your database.

## Verification Checklist

After completing the configuration, verify:

- [ ] App Billing is enabled in Wix Developer Dashboard
- [ ] Four plans are created with correct pricing:
  - [ ] Free: $0, 200 credits
  - [ ] Starter: $9, 1000 credits
  - [ ] Pro: $19, 5000 credits
  - [ ] Scale: $49, 25000 credits
- [ ] Plan IDs match exactly: `free`, `starter`, `pro`, `scale`
- [ ] Webhook URL is set to your Render service
- [ ] Webhook events are subscribed:
  - [ ] subscription.created
  - [ ] subscription.updated
  - [ ] subscription.canceled
- [ ] Test webhook successfully delivered and processed

## Testing the Integration

### Test 1: Upgrade Flow
1. Install your app on a test Wix site
2. Navigate to the Billing & Credits page in your app
3. Click "Upgrade" on the Starter plan
4. Verify you're redirected to Wix checkout page
5. Complete the test purchase (use Wix test mode)
6. Verify the webhook is received and plan is updated

### Test 2: Plan Change
1. From the Billing page, upgrade to Pro plan
2. Verify webhook is received
3. Check database to confirm:
   - `plan_id` updated to `pro`
   - `credits_total` updated to `5000`
   - `credits_used_month` preserved

### Test 3: Cancellation
1. Cancel the subscription from Wix dashboard
2. Verify webhook is received
3. Check database to confirm:
   - `plan_id` downgraded to `free`
   - `credits_total` updated to `100`

## Troubleshooting

### Webhook Not Received

**Problem**: Webhook events are not reaching your server

**Solutions**:
1. Verify webhook URL is correct and accessible
2. Check Render logs for incoming requests
3. Ensure your server is running and healthy
4. Verify webhook URL uses HTTPS (required by Wix)
5. Check Wix webhook delivery logs for errors

### Plan Not Updating

**Problem**: Webhook received but plan not updating in database

**Solutions**:
1. Check Render logs for error messages
2. Verify plan IDs match exactly (case-sensitive)
3. Ensure database connection is working
4. Check that `plans` table has all four plans seeded
5. Verify `updateInstancePlan()` function is working

### Invalid Plan ID Error

**Problem**: Webhook contains plan ID that doesn't exist

**Solutions**:
1. Verify plan IDs in Wix match your database exactly
2. Check plan ID normalization in `billing.ts`
3. Add logging to see what plan ID is being sent
4. Update plan mapping if Wix uses different format

### Checkout URL Not Working

**Problem**: Upgrade button doesn't redirect properly

**Solutions**:
1. Verify `WIX_APP_ID` environment variable is set
2. Check that upgrade URL format matches Wix requirements
3. Review Wix Billing API documentation for correct URL format
4. Test URL manually in browser
5. Check browser console for JavaScript errors

## Environment Variables

Ensure these are set in your Render environment:

```bash
WIX_APP_ID=your-app-id-here
WIX_APP_SECRET=your-app-secret-here
DATABASE_URL=your-postgres-url-here
```

## Database Verification

After configuration, verify your database has the plans table seeded:

```sql
SELECT * FROM plans;
```

Expected output:
```
id      | name    | price_cents | monthly_credits
--------|---------|-------------|----------------
free    | Free    | 0           | 100
starter | Starter | 900         | 1000
pro     | Pro     | 1900        | 5000
scale   | Scale   | 4900        | 25000
```

## Support Resources

- [Wix App Billing Documentation](https://dev.wix.com/docs/build-apps/developer-tools/app-billing)
- [Wix Webhooks Guide](https://dev.wix.com/docs/build-apps/developer-tools/webhooks)
- [Render Deployment Logs](https://dashboard.render.com/)

## Next Steps

After completing this configuration:

1. ✅ Mark task 17.1 as complete
2. Test the complete billing flow end-to-end
3. Monitor webhook events in production
4. Set up alerts for failed webhook deliveries
5. Consider implementing webhook signature verification (task 17.3)

## Notes

- Wix may take a few minutes to activate billing after enabling
- Test mode allows testing without real charges
- Keep webhook URL updated if you change hosting providers
- Monitor billing events closely during initial rollout
- Consider rate limiting on webhook endpoint for production

## Completion Criteria

Task 17.1 is complete when:
- ✅ App Billing is enabled in Wix
- ✅ All four plans are created with correct pricing
- ✅ Webhook URL is configured and tested
- ✅ Test subscription successfully updates database
- ✅ Upgrade flow works end-to-end
