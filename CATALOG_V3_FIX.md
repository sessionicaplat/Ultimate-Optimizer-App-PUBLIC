# Catalog V3 Fix - FINAL SOLUTION

## Problem Identified ✅

The error logs clearly showed:

```
[Worker] ❌ Failed to process item 21: Wix API error (428): 
Endpoint belongs to CATALOG_V1, but your site is using CATALOG_V3.
```

**Root Cause:** The Wix store is using Catalog V3, but our code was trying to:
- Fetch products using `/stores/v1/products/{id}` (V1 endpoint)
- Update products using PATCH `/stores/v1/products/{id}` (V1 endpoint)

Wix returns HTTP 428 (Precondition Required) when you try to use V1 endpoints on a V3 catalog.

## Solution Implemented ✅

Updated `WixStoresClient` to detect catalog version and use the correct API:

### 1. Get Product (Read)
- **V3**: Use `POST /stores/v3/products/query` with filter `{_id: {$eq: productId}}`
- **V1**: Use `GET /stores/v1/products/{id}?fieldsets=FULL`

### 2. Update Product (Write)
- **V3**: Use `POST /stores/v3/products/update` with product object including ID
- **V1**: Use `PATCH /stores/v1/products/{id}` with updates

### 3. Catalog Version Detection
Already implemented - detects V3 vs V1 on first API call and caches the result.

## Files Modified

- `backend/src/wix/storesClient.ts`
  - Updated `getProduct()` method
  - Updated `updateProduct()` method

## Expected Behavior After Deployment

### Worker Processing
```
[Worker] Claimed 4 item(s) for processing
[Worker] Processing item X (product: abc123, attribute: name)
[Worker] Fetching product abc123 from Wix...
[WixStoresClient] POST https://www.wixapis.com/stores/v3/products/query
[WixStoresClient] Response: 200 OK
[Worker] Got product: Ceramic Flower Vase
[Worker] Extracting attribute 'name' from product...
[Worker] Before value length: 20 chars
[Worker] Calling OpenAI to optimize name...
[Worker] Got optimized value, length: 25 chars
[Worker] Saving results for item X...
[Worker] ✅ Successfully processed item X
```

### Publishing
```
[WixStoresClient] POST https://www.wixapis.com/stores/v3/products/update
[WixStoresClient] Response: 200 OK
Published item X: product abc123, attribute name
```

## Testing Steps

1. **Deploy these changes** to Render
2. **Create a new test job** with 1 product and 1-2 attributes
3. **Monitor logs** for:
   - ✅ `[Worker] Got product: [Product Name]`
   - ✅ `[Worker] Calling OpenAI to optimize...`
   - ✅ `[Worker] ✅ Successfully processed item X`
   - ✅ Job status changes to DONE with optimized content
4. **Test publishing** the optimized content back to Wix
5. **Verify** the product is updated in Wix store

## API References

### Wix Catalog V3 Documentation
- Query Products: https://dev.wix.com/docs/rest/api-reference/wix-stores/catalog/products/query-products
- Update Product: https://dev.wix.com/docs/rest/api-reference/wix-stores/catalog/products/update-product
- Catalog Versioning: https://dev.wix.com/docs/rest/business-solutions/stores/catalog-versioning/introduction

### V3 Query Product Example
```json
POST /stores/v3/products/query
{
  "query": {
    "filter": {
      "_id": {
        "$eq": "product-id-here"
      }
    }
  }
}
```

### V3 Update Product Example
```json
POST /stores/v3/products/update
{
  "product": {
    "id": "product-id-here",
    "name": "Updated Product Name",
    "description": "Updated description"
  }
}
```

## Next Steps

This should be the **final fix** needed for the worker to process jobs successfully. The complete flow will now work:

1. ✅ Job created with product IDs and attributes
2. ✅ Worker claims pending items
3. ✅ Fetches product data from Wix (using V3 API)
4. ✅ Extracts attribute values (name, description, seoTitle, seoDescription)
5. ✅ Sends to OpenAI for optimization
6. ✅ Saves optimized content to database
7. ✅ User reviews and publishes changes
8. ✅ Updates product in Wix (using V3 API)

Deploy and test!
