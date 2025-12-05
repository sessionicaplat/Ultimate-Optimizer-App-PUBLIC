import fetch from 'node-fetch';
import { createWixClient } from './sdkClient';

/**
 * Upload an image from a URL to Wix Media Manager using the Wix SDK
 * Returns a Wix Media URL in the format: wix:image://v1/<uri>/<filename>#originWidth=<width>&originHeight=<height>
 */
export async function uploadImageToWixMedia(
  imageUrl: string,
  accessToken: string
): Promise<string> {
  try {
    console.log(`[Wix Media] Downloading image from: ${imageUrl}`);
    
    // Step 1: Download the image from the external URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.buffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    console.log(`[Wix Media] Downloaded ${imageBuffer.length} bytes, type: ${contentType}`);
    
    // Step 2: Extract filename from URL or use default
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'blog-image.jpg';
    
    // Step 3: Upload using Wix SDK
    const wixClient = createWixClient(accessToken);
    const wixMediaUrl = await wixClient.uploadFileToMedia(
      imageBuffer,
      contentType,
      fileName
    );
    
    return wixMediaUrl;
  } catch (error: any) {
    console.error('[Wix Media] Error uploading image:', error.message || error);
    throw error;
  }
}
