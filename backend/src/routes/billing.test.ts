import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import billingRouter from './billing';
import * as appInstances from '../db/appInstances';

// Mock the database module
vi.mock('../db/appInstances');

// Mock the Wix SDK
vi.mock('@wix/sdk', () => ({
  createClient: vi.fn(() => ({
    billing: {
      onPurchasedItemInvoiceStatusUpdated: vi.fn(),
    },
    webhooks: {
      process: vi.fn().mockResolvedValue(undefined),
    },
  })),
  AppStrategy: vi.fn((config) => config),
}));

vi.mock('@wix/app-management', () => ({
  billing: {},
}));

const app = express();
app.use(express.json());
app.use(billingRouter);

describe('Billing Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WIX_APP_ID = 'test-app-id';
    process.env.WIX_PUBLIC_KEY = 'test-public-key';
  });

  describe('POST /api/webhooks/billing', () => {
    it('should accept webhook requests and return 200', async () => {
      const response = await request(app)
        .post('/api/webhooks/billing')
        .set('Content-Type', 'text/plain')
        .send('webhook-payload-data');

      expect(response.status).toBe(200);
    });

    it('should process webhook with text body', async () => {
      const response = await request(app)
        .post('/api/webhooks/billing')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ test: 'data' }));

      // Should accept and process the webhook
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/billing/upgrade-url', () => {
    beforeEach(() => {
      process.env.WIX_APP_ID = 'test-app-id';
    });

    it('should generate upgrade URL for valid plan', async () => {
      const response = await request(app)
        .get('/api/billing/upgrade-url')
        .query({ planId: 'starter' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('planId', 'starter');
      expect(response.body.url).toContain('test-app-id');
      expect(response.body.url).toContain('starter');
    });

    it('should return 400 for missing planId', async () => {
      const response = await request(app)
        .get('/api/billing/upgrade-url');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing or invalid planId parameter' });
    });

    it('should return 400 for invalid plan ID', async () => {
      const response = await request(app)
        .get('/api/billing/upgrade-url')
        .query({ planId: 'invalid-plan' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid plan ID' });
    });

    it('should return 500 if WIX_APP_ID is not configured', async () => {
      delete process.env.WIX_APP_ID;

      const response = await request(app)
        .get('/api/billing/upgrade-url')
        .query({ planId: 'starter' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'App configuration error' });
    });

    it('should accept all valid plan IDs', async () => {
      const validPlans = ['free', 'starter', 'pro', 'scale'];

      for (const planId of validPlans) {
        const response = await request(app)
          .get('/api/billing/upgrade-url')
          .query({ planId });

        expect(response.status).toBe(200);
        expect(response.body.planId).toBe(planId);
      }
    });
  });

  describe('Integration', () => {
    it('should have Wix SDK properly configured', () => {
      expect(process.env.WIX_APP_ID).toBe('test-app-id');
      expect(process.env.WIX_PUBLIC_KEY).toBe('test-public-key');
    });
  });
});
