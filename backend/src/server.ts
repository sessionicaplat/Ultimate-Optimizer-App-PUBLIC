import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { verifyInstance } from './auth/verifyInstance';
import oauthRouter from './routes/oauth';
import productsRouter from './routes/products';
import meRouter from './routes/me';
import jobsRouter from './routes/jobs';
import publishRouter from './routes/publish';
import provisionRouter from './routes/provision';
import billingRouter from './routes/billing';
import ordersRouter from './routes/orders';
import imageOptimizationRouter from './routes/imageOptimization';
import blogGenerationRouter from './routes/blogGeneration';
import blogWriterRouter from './routes/blogWriter';
import blogSchedulerRouter from './routes/blogScheduler';
import { startCreditResetScheduler } from './tasks/creditReset';
import { startWorker } from './workers/jobWorker';
import { startImageOptimizationWorker } from './workers/imageOptimizationWorker';
import { startBlogGenerationWorker } from './workers/blogGenerationWorker';
import { startBlogSchedulerWorker } from './workers/blogSchedulerWorker';
import { openAIRateLimiter } from './utils/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OAuth routes (no authentication required)
app.use(oauthRouter);

// Billing webhook (no authentication required - Wix sends these)
app.use(billingRouter);

// Protected routes (require authentication)
app.use(provisionRouter);
app.use(productsRouter);
app.use(meRouter);
app.use(jobsRouter);
app.use(publishRouter);
app.use('/api/orders', ordersRouter);
app.use(imageOptimizationRouter);
app.use(blogGenerationRouter);
app.use(blogWriterRouter);
app.use(blogSchedulerRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiter status endpoint (for monitoring)
app.get('/api/rate-limiter/stats', (req, res) => {
  const stats = openAIRateLimiter.getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rateLimiter: stats,
    health: {
      queueHealthy: stats.queueLength < 1000,
      rpmHealthy: stats.rpmUsagePercent < 95,
      tpmHealthy: stats.tpmUsagePercent < 95,
    }
  });
});

// Replicate rate limiter status endpoint (for image optimization monitoring)
app.get('/api/replicate-rate-limiter/stats', (req, res) => {
  const { replicateRateLimiter } = require('./utils/replicateRateLimiter');
  const stats = replicateRateLimiter.getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rateLimiter: stats,
    health: {
      queueHealthy: stats.queueLength < 500,
      rpmHealthy: stats.rpmUsagePercent < 95,
    }
  });
});

// Debug endpoint to check environment configuration
app.get('/api/debug/config', (req, res) => {
  const hasAppId = !!process.env.WIX_APP_ID;
  const hasAppSecret = !!process.env.WIX_APP_SECRET;
  const hasDbUrl = !!process.env.DATABASE_URL;
  
  res.json({
    environment: process.env.NODE_ENV,
    config: {
      WIX_APP_ID: hasAppId ? 'SET' : 'MISSING',
      WIX_APP_SECRET: hasAppSecret ? 'SET' : 'MISSING',
      DATABASE_URL: hasDbUrl ? 'SET' : 'MISSING',
    },
    appIdLength: process.env.WIX_APP_ID?.length || 0,
    appSecretLength: process.env.WIX_APP_SECRET?.length || 0,
  });
});



// Serve static files from the React app (in production)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Dashboard endpoint - serve React app
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Catch-all route to serve React app for client-side routing
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Dashboard available at: http://localhost:${PORT}/dashboard`);
  
  // Start credit reset scheduler (runs daily at 2 AM UTC)
  startCreditResetScheduler();
  
  // Start background job worker
  startWorker();
  
  // Start image optimization worker
  startImageOptimizationWorker();
  
  // Start blog generation worker
  startBlogGenerationWorker();
  
  // Start blog scheduler worker
  startBlogSchedulerWorker();
});
