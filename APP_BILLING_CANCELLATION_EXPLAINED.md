# App Billing Cancellation - How It Actually Works
rebuilt
## The Confusion ddddd

There are **two different types** of subscriptions in Wix:

### 1. Site Member Subscriptions (Pricing Plans)
- ❌ **NOT what you need**
- For end-users buying memberships, courses, etc. on a Wix site
- Uses `@wix/pricing-plans` API
- Requires member login context
- Example: A user buying a "Premium Membership" on a Wix site

### 2. App Billing Subscriptions
- ✅ **This is what you need**
- For site owners subscribing to YOUR app's plans (Free, Pro, etc.)
- Uses `@wix/app-management` billing API
- Works with app instance token
- Example: A site owner upgrading your app from Free to Pro

## How App Billing Actually Works

### The Real Flow

1. **User Upgrades in Wix Dashboard**
   - Site owner goes to Wix dashboard
   - Clicks "Upgrade" in your app
   - Selects a plan (Pro, Scale, etc.)
   - Completes payment through Wix

2. **Wix Sends Webhook**
   - Wix sends webhook to your `/api/billing/webhook` endpoint
   - Webhook contains subscription details
   - Your app updates the database

3. **User Cancels in Wix Dashboard**
   - Site owner goes to Wix dashboard
   - Manages subscriptions
   - Cancels your app's subscription
   - Wix sends cancellation webhook

4. **Your App Reacts**
   - Webhook handler updates database
   - Downgrades plan to "free"
   - Adjusts credits/features
   - UI reflects the change

### You DON'T Cancel Through Your App

**Important**: Site owners cancel subscriptions through the **Wix dashboard**, not through your app's UI.

Your app's role is to:
- ✅ Show current subscription status
- ✅ Provide "Upgrade" button (links to Wix billing)
- ✅ Handle webhooks when changes occur
- ❌ NOT provide a "Cancel" button (Wix handles this)

## What the Test Page Actually Does

The test cancellation page is for **testing your app's reaction** to cancellation, not for actually canceling subscriptions.

### Current Implementation

The test page now:
1. Shows your current app subscription from the database
2. Provides a "Simulate Cancel" button
3. Logs what would happen during cancellation
4. Explains the real cancellation flow

### To Test Cancellation Behavior

**Option 1: Simulate in Code**
```typescript
// Manually trigger what the webhook would do
await updateInstancePlan(instanceId, 'free');
```

**Option 2: Actually Cancel**
1. Go to Wix dashboard
2. Find your app in installed apps
3. Manage subscription
4. Cancel it
5. Watch your webhook handler process the cancellation

## The Correct API (If You Need It)

If you absolutely need to programmatically cancel (rare), the correct approach would be:

```typescript
import { billing } from '@wix/app-management';

// This is theoretical - the actual API might not support programmatic cancellation
// Wix expects users to cancel through their dashboard
```

**Reality**: Wix doesn't provide an API for apps to cancel their own subscriptions programmatically. This is by design - subscription management happens through Wix's billing interface.

## What You Should Implement

### 1. Show Current Subscription
```typescript
// GET /api/billing/subscription
const instance = await getAppInstance(instanceId);
return {
  planId: instance.plan_id,
  planName: instance.plan_id.toUpperCase(),
  status: 'ACTIVE',
  creditsTotal: instance.credits_total,
  creditsUsed: instance.credits_used_month
};
```

### 2. Provide Upgrade Button
```typescript
// GET /api/billing/checkout-url
const checkoutUrl = await wixClient.billing.getUrl(productId, {
  billingCycle: 'MONTHLY',
  successUrl: 'https://your-app.com/billing/success'
});
return { checkoutUrl };
```

### 3. Handle Cancellation Webhook
```typescript
// POST /api/billing/webhook (already implemented)
wixClient.billing.onPurchasedItemInvoiceStatusUpdated(async (event) => {
  if (event.data.status === 'CANCELLED') {
    await updateInstancePlan(instanceId, 'free');
  }
});
```

## Summary

**What You Thought:**
- Users cancel through your app
- You call an API to cancel the subscription
- You need `@wix/pricing-plans` orders API

**What Actually Happens:**
- Users cancel through Wix dashboard
- Wix sends you a webhook
- You update your database
- You use `@wix/app-management` billing API (for upgrades only)

**The Test Page:**
- Shows current subscription from your database
- Simulates what happens during cancellation
- Helps you test your app's reaction
- Does NOT actually cancel subscriptions

**Next Steps:**
1. ✅ Test page is working (shows current plan)
2. ✅ Webhook handler is implemented (handles cancellations)
3. ✅ Database updates correctly
4. ✅ Your app reacts to plan changes

You're all set! The test page will help you verify your app handles cancellations correctly when they happen through Wix.
