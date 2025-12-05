# Image Optimization Feature

## Overview
The Image Optimization page allows users to select products and optimize their images with custom AI prompts.

## Features

### Product Selection (Left Panel)
- Search and browse all store products
- Click on a product to view its images
- Visual indication of selected product
- Load more products functionality

### Image Optimization (Right Panel)
- View all images for the selected product
- Select multiple images (up to 10) for optimization
- Two prompt modes:
  1. **Global Prompt**: Apply the same optimization instructions to all selected images
  2. **Individual Prompts**: Customize optimization instructions for each image separately
- Visual selection indicators with checkmarks
- Credit calculation (5€ per image)
- Real-time credit availability display

## User Flow

1. **Select a Product**: Click on any product from the left panel
2. **Choose Images**: Click on images to select them for optimization
3. **Add Instructions**: 
   - Enable "Use a global prompt" for batch optimization with same instructions
   - Or add individual prompts for each selected image
4. **Optimize**: Click the optimize button to create the optimization job

## UI Components

### Product List
- Product thumbnail
- Product name
- Active status badge
- Search functionality

### Image Grid
- Responsive grid layout (auto-fill, min 160px)
- Image selection with visual feedback
- Checkmark overlay on selected images
- Individual prompt fields for selected images

### Action Button
- Shows number of selected images
- Displays required credits
- Disabled when no images selected
- Loading state during processing

## Navigation
Access the Image Optimization page from the sidebar navigation with the 🖼️ icon.

## Route
`/image-optimization`

## Files Created
- `frontend/src/pages/ImageOptimization.tsx` - Main component
- `frontend/src/pages/ImageOptimization.css` - Styling
- Updated `frontend/src/App.tsx` - Added route
- Updated `frontend/src/components/Layout.tsx` - Added navigation link

## Backend Integration

### Products API
The `/api/products` endpoint now returns all media items for each product:
```json
{
  "products": [
    {
      "id": "product-id",
      "name": "Product Name",
      "media": {
        "mainMedia": {
          "id": "main-image-id",
          "mediaType": "image",
          "title": "Main Image",
          "image": {
            "url": "https://..."
          }
        },
        "items": [
          {
            "id": "image-1-id",
            "mediaType": "image",
            "title": "Image 1",
            "image": {
              "url": "https://..."
            }
          }
        ]
      }
    }
  ]
}
```

### Image Optimization Endpoint
The page expects a `/api/image-optimization` endpoint that accepts:
```json
{
  "productId": "string",
  "images": [
    {
      "imageId": "string",
      "prompt": "string"
    }
  ]
}
```

## Future Enhancements
- Ongoing and completed image optimization tabs (UI ready)
- Image preview before/after comparison
- Batch processing status tracking
- Image quality settings
- Format conversion options
