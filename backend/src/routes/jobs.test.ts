import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import jobsRouter from './jobs';
import * as appInstances from '../db/appInstances';
import * as jobsDb from '../db/jobs';
import * as db from '../db/index';
import { AppInstance, Job, JobItem } from '../db/types';

// Mock the modules
vi.mock('../db/appInstances');
vi.mock('../db/jobs');
vi.mock('../db/index');
vi.mock('../auth/verifyInstance', () => ({
  verifyInstance: (req: any, res: any, next: any) => {
    req.wixInstance = { instanceId: 'test-instance-id' };
    next();
  },
}));

describe('Jobs API - Credit Validation', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create Express app with JSON middleware
    app = express();
    app.use(express.json());
    app.use(jobsRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/jobs - Sufficient Credits', () => {
    it('should create job when user has sufficient credits', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'free',
        credits_total: 100,
        credits_used_month: 20,
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockJob: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'PENDING',
        source_scope: 'products',
        source_ids: ['prod1', 'prod2'],
        attributes: { title: true, description: true },
        target_lang: 'en',
        user_prompt: 'Make it better',
        created_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);
      
      // Mock transaction to execute callback
      vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
        const mockClient = {
          query: vi.fn().mockResolvedValue({ rows: [mockJob] }),
        };
        return callback(mockClient);
      });

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: ['prod1', 'prod2'],
          attributes: { title: true, description: true },
          targetLang: 'en',
          userPrompt: 'Make it better',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        jobId: 1,
        status: 'PENDING',
        requiredCredits: 4, // 2 products × 2 attributes
        remainingCredits: 76, // 80 - 4
        productCount: 2,
        attributeCount: 2,
        totalItems: 4,
      });

      expect(appInstances.getAppInstance).toHaveBeenCalledWith('test-instance-id');
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should create job with exact credits remaining', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'starter',
        credits_total: 1000,
        credits_used_month: 996, // Exactly 4 credits remaining
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockJob: Job = {
        id: 2,
        instance_id: 'test-instance-id',
        status: 'PENDING',
        source_scope: 'products',
        source_ids: ['prod1'],
        attributes: { title: true, description: true, seo: true, metadata: true },
        target_lang: 'en',
        user_prompt: 'Optimize',
        created_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);
      vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
        const mockClient = {
          query: vi.fn().mockResolvedValue({ rows: [mockJob] }),
        };
        return callback(mockClient);
      });

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: ['prod1'],
          attributes: { title: true, description: true, seo: true, metadata: true },
          targetLang: 'en',
          userPrompt: 'Optimize',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        jobId: 2,
        requiredCredits: 4, // 1 product × 4 attributes
        remainingCredits: 0, // Exactly 0 after using all credits
      });
    });

    it('should handle collection scope with multiple products', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'pro',
        credits_total: 5000,
        credits_used_month: 0,
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockJob: Job = {
        id: 3,
        instance_id: 'test-instance-id',
        status: 'PENDING',
        source_scope: 'collections',
        source_ids: [
          { collectionId: 'col1', productIds: ['p1', 'p2', 'p3'] },
          { collectionId: 'col2', productIds: ['p4', 'p5'] },
        ],
        attributes: { title: true },
        target_lang: 'en',
        user_prompt: 'Optimize titles',
        created_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);
      vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
        const mockClient = {
          query: vi.fn().mockResolvedValue({ rows: [mockJob] }),
        };
        return callback(mockClient);
      });

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'collections',
          sourceIds: [
            { collectionId: 'col1', productIds: ['p1', 'p2', 'p3'] },
            { collectionId: 'col2', productIds: ['p4', 'p5'] },
          ],
          attributes: { title: true },
          targetLang: 'en',
          userPrompt: 'Optimize titles',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        requiredCredits: 5, // 5 products × 1 attribute
        productCount: 5,
        attributeCount: 1,
      });
    });
  });

  describe('POST /api/jobs - Insufficient Credits', () => {
    it('should return 402 when user has insufficient credits', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'free',
        credits_total: 100,
        credits_used_month: 98, // Only 2 credits remaining
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: ['prod1', 'prod2'],
          attributes: { title: true, description: true },
          targetLang: 'en',
          userPrompt: 'Make it better',
        });

      expect(response.status).toBe(402);
      expect(response.body).toMatchObject({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        required: 4,
        remaining: 2,
        creditsTotal: 100,
        creditsUsed: 98,
      });

      // Verify no job was created
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('should return 402 when user has zero credits', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'free',
        credits_total: 100,
        credits_used_month: 100, // No credits remaining
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: ['prod1'],
          attributes: { title: true },
          targetLang: 'en',
          userPrompt: 'Optimize',
        });

      expect(response.status).toBe(402);
      expect(response.body).toMatchObject({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        required: 1,
        remaining: 0,
      });
    });

    it('should return 402 for large job exceeding available credits', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'starter',
        credits_total: 1000,
        credits_used_month: 950, // 50 credits remaining
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: Array.from({ length: 20 }, (_, i) => `prod${i}`), // 20 products
          attributes: { title: true, description: true, seo: true }, // 3 attributes
          targetLang: 'en',
          userPrompt: 'Bulk optimize',
        });

      expect(response.status).toBe(402);
      expect(response.body).toMatchObject({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        required: 60, // 20 × 3
        remaining: 50,
      });
    });
  });

  describe('POST /api/jobs - Concurrent Job Creation', () => {
    it('should handle sequential job creation with credit deduction', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'free',
        credits_total: 100,
        credits_used_month: 90, // 10 credits remaining
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // First request should succeed
      vi.mocked(appInstances.getAppInstance).mockResolvedValueOnce(mockInstance);
      
      const mockJob1: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'PENDING',
        source_scope: 'products',
        source_ids: ['prod1'],
        attributes: { title: true },
        target_lang: 'en',
        user_prompt: 'First job',
        created_at: new Date(),
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (callback: any) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [mockJob1] }) // Job creation
            .mockResolvedValueOnce({ rows: [] }), // Credit increment
        };
        return callback(mockClient);
      });

      const response1 = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: ['prod1'],
          attributes: { title: true },
          targetLang: 'en',
          userPrompt: 'First job',
        });

      expect(response1.status).toBe(201);
      expect(response1.body.requiredCredits).toBe(1);

      // Second request should see updated credits (simulating sequential execution)
      const updatedInstance: AppInstance = {
        ...mockInstance,
        credits_used_month: 91, // After first job
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValueOnce(updatedInstance);

      const mockJob2: Job = {
        id: 2,
        instance_id: 'test-instance-id',
        status: 'PENDING',
        source_scope: 'products',
        source_ids: Array.from({ length: 5 }, (_, i) => `prod${i}`),
        attributes: { title: true, description: true },
        target_lang: 'en',
        user_prompt: 'Second job',
        created_at: new Date(),
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (callback: any) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [mockJob2] })
            .mockResolvedValueOnce({ rows: [] }),
        };
        return callback(mockClient);
      });

      const response2 = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: Array.from({ length: 5 }, (_, i) => `prod${i}`),
          attributes: { title: true, description: true },
          targetLang: 'en',
          userPrompt: 'Second job',
        });

      // Second job should fail due to insufficient credits (needs 10, only 9 remaining)
      expect(response2.status).toBe(402);
      expect(response2.body.required).toBe(10);
      expect(response2.body.remaining).toBe(9);
    });

    it('should use transaction to ensure atomic credit deduction', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'free',
        credits_total: 100,
        credits_used_month: 95, // 5 credits remaining
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);

      const mockJob: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'PENDING',
        source_scope: 'products',
        source_ids: ['prod1'],
        attributes: { title: true, description: true, seo: true },
        target_lang: 'en',
        user_prompt: 'Job 1',
        created_at: new Date(),
      };

      // Mock transaction that creates job and increments credits atomically
      vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [mockJob] }) // Job creation
            .mockResolvedValueOnce({ rows: [] }), // Credit increment
        };
        return callback(mockClient);
      });

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: ['prod1'],
          attributes: { title: true, description: true, seo: true },
          targetLang: 'en',
          userPrompt: 'Job 1',
        });

      expect(response.status).toBe(201);
      
      // Verify transaction was called (ensures atomic operation)
      expect(db.transaction).toHaveBeenCalled();
      
      // Verify the transaction callback received a client
      const transactionCallback = vi.mocked(db.transaction).mock.calls[0][0];
      expect(transactionCallback).toBeDefined();
    });

    it('should rollback transaction if credit increment fails', async () => {
      const mockInstance: AppInstance = {
        instance_id: 'test-instance-id',
        site_host: 'test-site.wixsite.com',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_expires_at: new Date(),
        plan_id: 'free',
        credits_total: 100,
        credits_used_month: 50,
        credits_reset_on: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(appInstances.getAppInstance).mockResolvedValue(mockInstance);

      // Mock transaction that fails during credit increment
      vi.mocked(db.transaction).mockRejectedValue(new Error('Database error during credit update'));

      const response = await request(app)
        .post('/api/jobs')
        .send({
          sourceScope: 'products',
          sourceIds: ['prod1'],
          attributes: { title: true },
          targetLang: 'en',
          userPrompt: 'Test job',
        });

      // Should return 500 error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
      
      // Transaction ensures job creation is rolled back if credit increment fails
      expect(db.transaction).toHaveBeenCalled();
    });
  });
});

describe('Jobs API - Job Monitoring Endpoints', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use(jobsRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/jobs - List Jobs', () => {
    it('should return all jobs for an instance', async () => {
      const mockJobs: Job[] = [
        {
          id: 1,
          instance_id: 'test-instance-id',
          status: 'RUNNING',
          source_scope: 'products',
          source_ids: ['p1', 'p2'],
          attributes: { title: true, description: true },
          target_lang: 'en',
          user_prompt: 'Optimize',
          created_at: new Date(),
          started_at: new Date(),
        },
        {
          id: 2,
          instance_id: 'test-instance-id',
          status: 'PENDING',
          source_scope: 'collections',
          source_ids: [{ collectionId: 'c1', productIds: ['p3', 'p4', 'p5'] }],
          attributes: { title: true },
          target_lang: 'en',
          user_prompt: 'Improve',
          created_at: new Date(),
        },
      ];

      const mockItems1: JobItem[] = [
        { id: 1, job_id: 1, instance_id: 'test-instance', product_id: 'p1', attribute: 'title', status: 'DONE', before_value: 'Old', after_value: 'New', created_at: new Date(), updated_at: new Date() },
        { id: 2, job_id: 1, instance_id: 'test-instance', product_id: 'p1', attribute: 'description', status: 'RUNNING', before_value: undefined, after_value: undefined, created_at: new Date(), updated_at: new Date() },
        { id: 3, job_id: 1, instance_id: 'test-instance', product_id: 'p2', attribute: 'title', status: 'PENDING', before_value: undefined, after_value: undefined, created_at: new Date(), updated_at: new Date() },
        { id: 4, job_id: 1, instance_id: 'test-instance', product_id: 'p2', attribute: 'description', status: 'PENDING', before_value: undefined, after_value: undefined, created_at: new Date(), updated_at: new Date() },
      ];

      const mockItems2: JobItem[] = [
        { id: 5, job_id: 2, instance_id: 'test-instance', product_id: 'p3', attribute: 'title', status: 'PENDING', before_value: undefined, after_value: undefined, created_at: new Date(), updated_at: new Date() },
        { id: 6, job_id: 2, instance_id: 'test-instance', product_id: 'p4', attribute: 'title', status: 'PENDING', before_value: undefined, after_value: undefined, created_at: new Date(), updated_at: new Date() },
        { id: 7, job_id: 2, instance_id: 'test-instance', product_id: 'p5', attribute: 'title', status: 'PENDING', before_value: undefined, after_value: undefined, created_at: new Date(), updated_at: new Date() },
      ];

      vi.mocked(jobsDb.getJobs).mockResolvedValue(mockJobs);
      vi.mocked(jobsDb.getJobItems)
        .mockResolvedValueOnce(mockItems1)
        .mockResolvedValueOnce(mockItems2);

      const response = await request(app).get('/api/jobs');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(2);
      
      // Check first job with progress
      expect(response.body.jobs[0]).toMatchObject({
        id: 1,
        status: 'RUNNING',
        sourceScope: 'products',
        productCount: 2,
        attributeCount: 2,
        totalItems: 4,
        completedItems: 1, // Only 1 DONE
        progress: 25, // 1/4 = 25%
      });

      // Check second job
      expect(response.body.jobs[1]).toMatchObject({
        id: 2,
        status: 'PENDING',
        sourceScope: 'collections',
        productCount: 3,
        attributeCount: 1,
        totalItems: 3,
        completedItems: 0,
        progress: 0,
      });

      expect(jobsDb.getJobs).toHaveBeenCalledWith('test-instance-id', undefined);
    });

    it('should filter jobs by status', async () => {
      const mockJobs: Job[] = [
        {
          id: 1,
          instance_id: 'test-instance-id',
          status: 'DONE',
          source_scope: 'products',
          source_ids: ['p1'],
          attributes: { title: true },
          target_lang: 'en',
          user_prompt: 'Test',
          created_at: new Date(),
          finished_at: new Date(),
        },
      ];

      const mockItems: JobItem[] = [
        { id: 1, job_id: 1, instance_id: 'test-instance', product_id: 'p1', attribute: 'title', status: 'DONE', before_value: 'Old', after_value: 'New', created_at: new Date(), updated_at: new Date() },
      ];

      vi.mocked(jobsDb.getJobs).mockResolvedValue(mockJobs);
      vi.mocked(jobsDb.getJobItems).mockResolvedValue(mockItems);

      const response = await request(app).get('/api/jobs?status=DONE');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].status).toBe('DONE');
      expect(jobsDb.getJobs).toHaveBeenCalledWith('test-instance-id', 'DONE');
    });

    it('should return empty array when no jobs exist', async () => {
      vi.mocked(jobsDb.getJobs).mockResolvedValue([]);

      const response = await request(app).get('/api/jobs');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toEqual([]);
    });

    it('should calculate progress correctly with failed items', async () => {
      const mockJobs: Job[] = [
        {
          id: 1,
          instance_id: 'test-instance-id',
          status: 'FAILED',
          source_scope: 'products',
          source_ids: ['p1'],
          attributes: { title: true, description: true },
          target_lang: 'en',
          user_prompt: 'Test',
          created_at: new Date(),
          finished_at: new Date(),
        },
      ];

      const mockItems: JobItem[] = [
        { id: 1, job_id: 1, instance_id: 'test-instance', product_id: 'p1', attribute: 'title', status: 'DONE', before_value: 'Old', after_value: 'New', created_at: new Date(), updated_at: new Date() },
        { id: 2, job_id: 1, instance_id: 'test-instance', product_id: 'p1', attribute: 'description', status: 'FAILED', before_value: undefined, after_value: undefined, error: 'API Error', created_at: new Date(), updated_at: new Date() },
      ];

      vi.mocked(jobsDb.getJobs).mockResolvedValue(mockJobs);
      vi.mocked(jobsDb.getJobItems).mockResolvedValue(mockItems);

      const response = await request(app).get('/api/jobs');

      expect(response.status).toBe(200);
      expect(response.body.jobs[0]).toMatchObject({
        totalItems: 2,
        completedItems: 2, // Both DONE and FAILED count as completed
        progress: 100,
      });
    });
  });

  describe('GET /api/jobs/:id - Get Job Details', () => {
    it('should return job details by ID', async () => {
      const mockJob: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'RUNNING',
        source_scope: 'products',
        source_ids: ['p1', 'p2'],
        attributes: { title: true, description: true },
        target_lang: 'en',
        user_prompt: 'Make it better',
        created_at: new Date('2024-01-01'),
        started_at: new Date('2024-01-01T00:01:00'),
      };

      vi.mocked(jobsDb.getJob).mockResolvedValue(mockJob);

      const response = await request(app).get('/api/jobs/1');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        status: 'RUNNING',
        sourceScope: 'products',
        sourceIds: ['p1', 'p2'],
        attributes: { title: true, description: true },
        targetLang: 'en',
        userPrompt: 'Make it better',
      });

      expect(jobsDb.getJob).toHaveBeenCalledWith(1, 'test-instance-id');
    });

    it('should return 404 when job not found', async () => {
      vi.mocked(jobsDb.getJob).mockResolvedValue(null);

      const response = await request(app).get('/api/jobs/999');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
      });
    });

    it('should return 400 for invalid job ID', async () => {
      const response = await request(app).get('/api/jobs/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Invalid job ID',
      });
    });

    it('should ensure instance isolation', async () => {
      vi.mocked(jobsDb.getJob).mockResolvedValue(null);

      await request(app).get('/api/jobs/1');

      // Verify getJob was called with instance ID for isolation
      expect(jobsDb.getJob).toHaveBeenCalledWith(1, 'test-instance-id');
    });
  });

  describe('GET /api/jobs/:id/items - Get Job Items', () => {
    it('should return all items for a job', async () => {
      const mockJob: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'DONE',
        source_scope: 'products',
        source_ids: ['p1'],
        attributes: { title: true, description: true },
        target_lang: 'en',
        user_prompt: 'Test',
        created_at: new Date(),
        finished_at: new Date(),
      };

      const mockItems: JobItem[] = [
        {
          id: 1,
          job_id: 1,
          instance_id: 'test-instance',
          product_id: 'p1',
          attribute: 'title',
          status: 'DONE',
          before_value: 'Old Title',
          after_value: 'New Optimized Title',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          job_id: 1,
          instance_id: 'test-instance',
          product_id: 'p1',
          attribute: 'description',
          status: 'DONE',
          before_value: 'Old description',
          after_value: 'New optimized description',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(jobsDb.getJob).mockResolvedValue(mockJob);
      vi.mocked(jobsDb.getJobItems).mockResolvedValue(mockItems);

      const response = await request(app).get('/api/jobs/1/items');

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0]).toMatchObject({
        id: 1,
        jobId: 1,
        productId: 'p1',
        attribute: 'title',
        status: 'DONE',
        beforeValue: 'Old Title',
        afterValue: 'New Optimized Title',
      });

      expect(jobsDb.getJob).toHaveBeenCalledWith(1, 'test-instance-id');
      expect(jobsDb.getJobItems).toHaveBeenCalledWith(1, 'test-instance-id');
    });

    it('should return 404 when job not found', async () => {
      vi.mocked(jobsDb.getJob).mockResolvedValue(null);

      const response = await request(app).get('/api/jobs/999/items');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
      });

      // Should not call getJobItems if job doesn't exist
      expect(jobsDb.getJobItems).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid job ID', async () => {
      const response = await request(app).get('/api/jobs/abc/items');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Invalid job ID',
      });
    });

    it('should return empty array when job has no items', async () => {
      const mockJob: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'PENDING',
        source_scope: 'products',
        source_ids: [],
        attributes: { title: true },
        target_lang: 'en',
        user_prompt: 'Test',
        created_at: new Date(),
      };

      vi.mocked(jobsDb.getJob).mockResolvedValue(mockJob);
      vi.mocked(jobsDb.getJobItems).mockResolvedValue([]);

      const response = await request(app).get('/api/jobs/1/items');

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    it('should include failed items with error messages', async () => {
      const mockJob: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'FAILED',
        source_scope: 'products',
        source_ids: ['p1'],
        attributes: { title: true },
        target_lang: 'en',
        user_prompt: 'Test',
        created_at: new Date(),
        finished_at: new Date(),
      };

      const mockItems: JobItem[] = [
        {
          id: 1,
          job_id: 1,
          instance_id: 'test-instance',
          product_id: 'p1',
          attribute: 'title',
          status: 'FAILED',
          before_value: 'Old Title',
          after_value: undefined,
          error: 'OpenAI API rate limit exceeded',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(jobsDb.getJob).mockResolvedValue(mockJob);
      vi.mocked(jobsDb.getJobItems).mockResolvedValue(mockItems);

      const response = await request(app).get('/api/jobs/1/items');

      expect(response.status).toBe(200);
      expect(response.body.items[0]).toMatchObject({
        status: 'FAILED',
        error: 'OpenAI API rate limit exceeded',
      });
      // afterValue should be undefined/null for failed items
      expect(response.body.items[0].afterValue).toBeUndefined();
    });

    it('should ensure instance isolation for job items', async () => {
      const mockJob: Job = {
        id: 1,
        instance_id: 'test-instance-id',
        status: 'DONE',
        source_scope: 'products',
        source_ids: ['p1'],
        attributes: { title: true },
        target_lang: 'en',
        user_prompt: 'Test',
        created_at: new Date(),
      };

      vi.mocked(jobsDb.getJob).mockResolvedValue(mockJob);
      vi.mocked(jobsDb.getJobItems).mockResolvedValue([]);

      await request(app).get('/api/jobs/1/items');

      // Verify both calls use instance ID for isolation
      expect(jobsDb.getJob).toHaveBeenCalledWith(1, 'test-instance-id');
      expect(jobsDb.getJobItems).toHaveBeenCalledWith(1, 'test-instance-id');
    });
  });
});
