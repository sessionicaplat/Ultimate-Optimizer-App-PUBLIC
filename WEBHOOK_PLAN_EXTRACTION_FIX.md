# Webhook Plan Extraction Fix

## The Problem (FOUND!)

Your logs show:

```
✅ Subscription data retrieved: {productId: 'starter', planId: 'starter'...}  ← API works!

But webhook shows:
Event data: {status: 'PAID', invoiceId: '1206705471', instanceId: '...'}  ← No plan info!
Updating instance plan: { instanceId: '...', planId: 'free' }  ← Defaults to free!
```

## Root Cause

The webhook payload from Wix **does not include plan information**. It only contains:
- `status`: 'PAID'
- `invoiceId`: '1206705471'  
- `instanceId`: '08df22f0-4e31-4c46-8ada-6fe6f0e52c07'

Your `extractPlanId()` function tries to find plan info in the webhook:
```typescript
const planName = purchasedItem.name || purchasedItem.planName || purchasedItem.id || '';
```

But none of these fields exist in the webhook, so it returns empty string, which `normalizePlanId()` converts to `'free'`.

## The Fix

Instead of extracting plan from webhook, **query Wix Billing API** to get the current subscription:

### Current Code (billing.ts, line 22-60)
```typescript
wixClient.billing.onPurchasedItemInvoiceStatusUpdated(async (event) => {
  // ...
  if (invoiceStatus === 'PAID') {
    const planId = extractPlanId(eventData);  // ❌ Returns null!
    if (planId) {
      await handleSubscriptionActive(instanceId, planId);
    }
  }
});
```

### Fixed Code
```typescript
wixClient.billing.onPurchasedItemInvoiceStatusUpdated(async (event) => {
  // ...
  if (invoiceStatus === 'PAID') {
    // Query Wix API to get current subscription
    const planId = await getCurrentPlanFromWix(instanceId);
    if (planId) {
      await handleSubscriptionActive(instanceId, planId);
    }
  }
});

async function getCurrentPlanFromWix(instanceId: string): Promise<string | null> {
  try {
    const { getInstanceToken } = await import('../wix/tokenHelper');
    const accessToken = await getInstanceToken(instanceId);
    
    const { WixSDKClient } = await import('../wix/sdkClient');
    const wixClient = new WixSDKClient(accessToken);
    
    const purchases = await wixClient.getPurchaseHistory();
    
    if (purchases.length > 0) {
      const productId = purchases[0].productId;
      return normalizePlanId(productId);
    }
    
    return 'free';
  } catch (error) {
    console.error('Error fetching plan from Wix:', error);
    return null;
  }
}
```

## Why This Works

Your `/api/billing/subscription` endpoint already successfully queries Wix and gets:
```
✅ Subscription data retrieved: {productId: 'starter', planId: 'starter'}
```

The webhook handler should do the exact same thing!

## Implementation Steps

1. Add `getCurrentPlanFromWix()` helper function
2. Update webhook handler to call it instead of `extractPlanId()`
3. Remove or keep `extractPlanId()` as fallback (but it won't work with current webhook format)

## Alternative: Use the Subscription Endpoint Logic

Even simpler - reuse the exact same logic from `/api/billing/subscription`:

```typescript
if (invoiceStatus === 'PAID') {
  // Reuse the same logic as /api/billing/subscription
  const { getInstanceToken } = await import('../wix/tokenHelper');
  const accessToken = await getInstanceToken(instanceId);
  
  const { WixSDKClient } = await import('../wix/sdkClient');
  const wixClient = new WixSDKClient(accessToken);
  
  const purchases = await wixClient.getPurchaseHistory();
  
  if (purchases.length > 0) {
    const productId = purchases[0].productId;
    const planId = normalizePlanId(productId);
    await handleSubscriptionActive(instanceId, planId);
  }
}
```

## Expected Result After Fix

```
Webhook received: status=PAID
Querying Wix for current subscription...
✅ Found subscription: productId='starter'
Normalized to planId: 'starter'
Updating instance plan: { instanceId: '...', planId: 'starter' }
✅ Instance plan updated: starter with 1000 credits
```

## Why the Current Approach Doesn't Work

Wix's `onPurchasedItemInvoiceStatusUpdated` webhook is **invoice-focused**, not **subscription-focused**. It tells you:
- An invoice was paid
- Which invoice ID
- For which instance

But it doesn't tell you:
- What product was purchased
- What plan the user is on now

You need to query the Billing API separately to get that information.

## Summary

**Problem**: Webhook doesn't contain plan info → defaults to 'free'

**Solution**: Query Wix Billing API in webhook handler (same as `/api/billing/subscription` does)

**Result**: Database gets updated with correct plan ('starter' instead of 'free')
