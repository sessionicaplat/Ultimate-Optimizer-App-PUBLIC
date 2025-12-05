# Wix Billing Webhook Fix - 2025 SDK Implementation

## Issue
The billing webhook endpoint was returning 404 errors because it wasn't properly integrated with the Wix SDK's webhook processing system.

## Solution
Updated the billing route to use the official Wix 2025 SDK with proper webhook processing.

## Changes Made

### 1. Installed Required Package
```bash
npm install @wix/app-management
```

### 2. Updated billing.ts
- Integrated `@wix/sdk` with `AppStrategy`
- Added `@wix/app-management` billing module
- Implemented `onPurchasedItemInvoiceStatusUpdated` event handler
- Updated webhook endpoint to use `express.text()` middleware
- Added Wix SDK webhook processing with `wixClient.webhooks.process()`

### 3. Key Implementation Details

**Wix SDK Client Setup:**
```typescript
const wixClient = createClient({
  auth: AppStrategy({
    appId: WIX_APP_ID,
    publicKey: WIX_PUBLIC_KEY,
  }),
  modules: { billing },
});
```

**Event Handler:**
```typescript
wixClient.billing.onPurchasedItemInvoiceStatusUpdated(async (event) => {
  // Handles invoice status changes
  // - PAID: Subscription active, update plan
  // - REFUNDED/VOIDED: Subscription canceled, downgrade to free
});
```

**Webhook Endpoint:**
```typescript
router.post('/api/webhooks/billing', express.text({ type: '*/*' }), async (req, res) => {
  await wixClient.webhooks.process(req.body);
  res.status(200).send();
});
```

## Required Environment Variables

You need to add a new environment variable to your Render service:

### WIX_PUBLIC_KEY

This is the public key used to verify webhook signatures from Wix.

**How to get it:**

1. Go to [Wix Developers Dashboard](https://dev.wix.com/)
2. Select your app
3. Navigate to **Webhooks** or **App Settings**
4. Look for **Public Key** or **Webhook Signing Key**
5. Copy the entire public key including the header and footer:
   ```
   -----BEGIN PUBLIC KEY-----
   MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
   ...
   -----END PUBLIC KEY-----
   ```

**Add to Render:**

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add new environment variable:
   - **Key**: `WIX_PUBLIC_KEY`
   - **Value**: Paste the entire public key (including BEGIN/END lines)
5. Save changes
6. Render will automatically redeploy

## Testing the Webhook

### 1. Verify Environment Variables
```bash
# Check that all required variables are set
curl https://ultimate-optimizer-app.onrender.com/api/debug/config
```

Should show:
```json
{
  "config": {
    "WIX_APP_ID": "SET",
    "WIX_APP_SECRET": "SET",
    "DATABASE_URL": "SET"
  }
}
```

### 2. Test Webhook Endpoint
In Wix Developer Dashboard:
1. Go to **Webhooks** section
2. Find your billing webhook configuration
3. Use the **Test** button to send a test event
4. Check Render logs for:
   ```
   Billing webhook event received
   Webhook request received
   ```

### 3. Monitor Logs
```bash
# In Render dashboard, watch logs for:
- "Webhook request received"
- "Billing webhook event received"
- "Invoice status: PAID"
- "Updating instance plan"
```

## Webhook Event Flow

1. **User subscribes/changes plan in Wix**
2. **Wix sends webhook to**: `https://ultimate-optimizer-app.onrender.com/api/webhooks/billing`
3. **Express receives request** with `express.text()` middleware
4. **Wix SDK processes webhook**: `wixClient.webhooks.process(req.body)`
   - Verifies signature using `WIX_PUBLIC_KEY`
   - Routes to appropriate event handler
5. **Event handler executes**: `onPurchasedItemInvoiceStatusUpdated()`
   - Extracts instanceId and plan info
   - Updates database via `updateInstancePlan()`
6. **Response sent**: 200 OK

## Troubleshooting

### Still Getting 404
**Check:**
- Webhook URL in Wix matches exactly: `https://ultimate-optimizer-app.onrender.com/api/webhooks/billing`
- No trailing slash
- HTTPS (not HTTP)
- Render service is running

### Getting 500 Errors
**Check:**
- `WIX_PUBLIC_KEY` is set correctly in Render
- Public key includes BEGIN/END lines
- No extra spaces or line breaks in the key
- Check Render logs for specific error messages

### Webhook Signature Verification Fails
**Check:**
- Public key matches the one in Wix dashboard
- Public key format is correct (PEM format)
- No encoding issues (copy/paste directly)

### Plan Not Updating
**Check:**
- Event handler is logging the event data
- `instanceId` is present in event metadata
- Plan ID extraction is working
- Database connection is healthy
- `plans` table has all four plans seeded

## Event Structure

The Wix billing webhook sends events with this structure:

```typescript
{
  metadata: {
    instanceId: "string" // Your app instance ID
  },
  data: {
    status: "PAID" | "REFUNDED" | "VOIDED" | ...,
    // Additional invoice and purchase details
  }
}
```

## Plan Mapping

The system maps Wix plan names to internal plan IDs:

| Wix Plan Name | Internal Plan ID | Credits | Price |
|---------------|------------------|---------|-------|
| Free          | free             | 100     | $0    |
| Starter       | starter          | 1,000   | $9    |
| Pro           | pro              | 5,000   | $19   |
| Scale         | scale            | 25,000  | $49   |

The `normalizePlanId()` function handles various formats and extracts the plan name.

## Next Steps

1. ✅ Add `WIX_PUBLIC_KEY` to Render environment variables
2. ✅ Redeploy the service (automatic after env var change)
3. ✅ Test webhook from Wix dashboard
4. ✅ Verify logs show successful processing
5. ✅ Test complete upgrade flow end-to-end

## References

- [Wix Webhooks Documentation](https://dev.wix.com/docs/build-apps/developer-tools/webhooks)
- [Wix App Billing Documentation](https://dev.wix.com/docs/build-apps/developer-tools/app-billing)
- [Wix SDK Documentation](https://dev.wix.com/docs/sdk)
