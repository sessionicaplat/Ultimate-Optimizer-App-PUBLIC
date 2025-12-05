# Wix 400 Bad Request "Expected an object" Fix

## Problem
Publishing description updates resulted in:
```
400 Bad Request: Expected an object
```

## Root Causes

### 1. Description Field Structure
We were sending `description` as a string:
```typescript
{
  description: "<p>value</p>"  // ❌ Wrong - expects object
}
```

But Wix Catalog V3 expects an object:
```typescript
{
  description: {
    plainText: "value",
    formattedText: "<p>value</p>"
  }
}
```

### 2. SEO Data Structure
The `seoData` structure was incorrectly nested with `tags`

## Solution

### 1. Fixed Description Field Structure (backend/src/routes/publish.ts)

**Before (Incorrect):**
```typescript
case 'description':
  return {
    description: `<p>${value}</p>`,  // ❌ String not allowed
  };
```

**After (Correct):**
```typescript
case 'description':
  return {
    description: {
      plainText: value,
      formattedText: `<p>${value}</p>`,
    },
    content: {
      sections: [
        {
          type: 'TEXT',
          content: {
            plainText: value,
            formattedText: `<p>${value}</p>`,
          },
        },
      ],
    },
  };
```

### 2. Fixed SEO Field Structure (backend/src/routes/publish.ts)

**Before (Incorrect):**
```typescript
case 'seoTitle':
  return {
    seoData: {
      tags: {
        title: value,
      },
    },
  };
```

**After (Correct):**
```typescript
case 'seoTitle':
  return {
    seoData: {
      title: value,
    },
  };

case 'seoDescription':
  return {
    seoData: {
      description: value,
    },
  };
```

### Fixed SEO Merging Logic

**Before (Incorrect - Deep merge with tags):**
```typescript
updatePayload.seoData = {
  ...existingSeoData,
  tags: {
    ...existingTags,
    ...updatePayload.seoData.tags,
  },
};
```

**After (Correct - Shallow merge):**
```typescript
updatePayload.seoData = {
  ...existingSeoData,
  ...updatePayload.seoData,
};
```

## Correct Wix Catalog V3 Structure

### Product Update Payload
```typescript
{
  product: {
    id: "product-uuid",
    revision: "revision-string",
    name: "Product Name",
    description: "<p>HTML description</p>",
    seoData: {
      title: "SEO Title",
      description: "SEO Description"
    },
    content: {
      sections: [
        {
          type: "TEXT",
          content: {
            plainText: "Plain text description",
            formattedText: "<p>HTML description</p>"
          }
        }
      ]
    }
  }
}
```

## Testing

After this fix:
- ✅ Product name updates work
- ✅ Product description updates work (both legacy and content.sections)
- ✅ SEO title updates work
- ✅ SEO description updates work
- ✅ No more 400 Bad Request errors

## References

- Wix Stores Catalog V3 API: https://dev.wix.com/docs/rest/api-reference/wix-stores/catalog/products/update-product
- SEO Data is a flat object with `title` and `description` fields
- No `tags` nesting in `seoData`


## Important Note About SEO Fields

### SEO in Catalog vs SEO in Editor

Wix maintains **two separate SEO layers**:

1. **Catalog SEO** (`product.seoData`) - Updated via Stores Catalog API
   - Stored in the product catalog
   - Used for internal data and API responses
   - ❌ **NOT visible in Wix Editor SEO panel**

2. **Page SEO** (Editor "SEO Basics") - Managed by Wix SEO Manager
   - Controlled by separate SEO Manager API
   - ✅ **Visible in Wix Editor**
   - ✅ **Used for actual meta tags on storefront**

### Why SEO Title/Description Don't Show in Editor

When you update `seoData` via the Catalog API, it updates the catalog record but **not** the page-level SEO that appears in:
- Wix Editor → SEO Basics panel
- Actual `<meta>` tags on the storefront

### To Make SEO Visible in Editor (Future Enhancement)

You would need to use the **Wix SEO Manager API**:

```typescript
// Option A: REST API
PATCH https://www.wixapis.com/seo/v1/pages
{
  "page": {
    "url": "/product/{product-slug}",
    "metaTags": {
      "title": "SEO Title",
      "description": "Meta Description"
    }
  }
}

// Option B: Wix SDK (if using site tokens)
import { seo } from '@wix/seo';
await seo.updateSeoTags({
  pageUrl: `/product/${product.slug}`,
  metaTitle: optimizedSeoTitle,
  metaDescription: optimizedSeoDescription,
});
```

### Current Behavior

- ✅ Product name: Updates and shows everywhere
- ✅ Product description: Updates and shows in catalog + storefront
- ⚠️ SEO title/description: Updates in catalog but **not in Editor or meta tags**
  - Stored for future use
  - Would need SEO Manager API integration to show in Editor

