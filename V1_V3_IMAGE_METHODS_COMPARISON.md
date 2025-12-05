# V1 vs V3 Image Publishing Methods

## Quick Reference

| Aspect | V1 | V3 |
|--------|----|----|
| **Method** | `addProductMedia()` | `updateProduct()` |
| **Purpose** | Add media to product | Update product fields |
| **Media Property** | `url` | `url` |
| **Revision** | Not required | Required |
| **Return Type** | `void` | Updated product |
| **Structure** | Direct array | Nested in `itemsInfo.items` |

## Code Comparison

### V1 - Adding Media

```typescript
// V1: Use dedicated addProductMedia method
await this.client.products.addProductMedia(
  productId,
  [{
    url: optimizedImageUrl,
  }]
);

// Returns void, need to fetch product
const updatedProduct = await this.getProduct(productId);
```

### V3 - Adding Media

```typescript
// V3: Update product with entire media array
const result = await this.client.productsV3.updateProduct(
  productId,
  {
    revision: product.revision,  // Required!
    media: {
      itemsInfo: {
        items: [...existingMedia, newMediaItem],
      },
    },
  }
);

// Returns updated product directly
const updatedProduct = result.product;
```

## Why Different Methods?

### V1 Design
- **Specialized methods** for different operations
- `addProductMedia()` - Add images
- `updateProduct()` - Update product fields
- Simpler, more focused API

### V3 Design
- **Unified method** for all updates
- `updateProduct()` handles everything
- Requires revision for concurrency control
- More flexible but more complex

## Media Item Structure

### V1 Media Item
```typescript
{
  url: string;           // Image URL
  choice?: {             // Optional: link to variant
    choice: string;
    option: string;
  }
}
```

### V3 Media Item
```typescript
{
  url: string;           // Image URL
  altText?: string;      // Optional alt text
}
```

## Common Mistakes

### ❌ Using V3 method on V1
```typescript
// This fails on V1!
await this.client.products.updateProduct(productId, {
  media: { items: [...] }
});
// Error: "Expected an object"
```

### ✅ Correct V1 approach
```typescript
// This works on V1!
await this.client.products.addProductMedia(productId, [
  { url: imageUrl }
]);
```

## Implementation Pattern

```typescript
if (version === 'V3_CATALOG') {
  // V3: Update with revision
  await this.client.productsV3.updateProduct(productId, {
    revision: product.revision,
    media: { itemsInfo: { items: [...] } }
  });
} else {
  // V1: Add media directly
  await this.client.products.addProductMedia(productId, [
    { url: imageUrl }
  ]);
}
```

This pattern ensures compatibility with both catalog versions.
