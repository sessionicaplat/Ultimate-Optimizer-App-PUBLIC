import { createClient } from '@wix/sdk';
import { products, productsV3, collections, catalogVersioning } from '@wix/stores';
import { billing } from '@wix/app-management';
import { orders } from '@wix/pricing-plans';
import { draftPosts } from '@wix/blog';
import { files } from '@wix/media';

/**
 * Wix SDK Client for accessing Stores and Billing data
 * Uses the official Wix SDK instead of REST API
 */
export class WixSDKClient {
  private client: any;
  private catalogVersion: string | null = null;

  constructor(accessToken: string) {
    // Create Wix SDK client with access token
    this.client = createClient({
      auth: {
        getAuthHeaders: () => ({
          headers: {
            Authorization: accessToken.startsWith('Bearer ')
              ? accessToken
              : `Bearer ${accessToken}`,
          },
        }),
      },
      modules: {
        products,
        productsV3,
        collections,
        catalogVersioning,
        billing,
        orders,
        draftPosts,
        files,
      },
    });
  }

  /**
   * Determine which catalog version the site is using
   */
  async getCatalogVersion(): Promise<string> {
    if (this.catalogVersion) {
      return this.catalogVersion;
    }

    try {
      const { catalogVersion } = await this.client.catalogVersioning.getCatalogVersion();
      this.catalogVersion = catalogVersion || 'V1_CATALOG';
      console.log(`Catalog version: ${this.catalogVersion}`);
      return this.catalogVersion!;
    } catch (error) {
      console.warn('Failed to get catalog version, defaulting to V1:', error);
      this.catalogVersion = 'V1_CATALOG';
      return this.catalogVersion!;
    }
  }

  /**
   * Query products based on catalog version
   */
  async getProducts(options?: {
    cursor?: string;
    query?: string;
    limit?: number;
  }): Promise<{
    products: any[];
    nextCursor?: string;
  }> {
    const version = await this.getCatalogVersion();
    const limit = options?.limit || 50;

    try {
      if (version === 'V3_CATALOG') {
        // Use V3 API
        let queryBuilder = this.client.productsV3.queryProducts();

        // Add search filter if provided
        if (options?.query) {
          queryBuilder = queryBuilder.contains('name', options.query);
        }

        // Add pagination
        queryBuilder = queryBuilder.limit(limit);
        if (options?.cursor) {
          queryBuilder = queryBuilder.skipTo(options.cursor);
        }

        const result = await queryBuilder.find();
        
        return {
          products: result.items || [],
          nextCursor: result.hasNext() ? result.nextCursor : undefined,
        };
      } else {
        // Use V1 API
        let queryBuilder = this.client.products.queryProducts();

        // Add search filter if provided
        if (options?.query) {
          queryBuilder = queryBuilder.contains('name', options.query);
        }

        // Add pagination
        queryBuilder = queryBuilder.limit(limit);
        if (options?.cursor) {
          queryBuilder = queryBuilder.skipTo(options.cursor);
        }

        const result = await queryBuilder.find();
        
        return {
          products: result.items || [],
          nextCursor: result.hasNext() ? result.nextCursor : undefined,
        };
      }
    } catch (error) {
      console.error('Error querying products:', error);
      throw error;
    }
  }

  /**
   * Query collections
   */
  async getCollections(options?: {
    cursor?: string;
    limit?: number;
  }): Promise<{
    collections: any[];
    nextCursor?: string;
  }> {
    const limit = options?.limit || 50;

    try {
      let queryBuilder = this.client.collections.queryCollections();

      // Add pagination
      queryBuilder = queryBuilder.limit(limit);
      if (options?.cursor) {
        queryBuilder = queryBuilder.skipTo(options.cursor);
      }

      const result = await queryBuilder.find();
      
      return {
        collections: result.items || [],
        nextCursor: result.hasNext() ? result.nextCursor : undefined,
      };
    } catch (error) {
      console.error('Error querying collections:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<any> {
    const version = await this.getCatalogVersion();

    try {
      console.log(`[getProduct] Fetching product ${productId} using ${version}`);
      
      if (version === 'V3_CATALOG') {
        const result = await this.client.productsV3.getProduct(productId, {
          fields: ['MEDIA_ITEMS_INFO']
        });
        console.log(`[getProduct] Product found:`, result.name || result.product?.name || 'unnamed');
        // The SDK returns the product directly, not nested under .product
        return result.product || result;
      } else {
        const result = await this.client.products.getProduct(productId);
        console.log(`[getProduct] Product found:`, result.name || result.product?.name || 'unnamed');
        // The SDK returns the product directly, not nested under .product
        return result.product || result;
      }
    } catch (error: any) {
      console.error(`[getProduct] Error getting product ${productId}:`, error.message || error);
      if (error.response) {
        console.error(`[getProduct] Response status:`, error.response.status);
        console.error(`[getProduct] Response data:`, JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Update a product
   */
  async updateProduct(productId: string, updates: any): Promise<any> {
    const version = await this.getCatalogVersion();

    try {
      if (version === 'V3_CATALOG') {
        const result = await this.client.productsV3.updateProduct(productId, {
          product: updates,
        });
        return result.product;
      } else {
        const result = await this.client.products.updateProduct(productId, {
          product: updates,
        });
        return result.product;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Update product media (add optimized image to gallery)
   */
  async updateProductMedia(
    productId: string,
    optimizedImageUrl: string,
    altText?: string
  ): Promise<any> {
    const version = await this.getCatalogVersion();

    try {
      console.log(`[updateProductMedia] Getting product ${productId}`);
      
      // Get the current product to retrieve its revision and existing media
      let product;
      try {
        product = await this.getProduct(productId);
        console.log(`[updateProductMedia] getProduct returned:`, typeof product, product ? 'truthy' : 'falsy');
      } catch (error: any) {
        console.error(`[updateProductMedia] Failed to get product ${productId}:`, error.message);
        throw new Error(`Product not found: ${productId}`);
      }
      
      if (!product) {
        console.error(`[updateProductMedia] Product is falsy after getProduct!`);
        throw new Error(`Product not found: ${productId}`);
      }

      console.log(`[updateProductMedia] Product found, has ${product.media?.items?.length || product.media?.itemsInfo?.items?.length || 0} existing media items`);
      console.log(`[updateProductMedia] Product revision:`, product.revision);

      if (version === 'V3_CATALOG') {
        // V3 API - must pass entire media array with the new image
        const existingMedia = product.media?.itemsInfo?.items || [];
        
        console.log(`[updateProductMedia] V3 API - existing media:`, JSON.stringify(existingMedia, null, 2));
        
        // Add the new optimized image
        // V3 API requires 'url' field, not 'image'
        const newMediaItem = {
          url: optimizedImageUrl,
          altText: altText || 'Optimized image',
        };

        const updatedMedia = [...existingMedia, newMediaItem];

        console.log(`[updateProductMedia] V3 API - updating with ${updatedMedia.length} media items, revision: ${product.revision}`);

        // Update product with revision
        const result = await this.client.productsV3.updateProduct(
          productId,
          {
            revision: product.revision,
            media: {
              itemsInfo: {
                items: updatedMedia,
              },
            },
          }
        );
        
        console.log(`[updateProductMedia] V3 API - update successful`);
        return result.product;
      } else {
        // V1 API - use dedicated addProductMedia method
        // V1 has a separate method for adding media, not updateProduct
        console.log(`[updateProductMedia] V1 API - using addProductMedia()`);
        
        // V1 uses addProductMedia() which takes product ID and media array
        // Media items use 'url' property (not 'image')
        await this.client.products.addProductMedia(
          productId,
          [{
            url: optimizedImageUrl,
          }]
        );
        
        console.log(`[updateProductMedia] V1 API - media added successfully`);
        
        // addProductMedia returns void, so fetch the updated product
        return await this.getProduct(productId);
      }
    } catch (error: any) {
      console.error('[updateProductMedia] Error:', error.message || error);
      throw error;
    }
  }

  /**
   * Get Wix Billing checkout URL for plan upgrade
   * 
   * Uses Wix Billing API to generate a checkout URL for a specific plan.
   * Timeout increased to 30s to accommodate Wix API response times.
   * 
   * @param productId - The Wix product ID (plan ID) to upgrade to
   * @param options - Optional checkout configuration
   * @returns Checkout URL and token
   */
  async getCheckoutUrl(
    productId: string,
    options?: {
      successUrl?: string;
      billingCycle?: 'MONTHLY' | 'YEARLY';
      testCheckout?: boolean;
    }
  ): Promise<{ checkoutUrl: string; token: string }> {
    try {
      console.log('[getCheckoutUrl] Requesting checkout URL for product:', productId);
      console.log('[getCheckoutUrl] Options:', {
        billingCycle: options?.billingCycle || 'MONTHLY',
        hasSuccessUrl: !!options?.successUrl,
        testCheckout: options?.testCheckout,
      });

      // Build request options, only include testCheckout if explicitly set
      const requestOptions: any = {
        billingCycle: options?.billingCycle || 'MONTHLY',
      };
      
      // Add successUrl if provided
      if (options?.successUrl) {
        requestOptions.successUrl = options.successUrl;
      }
      
      // Only add testCheckout if it's explicitly provided
      if (options?.testCheckout !== undefined) {
        requestOptions.testCheckout = options.testCheckout;
      }

      console.log('[getCheckoutUrl] Calling Wix Billing API...');

      // Increased timeout to 30s to accommodate Wix API response times
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Wix Billing API timeout after 30s')), 30000)
      );
      
      const apiPromise = this.client.billing.getUrl(productId, requestOptions);
      const result = await Promise.race([apiPromise, timeoutPromise]);

      console.log('[getCheckoutUrl] ✅ Checkout URL received');

      return {
        checkoutUrl: result.checkoutUrl,
        token: result.token,
      };
    } catch (error: any) {
      if (error.message?.includes('timeout')) {
        console.error('⏱️ Wix Billing API timeout - request took > 30s');
        console.error('This may indicate:');
        console.error('  1. Product ID does not exist in Wix Dashboard');
        console.error('  2. Plan is not published');
        console.error('  3. Wix API is experiencing issues');
      } else {
        console.error('❌ Error getting checkout URL:', error.message || error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
      }
      throw error;
    }
  }

  /**
   * Get purchase history for the current site
   * 
   * PRIORITY 2 FIX: Added 10s timeout to prevent hanging requests
   * 
   * @returns List of past purchases
   */
  async getPurchaseHistory(): Promise<any[]> {
    try {
      // Create timeout promise (10 seconds)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Wix Billing API timeout after 10s')), 10000)
      );
      
      // Race between API call and timeout
      const apiPromise = this.client.billing.getPurchaseHistory();
      const result = await Promise.race([apiPromise, timeoutPromise]);
      
      return result.purchases || [];
    } catch (error: any) {
      if (error.message?.includes('timeout')) {
        console.error('⏱️ Wix Billing API timeout - request took > 10s');
      } else {
        console.error('Error getting purchase history:', error);
      }
      throw error;
    }
  }

  /**
   * Get site owner information from Wix
   * This requires the app to have proper permissions
   */
  async getSiteOwnerInfo(): Promise<{ memberId?: string; email?: string }> {
    try {
      // Try to get site info using the SDK
      // Note: This may require additional permissions
      const response = await fetch('https://www.wixapis.com/apps/v1/instance', {
        headers: this.client.auth.getAuthHeaders().headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get site info: ${response.status}`);
      }
      
      const data: any = await response.json();
      
      return {
        memberId: data?.site?.ownerInfo?.memberId || data?.instance?.memberId,
        email: data?.site?.ownerInfo?.email,
      };
    } catch (error) {
      console.error('Error getting site owner info:', error);
      throw error;
    }
  }

  /**
   * Create a draft blog post
   * For 3rd-party apps, memberId is required
   */
  async createDraftPost(data: {
    title: string;
    richContent: any;
    wixMediaImageUrl?: string; // Wix Media URL format: wix:image://v1/...
    excerpt?: string;
    memberId: string; // Required for 3rd-party apps
  }): Promise<any> {
    try {
      const draftPost: any = {
        title: data.title,
        richContent: data.richContent,
        media: data.wixMediaImageUrl
          ? {
              wixMedia: {
                image: data.wixMediaImageUrl,
              },
              displayed: true,
            }
          : undefined,
        excerpt: data.excerpt,
        memberId: data.memberId, // Use the stored member ID
      };

      console.log('[createDraftPost] Creating draft with:', {
        title: draftPost.title,
        hasMedia: !!draftPost.media,
        mediaImage: draftPost.media?.wixMedia?.image,
        memberId: draftPost.memberId,
      });

      const result = await this.client.draftPosts.createDraftPost(draftPost);
      return result.draftPost;
    } catch (error) {
      console.error('Error creating draft post:', error);
      throw error;
    }
  }

  /**
   * Publish a draft blog post
   */
  async publishDraftPost(draftPostId: string): Promise<any> {
    try {
      const result = await this.client.draftPosts.publishDraftPost(draftPostId);
      return result;
    } catch (error) {
      console.error('Error publishing draft post:', error);
      throw error;
    }
  }

  /**
   * Get a draft blog post
   */
  async getDraftPost(draftPostId: string): Promise<any> {
    try {
      const result = await this.client.draftPosts.getDraftPost(draftPostId);
      return result.draftPost;
    } catch (error) {
      console.error('Error getting draft post:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Wix Media Manager and return the Wix Media URL
   */
  async uploadFileToMedia(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<string> {
    try {
      console.log(`[uploadFileToMedia] Generating upload URL for ${fileName}`);
      
      // Step 1: Generate upload URL using SDK
      const uploadResult = await this.client.files.generateFileUploadUrl(mimeType, {
        fileName,
      });
      
      console.log(`[uploadFileToMedia] Got upload URL`);
      
      // Step 2: Upload file to the generated URL
      const uploadResponse = await fetch(uploadResult.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: fileBuffer,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
      
      const uploadData: any = await uploadResponse.json();
      console.log(`[uploadFileToMedia] Upload successful`);
      
      // Step 3: Extract Wix Media URL from response
      // The response structure is: file.media.image.image (which is a string like "wix:image://...")
      const imageData = uploadData?.file?.media?.image?.image;
      
      // If imageData is an object, it might have an 'image' property or we need to construct the URL
      let wixMediaUrl: string;
      
      if (typeof imageData === 'string') {
        wixMediaUrl = imageData;
      } else if (typeof imageData === 'object' && imageData !== null) {
        // If it's an object, try to get the image URL from common properties
        wixMediaUrl = imageData.image || imageData.url || imageData.id;
        
        // If we have an id but no full wix:image:// URL, construct it
        if (wixMediaUrl && !wixMediaUrl.startsWith('wix:image://')) {
          const file = uploadData?.file;
          if (file?.id && file?.media?.image?.image) {
            // Use the file ID to construct the wix:image:// URL
            const width = file.media.image.image.width || 1024;
            const height = file.media.image.image.height || 1024;
            wixMediaUrl = `wix:image://v1/${file.id}/${fileName}#originWidth=${width}&originHeight=${height}`;
          }
        }
      } else {
        console.error('[uploadFileToMedia] Response structure:', JSON.stringify(uploadData, null, 2));
        throw new Error('Wix Media URL not found in upload response');
      }
      
      if (!wixMediaUrl || typeof wixMediaUrl !== 'string') {
        console.error('[uploadFileToMedia] Invalid wixMediaUrl:', wixMediaUrl);
        console.error('[uploadFileToMedia] Full response:', JSON.stringify(uploadData, null, 2));
        throw new Error('Failed to extract valid Wix Media URL string');
      }
      
      console.log(`[uploadFileToMedia] Wix Media URL: ${wixMediaUrl}`);
      return wixMediaUrl;
    } catch (error: any) {
      console.error('[uploadFileToMedia] Error:', error.message || error);
      throw error;
    }
  }
}

/**
 * Factory function to create a WixSDKClient instance
 */
export function createWixClient(accessToken: string): WixSDKClient {
  return new WixSDKClient(accessToken);
}
