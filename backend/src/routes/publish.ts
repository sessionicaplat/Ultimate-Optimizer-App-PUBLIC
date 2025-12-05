import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { getJobItem } from '../db/jobs';
import { getAppInstance } from '../db/appInstances';
import { createPublishLog } from '../db/publishLogs';
import { WixStoresClient } from '../wix/storesClient';
import { getInstanceToken } from '../wix/tokenHelper';

const router = Router();

/**
 * Build Wix API update payload for V1 catalog
 * V1 uses different field names and requires additional properties
 */
function buildProductUpdateV1(attribute: string, value: string): any {
  switch (attribute) {
    case 'name':
      // Product name/title - same in V1 and V3
      return { name: value };
    
    case 'description':
      // Product description - V1 uses 'description' field (not plainDescription)
      return {
        description: value,
      };
    
    case 'seoTitle':
      // SEO page title - V1 requires custom and disabled properties
      return {
        seoData: {
          tags: [
            {
              type: 'title',
              children: value,
              custom: false,
              disabled: false,
            },
          ],
        },
      };
    
    case 'seoDescription':
      // SEO meta description - V1 requires custom and disabled properties
      return {
        seoData: {
          tags: [
            {
              type: 'meta',
              props: {
                name: 'description',
                content: value,
              },
              custom: false,
              disabled: false,
            },
          ],
        },
      };
    
    default:
      throw new Error(`Unknown attribute type: ${attribute}`);
  }
}

/**
 * Build Wix API update payload for V3 catalog
 * V3 uses plainDescription and simpler seoData structure
 */
function buildProductUpdateV3(attribute: string, value: string): any {
  switch (attribute) {
    case 'name':
      // Product name/title - same in V1 and V3
      return { name: value };
    
    case 'description':
      // Product description - V3 uses plainDescription (HTML string)
      return {
        plainDescription: `<p>${value}</p>`,
      };
    
    case 'seoTitle':
      // SEO page title - V3 uses seoData.tags array
      return {
        seoData: {
          tags: [
            {
              type: 'title',
              children: value,
            },
          ],
        },
      };
    
    case 'seoDescription':
      // SEO meta description - V3 uses seoData.tags array
      return {
        seoData: {
          tags: [
            {
              type: 'meta',
              props: {
                name: 'description',
                content: value,
              },
            },
          ],
        },
      };
    
    default:
      throw new Error(`Unknown attribute type: ${attribute}`);
  }
}

/**
 * POST /api/publish
 * Publish optimized content to Wix store
 */
router.post('/api/publish', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const { itemIds } = req.body;

    // Validate request body
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'itemIds must be a non-empty array',
      });
      return;
    }

    // Get instance and create Wix client
    const instance = await getAppInstance(instanceId);
    
    if (!instance) {
      res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND',
        message: 'App instance not found. Please reinstall the app.',
      });
      return;
    }

    // Get fresh access token (automatically refreshes if expired)
    const accessToken = await getInstanceToken(instanceId);

    const wixClient = new WixStoresClient(
      accessToken,
      instance.refresh_token,
      instanceId,
      instance.catalog_version
    );

    // Process each item
    const results = [];

    for (const itemId of itemIds) {
      try {
        // Get job item and verify it belongs to this instance
        const item = await getJobItem(itemId, instanceId);

        if (!item) {
          results.push({
            itemId,
            success: false,
            error: 'Item not found or does not belong to this instance',
          });
          continue;
        }

        // Verify item status is DONE
        if (item.status !== 'DONE') {
          results.push({
            itemId,
            success: false,
            error: `Item status is ${item.status}, must be DONE to publish`,
          });
          continue;
        }

        // Verify after_value exists
        if (!item.after_value) {
          results.push({
            itemId,
            success: false,
            error: 'No optimized content available',
          });
          continue;
        }

        // Detect catalog version (default to V3 for backward compatibility)
        const catalogVersion = instance.catalog_version || 'V3';
        
        // Build update payload using correct structure for catalog version
        const updatePayload = catalogVersion === 'V1'
          ? buildProductUpdateV1(item.attribute, item.after_value)
          : buildProductUpdateV3(item.attribute, item.after_value);

        console.log(`[Publish] Using ${catalogVersion} format for product ${item.product_id}, attribute ${item.attribute}`);

        // For SEO fields, we need to merge with existing seoData.tags to avoid overwriting
        if (item.attribute === 'seoTitle' || item.attribute === 'seoDescription') {
          // Fetch current product to get existing seoData
          const currentProduct = await wixClient.getProduct(item.product_id);
          const existingTags = currentProduct.seoData?.tags || [];
          
          // Filter out the tag we're updating (title or meta description)
          const tagTypeToUpdate = item.attribute === 'seoTitle' ? 'title' : 'meta';
          const filteredTags = existingTags.filter((tag: any) => {
            if (tagTypeToUpdate === 'title') {
              return tag.type !== 'title';
            } else {
              return !(tag.type === 'meta' && tag.props?.name === 'description');
            }
          });
          
          // Merge with new tag
          updatePayload.seoData = {
            ...currentProduct.seoData,
            tags: [...filteredTags, ...updatePayload.seoData.tags],
          };
        }

        // Call Wix API to update product
        await wixClient.updateProduct(item.product_id, updatePayload);

        // Create publish log entry
        await createPublishLog({
          instanceId,
          productId: item.product_id,
          attribute: item.attribute,
          appliedValue: item.after_value,
          jobItemId: item.id,
        });

        console.log(
          `Published item ${itemId}: product ${item.product_id}, attribute ${item.attribute}`
        );

        results.push({
          itemId,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error publishing item ${itemId}:`, error);
        
        results.push({
          itemId,
          success: false,
          error: error.message || 'Failed to publish to Wix',
        });
      }
    }

    // Return results array
    res.json({ results });
  } catch (error: any) {
    console.error('Error in publish endpoint:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while publishing',
      details: error.message,
    });
  }
});

export default router;
