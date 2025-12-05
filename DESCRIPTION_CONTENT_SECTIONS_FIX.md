# Wix Catalog V3 Description and SEO Fields Fix

## Problem
Product descriptions were being updated successfully (200 OK responses) but were not appearing on the Wix storefront product pages. SEO fields were also not properly updating due to incorrect field paths.

## Root Cause
In Wix Catalog V3, there are multiple ways to set product data:

1. **Description field**: V3 supports both legacy `description` (HTML string) and new `content.sections` (structured model)
2. **SEO fields**: Must be nested under `seoData.tags.title` and `seoData.tags.description`

Different Wix sites may read from either the legacy or new fields depending on their configuration, so we need to set both for maximum compatibility.

## Solution Implemented

### 1. Updated Publish Route (`backend/src/routes/publish.ts`)

#### Description - Set Both Legacy and New Fields
```typescript
case 'description':
  return {
    description: `<p>${value}</p>`, // Legacy field (HTML string)
    content: {
      sections: [
        {
          type: 'TEXT',
          content: {
            plainText: value,
            formattedText: `<p>${value}</p>`, // New structured content model
          },
        },
      ],
    },
  };
```

#### SEO Fields - Use Correct Nested Path
```typescript
case 'seoTitle':
  return {
    seoData: {
      tags: {
        title: value,
      },
    },
  };

case 'seoDescription':
  return {
    seoData: {
      tags: {
        description: value,
      },
    },
  };
```

#### SEO Merging - Deep Merge for Tags Object
```typescript
// Deep merge SEO data (merge tags object)
updatePayload.seoData = {
  ...existingSeoData,
  tags: {
    ...existingTags,
    ...updatePayload.seoData.tags,
  },
};
```

### 2. Updated Worker Extraction (`backend/src/workers/jobWorker.ts`)
Modified the description extraction to read from content sections:

```typescript
case 'description':
  return product.content?.sections?.[0]?.content?.plainText || 
         product.content?.sections?.[0]?.content?.formattedText || 
         product.description || '';
```

### 3. Updated Product Fetching (`backend/src/wix/storesClient.ts`)
Added `content` field to the fields array when fetching products:

```typescript
fields: ['id', 'name', 'description', 'seoData', 'content', 'revision']
```

## Field Comparison

| Field | API Path | Rendered By | Visible After PATCH |
|-------|----------|-------------|---------------------|
| Product Name | `name` | ✅ Storefront | ✅ |
| Product Description (Legacy) | `description` | ✅ Some sites | ✅ |
| Product Description (New) | `content.sections[0].content.formattedText` | ✅ V3 sites | ✅ |
| SEO Title | `seoData.tags.title` | ✅ Meta tags | ✅ |
| SEO Description | `seoData.tags.description` | ✅ Meta tags | ✅ |

## Verification Steps

After deploying this fix:

1. Publish a description update through the app
2. Check the API response (should be 200 OK)
3. Call `GET /stores/v3/products/{id}?fields=content` to verify the structure
4. Wait 10-20 seconds for Wix cache to clear
5. Refresh the product page in the Wix Editor or Live View
6. The description should now be visible

## References

- Wix Catalog V3 uses a content-section system for product descriptions
- The storefront template reads from `product.content.sections[0].content.formattedText`
- This is different from the legacy `product.description` field which is no longer rendered
