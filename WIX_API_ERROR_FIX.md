# Wix API Error Fix

## Problem Identified

The worker IS running and processing jobs correctly, but **all items are failing when fetching products from Wix**:

```
[Worker] ❌ Failed to process item 17: Wix API error: unknown
[Worker] Fetching product af654225-662f-42e5-ac51-fbebc88f63ed from Wix...
```

The error message "unknown" comes from `response.statusText` being empty/unknown, which doesn't tell us what's actually wrong.

## Root Cause

The Wix API is returning an error response, but our error handling only showed `response.statusText` which was "unknown". We weren't logging:
- The actual HTTP status code
- The error response body
- The full URL being called

## Solution

Enhanced error handling in `WixStoresClient`:

### 1. Better Error Messages
- Include HTTP status code in error message
- Parse JSON error responses to extract `message` or `error` fields
- Include raw error text if it's short and not JSON

### 2. Detailed Logging
- Log the full URL being called
- Log the response status and status text
- Log the error body (first 500 chars) when requests fail

### 3. Request Logging
- Log every request: `[WixStoresClient] GET https://www.wixapis.com/stores/v1/products/{id}?fieldsets=FULL`
- Log every response: `[WixStoresClient] Response: 404 Not Found`

## Expected Next Deployment

After deploying these changes, the logs will show:

### Successful Request
```
[WixStoresClient] GET https://www.wixapis.com/stores/v1/products/abc123?fieldsets=FULL
[WixStoresClient] Response: 200 OK
[Worker] Got product: Product Name
```

### Failed Request (with details)
```
[WixStoresClient] GET https://www.wixapis.com/stores/v1/products/abc123?fieldsets=FULL
[WixStoresClient] Response: 404 Not Found
[WixStoresClient] GET /stores/v1/products/abc123?fieldsets=FULL failed: {
  status: 404,
  statusText: 'Not Found',
  body: '{"message":"Product not found"}'
}
[Worker] ❌ Failed to process item 17: Wix API error (404): Product not found
```

## Possible Wix API Issues

Based on the error, likely causes are:

1. **404 Not Found** - Product doesn't exist or was deleted
2. **401 Unauthorized** - Access token expired or invalid
3. **403 Forbidden** - App doesn't have permission to read products
4. **400 Bad Request** - Invalid product ID format or query parameters
5. **500 Internal Server Error** - Wix API issue

## Next Steps

1. **Deploy these changes**
2. **Create a new test job**
3. **Check logs for the actual error details**
4. **Fix the specific issue based on the error**

Common fixes:
- If 401: Token refresh logic might be failing
- If 403: Check app permissions in Wix dashboard
- If 404: Verify product IDs are correct
- If 400: Check the URL format and query parameters
