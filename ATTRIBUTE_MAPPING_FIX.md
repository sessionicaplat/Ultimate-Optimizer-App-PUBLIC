# Product Attribute Mapping Fix

## Problem
The Product Optimizer page was using generic attribute names (`title`, `description`, `seo`, `metadata`) that didn't map to actual Wix product fields. This meant:
- No real product data was being sent to ChatGPT
- Jobs were being created but couldn't fetch or update actual product information
- The worker would fail when trying to extract attribute values

## Solution
Updated the entire flow to use actual Wix product field names:

### Attribute Mapping (Old → New)
- `title` → `name` (Product name/title)
- `description` → `description` (Product description - unchanged)
- `seo` → `seoTitle` (SEO page title from seoData.tags.title)
- `metadata` → `seoDescription` (SEO meta description from seoData.tags.description)

## Files Changed

### Frontend
**frontend/src/pages/ProductOptimizer.tsx**
- Updated `Attributes` interface to use: `name`, `description`, `seoTitle`, `seoDescription`
- Updated UI labels to reflect actual Wix fields
- Updated state initialization and reset logic

### Backend Worker
**backend/src/workers/jobWorker.ts**
- Updated `extractAttributeValue()` function to properly extract:
  - `name`: product.name
  - `description`: product.description
  - `seoTitle`: product.seoData?.tags?.title
  - `seoDescription`: product.seoData?.tags?.description

### Backend API
**backend/src/wix/storesClient.ts**
- Updated `getProduct()` to fetch full product data including SEO fields using `?fieldsets=FULL`

**backend/src/routes/publish.ts**
- Updated `buildProductUpdate()` to map attributes to correct Wix API fields:
  - `name` → `{ name: value }`
  - `description` → `{ description: value }`
  - `seoTitle` → `{ seoData: { tags: { title: value } } }`
  - `seoDescription` → `{ seoData: { tags: { description: value } } }`

**backend/src/routes/publish.test.ts**
- Updated tests to match new attribute names

## Wix Product Fields Reference
Based on Wix Stores API documentation:

### Queryable/Searchable Fields
- `name` - Product title/name (searchable, filterable)
- `description` - Product description (searchable, filterable)
- `seoData.tags.title` - SEO page title
- `seoData.tags.description` - SEO meta description

### API Endpoints Used
- GET `/stores/v1/products/{id}?fieldsets=FULL` - Fetch product with all fields
- PATCH `/stores/v1/products/{id}` - Update product fields

## Testing
After deployment, verify:
1. Select products and attributes on Product Optimizer page
2. Create a job and check that it starts processing
3. Verify worker logs show actual product data being extracted
4. Check that OpenAI receives real product content
5. Verify optimized content can be published back to Wix

## Next Steps
- Test with real Wix store to ensure SEO data structure matches
- Consider adding more Wix product fields if needed (tags, collections, etc.)
- Monitor worker logs for any extraction errors
