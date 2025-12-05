# Image Publish "Product Not Found" Error - Fix

## Issue
When clicking "Publish to Store", getting error: `Product not found`

## Root Cause
The product ID stored in the image optimization job doesn't exist in the Wix store anymore. This can happen if:
1. The product was deleted from Wix after optimization started
2. The product ID format changed
3. The product is in a different catalog version

## Immediate Fix Applied

### 1. Better Error Logging
Added detailed logging to track:
- Product ID being requested
- Catalog version (V1 vs V3)
- Wix API response details

### 2. User-Friendly Error Messages
Changed generic "Failed to publish" to specific messages:
- "Product not found in your Wix store. It may have been deleted."
- "Product was modified. Please try again."
- "Access denied. Please reconnect your Wix account."

### 3. Error Response Includes Product ID
Now returns the product ID in error response so you can verify it exists.

## How to Debug

### Step 1: Check the Backend Logs
Look for these log lines:
```
[ImageOptimization] Publishing item X to product Y
[getProduct] Fetching product Y using V3_CATALOG
[getProduct] Error getting product Y: ...
```

### Step 2: Verify Product Exists in Wix
1. Copy the product ID from the error
2. Go to your Wix dashboard
3. Go to Store Products
4. Search for the product
5. Check if it still exists

### Step 3: Check Product ID Format
The product ID should be a UUID format like:
```
af654225-662f-42e5-ac51-fbebc88f63ed
```

If it's different, there may be a mismatch.

## Solutions

### Solution 1: Re-optimize the Product
If the product was deleted:
1. Go to Image Optimization page
2. Select the product again (if it exists)
3. Run a new optimization
4. Try publishing from the new job

### Solution 2: Skip This Optimization
If the product is gone:
1. The optimization is orphaned
2. You can't publish it
3. Just ignore it and optimize other products

### Solution 3: Manual Upload
If you really want the optimized image:
1. Right-click the optimized image
2. Save it to your computer
3. Go to Wix product editor
4. Upload the image manually

## Prevention

### For Future Optimizations
1. Don't delete products while optimization is running
2. Complete optimizations before making product changes
3. Publish optimized images soon after completion

## Testing the Fix

### Test 1: Valid Product
1. Optimize a product that exists
2. Click "Publish to Store"
3. Should work successfully

### Test 2: Deleted Product
1. Find an optimization for a deleted product
2. Click "Publish to Store"
3. Should show: "Product not found in your Wix store. It may have been deleted."

### Test 3: Check Logs
1. Try to publish
2. Check backend logs
3. Should see detailed product ID and error info

## Code Changes

### Files Modified
1. `backend/src/wix/sdkClient.ts` - Added logging to getProduct and updateProductMedia
2. `backend/src/routes/imageOptimization.ts` - Better error handling and messages

### Key Improvements
- Detailed logging at each step
- User-friendly error messages
- Product ID included in error response
- Specific error codes (404, 403, 409, 500)

## Next Steps

1. Deploy the updated code
2. Try publishing again
3. Check the logs for the product ID
4. Verify the product exists in Wix
5. If product is deleted, skip this optimization

## Additional Debugging

If the issue persists, check:
1. Access token is valid
2. App has STORES.PRODUCTS_WRITE permission
3. Catalog version matches (V1 vs V3)
4. Product ID format is correct
5. Network connectivity to Wix API
