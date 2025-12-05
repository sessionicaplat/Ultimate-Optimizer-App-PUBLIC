# Cancellation Handling Analysis

## 🔍 Current Implementation Status

### ❌ What's Missing

Your app **does NOT currently handle the `PaidPlanAutoRenewalCancelled` webhook event** from Wix.

### ✅ What You Have

You only handle the `InvoiceStatusUpdated` webhook, which covers:
- `PAID` status → Activates subscription
- `REFUNDED` or `VOIDED` status → Downgrades to free

### ❌ The Problem

According to Wix 2025 documentation, when a user cancels their subscription:

1. **Wix sends `PaidPlanAutoRenewalCancelled` webhook** immediately
2. **User keeps access until end of billing cycle** (they already paid)
3. **After billing cycle ends**, the plan expires
4. **Then Wix might send `InvoiceStatusUpdated` with REFUNDED/VOIDED**

**Your app is missing step 1** - it doesn't listen for the cancellation webhook.

## 📊 How Cancellation Should Work (Per Wix 2025 Docs)

### Timeline

```
Day 1: User Cancels
  ↓
  Wix sends: PaidPlanAutoRenewalCancelled webhook
  ↓
  Your app should: Log the cancellation, but DON'T downgrade yet
  ↓
Day 1-30: User still has access
  ↓
  User continues using paid features (they already paid for this month)
  ↓
Day 30: Billing cycle ends
  ↓
  Plan expires, no renewal charge
  ↓
  Wix might send: InvoiceStatusUpdated (REFUNDED/VOIDED)
  ↓
  Your app should: NOW downgrade to free plan
```

### Key Points from Wix Docs

> "When a user cancels a paid plan, they are turning off the auto-renewal."

> "Even after cancellation, the user is still considered a paid user and retains access to premium features until the current billing cycle or free trial period ends."

> "You should not downgrade the user's access immediately upon receiving the cancellation webhook."

## 🎯 What Your App Currently Does

### Webhook Handler (`backend/src/routes/billing.ts`)

```typescript
// Only handles InvoiceStatusUpdated
wixClient.billing.onPurchasedItemInvoiceStatusUpdated(async (event) => {
  if (invoiceStatus === 'PAID') {
    // Activate subscription
    await handleSubscriptionActive(instanceId, planId);
  } else if (invoiceStatus === 'REFUNDED' || invoiceStatus === 'VOIDED') {
    // Downgrade to free
    await handleSubscriptionCanceled(instanceId);
  }
});
```

### What Happens When User Cancels

1. **User clicks "Cancel" in Wix** → Wix sends `PaidPlanAutoRenewalCancelled`
2. **Your app doesn't listen for this event** → Nothing happens
3. **User continues using paid features** → ✅ Correct (they should)
4. **Billing cycle ends** → Wix might send `InvoiceStatusUpdated` with REFUNDED
5. **Your app downgrades to free** → ✅ Eventually correct

### The Issue

- ❌ No logging of cancellation event
- ❌ No tracking of "canceled but still active" state
- ❌ No way to show user "Your subscription will end on [date]"
- ❌ Relies on REFUNDED/VOIDED status (might not always be sent)

## ✅ What Should Be Implemented

### 1. Add Cancellation Webhook Handler

```typescript
// Add this to backend/src/routes/billing.ts
wixClient.billing.onPaidPlanAutoRenewalCancelled(async (event) => {
  console.log('Cancellation webhook received:', {
    type: 'PaidPlanAutoRenewalCancelled',
    instanceId: event.metadata?.instanceId,
    timestamp: new Date().toISOString(),
    eventData: event.data,
  });

  try {
    const instanceId = event.metadata?.instanceId;
    if (!instanceId) {
      console.error('Missing instanceId in cancellation webhook');
      return;
    }

    const eventData = event.data as any;
    const vendorProductId = eventData.vendorProductId;
    const subscriptionCancellationType = eventData.subscriptionCancellationType;
    const cancelReason = eventData.cancelReason;
    
    console.log('Cancellation details:', {
      instanceId,
      vendorProductId,
      subscriptionCancellationType, // "AT_END_OF_PERIOD" or "IMMEDIATELY"
      cancelReason,
    });

    // Log the cancellation but DON'T downgrade yet
    // User keeps access until end of billing cycle
    await logCancellation(instanceId, {
      vendorProductId,
      subscriptionCancellationType,
      cancelReason,
      canceledAt: new Date(),
    });

    // If cancellation type is "IMMEDIATELY", downgrade now
    if (subscriptionCancellationType === 'IMMEDIATELY') {
      await handleSubscriptionCanceled(instanceId);
    }
    // Otherwise, wait for plan to expire naturally
    
  } catch (error) {
    console.error('Error processing cancellation webhook:', error);
  }
});
```

### 2. Add Database Tracking (Optional but Recommended)

Add a field to track cancellation status:

```sql
ALTER TABLE app_instances 
ADD COLUMN subscription_canceled_at TIMESTAMP,
ADD COLUMN subscription_expires_at TIMESTAMP,
ADD COLUMN subscription_cancel_reason VARCHAR(255);
```

### 3. Update Frontend to Show Cancellation Status

```typescript
// In Credits page, show if subscription is canceled
if (account.subscriptionCanceledAt && account.subscriptionExpiresAt) {
  return (
    <div className="cancellation-notice">
      ⚠️ Your subscription will end on {formatDate(account.subscriptionExpiresAt)}
      <button onClick={handleReactivate}>Reactivate Subscription</button>
    </div>
  );
}
```

## 🔄 Complete Cancellation Flow (Recommended)

### User Cancels Subscription

1. **User goes to Wix billing page** and clicks "Cancel"
2. **Wix sends `PaidPlanAutoRenewalCancelled` webhook**
3. **Your app receives webhook:**
   - Logs cancellation
   - Updates database: `subscription_canceled_at = NOW()`
   - Updates database: `subscription_expires_at = end_of_billing_cycle`
   - Does NOT change `plan_id` yet
4. **User continues using app** with full paid features
5. **Frontend shows notice:** "Your subscription will end on [date]"

### Billing Cycle Ends

1. **Wix does not charge renewal** (auto-renewal is off)
2. **Wix might send `InvoiceStatusUpdated` with REFUNDED/VOIDED**
3. **Your app receives webhook:**
   - Downgrades to free plan
   - Updates database: `plan_id = 'free'`
   - Resets credits to free tier
4. **User now has free plan access**

### User Reactivates (Optional)

1. **User clicks "Reactivate" in your app**
2. **Redirect to Wix pricing page** (same upgrade flow)
3. **Wix sends `PlanReactivated` webhook**
4. **Your app receives webhook:**
   - Clears cancellation flags
   - Restores paid plan access

## 📋 Comparison: Current vs Recommended

### Current Implementation

| Event | Your App | Correct? |
|-------|----------|----------|
| User cancels | ❌ Not detected | ❌ No |
| During grace period | ✅ User keeps access | ✅ Yes (by accident) |
| After expiration | ✅ Downgrades to free | ✅ Yes (eventually) |
| User notification | ❌ No warning | ❌ No |
| Reactivation | ❌ Not supported | ❌ No |

### Recommended Implementation

| Event | Your App | Correct? |
|-------|----------|----------|
| User cancels | ✅ Logs cancellation | ✅ Yes |
| During grace period | ✅ User keeps access | ✅ Yes |
| After expiration | ✅ Downgrades to free | ✅ Yes |
| User notification | ✅ Shows end date | ✅ Yes |
| Reactivation | ✅ Supported | ✅ Yes |

## 🎯 Risk Assessment

### Current Risk Level: **MEDIUM**

**What works:**
- ✅ Users keep access after cancellation (correct behavior)
- ✅ Eventually downgrade to free (via REFUNDED/VOIDED)

**What's problematic:**
- ❌ No visibility into cancellations
- ❌ Can't show users when subscription ends
- ❌ Can't track cancellation reasons
- ❌ Relies on REFUNDED/VOIDED (might not always be sent)
- ❌ No reactivation support

### For Wix App Market Approval

The Wix App Market requires:
> "Test the entire checkout flow of the app installed on a Wix site – test each plan, cancel plan, etc."

Your app **might pass** because it eventually handles cancellations correctly, but it's **not following best practices** from the 2025 documentation.

## 💡 Recommendation

### Minimum (Quick Fix)
Add the `onPaidPlanAutoRenewalCancelled` webhook handler to log cancellations. This gives you visibility and helps with debugging.

### Recommended (Full Implementation)
1. Add cancellation webhook handler
2. Add database fields to track cancellation status
3. Update frontend to show cancellation notice
4. Add reactivation support
5. Test the full cancellation flow

### Priority
- **For MVP/Testing:** Minimum is acceptable
- **For Production/App Market:** Recommended is better
- **For User Experience:** Recommended is essential

---

**Status:** Analysis Complete
**Current Implementation:** Partially Correct (works but incomplete)
**Recommendation:** Add cancellation webhook handler
**Priority:** Medium (works now, but should be improved)
