# Catalog V3 2025 Description & SEO Fix

## Problem
Product descriptions and SEO descriptions were not appearing in the Wix Editor or storefront, even though the API calls were succeeding (200 OK). Only product name and SEO title were being published successfully.

## Root Cause
Wix's Catalog V3 API changed its field structure in 2024-2025:

### Old Structure (deprecated)
```javascript
{
  description: {
    plainText: "text",
    formattedText: "<p>text</p>"
  },
  seoData: {
    title: "SEO Title",
    description: "SEO Description"
  }
}
```

### New 2025 Structure (required)
```javascript
{
  plainDescription: "<p>text</p>",  // HTML string
  seoData: {
    tags: [
      {
        type: "title",
        children: "SEO Title"
      },
      {
        type: "meta",
        props: {
          name: "description",
          content: "SEO Description"
        }
      }
    ]
  }
}
```

## Solution Applied

### 1. Updated `buildProductUpdate()` in `backend/src/routes/publish.ts`

**Description field:**
- Changed from `description: { plainText, formattedText }` object
- To `plainDescription: "<p>text</p>"` HTML string

**SEO Title field:**
- Changed from `seoData: { title: "value" }`
- To `seoData: { tags: [{ type: "title", children: "value" }] }`

**SEO Description field:**
- Changed from `seoData: { description: "value" }`
- To `seoData: { tags: [{ type: "meta", props: { name: "description", content: "value" } }] }`

### 2. Updated SEO Tag Merging Logic

When updating SEO fields, we now:
1. Fetch existing `seoData.tags` array
2. Filter out the specific tag being updated (title or meta description)
3. Append the new tag to the filtered array
4. This prevents overwriting other SEO tags

### 3. Updated Tests

Updated `backend/src/routes/publish.test.ts` to reflect the new 2025 V3 structure.

## Expected Results

After deploying this fix:

✅ **Product Name** - Shows in Wix Editor and storefront  
✅ **Product Description** - Shows in Wix Editor and storefront  
✅ **SEO Title** - Shows in Wix Editor SEO panel and `<title>` tag  
✅ **SEO Description** - Shows in Wix Editor SEO panel and `<meta name="description">` tag

## Deployment Steps

1. Commit the changes to `backend/src/routes/publish.ts` and `backend/src/routes/publish.test.ts`
2. Push to your repository
3. Render will automatically deploy the updated backend
4. Test by publishing a product with all four attributes
5. Verify in Wix Editor that all fields appear correctly

## Verification

After deployment, check:
1. Open a product in Wix Editor → Description should be visible
2. Click "SEO Basics" in Wix Editor → Title and Description should be visible
3. View product on live site → All content should render
4. View page source → `<title>` and `<meta name="description">` should contain optimized values

## References

- Wix Stores Catalog V3 API: https://dev.wix.com/docs/rest/api-reference/wix-stores/catalog/products
- SEO Tags Structure: https://dev.wix.com/docs/rest/api-reference/wix-seo/seo-tags
