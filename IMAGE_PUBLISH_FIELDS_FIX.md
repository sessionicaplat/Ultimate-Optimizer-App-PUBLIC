# Image Publish - Fields Parameter Fix

## Issue
Product was being fetched but returned without media data, causing "Product not found" error even though the product exists.

## Root Cause
The Wix Stores V3 API requires explicit `fields` parameter to retrieve media information. Without it, the product is returned but without the `media` field populated.

## Fix Applied

### Updated `getProduct()` Method
Added `fields` parameter to V3 API call:

```typescript
const result = await this.client.productsV3.getProduct(productId, {
  fields: ['MEDIA_ITEMS_INFO']
});
```

This ensures the product's media information is included in the response.

## Why This Matters

### Before Fix
- Product fetched without media data
- `product.media` was undefined
- Couldn't append new optimized image
- Error: "Product not found"

### After Fix
- Product fetched WITH media data
- `product.media.itemsInfo.items` contains existing images
- Can append optimized image to array
- Publish works correctly

## Wix V3 API Fields

According to Wix documentation, these fields can be requested:
- `MEDIA_ITEMS_INFO` - Product media/images
- `DESCRIPTION` - Rich content description
- `INFO_SECTION` - Additional info sections
- `PLAIN_DESCRIPTION` - HTML description
- `CURRENCY` - Price currency
- `MERCHANT_DATA` - Cost and inventory (requires admin scope)

We only need `MEDIA_ITEMS_INFO` for publishing images.

## Testing

After deploying, the publish flow should:
1. Fetch product with media data
2. Log existing media items
3. Append optimized image
4. Update product successfully

## Deploy

```bash
cd backend
npm run build
git push
```

Then try publishing again - it should work!
