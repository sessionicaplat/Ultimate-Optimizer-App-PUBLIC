import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  createScheduledBlog,
  getScheduledBlogs,
  getAllScheduledBlogs,
  updateScheduledBlog,
  deleteScheduledBlog,
  getCampaignWithStats,
} from '../db/blogScheduler';

const router = Router();

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/api/campaigns', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Campaign name is required',
      });
      return;
    }

    // Check active campaign limit (10 max)
    const activeCampaigns = await getCampaigns(instanceId, false);
    if (activeCampaigns.length >= 10) {
      res.status(400).json({
        error: 'Campaign limit reached',
        message: 'You can have a maximum of 10 active campaigns. Archive some campaigns to create new ones.',
      });
      return;
    }

    const campaign = await createCampaign({
      instanceId,
      name: name.trim(),
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    console.error('[Blog Scheduler] Error creating campaign:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create campaign',
    });
  }
});

/**
 * GET /api/campaigns
 * Get all campaigns
 */
router.get('/api/campaigns', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const includeArchived = req.query.archived === 'true';

    const campaigns = await getCampaigns(instanceId, includeArchived);

    res.json({ campaigns });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error fetching campaigns:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch campaigns',
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get a single campaign with stats
 */
router.get('/api/campaigns/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid campaign ID',
      });
      return;
    }

    const campaign = await getCampaignWithStats(id, instanceId);

    if (!campaign) {
      res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found',
      });
      return;
    }

    res.json(campaign);
  } catch (error: any) {
    console.error('[Blog Scheduler] Error fetching campaign:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch campaign',
    });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update a campaign
 */
router.put('/api/campaigns/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const id = parseInt(req.params.id, 10);
    const { name, status } = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid campaign ID',
      });
      return;
    }

    const campaign = await getCampaign(id, instanceId);

    if (!campaign) {
      res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found',
      });
      return;
    }

    const updates: any = {};

    if (name && typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }

    if (status && ['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(status)) {
      updates.status = status;
    }

    await updateCampaign(id, updates);

    res.json({ message: 'Campaign updated successfully' });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error updating campaign:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update campaign',
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign
 */
router.delete('/api/campaigns/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid campaign ID',
      });
      return;
    }

    const campaign = await getCampaign(id, instanceId);

    if (!campaign) {
      res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found',
      });
      return;
    }

    await deleteCampaign(id);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error deleting campaign:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete campaign',
    });
  }
});

/**
 * POST /api/campaigns/:id/scheduled-blogs
 * Add scheduled blogs to a campaign
 */
router.post('/api/campaigns/:id/scheduled-blogs', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const campaignId = parseInt(req.params.id, 10);
    const { scheduledBlogs } = req.body;

    if (isNaN(campaignId)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid campaign ID',
      });
      return;
    }

    if (!Array.isArray(scheduledBlogs) || scheduledBlogs.length === 0) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'scheduledBlogs must be a non-empty array',
      });
      return;
    }

    if (scheduledBlogs.length > 30) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Cannot schedule more than 30 blogs at once',
      });
      return;
    }

    const campaign = await getCampaign(campaignId, instanceId);

    if (!campaign) {
      res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found',
      });
      return;
    }

    // Validate and create scheduled blogs
    const created = [];
    for (const blog of scheduledBlogs) {
      if (!blog.sourceType || !['product', 'keyword'].includes(blog.sourceType)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Each blog must have a valid sourceType (product or keyword)',
        });
        return;
      }

      if (!blog.scheduledDate) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Each blog must have a scheduledDate',
        });
        return;
      }

      const scheduledDate = new Date(blog.scheduledDate);
      if (isNaN(scheduledDate.getTime())) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid scheduledDate format',
        });
        return;
      }

      const scheduledBlog = await createScheduledBlog({
        campaignId,
        instanceId,
        sourceType: blog.sourceType,
        sourceId: blog.sourceId,
        blogIdea: blog.blogIdea,
        scheduledDate,
      });

      created.push(scheduledBlog);
    }

    res.status(201).json({ scheduledBlogs: created });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error creating scheduled blogs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create scheduled blogs',
    });
  }
});

/**
 * GET /api/campaigns/:id/scheduled-blogs
 * Get scheduled blogs for a campaign
 */
router.get('/api/campaigns/:id/scheduled-blogs', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const campaignId = parseInt(req.params.id, 10);

    if (isNaN(campaignId)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid campaign ID',
      });
      return;
    }

    const scheduledBlogs = await getScheduledBlogs(campaignId, instanceId);

    res.json({ scheduledBlogs });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error fetching scheduled blogs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch scheduled blogs',
    });
  }
});

/**
 * GET /api/scheduled-blogs
 * Get all scheduled blogs for the instance
 */
router.get('/api/scheduled-blogs', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;

    const scheduledBlogs = await getAllScheduledBlogs(instanceId);

    res.json({ scheduledBlogs });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error fetching scheduled blogs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch scheduled blogs',
    });
  }
});

/**
 * PUT /api/scheduled-blogs/:id
 * Update a scheduled blog
 */
router.put('/api/scheduled-blogs/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const id = parseInt(req.params.id, 10);
    const { scheduledDate, status } = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid scheduled blog ID',
      });
      return;
    }

    const updates: any = {};

    if (scheduledDate) {
      const date = new Date(scheduledDate);
      if (isNaN(date.getTime())) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid scheduledDate format',
        });
        return;
      }
      updates.scheduled_date = date;
    }

    if (status && ['SCHEDULED', 'CANCELLED'].includes(status)) {
      updates.status = status;
    }

    await updateScheduledBlog(id, updates);

    res.json({ message: 'Scheduled blog updated successfully' });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error updating scheduled blog:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update scheduled blog',
    });
  }
});

/**
 * DELETE /api/scheduled-blogs/:id
 * Delete a scheduled blog
 */
router.delete('/api/scheduled-blogs/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid scheduled blog ID',
      });
      return;
    }

    await deleteScheduledBlog(id);

    res.json({ message: 'Scheduled blog deleted successfully' });
  } catch (error: any) {
    console.error('[Blog Scheduler] Error deleting scheduled blog:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete scheduled blog',
    });
  }
});

export default router;
