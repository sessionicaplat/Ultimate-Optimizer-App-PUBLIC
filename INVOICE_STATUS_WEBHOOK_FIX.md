# Invoice Status Updated Webhook - Implementation Complete

## Problem
The billing webhook endpoint was receiving `InvoiceStatusUpdated` events from Wix but rejecting them with a 500 error because the event handler wasn't registered.

Error message:
```
Webhook processing error: Error: Unexpected event type: InvoiceStatusUpdated. 
Expected one of: PaidPlanAutoRenewalCancelled, PaidPlanPurchased, PaidPlanChanged
```

## Solution
Added support for the `InvoiceStatusUpdated` webhook event by:

1. **Imported the billing module** from `@wix/app-management`
2. **Registered the event handler** using `wixClient.billing.onPurchasedItemInvoiceStatusUpdated()`
3. **Implemented proper status handling** for all invoice statuses

## Changes Made

### File: `backend/src/routes/billing.ts`

#### 1. Added billing module import
```typescript
import { appInstances, billing } from '@wix/app-management';
```

#### 2. Updated Wix client initialization
```typescript
const wixClient = createClient({
  auth: AppStrategy({
    appId: WIX_APP_ID,
    publicKey: WIX_PUBLIC_KEY,
  }),
  modules: { appInstances, billing }, // Added billing module
});
```

#### 3. Added Invoice Status Updated handler
```typescript
wixClient.billing.onPurchasedItemInvoiceStatusUpdated(async (event) => {
  // Handles invoice status changes with proper logic for each status
});
```

## Invoice Status Handling

The handler now properly processes these invoice statuses:

| Status | Action | Description |
|--------|--------|-------------|
| `PAID` | Update plan | Invoice paid successfully - query Wix for current plan and update |
| `REFUNDED` | Check & downgrade | Invoice refunded - verify if user still has active plan, downgrade if not |
| `VOIDED` | Check & downgrade | Invoice voided/cancelled - verify if user still has active plan, downgrade if not |
| `PAYMENT_FAILED` | Log only | Payment failed - log for monitoring, don't downgrade (Wix may retry) |
| `CHARGEDBACK` | Log only | Chargeback detected - log for potential action |
| `UNKNOWN_INVOICE_STATUS` | Log only | Unknown status - log for investigation |

## Event Data Structure

The webhook receives:
```typescript
{
  data: {
    instanceId: string,      // App instance GUID
    invoiceId: string,        // Invoice GUID
    status: InvoiceStatus,    // Payment status
    recurring: boolean        // Single or recurring payment
  },
  metadata: {
    eventType: string,
    identity: { ... },
    instanceId: string
  }
}
```

## Testing

To test the webhook:
1. Make a test purchase in your Wix app
2. Check server logs for: `💰 Invoice status updated webhook received`
3. Verify the status is handled correctly
4. Check that plan updates occur as expected

## Wix Documentation Reference

Based on Wix 2025 documentation:
- Event: `onPurchasedItemInvoiceStatusUpdated`
- Module: `@wix/app-management` → `billing`
- Particularly relevant for usage-based charges via Custom Charges SPI

## Next Steps

1. **Deploy the updated code** to your server
2. **Monitor webhook logs** to ensure events are processed successfully
3. **Verify no more 500 errors** for InvoiceStatusUpdated events
4. **Optional**: Add more sophisticated handling for PAYMENT_FAILED and CHARGEDBACK statuses

## Notes

- The webhook endpoint automatically returns 200 OK after processing
- All invoice status events are logged for monitoring
- The handler queries Wix API to verify current plan before making changes
- Prevents premature downgrades by checking actual subscription status
