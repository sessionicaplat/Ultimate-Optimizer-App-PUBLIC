# V1 Image Publish Issue Analysis

## Problem Statement

When publishing optimized images to V1 stores, the operation fails with:
```
"Expected an object"
```

Error occurs in `updateProductMedia()` method when trying to update product media.

## Root Cause

The `updateProductMedia()` method in `backend/src/wix/sdkClient.ts` is using **incorrect media structure for V1**.

### Current V1 Code (Lines ~239-250)

```typescript
// V1 API - simpler approach
const existingMedia = product.media?.items || [];

const result = await this.client.products.updateProduct(
  productId,
  {
    media: {
      items: [
        ...existingMedia,
        {
          image: optimizedImageUrl,  // ❌ WRONG!
          altText: altText || 'Optimized image',
        },
      ],
    },
  }
);
```

## The Problem

The V1 SDK `updateProduct()` expects the **entire product object**, not just the `media` field.

According to Wix V1 documentation, when updating a product, you must pass:
```typescript
{
  product: {
    // product fields here
  }
}
```

But for **adding media**, V1 has a **separate method**: `addProductMedia()`

## V1 Documentation Reference

From the documentation you provided:

### addProductMedia() - V1 Method

```javascript
import { products } from '@wix/stores';

export const addProductMedia = webMethod(Permissions.Anyone, (_id, media) => {
  return products.addProductMedia(_id, media);
});

// Usage:
const _id = ...; // product ID
const url = "wix:image://v1/1a11a1_..._1a~mv2.jpg/1a11a1_..._1a~mv2.jpg";

const media = [{
  url,  // ← V1 uses 'url' not 'image'
}];

addProductMedia(_id, media);
```

**Key Points:**
1. V1 has a dedicated `addProductMedia()` method
2. Media items use `url` property (not `image`)
3. Takes product ID and media array directly
4. No need for revision or full product object

## V3 vs V1 Media Update Comparison

### V3 Approach (Current - Works)
```typescript
// V3: Update entire media array with revision
await this.client.productsV3.updateProduct(
  productId,
  {
    revision: product.revision,  // Required
    media: {
      itemsInfo: {
        items: [...existingMedia, newMediaItem],
      },
    },
  }
);
```

### V1 Approach (Should Be)
```typescript
// V1: Use dedicated addProductMedia method
await this.client.products.addProductMedia(
  productId,
  [{
    url: optimizedImageUrl,  // V1 uses 'url'
  }]
);
```

## Media Item Structure Differences

### V3 Media Item
```typescript
{
  url: "https://...",
  altText: "Description"
}
```

### V1 Media Item
```typescript
{
  url: "wix:image://v1/...",  // Can be external URL too
  // Optional properties:
  choice: {
    choice: "Color",
    option: "Blue"
  }
}
```

## Solution

Update `updateProductMedia()` in `backend/src/wix/sdkClient.ts`:

### Option 1: Use addProductMedia() for V1 (Recommended)

```typescript
async updateProductMedia(
  productId: string,
  optimizedImageUrl: string,
  altText?: string
): Promise<any> {
  const version = await this.getCatalogVersion();

  try {
    console.log(`[updateProductMedia] Getting product ${productId}`);
    
    const product = await this.getProduct(productId);
    
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (version === 'V3_CATALOG') {
      // V3: Update entire media array with revision
      const existingMedia = product.media?.itemsInfo?.items || [];
      
      const newMediaItem = {
        url: optimizedImageUrl,
        altText: altText || 'Optimized image',
      };

      const updatedMedia = [...existingMedia, newMediaItem];

      const result = await this.client.productsV3.updateProduct(
        productId,
        {
          revision: product.revision,
          media: {
            itemsInfo: {
              items: updatedMedia,
            },
          },
        }
      );
      
      return result.product;
    } else {
      // V1: Use dedicated addProductMedia method
      console.log(`[updateProductMedia] V1 - Using addProductMedia()`);
      
      await this.client.products.addProductMedia(
        productId,
        [{
          url: optimizedImageUrl,
        }]
      );
      
      // Return updated product
      return await this.getProduct(productId);
    }
  } catch (error: any) {
    console.error('[updateProductMedia] Error:', error.message || error);
    throw error;
  }
}
```

## Why This Will Work

### V1 Method Signature
```typescript
addProductMedia(
  _id: string,           // Product ID
  media: Array<MediaDataForWrite>  // Media items to add
): Promise<void>
```

### MediaDataForWrite Structure
```typescript
{
  url: string;           // Image URL (external or wix:image://)
  choice?: {             // Optional: link to product variant
    choice: string;
    option: string;
  }
}
```

## Testing Checklist

After implementation:
- [ ] V1: Optimized image adds to product gallery
- [ ] V1: No "Expected an object" error
- [ ] V3: Images still add correctly (regression test)
- [ ] Logs show correct method being used

## Files to Modify

**Single file:** `backend/src/wix/sdkClient.ts`

**Method:** `updateProductMedia()` (lines ~215-260)

## Key Differences Summary

| Aspect | V1 | V3 |
|--------|----|----|
| Method | `addProductMedia()` | `updateProduct()` |
| Revision | Not needed | Required |
| Media Property | `url` | `url` |
| Structure | Direct array | Nested in `itemsInfo.items` |
| Return | `void` | Updated product |

## Error Explanation

The error "Expected an object" occurs because:
1. V1 `updateProduct()` expects `{ product: {...} }` structure
2. We're passing `{ media: {...} }` directly
3. Wix API rejects it as malformed

The fix is to use the correct V1 method: `addProductMedia()` instead of `updateProduct()`.
