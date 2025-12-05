import { EventEmitter } from 'events';
import {
  getPendingBlogGenerations,
  getBlogGenerationsByStatus,
  getAllBlogsNeedingProcessing,
  updateBlogGeneration,
  type BlogGeneration,
} from '../db/blogGenerations';
import {
  getAppInstance,
  incrementCreditsUsed,
  updateOwnerEmail,
  updateOwnerMemberId,
  updateDefaultWriter,
} from '../db/appInstances';
import { BlogOpenAIClient } from '../openai/blogClient';
import { optimizeImage } from '../replicate/client';
import { createWixClient } from '../wix/sdkClient';
import { getInstanceToken } from '../wix/tokenHelper';
import {
  getOrCreateMemberIdByEmail,
  getOrCreateOwnerMemberId,
  getSiteOwnerInfo,
} from '../wix/memberHelper';
import { uploadImageToWixMedia } from '../wix/mediaHelper';
import { generateWriterEmail } from '../utils/writer';
import { query } from '../db/index';
import { openAIRateLimiter } from '../utils/rateLimiter';
import { replicateRateLimiter } from '../utils/replicateRateLimiter';
import { logger } from '../utils/logger';
import { r2Client } from '../utils/r2Client';

const workerEmitter = new EventEmitter();
let isProcessing = false;

const BLOG_GENERATION_CREDITS = 25;
const BATCH_SIZE = 1000; // Fetch 1000 pending blogs at a time (increased from 100)
const MAX_PER_INSTANCE = 50; // Max 50 blogs per instance per batch (increased from 20)
const CHUNK_SIZE = 50; // Process 50 blogs at a time to prevent memory exhaustion
const MAX_RETRIES = 3; // Maximum retry attempts for failed blogs

/**
 * Notify worker that a new blog generation is available
 */
export function notifyBlogGenerationCreated() {
  workerEmitter.emit('new-generation');
}

/**
 * Start the blog generation worker
 */
export function startBlogGenerationWorker() {
  logger.info('[Blog Worker] Starting with optimized batch processing...');
  logger.info(`[Blog Worker] Config: ${BATCH_SIZE} batch size, ${MAX_PER_INSTANCE} max per instance, ${CHUNK_SIZE} chunk size`);

  // Listen for new generation notifications
  workerEmitter.on('new-generation', () => {
    if (!isProcessing) {
      processBlogBatch();
    }
  });

  // Initial check for pending generations
  processBlogBatch();

  // Periodic check every 10 seconds
  setInterval(() => {
    if (!isProcessing) {
      processBlogBatch();
    }
  }, 10000);

  logger.info('[Blog Worker] Started successfully');
}

/**
 * Process pending blog generations with stage-based parallelism
 * All blogs at the same stage are processed simultaneously
 * This ensures true parallelism across different stores
 */
async function processBlogBatch() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;
  let cycleCount = 0;
  let lastHeartbeat = Date.now();

  try {
    while (true) {
      cycleCount++;
      const startTime = Date.now();

      // Fetch ALL blogs that need processing (any stage)
      const blogsNeedingWork = await getAllBlogsNeedingProcessing(BATCH_SIZE, MAX_PER_INSTANCE);

      if (blogsNeedingWork.length === 0) {
        logger.debug('[Blog Worker] No blogs need processing');
        break;
      }

      // Log heartbeat every 30 seconds
      const now = Date.now();
      if (now - lastHeartbeat > 30000) {
        const stats = openAIRateLimiter.getStats();
        const replicateStats = replicateRateLimiter.getStats();
        logger.info(
          `[Blog Worker] Heartbeat - cycle ${cycleCount} | ` +
          `Queue: ${stats.queueLength} | ` +
          `OpenAI RPM: ${stats.requestsInLastMinute}/${stats.maxRPM} (${stats.rpmUsagePercent}%) | ` +
          `Replicate RPM: ${replicateStats.requestsInLastMinute}/${replicateStats.maxRPM} (${replicateStats.rpmUsagePercent}%)`
        );
        lastHeartbeat = now;
      }

      // Count unique instances for fairness logging
      const uniqueInstances = new Set(blogsNeedingWork.map(g => g.instance_id)).size;
      
      // Group blogs by what stage they need
      const blogsNeedingIdeas: BlogGeneration[] = [];
      const blogsNeedingContent: BlogGeneration[] = [];
      const blogsNeedingImage: BlogGeneration[] = [];
      const blogsNeedingPublish: BlogGeneration[] = [];

      for (const blog of blogsNeedingWork) {
        const hasIdeas = blog.blog_ideas && Array.isArray(blog.blog_ideas) && blog.blog_ideas.length > 0;
        const hasSelectedIdea = typeof blog.selected_idea_index === 'number' && blog.selected_idea_index >= 0;
        const hasContent = !!blog.blog_content;
        const hasImage = !!blog.blog_image_url;
        const hasPublished = !!blog.draft_post_id;

        if (!hasIdeas && blog.status !== 'AWAITING_SELECTION') {
          blogsNeedingIdeas.push(blog);
        } else if (hasIdeas && hasSelectedIdea && !hasContent) {
          blogsNeedingContent.push(blog);
        } else if (hasContent && !hasImage) {
          blogsNeedingImage.push(blog);
        } else if (hasContent && hasImage && !hasPublished) {
          blogsNeedingPublish.push(blog);
        }
      }

      logger.info(
        `[Blog Worker] Processing batch: ${blogsNeedingWork.length} blogs from ${uniqueInstances} store(s) | ` +
        `Ideas: ${blogsNeedingIdeas.length}, Content: ${blogsNeedingContent.length}, Image: ${blogsNeedingImage.length}, Publish: ${blogsNeedingPublish.length}`
      );

      // Process all blogs at each stage in CHUNKS to prevent memory exhaustion
      
      // Stage 1: Idea generation (chunked)
      if (blogsNeedingIdeas.length > 0) {
        await processInChunks(blogsNeedingIdeas, CHUNK_SIZE, async (blog) => {
          await processIdeaGeneration(blog).catch(error => {
            logger.error(`[Blog Worker] Error generating ideas for blog ${blog.id}:`, error.message);
            handleBlogError(blog.id, error);
          });
        });
      }

      // Stage 2: Content generation (chunked)
      if (blogsNeedingContent.length > 0) {
        await processInChunks(blogsNeedingContent, CHUNK_SIZE, async (blog) => {
          await processContentGeneration(blog).catch(error => {
            logger.error(`[Blog Worker] Error generating content for blog ${blog.id}:`, error.message);
            handleBlogError(blog.id, error);
          });
        });
      }

      // Stage 3: Image generation (chunked)
      if (blogsNeedingImage.length > 0) {
        await processInChunks(blogsNeedingImage, CHUNK_SIZE, async (blog) => {
          await processImageGeneration(blog).catch(error => {
            logger.error(`[Blog Worker] Error generating image for blog ${blog.id}:`, error.message);
            handleBlogError(blog.id, error);
          });
        });
      }

      // Stage 4: Publishing (chunked)
      if (blogsNeedingPublish.length > 0) {
        await processInChunks(blogsNeedingPublish, CHUNK_SIZE, async (blog) => {
          await processPublishing(blog).catch(error => {
            logger.error(`[Blog Worker] Error publishing blog ${blog.id}:`, error.message);
            handleBlogError(blog.id, error);
          });
        });
      }

      const elapsed = Date.now() - startTime;
      logger.info(
        `[Blog Worker] Batch complete: ${blogsNeedingWork.length} blogs in ${Math.round(elapsed / 1000)}s`
      );

      // If we got a full batch, there might be more pending
      if (blogsNeedingWork.length === BATCH_SIZE) {
        logger.debug('[Blog Worker] Full batch, checking for more blogs');
        continue; // Continue to next batch immediately
      } else {
        // Partial batch means we're done
        break;
      }
    }
  } catch (error: any) {
    logger.error('[Blog Worker] Error in processBlogBatch:', error);
  } finally {
    isProcessing = false;
  }
}



/**
 * Process blogs in chunks to prevent memory exhaustion
 * @param blogs - Array of blogs to process
 * @param chunkSize - Number of blogs to process concurrently
 * @param processFn - Function to process each blog
 */
async function processInChunks<T>(
  blogs: T[],
  chunkSize: number,
  processFn: (blog: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < blogs.length; i += chunkSize) {
    const chunk = blogs.slice(i, i + chunkSize);
    logger.debug(`[Blog Worker] Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(blogs.length / chunkSize)} (${chunk.length} blogs)`);
    
    await Promise.all(chunk.map(blog => processFn(blog)));
    
    // Small delay between chunks to allow garbage collection
    if (i + chunkSize < blogs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Handle blog processing errors with retry logic
 * @param blogId - Blog generation ID
 * @param error - Error that occurred
 */
async function handleBlogError(blogId: number, error: any): Promise<void> {
  try {
    // Get current blog to check retry count
    const result = await query(
      `SELECT retry_count FROM blog_generations WHERE id = $1`,
      [blogId]
    );
    
    const retryCount = result.rows[0]?.retry_count || 0;
    
    if (retryCount < MAX_RETRIES) {
      // Retry: Reset to PENDING with incremented retry count
      await query(
        `UPDATE blog_generations 
         SET status = 'PENDING', 
             retry_count = $1,
             last_error = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [retryCount + 1, error.message, blogId]
      );
      logger.info(`[Blog Worker] Blog ${blogId} will retry (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    } else {
      // Max retries reached: Mark as FAILED
      await updateBlogGeneration(blogId, {
        status: 'FAILED',
        error: `Failed after ${MAX_RETRIES} attempts: ${error.message}`
      });
      logger.error(`[Blog Worker] Blog ${blogId} failed after ${MAX_RETRIES} attempts`);
    }
  } catch (err: any) {
    logger.error(`[Blog Worker] Error handling blog error for ${blogId}:`, err.message);
  }
}

/**
 * Stage 1: Generate blog ideas
 */
async function processIdeaGeneration(generation: BlogGeneration) {
  const generationId = generation.id;
  
  // Check if ideas already exist (pre-selected from frontend)
  if (generation.blog_ideas && Array.isArray(generation.blog_ideas) && generation.blog_ideas.length > 0) {
    logger.debug(`[Blog Worker] Blog ${generationId} already has ${generation.blog_ideas.length} idea(s), skipping generation`);
    
    // If idea is also selected, keep as PENDING for content generation
    if (typeof generation.selected_idea_index === 'number' && generation.selected_idea_index >= 0) {
      logger.debug(`[Blog Worker] Blog ${generationId} has pre-selected idea at index ${generation.selected_idea_index}, ready for content generation`);
      await updateBlogGeneration(generationId, {
        status: 'PENDING' // Ready for content generation stage
      });
    } else {
      // Ideas exist but not selected, wait for user
      logger.debug(`[Blog Worker] Blog ${generationId} has ideas but none selected, awaiting user selection`);
      await updateBlogGeneration(generationId, {
        status: 'AWAITING_SELECTION' as any,
      });
    }
    return;
  }
  
  await updateBlogGeneration(generationId, {
    status: 'GENERATING_IDEAS' as any,
  });

  const instance = await getAppInstance(generation.instance_id);
  if (!instance) {
    throw new Error('Instance not found');
  }

  // Get source data
  let sourceData = '';
  if (generation.source_type === 'product' && generation.source_id) {
    const product = await loadProductForGeneration(generation, instance);
    if (product) {
      sourceData = formatProductSummary(product);
    } else {
      sourceData = generation.source_id;
    }
  } else {
    sourceData = generation.source_id || 'General blog topic';
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const blogClient = new BlogOpenAIClient(openaiApiKey);

  logger.debug(`[Blog Worker] Generating ideas for blog ${generationId}`);
  
  const ideas = await openAIRateLimiter.executeWithRateLimit(
    () => blogClient.generateBlogIdeas({
      sourceType: generation.source_type,
      sourceData,
    }),
    2000
  );

  await updateBlogGeneration(generationId, {
    blog_ideas: ideas,
    status: 'AWAITING_SELECTION' as any,
  });

  logger.debug(`[Blog Worker] Generated ${ideas.length} ideas for blog ${generationId}`);
}

/**
 * Stage 2: Generate blog content
 */
async function processContentGeneration(generation: BlogGeneration) {
  const generationId = generation.id;
  
  await updateBlogGeneration(generationId, {
    status: 'GENERATING_CONTENT',
  });

  const instance = await getAppInstance(generation.instance_id);
  if (!instance) {
    throw new Error('Instance not found');
  }

  const ideas = generation.blog_ideas as any[];
  const selectedIdea = ideas[generation.selected_idea_index!];

  if (!selectedIdea) {
    throw new Error(`Invalid idea index ${generation.selected_idea_index}`);
  }

  logger.debug(`[Blog Worker] Generating content for blog ${generationId}: "${selectedIdea.title}"`);

  // Get source data
  let sourceData = '';
  if (generation.source_type === 'product' && generation.source_id) {
    const product = await loadProductForGeneration(generation, instance);
    if (product) {
      sourceData = formatProductSummary(product);
    } else {
      sourceData = generation.source_id;
    }
  } else {
    sourceData = generation.source_id || 'General blog topic';
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const blogClient = new BlogOpenAIClient(openaiApiKey);

  const blogContent = await openAIRateLimiter.executeWithRateLimit(
    () => blogClient.generateBlogPost({
      idea: selectedIdea,
      sourceType: generation.source_type,
      sourceData,
    }),
    4000
  );

  await updateBlogGeneration(generationId, {
    blog_title: blogContent.title,
    blog_content: blogContent.content,
    blog_image_prompt: blogContent.imagePrompt,
    status: 'PENDING', // Back to PENDING for next stage
  });

  logger.debug(`[Blog Worker] Generated content for blog ${generationId}`);
}

/**
 * Stage 3: Generate blog image
 */
async function processImageGeneration(generation: BlogGeneration) {
  const generationId = generation.id;
  
  await updateBlogGeneration(generationId, {
    status: 'GENERATING_IMAGE',
  });

  const instance = await getAppInstance(generation.instance_id);
  if (!instance) {
    throw new Error('Instance not found');
  }

  logger.debug(`[Blog Worker] Generating image for blog ${generationId}`);

  let fallbackImage: string | null = null;

  try {
    // Try to get product image as fallback
    if (generation.source_type === 'product' && generation.source_id) {
      const product = await loadProductForGeneration(generation, instance);
      fallbackImage = product ? extractProductImage(product) : null;
    }

    const prompt =
      generation.blog_image_prompt ||
      `Featured image for a blog post titled "${generation.blog_title}" with a realistic, modern aesthetic`;

    const replicateImageUrl = await replicateRateLimiter.executeWithRateLimit(
      () => optimizeImage(null, prompt)
    );

    let finalImageUrl = replicateImageUrl;

    // Upload to R2 for permanent storage (if enabled)
    if (r2Client.isEnabled()) {
      try {
        logger.debug(`[Blog Worker] Uploading blog image to R2 for generation ${generationId}...`);
        
        const extension = r2Client.getExtension(replicateImageUrl);
        const storageKey = r2Client.generateBlogImageKey(
          generation.instance_id,
          generationId,
          extension
        );
        
        const r2Url = await r2Client.uploadFromUrl(replicateImageUrl, storageKey);
        finalImageUrl = r2Url;
        
        logger.info(`[Blog Worker] ✅ Blog image uploaded to R2: ${storageKey}`);
      } catch (r2Error: any) {
        logger.error(`[Blog Worker] R2 upload failed for blog ${generationId}, using Replicate URL:`, r2Error.message);
        // Continue with Replicate URL (temporary but better than failing)
      }
    }

    await updateBlogGeneration(generationId, {
      blog_image_url: finalImageUrl,
      status: 'PENDING', // Back to PENDING for next stage
    });

    logger.debug(`[Blog Worker] Generated image for blog ${generationId}`);
  } catch (error: any) {
    logger.error(`[Blog Worker] Image generation failed for ${generationId}:`, error.message);

    let fallbackImageUrl = fallbackImage || 'https://via.placeholder.com/1200x630';

    // Try to upload fallback to R2 if it's a real image
    if (r2Client.isEnabled() && fallbackImage) {
      try {
        logger.debug(`[Blog Worker] Uploading fallback image to R2 for blog ${generationId}...`);
        
        const extension = r2Client.getExtension(fallbackImage);
        const storageKey = r2Client.generateBlogImageKey(
          generation.instance_id,
          generationId,
          extension
        );
        
        fallbackImageUrl = await r2Client.uploadFromUrl(fallbackImage, storageKey);
        
        logger.info(`[Blog Worker] ✅ Fallback image uploaded to R2: ${storageKey}`);
      } catch (r2Error: any) {
        logger.error(`[Blog Worker] Failed to upload fallback image to R2:`, r2Error.message);
        // Continue with original fallback URL
      }
    }

    await updateBlogGeneration(generationId, {
      blog_image_url: fallbackImageUrl,
      status: 'PENDING', // Continue despite image failure
    });
  }
}

/**
 * Stage 4: Publish blog to Wix
 */
async function processPublishing(generation: BlogGeneration) {
  const generationId = generation.id;
  
  await updateBlogGeneration(generationId, {
    status: 'PUBLISHING',
  });

  const instance = await getAppInstance(generation.instance_id);
  if (!instance) {
    throw new Error('Instance not found');
  }

  logger.debug(`[Blog Worker] Publishing blog ${generationId}`);

  // Get author member ID
  const authorMemberId = await getAuthorMemberIdForInstance(instance);

  if (!authorMemberId) {
    throw new Error('Author member ID not available. Configure a default blog writer.');
  }

  // Convert HTML to Wix rich content
  const richContent = convertHtmlToRichContent(generation.blog_content!);
  
  // Upload image to Wix Media Manager
  let wixMediaImageUrl: string | undefined;
  if (generation.blog_image_url) {
    try {
      const token = await getInstanceToken(instance.instance_id);
      wixMediaImageUrl = await uploadImageToWixMedia(generation.blog_image_url, token);
      logger.debug(`[Blog Worker] Image uploaded to Wix Media for blog ${generationId}`);
    } catch (error: any) {
      logger.error(`[Blog Worker] Failed to upload image for blog ${generationId}:`, error.message);
    }
  }
  
  // Create draft post
  const token = await getInstanceToken(instance.instance_id);
  const wixClient = createWixClient(token);
  
  const draftPost = await wixClient.createDraftPost({
    title: generation.blog_title!,
    richContent,
    memberId: authorMemberId,
    wixMediaImageUrl,
  });

  await updateBlogGeneration(generationId, {
    draft_post_id: draftPost._id,
    status: 'DONE',
  });

  // Increment credits used
  await incrementCreditsUsed(instance.instance_id, BLOG_GENERATION_CREDITS);

  logger.info(`[Blog Worker] ✅ Published blog ${generationId}: "${generation.blog_title}"`);
  
  // Update scheduled blog status if linked
  await updateScheduledBlogStatus(generationId, 'COMPLETED');
}

/**
 * Helper: Load product for a generation
 */
async function loadProductForGeneration(
  generation: BlogGeneration,
  instance: any
): Promise<any | null> {
  if (generation.source_type !== 'product' || !generation.source_id) {
    return null;
  }

  try {
    const token = await getInstanceToken(instance.instance_id);
    const wixClient = createWixClient(token);
    return await wixClient.getProduct(generation.source_id);
  } catch (error: any) {
    logger.error(`[Blog Worker] Failed to load product ${generation.source_id}:`, error.message);
    return null;
  }
}

/**
 * Helper: Get author member ID for instance
 */
async function getAuthorMemberIdForInstance(instance: any): Promise<string | null> {
  // Try default writer first
  if (instance.default_writer_member_id) {
    return instance.default_writer_member_id;
  }

  // Try to create/get default writer
  if (instance.default_writer_name) {
    try {
      const writerEmail =
        instance.default_writer_email ||
        generateWriterEmail(instance.default_writer_name, instance.instance_id);

      const token = await getInstanceToken(instance.instance_id);
      const memberId = await getOrCreateMemberIdByEmail(
        { accessToken: token, siteId: instance.site_id },
        writerEmail,
        {
          nickname: instance.default_writer_name,
          privacyStatus: 'PUBLIC',
        }
      );

      if (memberId) {
        await updateDefaultWriter(instance.instance_id, {
          email: writerEmail,
          memberId,
        });
        return memberId;
      }
    } catch (error: any) {
      logger.error(`[Blog Worker] Failed to get writer member ID:`, error.message);
    }
  }

  // Fall back to owner
  if (instance.owner_member_id) {
    return instance.owner_member_id;
  }

  // Try to get/create owner member
  if (instance.owner_email) {
    try {
      const token = await getInstanceToken(instance.instance_id);
      const memberId = await getOrCreateOwnerMemberId(
        { accessToken: token, siteId: instance.site_id },
        instance.owner_email
      );

      if (memberId) {
        await updateOwnerMemberId(instance.instance_id, memberId);
        return memberId;
      }
    } catch (error: any) {
      logger.error(`[Blog Worker] Failed to get owner member ID:`, error.message);
    }
  }

  return null;
}

/**
 * DEPRECATED: Old monolithic processing function (kept for reference)
 * This is replaced by stage-specific functions above
 */
async function processBlogGeneration(generationId: number) {
  try {
    // Get generation without instance_id check (worker has access to all)
    const generationResult = await query(
      `SELECT * FROM blog_generations WHERE id = $1`,
      [generationId]
    );

    const generation = normalizeGenerationRecord(generationResult.rows[0]);

    if (!generation) {
      console.error(`[Blog Worker] Generation ${generationId} not found`);
      return;
    }

    const hasIdeas =
      Array.isArray(generation.blog_ideas) && generation.blog_ideas.length > 0;
    const hasSelectedIdea =
      typeof generation.selected_idea_index === 'number' &&
      generation.selected_idea_index >= 0;

    console.log(`[Blog Worker] Generation ${generationId} state:`, {
      status: generation.status,
      has_ideas: hasIdeas,
      has_selection: hasSelectedIdea,
      has_content: !!generation.blog_content,
    });

    const instance = await getAppInstance(generation.instance_id);
    if (!instance) {
      await updateBlogGeneration(generationId, {
        status: 'FAILED',
        error: 'Instance not found',
      });
      return;
    }

    let cachedAccessToken: string | null = null;

    const getSiteAccessToken = async (forceRefresh = false) => {
      if (forceRefresh || !cachedAccessToken) {
        cachedAccessToken = await getInstanceToken(instance.instance_id, {
          forceRefresh,
        });
      }
      return cachedAccessToken;
    };

    // Always get fresh token for each operation to avoid stale token issues
    const getAuthorizedWixClient = async (forceRefresh = false) => {
      const token = await getSiteAccessToken(forceRefresh);
      return createWixClient(token);
    };

    let cachedProduct: any | null = null;
    const loadProduct = async () => {
      if (generation.source_type !== 'product' || !generation.source_id) {
        return null;
      }

      if (!cachedProduct) {
        console.log(`[Blog Worker] Fetching product ${generation.source_id}`);
        try {
          const wixClient = await getAuthorizedWixClient();
          cachedProduct = await wixClient.getProduct(generation.source_id);
        } catch (error: any) {
          if (isUnauthenticatedError(error)) {
            const wixClient = await getAuthorizedWixClient(true);
            cachedProduct = await wixClient.getProduct(generation.source_id);
          } else {
            throw error;
          }
        }
      }

      return cachedProduct;
    };

    const ensureOwnerEmail = async (): Promise<string | null> => {
      if (instance.owner_email && instance.site_id) {
        return instance.owner_email;
      }

      try {
        console.log(
          `[Blog Worker] Owner metadata missing for ${instance.instance_id}, fetching from Wix...`
        );
        const token = await getSiteAccessToken();
        const ownerInfo = await getSiteOwnerInfo(token);
        const ownerEmail = ownerInfo.ownerEmail;
        const siteId = ownerInfo.siteId;

        if (ownerEmail) {
          await updateOwnerEmail(instance.instance_id, ownerEmail, { siteId });
          instance.owner_email = ownerEmail;
          if (siteId) {
            instance.site_id = siteId;
          }
          console.log(
            `[Blog Worker] Stored owner email ${ownerEmail}${
              siteId ? ` (siteId: ${siteId})` : ''
            } for ${instance.instance_id}`
          );
          return ownerEmail;
        }

        if (siteId && instance.owner_email) {
          await updateOwnerEmail(instance.instance_id, instance.owner_email, {
            siteId,
          });
          instance.site_id = siteId;
          console.log(
            `[Blog Worker] Stored missing siteId ${siteId} for ${instance.instance_id}`
          );
          return instance.owner_email;
        }

        console.warn(
          `[Blog Worker] Wix did not return owner email/siteId for ${instance.instance_id}`
        );
        return instance.owner_email || null;
      } catch (error) {
        console.error(
          `[Blog Worker] Error retrieving owner metadata for ${instance.instance_id}:`,
          error
        );
        return instance.owner_email || null;
      }
    };

    const ensureWriterMemberId = async (): Promise<string | null> => {
      if (!instance.default_writer_name) {
        return null;
      }

      if (instance.default_writer_member_id) {
        return instance.default_writer_member_id;
      }

      const writerEmail =
        instance.default_writer_email ||
        generateWriterEmail(instance.default_writer_name, instance.instance_id);

      if (!instance.site_id) {
        await ensureOwnerEmail();
      }

      try {
        const token = await getSiteAccessToken();
        const memberId = await getOrCreateMemberIdByEmail(
          { accessToken: token, siteId: instance.site_id },
          writerEmail,
          {
            nickname: instance.default_writer_name,
            privacyStatus: 'PUBLIC',
          }
        );

        if (memberId) {
          await updateDefaultWriter(instance.instance_id, {
            email: writerEmail,
            memberId,
          });
          instance.default_writer_email = writerEmail;
          instance.default_writer_member_id = memberId;
          console.log(
            `[Blog Worker] Stored default writer member ID ${memberId} for ${instance.instance_id}`
          );
          return memberId;
        }
      } catch (error: any) {
        console.error(
          `[Blog Worker] Failed to ensure default writer member for ${instance.instance_id}:`,
          error?.message || error
        );
      }

      return null;
    };

    const getOwnerMemberId = async (): Promise<string | null> => {
      if (instance.owner_member_id) {
        return instance.owner_member_id;
      }

      const ownerEmail = instance.owner_email || (await ensureOwnerEmail());

      if (!ownerEmail) {
        console.error(
          `[Blog Worker] Cannot resolve owner member ID — owner email missing for ${instance.instance_id}`
        );
        return null;
      }

      try {
        console.log(
          `[Blog Worker] Getting member ID for owner email: ${ownerEmail}`
        );

        const token = await getSiteAccessToken();
        const memberId = await getOrCreateOwnerMemberId(
          { accessToken: token, siteId: instance.site_id },
          ownerEmail
        );

        if (memberId) {
          await updateOwnerMemberId(instance.instance_id, memberId);
          instance.owner_member_id = memberId;
          console.log(
            `[Blog Worker] Stored owner member ID ${memberId} for ${instance.instance_id}`
          );
          return memberId;
        }

        console.error(
          `[Blog Worker] Failed to get/create member ID for ${ownerEmail}`
        );
        return null;
      } catch (error: any) {
        console.error(
          '[Blog Worker] Error getting owner member ID:',
          error.message || error
        );
        return null;
      }
    };

    const getAuthorMemberId = async (): Promise<string | null> => {
      const writerMemberId = await ensureWriterMemberId();
      if (writerMemberId) {
        return writerMemberId;
      }

      return getOwnerMemberId();
    };

    /**
     * Get the site owner's member ID
     * This queries/creates a Site Member record using the owner's email
     */
    // Initialize OpenAI client
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error(`[Blog Worker] OPENAI_API_KEY not configured!`);
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log(`[Blog Worker] OpenAI API key is configured`);
    const blogClient = new BlogOpenAIClient(openaiApiKey);

    // Step 1: Generate blog ideas (if not already generated)
    if (!hasIdeas) {
      logger.debug(`[Blog Worker] Starting idea generation for ${generationId}`);
      
      await updateBlogGeneration(generationId, {
        status: 'GENERATING_IDEAS' as any,
      });

      // Get source data
      let sourceData = '';
      if (generation.source_type === 'product' && generation.source_id) {
        const product = await loadProduct();
        if (product) {
          sourceData = formatProductSummary(product);
        } else {
          sourceData = generation.source_id;
        }
      } else {
        sourceData = generation.source_id || 'General blog topic';
      }

      logger.debug(`[Blog Worker] Calling OpenAI for ideas (with rate limiting)...`);
      
      // Use rate limiter for OpenAI API call
      const ideas = await openAIRateLimiter.executeWithRateLimit(
        () => blogClient.generateBlogIdeas({
          sourceType: generation.source_type,
          sourceData,
        }),
        2000 // Estimated tokens for idea generation
      );

      logger.debug(`[Blog Worker] OpenAI returned ${ideas.length} ideas for ${generationId}`);

      await updateBlogGeneration(generationId, {
        blog_ideas: ideas,
        status: 'AWAITING_SELECTION' as any,
      });

      logger.debug(`[Blog Worker] Completed idea generation for ${generationId}, status: AWAITING_SELECTION`);
      generation.blog_ideas = ideas;
      generation.status = 'AWAITING_SELECTION';
      return; // Wait for user selection
    }
    
    logger.debug(`[Blog Worker] Generation ${generationId} already has ideas, checking for selection...`);

    if (hasIdeas && !hasSelectedIdea && !generation.blog_content) {
      if (generation.status !== 'AWAITING_SELECTION') {
        await updateBlogGeneration(generationId, {
          status: 'AWAITING_SELECTION' as any,
        });
        generation.status = 'AWAITING_SELECTION';
      }

      logger.debug(`[Blog Worker] Waiting for merchant selection for ${generationId}`);
      return;
    }

    // Step 2: Generate blog content (if idea is selected)
    if (hasSelectedIdea && !generation.blog_content) {
      await updateBlogGeneration(generationId, {
        status: 'GENERATING_CONTENT',
      });

      logger.debug(`[Blog Worker] Generating content for ${generationId}`);

      const ideas = generation.blog_ideas as any[];
      const selectedIdea = ideas[generation.selected_idea_index!];

      if (!selectedIdea) {
        throw new Error(
          `Selected idea index ${generation.selected_idea_index} is invalid for generation ${generationId}`
        );
      }
      
      logger.debug(`[Blog Worker] Using selected idea: "${selectedIdea.title}"`);

      // Get source data
      let sourceData = '';
      if (generation.source_type === 'product' && generation.source_id) {
        const product = await loadProduct();
        if (product) {
          sourceData = formatProductSummary(product);
        } else {
          sourceData = generation.source_id;
        }
      } else {
        sourceData = generation.source_id || 'General blog topic';
      }

      // Use rate limiter for OpenAI API call
      const blogContent = await openAIRateLimiter.executeWithRateLimit(
        () => blogClient.generateBlogPost({
          idea: selectedIdea,
          sourceType: generation.source_type,
          sourceData,
        }),
        4000 // Estimated tokens for blog content generation
      );

      await updateBlogGeneration(generationId, {
        blog_title: blogContent.title,
        blog_content: blogContent.content,
        blog_image_prompt: blogContent.imagePrompt,
      });

      logger.debug(`[Blog Worker] Generated content for ${generationId}: "${blogContent.title}"`);
      generation.blog_title = blogContent.title;
      generation.blog_content = blogContent.content;
      generation.blog_image_prompt = blogContent.imagePrompt;
    }

    // Step 3: Generate blog image
    if (generation.blog_content && generation.blog_title && !generation.blog_image_url) {
      await updateBlogGeneration(generationId, {
        status: 'GENERATING_IMAGE',
      });

      logger.debug(`[Blog Worker] Generating image for ${generationId}`);

      let fallbackImage: string | null = null;

      try {
        const product = await loadProduct();
        fallbackImage = product ? extractProductImage(product) : null;

        const prompt =
          generation.blog_image_prompt ||
          `Featured image for a blog post titled "${generation.blog_title}" with a realistic, modern aesthetic`;

        // Use rate limiter for Replicate API call
        const imageUrl = await replicateRateLimiter.executeWithRateLimit(
          () => optimizeImage(null, prompt)
        );

        await updateBlogGeneration(generationId, {
          blog_image_url: imageUrl,
        });

        logger.debug(`[Blog Worker] Generated image for ${generationId}`);
        generation.blog_image_url = imageUrl;
      } catch (error: any) {
        logger.error(`[Blog Worker] Image generation failed for ${generationId}:`, error.message);

        const fallbackImageUrl =
          fallbackImage || 'https://via.placeholder.com/1200x630';

        await updateBlogGeneration(generationId, {
          blog_image_url: fallbackImageUrl,
        });

        generation.blog_image_url = fallbackImageUrl;
      }
    }

    // Step 4: Create draft post in Wix
    if (generation.blog_content && !generation.draft_post_id) {
      await updateBlogGeneration(generationId, {
        status: 'PUBLISHING',
      });

      logger.debug(`[Blog Worker] Creating draft post for ${generationId}`);

      // Get author member ID (default writer or site owner)
      const authorMemberId = await getAuthorMemberId();

      if (!authorMemberId) {
        throw new Error(
          'Author member ID not available. Configure a default blog writer in the dashboard and try again.'
        );
      }

      // Convert HTML content to Wix rich content format
      const richContent = convertHtmlToRichContent(generation.blog_content);
      
      // Upload image to Wix Media Manager if we have one
      let wixMediaImageUrl: string | undefined;
      if (generation.blog_image_url) {
        try {
          logger.debug(`[Blog Worker] Uploading image to Wix Media Manager...`);
          const token = await getSiteAccessToken();
          wixMediaImageUrl = await uploadImageToWixMedia(
            generation.blog_image_url,
            token
          );
          logger.debug(`[Blog Worker] Image uploaded to Wix Media: ${wixMediaImageUrl}`);
        } catch (error: any) {
          logger.error(
            `[Blog Worker] Failed to upload image to Wix Media:`,
            error.message
          );
          // Continue without image rather than failing the entire post
        }
      }
      
      const createDraft = async (forceRefresh = false) => {
        const wixClient = await getAuthorizedWixClient(forceRefresh);
        
        return wixClient.createDraftPost({
          title: generation.blog_title!,
          richContent,
          memberId: authorMemberId,
          wixMediaImageUrl,
        });
      };

      let draftPost;
      try {
        draftPost = await createDraft();
      } catch (error: any) {
        if (isUnauthenticatedError(error)) {
          logger.warn(
            `[Blog Worker] Draft creation failed due to auth error, refreshing token and retrying...`
          );
          draftPost = await createDraft(true);
        } else {
          throw error;
        }
      }

      await updateBlogGeneration(generationId, {
        draft_post_id: draftPost._id,
        status: 'DONE',
      });

      // Increment credits used
      await incrementCreditsUsed(instance.instance_id, BLOG_GENERATION_CREDITS);

      logger.info(`[Blog Worker] ✅ Completed blog ${generationId}: "${generation.blog_title}"`);
      
      // Update scheduled blog status if this generation is linked to one
      await updateScheduledBlogStatus(generationId, 'COMPLETED');
      
      generation.draft_post_id = draftPost._id;
      generation.status = 'DONE';
    }

  } catch (error: any) {
    logger.error(`[Blog Worker] ❌ Error processing generation ${generationId}:`, error.message);
    
    await updateBlogGeneration(generationId, {
      status: 'FAILED',
      error: error.message,
    });
    
    // Update scheduled blog status if this generation is linked to one
    await updateScheduledBlogStatus(generationId, 'FAILED', error.message);
  }
}

/**
 * Update scheduled blog status when blog generation completes or fails
 */
async function updateScheduledBlogStatus(
  blogGenerationId: number,
  status: 'COMPLETED' | 'FAILED',
  error?: string
) {
  try {
    const result = await query(
      `UPDATE scheduled_blogs 
       SET status = $1, error = $2
       WHERE blog_generation_id = $3
       RETURNING id`,
      [status, error || null, blogGenerationId]
    );
    
    if (result.rows.length > 0) {
      console.log(
        `[Blog Worker] Updated scheduled blog ${result.rows[0].id} status to ${status}`
      );
    }
  } catch (err: any) {
    console.error(
      `[Blog Worker] Failed to update scheduled blog status for generation ${blogGenerationId}:`,
      err
    );
  }
}

/**
 * Convert HTML content to Wix rich content format
 */
function convertHtmlToRichContent(html: string): any {
  // Simple conversion - in production, use a proper HTML parser
  const paragraphs = html
    .split(/<\/?p>/)
    .filter(p => p.trim())
    .map((text, index) => ({
      type: 'PARAGRAPH',
      id: `p${index}`,
      nodes: [
        {
          type: 'TEXT',
          id: '',
          nodes: [],
          textData: {
            text: text.replace(/<[^>]+>/g, ''), // Strip HTML tags
            decorations: [],
          },
        },
      ],
      paragraphData: {},
    }));

  return {
    nodes: paragraphs,
  };
}

/**
 * Normalize generation record values that come from Postgres
 */
function normalizeGenerationRecord(
  record: BlogGeneration | null | undefined
): BlogGeneration | null | undefined {
  if (!record) {
    return record;
  }

  const normalized: BlogGeneration & { blog_ideas?: any } = { ...record };

  if (record.blog_ideas && !Array.isArray(record.blog_ideas)) {
    try {
      normalized.blog_ideas =
        typeof record.blog_ideas === 'string'
          ? JSON.parse(record.blog_ideas)
          : record.blog_ideas;
    } catch (error) {
      console.error('[Blog Worker] Failed to parse blog_ideas JSON:', error);
      normalized.blog_ideas = [];
    }
  }

  if (typeof normalized.selected_idea_index === 'string') {
    const parsed = parseInt(normalized.selected_idea_index, 10);
    normalized.selected_idea_index = Number.isNaN(parsed) ? null : parsed;
  }

  if (normalized.selected_idea_index === undefined) {
    normalized.selected_idea_index = null;
  }

  return normalized;
}

function formatProductSummary(product: any): string {
  const description =
    product?.description ||
    product?.product?.description ||
    product?.additionalInfoSections
      ?.map((section: any) => section?.description)
      .filter(Boolean)
      .join('\n') ||
    'N/A';

  const tags =
    Array.isArray(product?.tags) && product.tags.length
      ? product.tags.slice(0, 5).join(', ')
      : '';

  return [
    `Product Name: ${product?.name || product?.product?.name || 'Unnamed product'}`,
    `Description: ${stripHtml(description)}`,
    tags ? `Tags: ${tags}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function extractProductImage(product: any): string | null {
  const candidates = [
    product?.media?.mainMedia?.image?.url,
    product?.product?.media?.mainMedia?.image?.url,
    product?.mediaItems?.[0]?.image?.url,
    product?.media?.items?.[0]?.image?.url,
    product?.product?.media?.items?.[0]?.image?.url,
    product?.media?.mainMedia?.url,
    product?.product?.media?.mainMedia?.url,
  ];

  const found = candidates.find(
    (url) => typeof url === 'string' && url.trim().length > 0
  );
  return found || null;
}

function stripHtml(text: string): string {
  return text ? text.replace(/<[^>]+>/g, '') : '';
}

function isUnauthenticatedError(error: any): boolean {
  const message: string | undefined = error?.message || error?.response?.data?.message;
  const code: string | undefined = error?.details?.applicationError?.code;
  const status = error?.response?.status;

  return (
    status === 401 ||
    code === 'UNAUTHENTICATED' ||
    (typeof message === 'string' && message.toUpperCase().includes('UNAUTHENTICATED'))
  );
}
