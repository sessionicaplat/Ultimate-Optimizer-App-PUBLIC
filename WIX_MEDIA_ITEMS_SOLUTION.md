# Wix Media Items Solution - Two-Step Approach

## The Problem
The Wix Stores V3 `/stores/v3/products/query` endpoint **does NOT return `media.items`** array, even when explicitly requested in the `fields` parameter.

### Evidence from Logs:
```
[WixStoresClient] V3 Query with fields: {"fieldsCount":18,"hasMediaItems":true}
[WixStoresClient] Response: 200 OK
"mediaItemsCount": 0  ← Always zero!
"media": {
  "main": { ... }
  // No "items" array
}
```

## The Root Cause
According to Wix 2025 documentation:
- `/stores/v3/products/query` - Returns **basic product info only**, `media.main` included by default
- `/stores-reader/v1/products/{id}` - Returns **full product details** including `media.items[]` array

The query endpoint is optimized for listing products quickly, while the reader endpoint provides complete product data.

## The Solution: Two-Step Fetch

### Step 1: Query Products (List)
Use `/stores/v3/products/query` to get product IDs and basic info

### Step 2: Fetch Full Media (Per Product)
Use `/stores-reader/v1/products/{id}` to get complete media gallery for each product

## Implementation

### `backend/src/wix/storesClient.ts`

Added new method and updated `getProducts()`:

```typescript
async getProducts(options?: {
  cursor?: string;
  query?: string;
  limit?: number;
  includeFullMedia?: boolean;  // ← New option
}): Promise<{
  products: any[];
  nextCursor?: string;
}> {
  // ... query products ...
  
  // If full media requested, fetch detailed info for each product
  if (options?.includeFullMedia && products.length > 0) {
    products = await Promise.all(
      products.map(async (product) => {
        return await this.getProductWithMedia(product.id);
      })
    );
  }
  
  return { products, nextCursor };
}

private async getProductWithMedia(productId: string): Promise<any> {
  const response = await this.request(
    `/stores-reader/v1/products/${productId}`,
    null,
    'GET'
  );
  return response.product;
}
```

### `backend/src/routes/products.ts`

Updated to request full media:

```typescript
const result = await client.getProducts({
  cursor,
  query,
  limit,
  includeFullMedia: true  // ← Enable full media fetch
});
```

## Expected Results After Deploy

### Backend Logs:
```
[WixStoresClient] POST https://www.wixapis.com/stores/v3/products/query
[WixStoresClient] Response: 200 OK
[WixStoresClient] Fetching full media for 12 products...
[WixStoresClient] GET https://www.wixapis.com/stores-reader/v1/products/af654225-...
[WixStoresClient] Response: 200 OK
[Products API] Sample product structure: {
  "id": "af654225-662f-42e5-ac51-fbebc88f63ed",
  "name": "Ceramic Flower Vase",
  "media": {
    "mainMedia": { ... },
    "items": [  ← Now populated!
      { "mediaType": "image", "image": { "url": "..." } },
      { "mediaType": "image", "image": { "url": "..." } },
      { "mediaType": "image", "image": { "url": "..." } }
    ]
  }
}
[Products API] Product "Ceramic Flower Vase" has 3 media items
```

## Performance Considerations

### Pros:
- ✅ Gets complete media data for all products
- ✅ Works reliably with Wix 2025 API
- ✅ Uses official documented endpoints

### Cons:
- ⚠️ Makes N+1 API calls (1 query + N product fetches)
- ⚠️ Slower for large product lists

### Optimization Options:

1. **Lazy Loading**: Only fetch full media when user selects a product
2. **Caching**: Cache product media data to reduce API calls
3. **Pagination**: Limit initial product count (already at 50)
4. **Parallel Requests**: Already using `Promise.all()` for concurrent fetches

## Alternative: Lazy Load on Selection

For better performance, we could fetch full media only when a product is selected in the Image Optimization page:

```typescript
// In ImageOptimization.tsx
const handleProductSelect = async (product: Product) => {
  setLoading(true);
  const fullProduct = await fetchWithAuth(`/api/products/${product.id}`);
  setSelectedProduct(fullProduct);
  setLoading(false);
};
```

This would require a new endpoint `/api/products/:id` but would be much faster for the initial product list load.

## Deploy Steps

1. Commit changes:
   ```bash
   git add backend/src/wix/storesClient.ts backend/src/routes/products.ts
   git commit -m "Fix: Use stores-reader endpoint to fetch full product media gallery"
   git push
   ```

2. Wait for Render deployment

3. Test in Wix dashboard - should now see all product images

## Files Modified
- `backend/src/wix/storesClient.ts` - Added `getProductWithMedia()` method
- `backend/src/routes/products.ts` - Enabled `includeFullMedia` option
