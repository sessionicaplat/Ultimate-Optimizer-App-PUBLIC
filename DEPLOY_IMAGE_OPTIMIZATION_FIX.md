# Deploy Image Optimization Fix

## What Was Fixed
The Image Optimization page was only showing one image per product because the Wix Stores V3 API doesn't return the full media gallery by default.

## The Critical Change
Updated `backend/src/wix/storesClient.ts` to explicitly request `media.items` field in the products query.

### File Changed:
- `backend/src/wix/storesClient.ts` - Added `fields` parameter to V3 query

### What This Does:
Forces Wix API to return ALL product images in the `media.items` array instead of just the main image.

## Deploy Steps

1. **Commit the changes:**
   ```bash
   git add backend/src/wix/storesClient.ts backend/src/routes/products.ts
   git commit -m "Fix: Request all media items from Wix API for image optimization"
   git push
   ```

2. **Render will auto-deploy** (if auto-deploy is enabled)

3. **Verify the fix:**
   - Open your Wix dashboard app
   - Navigate to Image Optimization page
   - Select a product with multiple images
   - You should now see ALL images in the grid

## Expected Logs After Deploy

### Backend:
```
[Products API] Sample product structure: {
  "mediaItemsCount": 3,
  "media": {
    "items": [ ... ]
  }
}
[Products API] Product "Ceramic Flower Vase" has 3 media items
```

### Frontend Console:
```
[ImageOptimization] Found 3 media items for Ceramic Flower Vase
[ImageOptimization] Total images extracted: 3
```

## Why This Was Needed
Wix Stores V3 API uses field projection - you must explicitly request nested fields like `media.items` or they won't be included in the response. This is for performance optimization on Wix's side.

## Files Modified
1. `backend/src/wix/storesClient.ts` - Added fields array to V3 query
2. `backend/src/routes/products.ts` - Added logging for media items count
3. `frontend/src/pages/ImageOptimization.tsx` - Already had correct logic
4. Documentation files created

## No Breaking Changes
This change only adds more data to the response. Existing functionality remains unchanged.
