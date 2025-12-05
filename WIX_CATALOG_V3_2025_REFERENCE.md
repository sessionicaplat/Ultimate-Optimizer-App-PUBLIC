# Wix Catalog V3 2025 API Reference

## Quick Reference for Product Updates

This document provides the correct structure for updating products using Wix's Catalog V3 API as of 2025.

---

## Product Update Structure

### ✅ Correct 2025 Format

```typescript
const updatePayload = {
  product: {
    id: "product-id",
    revision: "current-revision", // Required for V3
    
    // Product name/title
    name: "Product Name",
    
    // Product description (HTML string)
    plainDescription: "<p>Product description text</p>",
    
    // SEO metadata
    seoData: {
      tags: [
        // SEO Title
        {
          type: "title",
          children: "SEO Page Title"
        },
        // SEO Meta Description
        {
          type: "meta",
          props: {
            name: "description",
            content: "SEO meta description text"
          }
        }
      ]
    }
  }
};
```

### ❌ Old/Deprecated Format (Don't Use)

```typescript
// DON'T USE - This won't show in Editor or storefront
const oldFormat = {
  product: {
    // Old description format - DEPRECATED
    description: {
      plainText: "text",
      formattedText: "<p>text</p>"
    },
    
    // Old SEO format - DEPRECATED
    seoData: {
      title: "SEO Title",
      description: "SEO Description"
    }
  }
};
```

---

## Field Mapping Reference

| Attribute | 2025 V3 Structure | Shows In Editor | Shows On Site |
|-----------|-------------------|-----------------|---------------|
| **Product Name** | `name: "string"` | ✅ | ✅ |
| **Product Description** | `plainDescription: "<p>html</p>"` | ✅ | ✅ |
| **SEO Title** | `seoData.tags: [{ type: "title", children: "string" }]` | ✅ (SEO panel) | ✅ (`<title>`) |
| **SEO Description** | `seoData.tags: [{ type: "meta", props: { name: "description", content: "string" } }]` | ✅ (SEO panel) | ✅ (`<meta>`) |

---

## Implementation Examples

### 1. Update Product Name

```typescript
await wixClient.updateProduct(productId, {
  name: "New Product Name"
});
```

### 2. Update Product Description

```typescript
await wixClient.updateProduct(productId, {
  plainDescription: "<p>New product description with HTML formatting</p>"
});
```

### 3. Update SEO Title

```typescript
await wixClient.updateProduct(productId, {
  seoData: {
    tags: [
      {
        type: "title",
        children: "Buy Premium Product | Brand Name"
      }
    ]
  }
});
```

### 4. Update SEO Description

```typescript
await wixClient.updateProduct(productId, {
  seoData: {
    tags: [
      {
        type: "meta",
        props: {
          name: "description",
          content: "Shop our premium product with free shipping and 30-day returns."
        }
      }
    ]
  }
});
```

### 5. Update Multiple SEO Tags (Merge Pattern)

```typescript
// Fetch current product
const currentProduct = await wixClient.getProduct(productId);
const existingTags = currentProduct.seoData?.tags || [];

// Filter out tags you're updating
const filteredTags = existingTags.filter(tag => {
  // Keep all tags except the ones we're updating
  if (tag.type === 'title') return false;
  if (tag.type === 'meta' && tag.props?.name === 'description') return false;
  return true;
});

// Add new tags
const newTags = [
  { type: "title", children: "New SEO Title" },
  { type: "meta", props: { name: "description", content: "New SEO Description" } }
];

// Update with merged tags
await wixClient.updateProduct(productId, {
  seoData: {
    ...currentProduct.seoData,
    tags: [...filteredTags, ...newTags]
  }
});
```

---

## Important Notes

### Revision Field (Required for V3)
- Always fetch the current product first to get the latest `revision`
- Include the revision in your update payload
- Wix uses this for optimistic concurrency control

```typescript
const product = await wixClient.getProduct(productId);
await wixClient.updateProduct(productId, {
  revision: product.revision, // Required!
  name: "Updated Name"
});
```

### HTML in Descriptions
- `plainDescription` accepts HTML strings
- Wrap text in `<p>` tags for proper formatting
- You can use other HTML tags: `<strong>`, `<em>`, `<ul>`, `<li>`, etc.

### SEO Tags Array
- `seoData.tags` is an array that can contain multiple tags
- Common tag types:
  - `title` - Page title
  - `meta` - Meta tags (description, keywords, etc.)
  - `og` - Open Graph tags (for social sharing)
- Always merge with existing tags to avoid overwriting

---

## API Endpoints

### Query Products
```
POST https://www.wixapis.com/stores/v3/products/query
```

### Get Single Product
```
POST https://www.wixapis.com/stores/v3/products/query
Body: { query: { filter: { id: { $eq: "product-id" } } } }
```

### Update Product
```
PATCH https://www.wixapis.com/stores/v3/products/{productId}
```

---

## Common Errors & Solutions

### Error: "Expected an object"
**Cause:** Using old `description: { plainText, formattedText }` format  
**Solution:** Use `plainDescription: "<p>text</p>"` instead

### Error: "Revision mismatch"
**Cause:** Product was updated by another process  
**Solution:** Fetch product again to get latest revision

### SEO fields not showing in Editor
**Cause:** Using old `seoData: { title, description }` format  
**Solution:** Use `seoData.tags` array format

### Description not visible on storefront
**Cause:** Using `description` object instead of `plainDescription`  
**Solution:** Use `plainDescription` with HTML string

---

## Testing Checklist

After updating products, verify:

- [ ] Product name appears in Wix Editor
- [ ] Product description appears in Wix Editor
- [ ] Product description appears on live storefront
- [ ] SEO title appears in Editor's SEO panel
- [ ] SEO description appears in Editor's SEO panel
- [ ] View page source shows correct `<title>` tag
- [ ] View page source shows correct `<meta name="description">` tag

---

## Related Files

- Implementation: `backend/src/routes/publish.ts`
- Tests: `backend/src/routes/publish.test.ts`
- Wix Client: `backend/src/wix/storesClient.ts`

---

## Official Documentation

- [Wix Stores Catalog V3 API](https://dev.wix.com/docs/rest/api-reference/wix-stores/catalog/products)
- [Wix SEO Tags](https://dev.wix.com/docs/rest/api-reference/wix-seo/seo-tags)
- [Wix OAuth 2025](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/self-hosted-apps/oauth-2-0)

---

**Last Updated:** November 2025  
**Status:** ✅ Verified Working
