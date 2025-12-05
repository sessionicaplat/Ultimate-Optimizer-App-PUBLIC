import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { getAppInstance } from '../db/appInstances';
import { WixStoresClient } from '../wix/storesClient';
import { getInstanceToken } from '../wix/tokenHelper';

const router = Router();

/**
 * GET /api/products
 * Retrieve products from Wix Stores with pagination and search
 */
router.get('/api/products', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const cursor = req.query.cursor as string | undefined;
    // Note: query parameter is ignored for server-side filtering (handled client-side)
    // const query = req.query.query as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    // Get instance data including tokens
    const instance = await getAppInstance(instanceId);
    
    // If no instance exists yet (dashboard app without OAuth), return mock data
    if (!instance) {
      console.log(`No instance found for ${instanceId}, returning mock data`);
      const mockProducts = [
        {
          id: 'mock-1',
          name: 'Sample Product 1',
          slug: 'sample-product-1',
          visible: true,
          priceData: {
            currency: 'USD',
            price: 29.99,
            formatted: { price: '$29.99' }
          },
          media: { 
            mainMedia: { 
              image: { url: 'https://via.placeholder.com/300x300?text=Product+1' } 
            } 
          }
        },
        {
          id: 'mock-2', 
          name: 'Sample Product 2',
          slug: 'sample-product-2',
          visible: true,
          priceData: {
            currency: 'USD',
            price: 49.99,
            formatted: { price: '$49.99' }
          },
          media: { 
            mainMedia: { 
              image: { url: 'https://via.placeholder.com/300x300?text=Product+2' } 
            } 
          }
        },
        {
          id: 'mock-3',
          name: 'Sample Product 3',
          slug: 'sample-product-3',
          visible: true,
          priceData: {
            currency: 'USD',
            price: 19.99,
            formatted: { price: '$19.99' }
          },
          media: { 
            mainMedia: { 
              image: { url: 'https://via.placeholder.com/300x300?text=Product+3' } 
            } 
          }
        }
      ];
      res.json({
        products: mockProducts,
        nextCursor: null
      });
      return;
    }

    // Check if we have the required Wix configuration
    if (!process.env.WIX_APP_ID || !process.env.WIX_APP_SECRET) {
      console.log('Wix configuration missing, returning mock data for development');
      // Return mock data for development
      const mockProducts = [
        {
          id: 'mock-1',
          name: 'Sample Product 1',
          slug: 'sample-product-1',
          visible: true,
          priceData: {
            currency: 'USD',
            price: 29.99,
            formatted: { price: '$29.99' }
          },
          media: { 
            mainMedia: { 
              image: { url: 'https://via.placeholder.com/300x300?text=Product+1' } 
            } 
          }
        },
        {
          id: 'mock-2', 
          name: 'Sample Product 2',
          slug: 'sample-product-2',
          visible: true,
          priceData: {
            currency: 'USD',
            price: 49.99,
            formatted: { price: '$49.99' }
          },
          media: { 
            mainMedia: { 
              image: { url: 'https://via.placeholder.com/300x300?text=Product+2' } 
            } 
          }
        },
        {
          id: 'mock-3',
          name: 'Sample Product 3',
          slug: 'sample-product-3',
          visible: true,
          priceData: {
            currency: 'USD',
            price: 19.99,
            formatted: { price: '$19.99' }
          },
          media: { 
            mainMedia: { 
              image: { url: 'https://via.placeholder.com/300x300?text=Product+3' } 
            } 
          }
        }
      ];
      res.json({
        products: mockProducts,
        nextCursor: null
      });
      return;
    }

    // Check if instance has valid tokens
    if (!instance.access_token || !instance.refresh_token) {
      res.status(400).json({
        error: 'Invalid instance tokens',
        code: 'INVALID_TOKENS',
        message: 'App instance does not have valid access tokens. Please reinstall the app.'
      });
      return;
    }

    try {
      // Get fresh access token (automatically refreshes if expired)
      const accessToken = await getInstanceToken(instance.instance_id);
      
      // Create Wix Stores client with REST API and cached catalog version
      const client = new WixStoresClient(
        accessToken,
        instance.refresh_token,
        instance.instance_id,
        instance.catalog_version // Pass cached version from database
      );

      // Fetch products from Wix with full media gallery
      // Note: No server-side query filtering - handled client-side for V1/V3 compatibility
      const result = await client.getProducts({
        cursor,
        limit,
        includeFullMedia: true  // Fetch full media.items array for image optimization
      });

      // Log first product structure for debugging - including items array
      if (result.products.length > 0) {
        console.log('[Products API] Sample product structure:', JSON.stringify({
          id: result.products[0].id,
          name: result.products[0].name,
          media: result.products[0].media,
          mediaItemsCount: result.products[0].media?.items?.length || 0,
        }, null, 2));
      }

      // Transform products to ensure consistent image structure
      // Extract ALL images from media.items array (V3 structure)
      const transformedProducts = result.products.map((product: any) => {
        const media = product?.media ?? {};
        
        // Extract main image URL with comprehensive fallback
        const mainImageUrl = 
          media?.main?.image?.url ||                // V3 primary
          media?.mainMedia?.image?.url ||           // V1 structure
          media?.main?.thumbnail?.url ||            // V3 thumbnail
          media?.mainMedia?.thumbnail?.url ||       // V1 thumbnail
          media?.items?.[0]?.image?.url ||          // V3 first item fallback
          '';

        // Extract ALL media items (this is the key for image optimization!)
        // V3 stores all images in media.items array
        const mediaItems = media?.items || media?.mediaItems || [];
        
        console.log(`[Products API] Product "${product.name}" has ${mediaItems.length} media items`);

        return {
          ...product,
          media: {
            mainMedia: {
              id: media?.main?.id || media?.mainMedia?.id || 'main',
              mediaType: 'image',
              title: media?.main?.title || media?.mainMedia?.title || product.name,
              image: {
                url: mainImageUrl
              }
            },
            // Pass through ALL media items from Wix API
            items: mediaItems
          }
        };
      });

      res.json({
        products: transformedProducts,
        nextCursor: result.nextCursor
      });
    } catch (wixError: any) {
      console.error('Wix API error:', wixError);
      // If it's a configuration error, return mock data for development
      if (wixError.message?.includes('configuration') || wixError.message?.includes('credentials')) {
        console.log('Wix API configuration error, returning mock data');
        const mockProducts = [
          {
            id: 'mock-1',
            name: 'Sample Product 1 (Mock)',
            slug: 'sample-product-1',
            visible: true,
            priceData: {
              currency: 'USD',
              price: 29.99,
              formatted: { price: '$29.99' }
            },
            media: { 
              mainMedia: { 
                image: { url: 'https://via.placeholder.com/300x300?text=Product+1' } 
              } 
            }
          },
          {
            id: 'mock-2', 
            name: 'Sample Product 2 (Mock)',
            slug: 'sample-product-2',
            visible: true,
            priceData: {
              currency: 'USD',
              price: 49.99,
              formatted: { price: '$49.99' }
            },
            media: { 
              mainMedia: { 
                image: { url: 'https://via.placeholder.com/300x300?text=Product+2' } 
              } 
            }
          }
        ];
        res.json({
          products: mockProducts,
          nextCursor: null
        });
        return;
      }
      // Re-throw other errors to be handled by the outer catch
      throw wixError;
    }
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    // Handle Wix API errors
    if (error.status) {
      res.status(502).json({
        error: 'Wix API error',
        code: 'WIX_API_ERROR',
        message: error.message || 'Failed to fetch products from Wix Stores',
        details: error.body
      });
      return;
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while fetching products'
    });
  }
});

/**
 * GET /api/products/:id
 * Retrieve a single product by ID from Wix Stores
 */
router.get('/api/products/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const productId = req.params.id;

    // Get instance data including tokens
    const instance = await getAppInstance(instanceId);
    
    // If no instance exists, return mock data
    if (!instance) {
      console.log(`No instance found for ${instanceId}, returning mock product`);
      res.json({
        product: {
          id: productId,
          name: 'Sample Product',
          slug: 'sample-product',
          visible: true
        }
      });
      return;
    }

    // Check if we have the required Wix configuration
    if (!process.env.WIX_APP_ID || !process.env.WIX_APP_SECRET) {
      console.log('Wix configuration missing, returning mock data');
      res.json({
        product: {
          id: productId,
          name: 'Sample Product',
          slug: 'sample-product',
          visible: true
        }
      });
      return;
    }

    // Check if instance has valid tokens
    if (!instance.access_token || !instance.refresh_token) {
      res.status(400).json({
        error: 'Invalid instance tokens',
        code: 'INVALID_TOKENS',
        message: 'App instance does not have valid access tokens.'
      });
      return;
    }

    try {
      // Get fresh access token
      const accessToken = await getInstanceToken(instance.instance_id);
      
      // Create Wix Stores client with cached catalog version
      const client = new WixStoresClient(
        accessToken,
        instance.refresh_token,
        instance.instance_id,
        instance.catalog_version
      );

      // Fetch single product from Wix
      const product = await client.getProduct(productId);

      if (!product) {
        res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
          message: `Product with ID ${productId} not found`
        });
        return;
      }

      res.json({ product });
    } catch (wixError: any) {
      console.error('Wix API error:', wixError);
      if (wixError.message?.includes('configuration') || wixError.message?.includes('credentials')) {
        res.json({
          product: {
            id: productId,
            name: 'Sample Product',
            slug: 'sample-product',
            visible: true
          }
        });
        return;
      }
      throw wixError;
    }
  } catch (error: any) {
    console.error('Error fetching product:', error);
    
    if (error.status) {
      res.status(502).json({
        error: 'Wix API error',
        code: 'WIX_API_ERROR',
        message: error.message || 'Failed to fetch product from Wix Stores'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while fetching product'
    });
  }
});

/**
 * GET /api/collections
 * Retrieve collections from Wix Stores with pagination
 */
router.get('/api/collections', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId} = req.wixInstance!;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    // Get instance data including tokens
    const instance = await getAppInstance(instanceId);
    
    // If no instance exists yet (dashboard app without OAuth), return mock data
    if (!instance) {
      console.log(`No instance found for ${instanceId}, returning mock collections`);
      const mockCollections = [
        {
          id: 'mock-col-1',
          name: 'Sample Collection 1',
          slug: 'sample-collection-1',
          numberOfProducts: 5
        },
        {
          id: 'mock-col-2',
          name: 'Sample Collection 2',
          slug: 'sample-collection-2',
          numberOfProducts: 8
        },
        {
          id: 'mock-col-3',
          name: 'Sample Collection 3',
          slug: 'sample-collection-3',
          numberOfProducts: 12
        }
      ];
      res.json({
        collections: mockCollections,
        nextCursor: null
      });
      return;
    }

    // Check if we have the required Wix configuration
    if (!process.env.WIX_APP_ID || !process.env.WIX_APP_SECRET) {
      console.log('Wix configuration missing, returning mock data for development');
      // Return mock data for development
      const mockCollections = [
        {
          id: 'mock-col-1',
          name: 'Sample Collection 1',
          slug: 'sample-collection-1',
          numberOfProducts: 5
        },
        {
          id: 'mock-col-2',
          name: 'Sample Collection 2',
          slug: 'sample-collection-2',
          numberOfProducts: 8
        },
        {
          id: 'mock-col-3',
          name: 'Sample Collection 3',
          slug: 'sample-collection-3',
          numberOfProducts: 12
        }
      ];
      res.json({
        collections: mockCollections,
        nextCursor: null
      });
      return;
    }

    // Check if instance has valid tokens
    if (!instance.access_token || !instance.refresh_token) {
      res.status(400).json({
        error: 'Invalid instance tokens',
        code: 'INVALID_TOKENS',
        message: 'App instance does not have valid access tokens. Please reinstall the app.'
      });
      return;
    }

    try {
      // Get fresh access token (automatically refreshes if expired)
      const accessToken = await getInstanceToken(instance.instance_id);
      
      // Create Wix Stores client with REST API and cached catalog version
      const client = new WixStoresClient(
        accessToken,
        instance.refresh_token,
        instance.instance_id,
        instance.catalog_version
      );

      // Fetch collections from Wix
      const result = await client.getCollections({
        cursor,
        limit
      });

      // Log first collection structure for debugging
      if (result.collections.length > 0) {
        console.log('[Collections API] Sample collection structure:', JSON.stringify({
          id: result.collections[0].id,
          name: result.collections[0].name,
          numberOfProducts: result.collections[0].numberOfProducts,
          productCount: result.collections[0].productCount,
          numProducts: result.collections[0].numProducts,
          fullObject: result.collections[0]
        }, null, 2));
      }

      // Transform collections to ensure consistent structure
      const transformedCollections = result.collections.map((collection: any) => {
        // V3 categories use 'itemCounter', V1 collections use 'numberOfProducts'
        const productCount = collection.itemCounter || collection.numberOfProducts || 0;
        
        return {
          ...collection,
          numberOfProducts: productCount
        };
      });

      res.json({
        collections: transformedCollections,
        nextCursor: result.nextCursor
      });
    } catch (wixError: any) {
      console.error('Wix API error:', wixError);
      // If it's a configuration error, return mock data for development
      if (wixError.message?.includes('configuration') || wixError.message?.includes('credentials')) {
        console.log('Wix API configuration error, returning mock data');
        const mockCollections = [
          {
            id: 'mock-col-1',
            name: 'Sample Collection 1 (Mock)',
            slug: 'sample-collection-1',
            numberOfProducts: 5
          },
          {
            id: 'mock-col-2',
            name: 'Sample Collection 2 (Mock)',
            slug: 'sample-collection-2',
            numberOfProducts: 8
          }
        ];
        res.json({
          collections: mockCollections,
          nextCursor: null
        });
        return;
      }
      // Re-throw other errors to be handled by the outer catch
      throw wixError;
    }
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    
    // Handle Wix API errors
    if (error.status) {
      res.status(502).json({
        error: 'Wix API error',
        code: 'WIX_API_ERROR',
        message: error.message || 'Failed to fetch collections from Wix Stores',
        details: error.body
      });
      return;
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while fetching collections'
    });
  }
});

export default router;
