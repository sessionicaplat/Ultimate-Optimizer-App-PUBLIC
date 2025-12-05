import { getDueScheduledBlogs, updateScheduledBlog } from '../db/blogScheduler';
import { createBlogGeneration, updateBlogGeneration } from '../db/blogGenerations';
import { notifyBlogGenerationCreated } from './blogGenerationWorker';

let isProcessing = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Start the blog scheduler worker
 */
export function startBlogSchedulerWorker() {
  if (schedulerInterval) {
    console.log('[Blog Scheduler Worker] Already running');
    return;
  }

  console.log('[Blog Scheduler Worker] Starting...');

  // Check every minute for due scheduled blogs
  schedulerInterval = setInterval(async () => {
    await processDueScheduledBlogs();
  }, 60000); // 1 minute

  // Run immediately on start
  processDueScheduledBlogs();
}

/**
 * Stop the blog scheduler worker
 */
export function stopBlogSchedulerWorker() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Blog Scheduler Worker] Stopped');
  }
}

/**
 * Process due scheduled blogs
 */
async function processDueScheduledBlogs() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const currentTime = new Date().toISOString();
    console.log(`[Blog Scheduler Worker] Checking for due blogs at ${currentTime}`);
    
    const dueBlogs = await getDueScheduledBlogs();

    if (dueBlogs.length === 0) {
      return;
    }

    console.log(`[Blog Scheduler Worker] Found ${dueBlogs.length} due scheduled blogs`);

    for (const scheduledBlog of dueBlogs) {
      try {
        // Mark as processing
        await updateScheduledBlog(scheduledBlog.id, {
          status: 'PROCESSING',
        });

        // Create blog generation
        const blogGeneration = await createBlogGeneration({
          instanceId: scheduledBlog.instance_id,
          sourceType: scheduledBlog.source_type,
          sourceId: scheduledBlog.source_id,
        });

        // If there's a pre-selected idea, add it
        if (scheduledBlog.blog_idea) {
          await updateBlogGeneration(blogGeneration.id, {
            blog_ideas: [scheduledBlog.blog_idea],
            selected_idea_index: 0,
          });
        }

        // Link the blog generation to the scheduled blog
        await updateScheduledBlog(scheduledBlog.id, {
          blog_generation_id: blogGeneration.id,
        });

        // Notify the blog generation worker
        notifyBlogGenerationCreated();

        console.log(
          `[Blog Scheduler Worker] Created blog generation ${blogGeneration.id} for scheduled blog ${scheduledBlog.id}`
        );
      } catch (error: any) {
        console.error(
          `[Blog Scheduler Worker] Error processing scheduled blog ${scheduledBlog.id}:`,
          error
        );

        await updateScheduledBlog(scheduledBlog.id, {
          status: 'FAILED',
          error: error.message || 'Failed to create blog generation',
        });
      }
    }
  } catch (error: any) {
    console.error('[Blog Scheduler Worker] Error processing due scheduled blogs:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Manually trigger processing (for testing)
 */
export async function triggerScheduledBlogProcessing() {
  await processDueScheduledBlogs();
}
