# Image Publish Feature - Usage Guide

## For End Users

### How to Publish Optimized Images to Your Store

#### Step 1: Complete an Optimization
1. Go to "Image Optimization" page
2. Select a product
3. Choose images to optimize
4. Enter optimization prompts
5. Click "Start Optimization"
6. Wait for completion

#### Step 2: View Completed Optimizations
1. Navigate to "Completed Image Optimizations" from the menu
2. You'll see a list of all completed optimization jobs
3. Click on a job to view the optimized images

#### Step 3: Publish to Store
1. Review the before/after comparison
2. Click the "📤 Publish to Store" button
3. Wait for the "✓ Published" confirmation
4. The optimized image is now in your product's media gallery!

### What Happens When You Publish?

When you click "Publish to Store":
- ✅ The optimized image is added to your product's media gallery
- ✅ The original image remains unchanged
- ✅ The new image appears at the end of the gallery
- ✅ You can rearrange images in Wix dashboard
- ✅ The alt text includes your optimization prompt

### Tips & Best Practices

#### ✨ Review Before Publishing
- Click on the image to see a full-size comparison
- Make sure you're happy with the optimization
- Check that the prompt achieved the desired result

#### 🎯 Selective Publishing
- You don't have to publish all optimized images
- Only publish the ones you want to use
- Keep experimenting with different prompts

#### 🔄 Multiple Versions
- You can optimize the same image multiple times
- Try different prompts to get different results
- Publish your favorite version

#### 📸 Managing Published Images
- Published images appear in your Wix product editor
- You can set any image as the main product image
- You can delete unwanted images from Wix dashboard
- You can reorder images in the gallery

### Common Questions

#### Q: Can I unpublish an image?
A: Not directly from the app. Go to your Wix product editor and remove the image from the media gallery.

#### Q: What if I publish the wrong image?
A: Go to your Wix product editor and delete the unwanted image from the media gallery.

#### Q: Can I publish the same image twice?
A: Yes, but it will create a duplicate in your product gallery. The button will allow multiple publishes.

#### Q: Does publishing replace the original image?
A: No, it adds the optimized image to the gallery. The original remains unchanged.

#### Q: Can I edit the published image in Wix?
A: Yes, you can use Wix's built-in image editor to make further adjustments.

#### Q: Will publishing affect my live store immediately?
A: The image is added to the product's media gallery, but you control which image is displayed as the main product image in Wix.

## For Developers

### API Usage Example

```typescript
// Publish an optimized image
const response = await fetchWithAuth(
  `/api/image-optimization/publish/${itemId}`,
  { method: 'POST' }
);

if (response.success) {
  console.log('Image published successfully');
  console.log('Updated product:', response.product);
}
```

### Integration Example

```typescript
// In your component
const [publishedItems, setPublishedItems] = useState<Set<number>>(new Set());

const handlePublish = async (itemId: number) => {
  try {
    await fetchWithAuth(`/api/image-optimization/publish/${itemId}`, {
      method: 'POST',
    });
    
    setPublishedItems(prev => new Set(prev).add(itemId));
  } catch (error) {
    console.error('Publish failed:', error);
  }
};
```

### Backend Integration

```typescript
import { WixSDKClient } from '../wix/sdkClient';

// Create client with access token
const wixClient = new WixSDKClient(accessToken);

// Publish optimized image
const updatedProduct = await wixClient.updateProductMedia(
  productId,
  optimizedImageUrl,
  'Alt text for the image'
);
```

### Custom Implementation

If you want to customize the publish behavior:

```typescript
// backend/src/wix/sdkClient.ts

async updateProductMedia(
  productId: string,
  optimizedImageUrl: string,
  altText?: string,
  options?: {
    setAsMain?: boolean;      // Set as main product image
    replaceOriginal?: boolean; // Replace instead of append
    position?: number;         // Insert at specific position
  }
): Promise<any> {
  // Your custom implementation
}
```

## Advanced Usage

### Bulk Publishing

Want to publish all optimized images at once? Here's how you could implement it:

```typescript
const publishAll = async (items: ImageOptimizationItem[]) => {
  const publishPromises = items
    .filter(item => item.status === 'DONE' && item.optimizedImageUrl)
    .map(item => handlePublish(item.id));
  
  await Promise.all(publishPromises);
};
```

### Conditional Publishing

Publish only images that meet certain criteria:

```typescript
const publishIfQualityHigh = async (item: ImageOptimizationItem) => {
  // Add your quality check logic
  const meetsQuality = checkImageQuality(item.optimizedImageUrl);
  
  if (meetsQuality) {
    await handlePublish(item.id);
  }
};
```

### Tracking Published Images

Keep track of what's been published:

```typescript
// Store in localStorage
const trackPublished = (itemId: number, productId: string) => {
  const published = JSON.parse(
    localStorage.getItem('publishedImages') || '{}'
  );
  
  published[itemId] = {
    productId,
    publishedAt: new Date().toISOString(),
  };
  
  localStorage.setItem('publishedImages', JSON.stringify(published));
};
```

## Workflow Examples

### Scenario 1: Product Photo Enhancement
1. Optimize product photos with prompt: "enhance colors and lighting"
2. Review all optimizations
3. Publish the best 3-4 images
4. Set your favorite as the main product image in Wix

### Scenario 2: Seasonal Updates
1. Optimize images with prompt: "add winter/holiday theme"
2. Publish seasonal versions
3. Use Wix to switch between seasonal and regular images
4. Remove seasonal images after the season

### Scenario 3: A/B Testing
1. Optimize same image with different prompts
2. Publish multiple versions
3. Test which version performs better
4. Keep the winner, remove others

### Scenario 4: Batch Processing
1. Optimize all products in a category
2. Review completed optimizations
3. Publish all approved images
4. Update product descriptions to match new images

## Troubleshooting Guide

### Issue: Button Doesn't Respond
**Solution:**
- Check browser console for errors
- Verify you're logged in
- Refresh the page
- Check network connectivity

### Issue: "Insufficient Credits" Error
**Solution:**
- Check your credit balance
- Upgrade your plan if needed
- Contact support for credit issues

### Issue: Image Not Appearing in Wix
**Solution:**
- Wait a few seconds and refresh Wix dashboard
- Check if image URL is accessible
- Verify product exists in Wix
- Check Wix API status

### Issue: Published Wrong Image
**Solution:**
- Go to Wix product editor
- Find the image in media gallery
- Click delete/remove
- Publish the correct image

## Support

Need help? Check:
- App documentation
- Wix support articles
- Contact app support
- Check status page

## Updates & Changelog

### Version 1.0
- ✅ Initial publish feature
- ✅ V1 and V3 Catalog support
- ✅ Alt text from prompts
- ✅ Published state tracking

### Planned Features
- 🔄 Bulk publish
- 🔄 Replace original option
- 🔄 Set as main image
- 🔄 Publish history
- 🔄 Unpublish capability
