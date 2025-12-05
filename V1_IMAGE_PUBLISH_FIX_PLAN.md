# V1 Image Publish Fix - Implementation Plan

## The Issue

Publishing optimized images fails on V1 stores with error:
```
"Expected an object"
```

## Root Cause

Using wrong method for V1:
- ❌ Current: `updateProduct()` with media object
- ✅ Should use: `addProductMedia()` method

## The Fix

Update `updateProductMedia()` method in `backend/src/wix/sdkClient.ts` to use V1's dedicated `addProductMedia()` method.

## Code Changes

### Location
File: `backend/src/wix/sdkClient.ts`
Method: `updateProductMedia()` (around line 215-260)

### Change the V1 Branch

**Find this code (V1 section):**
```typescript
} else {
  // V1 API - simpler approach
  const existingMedia = product.media?.items || [];
  
  console.log(`[updateProductMedia] V1 API - existing media:`, JSON.stringify(existingMedia, null, 2));
  
  const result = await this.client.products.updateProduct(
    productId,
    {
      media: {
        items: [
          ...existingMedia,
          {
            image: optimizedImageUrl,
            altText: altText || 'Optimized image',
          },
        ],
      },
    }
  );
  
  console.log(`[updateProductMedia] V1 API - update successful`);
  return result.product;
}
```

**Replace with:**
```typescript
} else {
  // V1 API - use dedicated addProductMedia method
  console.log(`[updateProductMedia] V1 API - using addProductMedia()`);
  
  // V1 uses addProductMedia() method, not updateProduct()
  await this.client.products.addProductMedia(
    productId,
    [{
      url: optimizedImageUrl,
    }]
  );
  
  console.log(`[updateProductMedia] V1 API - media added successfully`);
  
  // Fetch and return updated product
  return await this.getProduct(productId);
}
```

## Key Differences

### V1 Method
- **Method**: `addProductMedia(productId, mediaArray)`
- **Media property**: `url` (not `image`)
- **Returns**: `void` (need to fetch product after)
- **No revision needed**

### V3 Method (Keep as is)
- **Method**: `updateProduct(productId, updates)`
- **Requires**: `revision` for optimistic concurrency
- **Returns**: Updated product directly

## Why This Works

V1 has a **dedicated method** for adding media:
```typescript
products.addProductMedia(_id, media)
```

This is the correct way to add images in V1, as documented in Wix V1 API.

## Testing

After deployment:
1. **V1 Store**: Optimize image → Publish → Should succeed
2. **V3 Store**: Verify still works (no changes to V3 code)
3. **Check logs**: Should see "V1 API - using addProductMedia()"

## Expected Log Output

**Before (Error):**
```
[updateProductMedia] V1 API - existing media: [...]
Error: Expected an object
```

**After (Success):**
```
[updateProductMedia] V1 API - using addProductMedia()
[updateProductMedia] V1 API - media added successfully
```

## Files to Modify

- ✅ `backend/src/wix/sdkClient.ts` - Update `updateProductMedia()` method

## Estimated Time

- Code change: 5 minutes
- Testing: 5 minutes
- Total: 10 minutes
