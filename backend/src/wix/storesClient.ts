import { updateAccessToken, updateCatalogVersion, getAppInstance } from '../db/appInstances';
import { logger } from '../utils/logger';

/**
 * Wix Stores API client supporting both Catalog V1 and V3
 * Handles product and collection operations with automatic token refresh
 */
export class WixStoresClient {
  private static readonly BASE_URL = 'https://www.wixapis.com';
  private accessToken: string;
  private refreshToken: string;
  private instanceId: string;
  private catalogVersion: string | null = null;
  private versionDetectionInProgress: Promise<string> | null = null;

  constructor(accessToken: string, refreshToken: string, instanceId: string, cachedVersion?: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.instanceId = instanceId;
    this.catalogVersion = cachedVersion || null;
  }

  /**
   * Detect which catalog version the site is using
   * Uses 428 error detection method - most reliable for self-hosted apps
   */
  private async getCatalogVersion(): Promise<string> {
    // Return cached version if available
    if (this.catalogVersion) {
      return this.catalogVersion;
    }

    // If detection is already in progress, wait for it
    if (this.versionDetectionInProgress) {
      return this.versionDetectionInProgress;
    }

    // Start detection
    this.versionDetectionInProgress = this.detectCatalogVersion();
    
    try {
      const version = await this.versionDetectionInProgress;
      return version;
    } finally {
      this.versionDetectionInProgress = null;
    }
  }

  /**
   * Detect catalog version by attempting a V3 call and checking for 428 error
   */
  private async detectCatalogVersion(): Promise<string> {
    logger.debug('[WixStoresClient] Detecting catalog version...');

    try {
      // Try a simple V3 query with limit 1
      const testBody = {
        query: {
          paging: { limit: 1 }
        }
      };

      const response = await fetch(
        `${WixStoresClient.BASE_URL}/stores/v3/products/query`,
        {
          method: 'POST',
          headers: {
            Authorization: this.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testBody),
        }
      );

      if (response.ok) {
        // V3 works!
        this.catalogVersion = 'V3';
        console.log('[WixStoresClient] ✅ Detected Catalog V3');
        await updateCatalogVersion(this.instanceId, 'V3');
        return 'V3';
      }

      // Check if it's a 428 error indicating V1 catalog
      if (response.status === 428) {
        const errorText = await response.text();
        if (errorText.includes('CATALOG_V1')) {
          this.catalogVersion = 'V1';
          console.log('[WixStoresClient] ✅ Detected Catalog V1 (from 428 error)');
          await updateCatalogVersion(this.instanceId, 'V1');
          return 'V1';
        }
      }

      // Other error - default to V3 and let it fail naturally
      console.log(`[WixStoresClient] ⚠️ Unexpected response ${response.status}, defaulting to V3`);
      this.catalogVersion = 'V3';
      return 'V3';

    } catch (error) {
      console.error('[WixStoresClient] Error detecting catalog version:', error);
      // Default to V3 on network errors
      this.catalogVersion = 'V3';
      return 'V3';
    }
  }

  /**
   * Get products with cursor pagination and optional search
   * Note: V3 query endpoint doesn't return full media gallery, so we fetch it separately
   */
  async getProducts(options?: {
    cursor?: string;
    query?: string;
    limit?: number;
    includeFullMedia?: boolean;
  }): Promise<{
    products: any[];
    nextCursor?: string;
  }> {
    const version = await this.getCatalogVersion();
    // V1 API has max limit of 100, V3 can handle more
    const maxLimit = version === 'V1' ? 100 : 200;
    const requestedLimit = options?.limit || 50;
    const limit = Math.min(requestedLimit, maxLimit);
    const requestBody: any = {
      query: {
        paging: {
          limit,
        },
      },
    };

    if (options?.cursor) {
      requestBody.query.paging.cursor = options.cursor;
    }

    // Note: Server-side filtering removed to ensure compatibility with both V1 and V3
    // Filtering is now handled client-side for better reliability
    // if (options?.query) {
    //   requestBody.query.filter = {
    //     name: {
    //       $contains: options.query,
    //     },
    //   };
    // }

    // Use correct endpoint based on catalog version
    const endpoint = version === 'V3' 
      ? '/stores/v3/products/query'
      : '/stores/v1/products/query';

    console.log(`[WixStoresClient] Fetching products using ${version} endpoint`);
    const response = await this.request(endpoint, requestBody, 'POST');
    let products = response.products || [];

    // If full media is requested, fetch detailed product info for each
    // V3 query endpoint doesn't return media.items, so we use the reader endpoint
    // V1 already includes media.items in the query response
    if (options?.includeFullMedia && products.length > 0 && version === 'V3') {
      console.log(`[WixStoresClient] Fetching full media for ${products.length} V3 products...`);
      
      products = await Promise.all(
        products.map(async (product: any) => {
          try {
            // Use stores-reader endpoint which returns full media gallery
            const detailedProduct = await this.getProductWithMedia(product.id);
            return detailedProduct;
          } catch (error) {
            console.warn(`[WixStoresClient] Failed to fetch media for product ${product.id}:`, error);
            // Return original product if media fetch fails
            return product;
          }
        })
      );
    } else if (version === 'V1') {
      console.log(`[WixStoresClient] V1 products already include full media`);
    }

    return {
      products,
      nextCursor: response.pagingMetadata?.cursors?.next,
    };
  }

  /**
   * Get a single product with full media gallery using the reader endpoint
   * This endpoint returns media.items array with all images
   */
  private async getProductWithMedia(productId: string): Promise<any> {
    // Use stores-reader endpoint which returns full product data including media.items
    const response = await this.request(
      `/stores-reader/v1/products/${productId}`,
      null,
      'GET'
    );
    
    return response.product;
  }

  /**
   * Get collections with cursor pagination
   * V3 uses Categories API, V1 uses Collections API
   */
  async getCollections(options?: {
    cursor?: string;
    limit?: number;
  }): Promise<{
    collections: any[];
    nextCursor?: string;
  }> {
    const version = await this.getCatalogVersion();
    const limit = options?.limit || 100;

    if (version === 'V3') {
      // V3 uses Categories API
      const requestBody: any = {
        query: {
          paging: {
            limit,
          },
        },
        treeReference: {
          appNamespace: '@wix/stores',
          treeKey: null,
        },
        returnNonVisibleCategories: false,
      };

      if (options?.cursor) {
        requestBody.query.paging.cursor = options.cursor;
      }

      const response = await this.request(
        '/categories/v1/categories/query',
        requestBody,
        'POST'
      );

      return {
        collections: response.categories || [],
        nextCursor: response.pagingMetadata?.cursors?.next,
      };
    } else {
      // V1 uses Collections API
      const requestBody: any = {
        query: {
          paging: {
            limit,
          },
        },
        includeNumberOfProducts: true, // Required to get product counts in V1
      };

      if (options?.cursor) {
        requestBody.query.paging.cursor = options.cursor;
      }

      const response = await this.request(
        '/stores/v1/collections/query',
        requestBody,
        'POST'
      );

      return {
        collections: response.collections || [],
        nextCursor: response.pagingMetadata?.cursors?.next,
      };
    }
  }

  /**
   * Get all product IDs contained in a specific collection
   */
  async getProductIdsByCollection(collectionId: string): Promise<string[]> {
    if (!collectionId) {
      return [];
    }

    const version = await this.getCatalogVersion();

    if (version === 'V3') {
      return this.getProductIdsByCategoryV3(collectionId);
    }

    return this.getProductIdsByCollectionV1(collectionId);
  }

  private async getProductIdsByCollectionV1(collectionId: string): Promise<string[]> {
    const uniqueIds = new Set<string>();
    let cursor: string | undefined;

    do {
      // V1 API requires filter as a JSON string, not an object
      const filterObj = {
        'collections.id': {
          $hasSome: [collectionId],
        },
      };

      const requestBody: any = {
        query: {
          paging: {
            limit: 100,
          },
          filter: JSON.stringify(filterObj),
        },
      };

      if (cursor) {
        requestBody.query.paging.cursor = cursor;
      }

      const response = await this.request(
        '/stores/v1/products/query',
        requestBody,
        'POST'
      );
      const products = response.products || [];

      for (const product of products) {
        if (product?.id) {
          uniqueIds.add(product.id);
        }
      }

      cursor = response.pagingMetadata?.cursors?.next;
    } while (cursor);

    return Array.from(uniqueIds);
  }

  private async getProductIdsByCategoryV3(categoryId: string): Promise<string[]> {
    const uniqueIds = new Set<string>();
    const limit = 100;
    let cursor: string | undefined;

    do {
      const params = new URLSearchParams();
      params.set('treeReference.appNamespace', '@wix/stores');
      params.set('cursorPaging.limit', limit.toString());
      params.set('includeItemsFromSubcategories', 'false');

      if (cursor) {
        params.set('cursorPaging.cursor', cursor);
      }

      const path = `/categories/v1/categories/${categoryId}/list-items?${params.toString()}`;
      const response = await this.request(path, null, 'GET');
      const items = response.items || [];

      for (const item of items) {
        if (item?.catalogItemId) {
          uniqueIds.add(item.catalogItemId);
        }
      }

      cursor = response.pagingMetadata?.cursors?.next;
    } while (cursor);

    return Array.from(uniqueIds);
  }

  /**
   * Get a single product by ID with all fields including SEO data and content
   */
  async getProduct(productId: string): Promise<any> {
    const version = await this.getCatalogVersion();
    
    console.log(`[WixStoresClient] Fetching product ${productId} using ${version}`);
    
    if (version === 'V3') {
      // V3: Use query endpoint to get single product by ID
      // Note: Not specifying fields to get all available fields including content
      const requestBody = {
        query: {
          filter: {
            id: {
              $eq: productId,
            },
          },
        },
      };

      const response = await this.request(
        '/stores/v3/products/query',
        requestBody,
        'POST'
      );

      if (!response.products || response.products.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      return response.products[0];
    } else {
      // V1: Use direct GET endpoint with full fieldsets
      const url = `/stores/v1/products/${productId}`;
      const response = await this.request(url, null, 'GET');
      return response.product;
    }
  }

  /**
   * Update a product
   */
  async updateProduct(productId: string, updates: any): Promise<any> {
    const version = await this.getCatalogVersion();

    console.log(`[WixStoresClient] Updating product ${productId} using ${version}`);

    if (version === 'V3') {
      // V3: Fetch product first to get revision (required for optimistic concurrency)
      const product = await this.getProduct(productId);
      
      if (!product.revision) {
        throw new Error('Product revision not found - cannot update');
      }

      const requestBody = {
        product: {
          id: productId,
          revision: product.revision,
          ...updates,
        },
      };

      const response = await this.request(
        `/stores/v3/products/${productId}`,
        requestBody,
        'PATCH'
      );
      return response.product;
    } else {
      // V1: Use V1 PATCH endpoint (no revision needed - simpler!)
      const requestBody = {
        product: updates,
      };

      const response = await this.request(
        `/stores/v1/products/${productId}`,
        requestBody,
        'PATCH'
      );
      return response.product;
    }
  }

  /**
   * Make an authenticated request to Wix API with automatic token refresh on 401/403
   * and automatic version switching on 428 errors
   */
  private async request(
    path: string,
    body: any,
    method: 'GET' | 'POST' | 'PATCH'
  ): Promise<any> {
    try {
      return await this.makeRequest(path, body, method);
    } catch (error: any) {
      // Check for invalid_token error in the error message or body
      const isInvalidToken = 
        error.status === 401 || 
        error.status === 403 ||
        (error.body && error.body.includes('invalid_token')) ||
        (error.message && error.message.includes('invalid_token'));

      // If token is invalid or expired, refresh and retry once
      if (isInvalidToken) {
        console.log(`[WixStoresClient] Invalid/expired token detected (${error.status}), attempting refresh...`);
        await this.refreshAccessToken();
        return await this.makeRequest(path, body, method);
      }

      // If 428 error with catalog version mismatch, update cached version and throw
      // The caller should retry with the correct version
      if (error.status === 428 && error.body) {
        if (error.body.includes('CATALOG_V1_SITE_CALLING_CATALOG_V3_API')) {
          console.log('[WixStoresClient] ⚠️ Catalog version mismatch detected: switching to V1');
          this.catalogVersion = 'V1';
          await updateCatalogVersion(this.instanceId, 'V1');
        } else if (error.body.includes('CATALOG_V3_SITE_CALLING_CATALOG_V1_API')) {
          console.log('[WixStoresClient] ⚠️ Catalog version mismatch detected: switching to V3');
          this.catalogVersion = 'V3';
          await updateCatalogVersion(this.instanceId, 'V3');
        }
      }

      throw error;
    }
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(
    path: string,
    body: any,
    method: 'GET' | 'POST' | 'PATCH'
  ): Promise<any> {
    const url = `${WixStoresClient.BASE_URL}${path}`;
    console.log(`[WixStoresClient] ${method} ${url}`);
    
    const headers: Record<string, string> = {
      Authorization: this.accessToken,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    console.log(`[WixStoresClient] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Wix API error (${response.status})`;
      
      // Try to parse error body for more details
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage += `: ${errorJson.message}`;
        } else if (errorJson.error) {
          errorMessage += `: ${errorJson.error}`;
        } else if (errorJson.errorDescription) {
          errorMessage += `: ${errorJson.errorDescription}`;
        }
      } catch {
        // If not JSON, include raw text if it's short
        if (errorText && errorText.length < 200) {
          errorMessage += `: ${errorText}`;
        }
      }
      
      console.error(`[WixStoresClient] ${method} ${path} failed:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500),
      });
      
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.body = errorText;
      throw error;
    }

    return response.json();
  }

  /**
   * Refresh the access token using the proper token refresh flow
   * Tries legacy refresh_token flow first, then falls back to client_credentials
   */
  private async refreshAccessToken(): Promise<void> {
    const clientId = process.env.WIX_APP_ID;
    const clientSecret = process.env.WIX_APP_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('WIX_APP_ID and WIX_APP_SECRET must be configured');
    }

    let newAccessToken: string;
    let newRefreshToken: string = this.refreshToken;
    let expiresIn: number = 3600;

    // Try legacy refresh_token flow first (works for both V1 and V3)
    if (this.refreshToken) {
      try {
        console.log('[WixStoresClient] Attempting token refresh using refresh_token flow...');
        const response = await fetch('https://www.wixapis.com/oauth/access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: this.refreshToken,
          }),
        });

        if (response.ok) {
          const data = await response.json() as {
            access_token: string;
            refresh_token?: string;
            expires_in?: number;
          };

          newAccessToken = data.access_token;
          newRefreshToken = data.refresh_token || this.refreshToken;
          expiresIn = data.expires_in || 3600;

          console.log('[WixStoresClient] ✅ Token refreshed using refresh_token flow');
        } else {
          throw new Error(`Refresh token flow failed: ${response.status}`);
        }
      } catch (error: any) {
        console.warn('[WixStoresClient] Refresh token flow failed, trying client_credentials...', error.message);
        
        // Fallback to client_credentials flow
        const fallbackResponse = await fetch('https://www.wixapis.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            instance_id: this.instanceId,
          }),
        });

        if (!fallbackResponse.ok) {
          const errorText = await fallbackResponse.text();
          throw new Error(`Token refresh failed: ${fallbackResponse.statusText} - ${errorText}`);
        }

        const data = await fallbackResponse.json() as {
          access_token: string;
          expires_in?: number;
        };

        newAccessToken = data.access_token;
        expiresIn = data.expires_in || 3600;

        console.log('[WixStoresClient] ✅ Token refreshed using client_credentials flow');
      }
    } else {
      // No refresh token, use client_credentials directly
      console.log('[WixStoresClient] No refresh token, using client_credentials flow...');
      const response = await fetch('https://www.wixapis.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          instance_id: this.instanceId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token elevation failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as {
        access_token: string;
        expires_in?: number;
      };

      newAccessToken = data.access_token;
      expiresIn = data.expires_in || 3600;

      console.log('[WixStoresClient] ✅ Token obtained using client_credentials flow');
    }

    // Update instance tokens
    this.accessToken = newAccessToken;
    this.refreshToken = newRefreshToken;

    // Persist to database
    await updateAccessToken(
      this.instanceId,
      newAccessToken,
      newRefreshToken,
      expiresIn
    );
  }
}
