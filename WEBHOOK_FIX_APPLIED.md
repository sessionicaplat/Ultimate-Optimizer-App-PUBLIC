# Webhook Plan Extraction Fix - APPLIED ✅

## What Was Fixed

The webhook handler was trying to extract plan information from the webhook payload, but Wix's `onPurchasedItemInvoiceStatusUpdated` webhook doesn't include plan details.

### Before (Broken)
```typescript
if (invoiceStatus === 'PAID') {
  const planId = extractPlanId(eventData);  // ❌ Returns null
  if (planId) {
    await handleSubscriptionActive(instanceId, planId);
  }
}
```

**Result**: Always defaulted to 'free' because webhook has no plan info

### After (Fixed)
```typescript
if (invoiceStatus === 'PAID') {
  console.log('Payment received, querying Wix for current subscription...');
  const planId = await getCurrentPlanFromWix(instanceId);  // ✅ Queries Wix API
  
  if (planId) {
    console.log(`Current plan from Wix: ${planId}`);
    await handleSubscriptionActive(instanceId, planId);
  }
}
```

**Result**: Queries Wix Billing API to get actual current plan

## New Function Added

```typescript
async function getCurrentPlanFromWix(instanceId: string): Promise<string | null> {
  // 1. Get instance access token
  // 2. Create Wix SDK client
  // 3. Call getPurchaseHistory()
  // 4. Extract productId from latest purchase
  // 5. Normalize to internal plan ID
  // 6. Return plan ID
}
```

This reuses the same logic as `/api/billing/subscription` endpoint, which already works correctly.

## Expected Behavior Now

### When User Upgrades to Starter Plan

1. **User purchases** Starter plan in Wix dashboard
2. **Wix sends webhook** with `status: 'PAID'`
3. **Your app receives webhook**:
   ```
   Billing webhook event received
   Invoice status: PAID
   Payment received, querying Wix for current subscription...
   Fetching current plan from Wix for instance: 08df22f0-...
   ✅ Retrieved plan from Wix: productId="starter" → planId="starter"
   Current plan from Wix: starter
   Updating instance plan: { instanceId: '...', planId: 'starter' }
   ✅ Instance plan updated: starter with 1000 credits
   ```
4. **Database updated** with correct plan
5. **Test page shows** "Starter Plan" ✅

## Testing

### To Test the Fix

1. **Trigger a new webhook** (easiest way):
   - Go to Wix dashboard
   - Cancel your current subscription
   - Re-subscribe to Starter plan
   - This will trigger a new PAID webhook

2. **Check Render logs** for:
   ```
   ✅ "Payment received, querying Wix for current subscription..."
   ✅ "Retrieved plan from Wix: productId="starter" → planId="starter""
   ✅ "Instance plan updated: starter with 1000 credits"
   ```

3. **Refresh test cancellation page**:
   - Should now show "Starter Plan"
   - With 1000 credits

### Alternative: Manual Database Update (Temporary)

If you don't want to re-subscribe, manually update the database:

```sql
UPDATE app_instances
SET plan_id = 'starter',
    credits_total = 1000,
    credits_used_month = 0
WHERE instance_id = '08df22f0-4e31-4c46-8ada-6fe6f0e52c07';
```

Then refresh the test page.

## Files Changed

- ✅ `backend/src/routes/billing.ts`
  - Updated webhook handler to query Wix API
  - Added `getCurrentPlanFromWix()` helper function
  - Added better logging

## Why This Fix Works

The `/api/billing/subscription` endpoint already successfully queries Wix and gets:
```
✅ Subscription data retrieved: {productId: 'starter', planId: 'starter'}
```

Now the webhook handler does the exact same thing, so it will get the same correct result.

## Deployment

The fix is ready to deploy:

```bash
git add backend/src/routes/billing.ts
git commit -m "Fix webhook plan extraction by querying Wix API"
git push
```

Render will automatically deploy the update.

## Summary

**Problem**: Webhook defaulted to 'free' because it doesn't contain plan info

**Solution**: Query Wix Billing API in webhook handler (same as subscription endpoint)

**Result**: Database gets updated with correct plan when webhook arrives

**Status**: ✅ Fixed and ready to test
