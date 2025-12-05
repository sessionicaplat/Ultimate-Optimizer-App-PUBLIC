# V1 API Limit Error Analysis

## The Error

```
Wix API error (400): query is invalid:
`-- paging is invalid:
    `-- limit got 200, expected 100 or less
```

**Request:** `GET /api/products?limit=200`

## Root Cause

The frontend is requesting 200 products, but **V1 API has a maximum limit of 100** products per request.

### From the Logs

```
[WixStoresClient] POST https://www.wixapis.com/stores/v1/products/query
[WixStoresClient] Response: 400 Bad Request
body: '{"message":"query is invalid:\\n`-- paging is invalid:\\n    `-- limit got 200, expected 100 or less"}'
```

## V1 vs V3 Limit Differences

| API Version | Max Limit | Current Code |
|-------------|-----------|--------------|
| V1 | 100 | Uses 200 (fails!) |
| V3 | 200 | Uses 200 (works) |

## Where the Issue Occurs

### Frontend Request
```
GET /api/products?limit=200
```

### Backend Code (storesClient.ts)
```typescript
async getProducts(options?: {
  cursor?: string;
  query?: string;
  limit?: number;
  includeFullMedia?: boolean;
}): Promise<{
  products: any[];
  nextCursor?: string;
}> {
  const version = await this.getCatalogVersion();
  const limit = options?.limit || 50;  // ← Uses whatever frontend sends
  
  const requestBody: any = {
    query: {
      paging: {
        limit,  // ← Passes 200 to V1 API (fails!)
      },
    },
  };
  
  // ...
}
```

## The Problem

The code doesn't enforce V1's 100-item limit. When the frontend requests 200 products:
1. ✅ V3 API accepts it (max 200)
2. ❌ V1 API rejects it (max 100)

## Solution

Add version-specific limit validation in `getProducts()` method:

```typescript
async getProducts(options?: {
  cursor?: string;
  query?: string;
  limit?: number;
  includeFullMedia?: boolean;
}): Promise<{
  products: any[];
  nextCursor?: string;
}> {
  const version = await this.getCatalogVersion();
  
  // V1 has a max limit of 100, V3 has max of 200
  const maxLimit = version === 'V1' ? 100 : 200;
  const requestedLimit = options?.limit || 50;
  const limit = Math.min(requestedLimit, maxLimit);
  
  // Log if we're capping the limit
  if (requestedLimit > maxLimit) {
    console.log(`[WixStoresClient] Capping limit from ${requestedLimit} to ${maxLimit} for ${version}`);
  }
  
  const requestBody: any = {
    query: {
      paging: {
        limit,
      },
    },
  };
  
  // ... rest of the code
}
```

## Why This Happens "After Some Time"

The error appears "after some time" because:
1. User initially loads products with default limit (50) → Works
2. User scrolls or requests more products → Frontend requests 200
3. V1 API rejects the 200 limit → Error appears

## Frontend Consideration

The frontend might also need updating to:
1. Request products in batches of 100 for V1
2. Use pagination/cursor to load more
3. Or detect catalog version and adjust limit

But the **backend should enforce the limit** as a safety measure.

## Implementation Location

**File:** `backend/src/wix/storesClient.ts`
**Method:** `getProducts()` (around line 100-125)

**Change:**
```typescript
// Before
const limit = options?.limit || 50;

// After
const version = await this.getCatalogVersion();
const maxLimit = version === 'V1' ? 100 : 200;
const requestedLimit = options?.limit || 50;
const limit = Math.min(requestedLimit, maxLimit);
```

## Testing

After fix:
1. Request 200 products on V1 store
2. Should automatically cap to 100
3. No 400 error
4. Log shows: "Capping limit from 200 to 100 for V1"

## Additional Consideration

If the frontend needs all 200 products on V1, it should:
1. Make first request with limit=100
2. Use returned cursor for second request
3. Combine results

But this is a frontend enhancement - the backend fix prevents the error.
