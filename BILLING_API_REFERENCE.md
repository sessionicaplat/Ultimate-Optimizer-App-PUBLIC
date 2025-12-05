# Billing API Reference

## Quick Reference for Wix Billing Integration

### Backend Endpoints

#### 1. GET `/api/billing/upgrade-url`

**Purpose**: Generate Wix checkout URL for plan upgrade

**Query Parameters**:
- `planId` (required): Internal plan ID (`free`, `starter`, `pro`, `scale`)

**Request Example**:
```bash
curl -X GET \
  'https://ultimate-optimizer-app.onrender.com/api/billing/upgrade-url?planId=starter' \
  -H 'X-Wix-Instance: <instance-token>'
```

**Response**:
```json
{
  "url": "https://www.wix.com/apps/upgrade/order-checkout?token=JWS.eyJ...",
  "planId": "starter",
  "productId": "e8f429d4-0a6a-468f-8044-87f519a53202"
}
```

**Internal Flow**:
1. Validates plan ID
2. Maps to Wix product ID via environment variables
3. Gets OAuth2 elevated token
4. Calls `WixSDKClient.getCheckoutUrl(productId)`
5. Returns real Wix checkout URL

**Wix API Called**:
```
POST https://www.wixapis.com/apps/v1/checkout
Body: {
  "productId": "e8f429d4-0a6a-468f-8044-87f519a53202",
  "billingCycle": "MONTHLY",
  "successUrl": "https://www.wix.com/my-account/app/<appId>",
  "testCheckout": true/false
}
```

---

#### 2. GET `/api/billing/subscription`

**Purpose**: Fetch current subscription from Wix

**Request Example**:
```bash
curl -X GET \
  'https://ultimate-optimizer-app.onrender.com/api/billing/subscription' \
  -H 'X-Wix-Instance: <instance-token>'
```

**Response (Active Subscription)**:
```json
{
  "planId": "starter",
  "planName": "Starter",
  "status": "active",
  "billingCycle": "MONTHLY",
  "price": 9,
  "currency": "USD",
  "dateCreated": "2025-10-31T12:00:00Z"
}
```

**Response (Free Plan / No Subscription)**:
```json
{
  "planId": "free",
  "planName": "Free",
  "status": "active",
  "billingCycle": null,
  "price": 0,
  "currency": "USD"
}
```

**Internal Flow**:
1. Gets OAuth2 elevated token
2. Calls `WixSDKClient.getPurchaseHistory()`
3. Returns most recent purchase
4. Falls back to free plan if no purchases

**Wix API Called**:
```
GET https://www.wixapis.com/apps/v1/checkout/history
```

---

#### 3. POST `/api/webhooks/billing`

**Purpose**: Receive billing events from Wix

**Already Implemented**: See `WIX_BILLING_WEBHOOK_FIX.md`

**Events Handled**:
- `InvoiceStatusUpdated` with status `PAID` → Upgrade plan
- `InvoiceStatusUpdated` with status `REFUNDED/VOIDED` → Downgrade to free

---

### Wix SDK Methods Used

#### `billing.getUrl(productId, options)`

**Purpose**: Generate checkout URL

**Parameters**:
```typescript
productId: string  // Wix product ID (UUID)
options?: {
  billingCycle?: 'MONTHLY' | 'YEARLY'
  successUrl?: string
  testCheckout?: boolean
  countryCode?: string
  languageCode?: string
  couponCode?: string
}
```

**Returns**:
```typescript
{
  checkoutUrl: string  // Valid for 48 hours
  token: string        // JWT token for checkout
}
```

**Example**:
```typescript
const result = await wixClient.billing.getUrl(
  'e8f429d4-0a6a-468f-8044-87f519a53202',
  {
    billingCycle: 'MONTHLY',
    successUrl: 'https://www.wix.com/my-account/app/12345',
    testCheckout: true
  }
);
```

---

#### `billing.getPurchaseHistory()`

**Purpose**: Get site's purchase history

**Parameters**: None (uses context from access token)

**Returns**:
```typescript
{
  purchases: Array<{
    productId: string
    price: string
    currency: string
    billingCycle: 'MONTHLY' | 'YEARLY'
    dateCreated: string
  }>
}
```

**Example**:
```typescript
const result = await wixClient.billing.getPurchaseHistory();
const currentPurchase = result.purchases[0]; // Most recent
```

---

### OAuth2 Token Flow

#### `getElevatedToken()`

**Purpose**: Get app-level access token for API calls

**Flow**:
```
POST https://www.wixapis.com/oauth2/token
Headers:
  Authorization: Basic base64(appId:appSecret)
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=client_credentials

Response:
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Implementation**:
```typescript
const response = await axios.post(
  'https://www.wixapis.com/oauth2/token',
  new URLSearchParams({ grant_type: 'client_credentials' }),
  {
    auth: {
      username: WIX_APP_ID,
      password: WIX_APP_SECRET
    }
  }
);
return response.data.access_token;
```

---

### Environment Variables

#### Required (Already Set)
```bash
WIX_APP_ID=<your-app-id>
WIX_APP_SECRET=<your-app-secret>
WIX_PUBLIC_KEY=<your-public-key>
```

#### New (Need to Add)
```bash
# Map internal plan IDs to Wix product IDs
WIX_PRODUCT_ID_FREE=<uuid>      # Optional
WIX_PRODUCT_ID_STARTER=<uuid>   # Required
WIX_PRODUCT_ID_PRO=<uuid>       # Required
WIX_PRODUCT_ID_SCALE=<uuid>     # Required
```

**Default Behavior**: If not set, uses plan ID as product ID
```typescript
const productId = process.env.WIX_PRODUCT_ID_STARTER || 'starter';
```

---

### Plan ID Mapping

#### Internal → Wix Product ID

```typescript
const planToProductId: Record<string, string> = {
  free: process.env.WIX_PRODUCT_ID_FREE || 'free',
  starter: process.env.WIX_PRODUCT_ID_STARTER || 'starter',
  pro: process.env.WIX_PRODUCT_ID_PRO || 'pro',
  scale: process.env.WIX_PRODUCT_ID_SCALE || 'scale',
};
```

#### Wix Product ID → Internal

```typescript
function normalizePlanId(productId: string): string {
  const normalized = productId.toLowerCase();
  
  // Check if contains plan name
  if (normalized.includes('starter')) return 'starter';
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('scale')) return 'scale';
  
  return 'free'; // Default
}
```

---

### Frontend API Calls

#### Fetch Account Data

```typescript
// Get credits from database
const accountData = await fetchWithAuth('/api/me');

// Get subscription from Wix
const subscriptionData = await fetchWithAuth('/api/billing/subscription');

// Merge data
setAccount({
  planId: subscriptionData.planId,
  creditsTotal: accountData.creditsTotal,
  creditsUsed: accountData.creditsUsedMonth,
  resetDate: accountData.creditsResetOn,
});
```

#### Upgrade Plan

```typescript
const handleUpgrade = async (planId: string) => {
  const response = await fetchWithAuth(
    `/api/billing/upgrade-url?planId=${planId}`
  );
  
  if (response.url) {
    // Redirect to Wix checkout
    window.top!.location.href = response.url;
  }
};
```

---

### Error Handling

#### Backend Errors

```typescript
try {
  const result = await wixClient.billing.getUrl(productId);
  return result;
} catch (error: any) {
  console.error('Billing API error:', error);
  
  // Return user-friendly error
  res.status(500).json({
    error: 'Failed to generate upgrade URL',
    details: error.message
  });
}
```

#### Frontend Errors

```typescript
try {
  const data = await fetchWithAuth('/api/billing/subscription');
  setAccount(data);
} catch (err) {
  console.error('Failed to fetch subscription:', err);
  
  // Fallback to database plan
  const accountData = await fetchWithAuth('/api/me');
  setAccount(accountData);
}
```

---

### Testing Commands

#### Test Token Generation
```bash
# Should succeed if credentials are correct
curl -X POST https://www.wixapis.com/oauth2/token \
  -u "APP_ID:APP_SECRET" \
  -d "grant_type=client_credentials"
```

#### Test Upgrade URL
```bash
curl -X GET \
  'http://localhost:3001/api/billing/upgrade-url?planId=starter' \
  -H 'X-Wix-Instance: <test-token>'
```

#### Test Subscription Fetch
```bash
curl -X GET \
  'http://localhost:3001/api/billing/subscription' \
  -H 'X-Wix-Instance: <test-token>'
```

---

### Common Response Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | - |
| 400 | Invalid plan ID | Check plan ID parameter |
| 401 | Unauthorized | Check instance token |
| 403 | Forbidden | Check app permissions in Wix |
| 404 | Not found | Check endpoint URL |
| 500 | Server error | Check logs for details |

---

### Logs to Monitor

#### Success Flow
```
[TokenHelper] Requesting elevated token
[TokenHelper] ✅ Elevated token obtained
Generating checkout URL: { planId: 'starter', productId: '...' }
✅ Checkout URL generated: { url: '...' }
```

#### Error Flow
```
[TokenHelper] ❌ Failed to get elevated token: ...
Error generating upgrade URL: ...
```

---

### Quick Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| "Failed to get elevated token" | WIX_APP_ID, WIX_APP_SECRET | Verify credentials in Render |
| "Invalid plan ID" | Query parameter | Use: free, starter, pro, scale |
| "Failed to generate upgrade URL" | External pricing page | Enable in Wix dashboard |
| Checkout URL 404 | Product IDs | Verify UUIDs match Wix |
| Plan not updating | Webhook | Check webhook logs |

---

## Summary

The billing integration uses:
- **OAuth2** for authentication
- **Wix SDK** for API calls
- **Environment variables** for product ID mapping
- **Webhooks** for real-time updates
- **Database** for credits tracking

All endpoints are production-ready and follow Wix best practices.
