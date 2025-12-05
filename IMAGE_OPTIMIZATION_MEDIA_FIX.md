# Image Optimization - Multiple Images Fix

## Problem
The Image Optimization page was only showing one image per product instead of all available images from the product gallery.

## Root Cause
The Wix Stores V3 API **does not return `media.items` by default**. The `/stores/v3/products/query` endpoint only returns a "light" response with basic fields unless you explicitly request the `media.items` field using the `fields` parameter in the query body.

Without the `fields` parameter:
- `mediaItemsCount` = 0
- `media.items` = undefined or empty array
- Only `media.main` is returned

## Solution Applied

### Critical Fix: Request Media Fields (`backend/src/wix/storesClient.ts`)

**The Key Change:**
Added explicit `fields` parameter to the V3 products query to request all media items:

```typescript
// V3: Explicitly request media.items field to get all product images
if (version === 'V3') {
  requestBody.query.fields = [
    'id',
    'name',
    'media.main.id',
    'media.main.image.url',
    'media.main.mediaType',
    'media.items.id',           // ← Request items array
    'media.items.image.url',    // ← Request image URLs
    'media.items.mediaType',    // ← Request media types
    'mediaItemsCount'           // ← Request count
  ];
}
```

**Without this:** Wix API returns `mediaItemsCount: 0` and no `media.items` array

**With this:** Wix API returns complete media gallery with all images

### Backend Changes (`backend/src/routes/products.ts`)

Added logging to verify media items are received:
```typescript
const mediaItems = media?.items || media?.mediaItems || [];
console.log(`[Products API] Product "${product.name}" has ${mediaItems.length} media items`);
```

### Frontend (Already Correct)
The frontend code in `ImageOptimization.tsx` was already correctly structured to:
- Extract images from `product.media.items` array
- Filter for `mediaType === 'image'`
- Display all images in a grid
- Handle selection of multiple images

## How It Works Now

### Wix API Response Structure:
```json
{
  "id": "product-id",
  "name": "Product Name",
  "media": {
    "main": {
      "id": "main-image-id",
      "mediaType": "IMAGE",
      "image": { "url": "https://..." }
    },
    "items": [
      {
        "id": "image-1-id",
        "mediaType": "IMAGE",
        "image": { "url": "https://..." }
      },
      {
        "id": "image-2-id",
        "mediaType": "IMAGE",
        "image": { "url": "https://..." }
      }
    ]
  }
}
```

### Backend Processing:
1. Receives products from Wix Stores V3 API
2. Extracts `media.items` array (contains ALL images)
3. Logs the count of media items per product
4. Passes the complete `items` array to frontend

### Frontend Display:
1. Receives product with `media.items` array
2. `getProductImages()` function extracts all images
3. Filters for `mediaType === 'image'` (excludes videos)
4. Displays all images in responsive grid
5. Allows selection of multiple images for optimization

## Testing

### Before the Fix:
```
[Products API] Sample product structure: {
  "mediaItemsCount": 0,  ← Zero items!
  "media": {
    "main": { ... }
    // No "items" array
  }
}
```

### After the Fix:
```
[Products API] Sample product structure: {
  "mediaItemsCount": 3,  ← Correct count!
  "media": {
    "main": { ... },
    "items": [
      { "mediaType": "IMAGE", "image": { "url": "..." } },
      { "mediaType": "IMAGE", "image": { "url": "..." } },
      { "mediaType": "IMAGE", "image": { "url": "..." } }
    ]
  }
}
[Products API] Product "Ceramic Flower Vase" has 3 media items
```

### Frontend Console:
```
[ImageOptimization] Found 3 media items for Ceramic Flower Vase
[ImageOptimization] Total images extracted: 3
```

## Expected Behavior
- Products with multiple images will show all images in the grid
- Each image can be individually selected
- Selected images show a checkmark overlay
- Individual prompts can be added per image (or use global prompt)
- The optimize button shows the count of selected images

## Notes
- The Wix Stores V3 API returns all media in the `media.items` array
- The `media.main` field is just a reference to the primary image
- Videos are filtered out (only `mediaType === 'IMAGE'` is shown)
- Products with only one image will show just that one image (correct behavior)
