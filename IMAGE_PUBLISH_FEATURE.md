# Image Publish to Wix Store Feature

## Overview
Added the ability to publish optimized images directly to the Wix product's media gallery from the Completed Image Optimizations page.

## What Was Implemented

### Backend Changes

#### 1. New Database Function (`backend/src/db/imageOptimization.ts`)
- Added `getImageOptimizationItem()` function to retrieve a single optimization item by ID

#### 2. New API Endpoint (`backend/src/routes/imageOptimization.ts`)
- **POST** `/api/image-optimization/publish/:itemId`
- Publishes an optimized image to the product's media gallery
- Validates that the item is completed and has an optimized image
- Uses the Wix SDK to update the product's media

#### 3. Enhanced WixSDKClient (`backend/src/wix/sdkClient.ts`)
- Added `updateProductMedia()` method
- Handles both V1 and V3 Catalog APIs
- Automatically retrieves existing media and appends the new optimized image
- Includes proper revision handling for V3 API

### Frontend Changes

#### 1. UI Updates (`frontend/src/pages/CompletedImageOptimization.tsx`)
- Added "Publish to Store" button for each completed optimization
- Button states:
  - Default: "📤 Publish to Store"
  - Publishing: "⏳ Publishing..."
  - Published: "✓ Published"
- Tracks publishing state per item
- Prevents duplicate publishes

#### 2. Styling (`frontend/src/pages/CompletedImageOptimization.css`)
- Added `.comparison-actions` section for action buttons
- Added `.publish-button` with hover effects
- Added `.published` state styling (green checkmark)
- Disabled state styling for in-progress publishes

## How It Works

### User Flow
1. User navigates to "Completed Image Optimizations" page
2. Selects a completed job from the left panel
3. Views optimized images in the grid
4. Clicks "Publish to Store" button on any optimized image
5. Image is added to the product's media gallery in Wix
6. Button changes to "✓ Published" state

### Technical Flow
1. Frontend sends POST request to `/api/image-optimization/publish/:itemId`
2. Backend validates:
   - Item exists and belongs to the user's instance
   - Item status is 'DONE'
   - Optimized image URL exists
3. Backend retrieves:
   - The optimization job (to get product ID)
   - The app instance (to get access token)
   - The current product data (to get existing media)
4. Backend calls Wix SDK:
   - Determines catalog version (V1 or V3)
   - Appends optimized image to existing media array
   - Updates product with proper revision handling
5. Frontend updates UI to show published state

## API Details

### Wix Stores API Integration

#### V3 Catalog API
```typescript
await productsV3.updateProduct(productId, {
  revision: currentRevision,
  media: {
    itemsInfo: {
      items: [
        ...existingMedia,
        {
          image: optimizedImageUrl,
          altText: 'Optimized: [prompt]'
        }
      ]
    }
  }
});
```

#### V1 Catalog API
```typescript
await products.updateProduct(productId, {
  media: {
    items: [
      ...existingMedia,
      {
        image: optimizedImageUrl,
        altText: 'Optimized: [prompt]'
      }
    ]
  }
});
```

## Key Features

### ✅ Automatic Catalog Version Detection
- Detects whether site uses V1 or V3 Catalog
- Uses appropriate API methods automatically

### ✅ Revision Handling
- V3 API requires current revision number
- Prevents conflicting updates
- Ensures data consistency

### ✅ Media Array Management
- Retrieves all existing product media
- Appends new optimized image
- Preserves existing media items

### ✅ Alt Text
- Sets descriptive alt text using the optimization prompt
- Format: "Optimized: [original prompt]"

### ✅ Error Handling
- Validates item status before publishing
- Checks for optimized image URL
- Provides clear error messages
- Prevents duplicate publishes

### ✅ User Feedback
- Visual button state changes
- Loading indicator during publish
- Success confirmation
- Persistent published state

## Testing

### Manual Testing Steps
1. Complete an image optimization job
2. Navigate to Completed Image Optimizations
3. Select a completed job
4. Click "Publish to Store" on an optimized image
5. Verify button changes to "✓ Published"
6. Check Wix product in dashboard - new image should appear in media gallery
7. Try clicking published button again - should remain disabled

### Edge Cases Handled
- Item not found
- Item not completed
- No optimized image URL
- Product not found in Wix
- Invalid access token
- Concurrent publish attempts
- Network errors

## Future Enhancements

### Potential Improvements
1. **Bulk Publish**: Publish all optimized images at once
2. **Replace Original**: Option to replace original image instead of adding
3. **Set as Main**: Option to set optimized image as product's main image
4. **Publish History**: Track which images were published and when
5. **Unpublish**: Remove published images from product gallery
6. **Preview**: Show how image will appear in store before publishing

## Related Files
- `backend/src/routes/imageOptimization.ts` - API endpoint
- `backend/src/db/imageOptimization.ts` - Database functions
- `backend/src/wix/sdkClient.ts` - Wix SDK integration
- `frontend/src/pages/CompletedImageOptimization.tsx` - UI component
- `frontend/src/pages/CompletedImageOptimization.css` - Styling

## Documentation References
- [Wix Stores Products V3 API](https://dev.wix.com/docs/sdk/backend-modules/stores/products-v3/update-product)
- [Wix Stores Products API](https://dev.wix.com/docs/sdk/backend-modules/stores/products/update-product)
- [Wix Media Manager](https://dev.wix.com/docs/sdk/backend-modules/media/files/list-files)
