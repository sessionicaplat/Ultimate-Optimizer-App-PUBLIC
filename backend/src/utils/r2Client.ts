import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { logger } from './logger';
import axios from 'axios';

/**
 * Cloudflare R2 Client for permanent image storage
 * Uses S3-compatible API
 * 
 * SETUP:
 * 1. Create Cloudflare account and R2 bucket
 * 2. Generate R2 API token with Read & Write permissions
 * 3. Set environment variables:
 *    - CLOUDFLARE_ACCOUNT_ID
 *    - CLOUDFLARE_R2_ACCESS_KEY_ID
 *    - CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *    - CLOUDFLARE_R2_BUCKET_NAME (optional, default: optimized-images)
 *    - CLOUDFLARE_R2_PUBLIC_URL (optional, for custom domain)
 * 4. Test with: npm run r2:test
 * 
 * FEATURES:
 * - Automatic fallback to Replicate URLs if R2 not configured
 * - Organized storage: instances/{instanceId}/jobs/{jobId}/image-{itemId}.ext
 * - 1-year cache headers for optimal CDN performance
 * - Supports jpg, png, webp, gif formats
 * 
 * COST (as of 2024):
 * - Storage: $0.015/GB/month
 * - Class A (uploads): $4.50/million
 * - Class B (downloads): $0.36/million
 * - No egress fees (unlike AWS S3)
 * - Estimated: ~$2-3/month for 10,000 images
 */
class R2Client {
  private client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;
  private enabled: boolean = false;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || 'optimized-images';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() || '';

    // Check if R2 is configured
    if (!accountId || !accessKeyId || !secretAccessKey) {
      logger.warn('[R2Client] Cloudflare R2 not configured - optimized images will use Replicate URLs (temporary)');
      logger.warn('[R2Client] To enable permanent storage, set: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY');
      this.enabled = false;
      return;
    }

    // Validate credentials format
    if (accountId.length < 10 || accessKeyId.length < 10 || secretAccessKey.length < 10) {
      logger.error('[R2Client] Invalid R2 credentials format - credentials appear too short');
      logger.warn('[R2Client] Falling back to Replicate URLs');
      this.enabled = false;
      return;
    }

    try {
      // Initialize S3 client with R2 endpoint
      const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
      
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        // Force path-style addressing for R2 compatibility
        forcePathStyle: false,
        // Use TLS 1.2+ for better compatibility
        tls: true,
        // Increase timeout for better reliability
        requestHandler: {
          connectionTimeout: 30000,
          socketTimeout: 30000,
        } as any,
      });

      this.enabled = true;
      logger.info('[R2Client] Initialized successfully');
      logger.info(`[R2Client] Endpoint: ${endpoint}`);
      logger.info(`[R2Client] Bucket: ${this.bucketName}`);
      logger.info(`[R2Client] Public URL: ${this.publicUrl || 'Not configured (using R2 direct URLs)'}`);
      
      // Test connection asynchronously (don't block initialization)
      this.testConnection().catch((err) => {
        logger.error('[R2Client] Connection test failed:', err.message);
        logger.warn('[R2Client] R2 uploads may fail - check credentials and network connectivity');
      });
    } catch (error: any) {
      logger.error('[R2Client] Failed to initialize:', error.message);
      logger.error('[R2Client] Please verify:');
      logger.error('[R2Client]   1. CLOUDFLARE_ACCOUNT_ID is correct');
      logger.error('[R2Client]   2. CLOUDFLARE_R2_ACCESS_KEY_ID is correct');
      logger.error('[R2Client]   3. CLOUDFLARE_R2_SECRET_ACCESS_KEY is correct');
      logger.error('[R2Client]   4. API token has Read & Write permissions');
      this.enabled = false;
    }
  }

  /**
   * Test R2 connection (called asynchronously during initialization)
   */
  private async testConnection(): Promise<void> {
    if (!this.client) return;
    
    try {
      // Try to list objects (this validates credentials without uploading)
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1,
        })
      );
      logger.info('[R2Client] ✅ Connection test successful');
    } catch (error: any) {
      // Provide specific error guidance
      if (error.name === 'NoSuchBucket') {
        throw new Error(`Bucket "${this.bucketName}" does not exist. Create it in Cloudflare dashboard.`);
      } else if (error.name === 'InvalidAccessKeyId') {
        throw new Error('Invalid Access Key ID. Check CLOUDFLARE_R2_ACCESS_KEY_ID.');
      } else if (error.name === 'SignatureDoesNotMatch') {
        throw new Error('Invalid Secret Access Key. Check CLOUDFLARE_R2_SECRET_ACCESS_KEY.');
      } else if (error.message?.includes('ssl') || error.message?.includes('TLS') || error.message?.includes('EPROTO')) {
        throw new Error('SSL/TLS connection failed. This may be a network or Node.js version issue.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if R2 is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Upload an image from a URL to R2
   * @param imageUrl - Source URL (e.g., Replicate temporary URL)
   * @param key - Storage key/path in R2
   * @returns Public URL of uploaded image
   */
  async uploadFromUrl(imageUrl: string, key: string): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('R2 client is not enabled');
    }

    try {
      logger.debug(`[R2Client] Downloading image from: ${imageUrl}`);

      // Download image from source URL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });

      const imageBuffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/jpeg';

      logger.debug(`[R2Client] Downloaded ${imageBuffer.length} bytes, type: ${contentType}`);

      // Upload to R2
      const uploadResult = await this.uploadBuffer(imageBuffer, key, contentType);

      logger.info(`[R2Client] ✅ Uploaded to R2: ${key}`);

      return uploadResult;
    } catch (error: any) {
      logger.error(`[R2Client] Failed to upload from URL:`, error.message);
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Upload a buffer directly to R2
   * @param buffer - Image buffer
   * @param key - Storage key/path in R2
   * @param contentType - MIME type
   * @returns Public URL of uploaded image
   */
  async uploadBuffer(buffer: Buffer, key: string, contentType: string = 'image/jpeg'): Promise<string> {
    if (!this.isEnabled() || !this.client) {
      throw new Error('R2 client is not enabled');
    }

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000', // 1 year cache
        },
      });

      await upload.done();

      // Return public URL
      return this.getPublicUrl(key);
    } catch (error: any) {
      logger.error(`[R2Client] Failed to upload buffer:`, error.message);
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Delete an image from R2
   * @param key - Storage key/path in R2
   */
  async deleteImage(key: string): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      throw new Error('R2 client is not enabled');
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      logger.debug(`[R2Client] Deleted: ${key}`);
    } catch (error: any) {
      logger.error(`[R2Client] Failed to delete:`, error.message);
      throw new Error(`R2 delete failed: ${error.message}`);
    }
  }

  /**
   * Generate public URL for an R2 object
   * @param key - Storage key/path in R2
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      // Use custom domain if configured
      return `${this.publicUrl}/${key}`;
    } else {
      // Use R2 public URL format
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      return `https://pub-${accountId}.r2.dev/${key}`;
    }
  }

  /**
   * Generate storage key for an optimized image
   * Format: instances/{instanceId}/jobs/{jobId}/image-{itemId}.jpg
   * @param instanceId - App instance ID
   * @param jobId - Job ID
   * @param itemId - Item ID
   * @param extension - File extension (default: jpg)
   * @returns Storage key
   */
  generateKey(instanceId: string, jobId: number, itemId: number, extension: string = 'jpg'): string {
    // Sanitize instanceId (remove special characters)
    const sanitizedInstanceId = instanceId.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `instances/${sanitizedInstanceId}/jobs/${jobId}/image-${itemId}.${extension}`;
  }

  /**
   * Generate storage key for a blog featured image
   * Format: blogs/{instanceId}/generations/{generationId}/featured-image.ext
   * @param instanceId - App instance ID
   * @param generationId - Blog generation ID
   * @param extension - File extension (default: jpg)
   * @returns Storage key
   */
  generateBlogImageKey(instanceId: string, generationId: number, extension: string = 'jpg'): string {
    // Sanitize instanceId (remove special characters)
    const sanitizedInstanceId = instanceId.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `blogs/${sanitizedInstanceId}/generations/${generationId}/featured-image.${extension}`;
  }

  /**
   * Extract file extension from URL or content type
   * @param url - Image URL
   * @param contentType - MIME type
   * @returns File extension (jpg, png, webp, etc.)
   */
  getExtension(url: string, contentType?: string): string {
    // Try to get from content type first
    if (contentType) {
      if (contentType.includes('png')) return 'png';
      if (contentType.includes('webp')) return 'webp';
      if (contentType.includes('gif')) return 'gif';
    }

    // Try to get from URL
    const urlMatch = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (urlMatch) {
      return urlMatch[1].toLowerCase();
    }

    // Default to jpg
    return 'jpg';
  }
}

// Export singleton instance
export const r2Client = new R2Client();

