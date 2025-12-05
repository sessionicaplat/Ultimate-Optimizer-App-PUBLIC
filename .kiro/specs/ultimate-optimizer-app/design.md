# Design Document

## Overview

Ultimate Optimizer App is a self-hosted Wix application that provides AI-powered product content optimization for Wix Stores. The system architecture consists of three primary layers:

1. **Frontend Dashboard** - React-based SPA embedded as an iframe in Wix admin
2. **Backend API** - Node.js/Express service hosted on Render
3. **Data Layer** - PostgreSQL database on Render with background worker process

The application integrates with Wix Stores Catalog V3 API, OpenAI API, and Wix App Billing to deliver a complete product optimization workflow with credit-based usage tracking.

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Wix Platform                         │
│  ┌──────────────┐         ┌─────────────────┐             │
│  │ Wix Admin UI │────────▶│ Dashboard Page  │             │
│  │              │ iframe  │   (Self-hosted) │             │
│  └──────────────┘         └────────┬────────┘             │
│                                     │                       │
│  ┌──────────────┐                  │                       │
│  │ Wix Stores   │◀─────────────────┼───────────────┐      │
│  │ Catalog V3   │                  │               │      │
│  └──────────────┘                  │               │      │
│                                     │               │      │
│  ┌──────────────┐                  │               │      │
│  │ Wix App      │◀─────────────────┼───────────────┤      │
│  │ Billing      │  webhooks        │               │      │
│  └──────────────┘                  │               │      │
└────────────────────────────────────┼───────────────┼──────┘
                                     │               │
                                     ▼               │
              ┌──────────────────────────────────────────┐
              │         Render Web Service               │
              │  ┌────────────────────────────────────┐  │
              │  │      Express API Server            │  │
              │  │  - Auth middleware                 │  │
              │  │  - REST endpoints                  │  │
              │  │  - Wix API client                  │  │
              │  └────────────┬───────────────────────┘  │
              │               │                           │
              │  ┌────────────▼───────────────────────┐  │
              │  │      Background Worker             │  │
              │  │  - Job queue processor             │  │
              │  │  - OpenAI integration              │  │
              │  └────────────┬───────────────────────┘  │
              │               │                           │
              └───────────────┼───────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────────────┐
              │      Render PostgreSQL Database           │
              │  - app_instances                          │
              │  - jobs, job_items                        │
              │  - plans, publish_logs                    │
              └───────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────────────┐
              │          OpenAI API                       │
              │  - GPT-4 Turbo                            │
              │  - Content generation                     │
              └───────────────────────────────────────────┘
```

### Technology Stack

- **Backend Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL 15+ (Render managed)
- **Frontend**: React 18 with TypeScript, Vite bundler
- **AI Service**: OpenAI API (GPT-4 Turbo)
- **Hosting**: Render.com (Web Service + PostgreSQL)
- **Authentication**: Wix OAuth 2.0 + Instance token verification
- **Billing**: Wix App Billing API


## Components and Interfaces

### 1. Frontend Dashboard (React SPA)

**Purpose**: Embedded iframe providing the user interface within Wix admin panel.

**Key Components**:

- **App.tsx** - Root component with routing and authentication context
- **ProductOptimizer.tsx** - Main job creation interface
  - Product/collection selector with search
  - Attribute checkboxes (title, description, SEO, metadata)
  - Language dropdown
  - Custom prompt textarea
  - Credit calculator and submit button
- **OngoingQueue.tsx** - Real-time job monitoring
  - Job list with status badges
  - Progress bars for running jobs
  - Auto-refresh every 3 seconds
- **CompletedJobs.tsx** - Results browser
  - Job history table
  - Expandable job items with before/after comparison
- **BeforeAfterDrawer.tsx** - Side-by-side content comparison
  - Original vs optimized content display
  - Individual or bulk publish actions
- **BillingCredits.tsx** - Subscription management
  - Current plan display
  - Credit usage meter
  - Upgrade/downgrade CTA

**API Client Pattern**:
```typescript
async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const instance = new URLSearchParams(window.location.search).get('instance');
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'X-Wix-Instance': instance || '',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
```


### 2. Backend API Server (Express)

**Purpose**: REST API handling authentication, job management, Wix API proxying, and billing webhooks.

**Core Modules**:

**auth/verifyInstance.ts** - Middleware for instance token verification
```typescript
interface InstancePayload {
  instanceId: string;
  siteHost: string;
  appDefId: string;
}

export async function verifyInstance(req: Request, res: Response, next: NextFunction) {
  const instance = req.headers['x-wix-instance'] as string;
  if (!instance) return res.status(401).json({ error: 'Missing instance token' });
  
  try {
    const payload = verifyWixSignature(instance, process.env.WIX_APP_SECRET!);
    req.wixInstance = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid instance token' });
  }
}
```

**wix/storesClient.ts** - Wix Stores API wrapper
```typescript
export class WixStoresClient {
  constructor(private accessToken: string) {}
  
  async getProducts(cursor?: string, query?: string) {
    return this.request('/stores/catalog-v3/products/query', {
      query: { filter: query, paging: { limit: 50, cursor } }
    });
  }
  
  async getCollections(cursor?: string) {
    return this.request('/stores/catalog-v3/collections/query', {
      query: { paging: { limit: 50, cursor } }
    });
  }
  
  async updateProduct(productId: string, updates: any) {
    return this.request(`/stores/catalog-v3/products/${productId}`, {
      product: updates
    }, 'PATCH');
  }
  
  private async request(path: string, body: any, method = 'POST') {
    const response = await fetch(`https://www.wixapis.com${path}`, {
      method,
      headers: {
        'Authorization': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Wix API error: ${response.statusText}`);
    return response.json();
  }
}
```


**routes/jobs.ts** - Job creation and retrieval endpoints
```typescript
router.post('/api/jobs', verifyInstance, async (req, res) => {
  const { instanceId } = req.wixInstance;
  const { sourceScope, sourceIds, attributes, targetLang, userPrompt } = req.body;
  
  // Calculate required credits
  const productCount = sourceScope === 'products' 
    ? sourceIds.length 
    : sourceIds.reduce((sum, col) => sum + col.productIds.length, 0);
  const attributeCount = Object.values(attributes).filter(Boolean).length;
  const requiredCredits = productCount * attributeCount;
  
  // Check credit balance
  const instance = await db.getAppInstance(instanceId);
  const remaining = instance.credits_total - instance.credits_used_month;
  if (remaining < requiredCredits) {
    return res.status(402).json({ 
      error: 'Insufficient credits',
      required: requiredCredits,
      remaining 
    });
  }
  
  // Create job and items
  const job = await db.createJob({
    instance_id: instanceId,
    source_scope: sourceScope,
    source_ids: sourceIds,
    attributes,
    target_lang: targetLang,
    user_prompt: userPrompt,
  });
  
  // Increment credits
  await db.incrementCreditsUsed(instanceId, requiredCredits);
  
  res.json({ jobId: job.id });
});

router.get('/api/jobs', verifyInstance, async (req, res) => {
  const { instanceId } = req.wixInstance;
  const { status } = req.query;
  const jobs = await db.getJobs(instanceId, status as string);
  res.json({ jobs });
});

router.get('/api/jobs/:id/items', verifyInstance, async (req, res) => {
  const { instanceId } = req.wixInstance;
  const items = await db.getJobItems(req.params.id, instanceId);
  res.json({ items });
});
```


**routes/publish.ts** - Content publishing endpoint
```typescript
router.post('/api/publish', verifyInstance, async (req, res) => {
  const { instanceId } = req.wixInstance;
  const { itemIds } = req.body; // Array of job_item IDs
  
  const instance = await db.getAppInstance(instanceId);
  const client = new WixStoresClient(instance.access_token);
  const results = [];
  
  for (const itemId of itemIds) {
    const item = await db.getJobItem(itemId, instanceId);
    if (!item || item.status !== 'DONE') {
      results.push({ itemId, success: false, error: 'Item not ready' });
      continue;
    }
    
    try {
      const update = buildProductUpdate(item.attribute, item.after_value);
      await client.updateProduct(item.product_id, update);
      await db.createPublishLog({
        instance_id: instanceId,
        product_id: item.product_id,
        attribute: item.attribute,
        applied_value: item.after_value,
      });
      results.push({ itemId, success: true });
    } catch (err) {
      results.push({ itemId, success: false, error: err.message });
    }
  }
  
  res.json({ results });
});

function buildProductUpdate(attribute: string, value: string) {
  switch (attribute) {
    case 'title': return { name: value };
    case 'description': return { description: value };
    case 'seo': return { seoData: { tags: [{ type: 'title', children: value }] } };
    case 'metadata': return { additionalInfoSections: [{ title: 'Details', description: value }] };
    default: throw new Error('Unknown attribute');
  }
}
```

**routes/billing.ts** - Wix billing webhook handler
```typescript
router.post('/api/webhooks/billing', express.raw({ type: 'application/json' }), async (req, res) => {
  const event = JSON.parse(req.body.toString());
  
  // TODO: Verify webhook signature if Wix provides one
  
  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
      await db.updateInstancePlan(event.instanceId, event.planId);
      break;
    case 'subscription.canceled':
      await db.updateInstancePlan(event.instanceId, 'free');
      break;
  }
  
  res.sendStatus(200);
});
```


### 3. Background Worker

**Purpose**: Process pending job items by calling OpenAI and updating results.

**workers/jobWorker.ts**:
```typescript
import { db } from '../db';
import { OpenAIClient } from '../openai/client';

const openai = new OpenAIClient(process.env.OPENAI_API_KEY!);

export async function startWorker() {
  setInterval(async () => {
    try {
      const items = await claimPendingItems(50);
      await Promise.all(items.map(processItem));
      await updateJobStatuses();
    } catch (err) {
      console.error('Worker error:', err);
    }
  }, 1500);
}

async function claimPendingItems(limit: number) {
  return db.query(`
    UPDATE job_items
    SET status = 'RUNNING'
    WHERE id IN (
      SELECT id FROM job_items
      WHERE status = 'PENDING'
      ORDER BY id
      FOR UPDATE SKIP LOCKED
      LIMIT $1
    )
    RETURNING *
  `, [limit]);
}

async function processItem(item: JobItem) {
  try {
    // Get current product data
    const instance = await db.getAppInstanceByJobItem(item.id);
    const client = new WixStoresClient(instance.access_token);
    const product = await client.getProduct(item.product_id);
    const beforeValue = extractAttributeValue(product, item.attribute);
    
    // Get job details for prompt
    const job = await db.getJob(item.job_id);
    
    // Generate optimized content
    const afterValue = await openai.optimize({
      productTitle: product.name,
      attribute: item.attribute,
      beforeValue,
      targetLang: job.target_lang,
      userPrompt: job.user_prompt,
    });
    
    // Save result
    await db.updateJobItem(item.id, {
      before_value: beforeValue,
      after_value: afterValue,
      status: 'DONE',
    });
  } catch (err) {
    await db.updateJobItem(item.id, {
      status: 'FAILED',
      error: err.message,
    });
  }
}

async function updateJobStatuses() {
  // Mark jobs as DONE when all items are complete
  await db.query(`
    UPDATE jobs
    SET status = 'DONE', finished_at = now()
    WHERE status = 'RUNNING'
    AND NOT EXISTS (
      SELECT 1 FROM job_items
      WHERE job_id = jobs.id
      AND status IN ('PENDING', 'RUNNING')
    )
  `);
  
  // Mark jobs as FAILED if any item failed
  await db.query(`
    UPDATE jobs
    SET status = 'FAILED', finished_at = now()
    WHERE status = 'RUNNING'
    AND EXISTS (
      SELECT 1 FROM job_items
      WHERE job_id = jobs.id
      AND status = 'FAILED'
    )
  `);
}
```


### 4. OpenAI Integration

**openai/client.ts**:
```typescript
import OpenAI from 'openai';

export class OpenAIClient {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async optimize(params: {
    productTitle: string;
    attribute: string;
    beforeValue: string;
    targetLang: string;
    userPrompt: string;
  }): Promise<string> {
    const systemPrompt = `You are an expert e-commerce copywriter. 
Optimize only the requested field for the product.
Target language: ${params.targetLang}
Maintain brand tone and accuracy.
Return only the optimized text, no explanations.`;

    const userPrompt = `Product: ${params.productTitle}
Field to optimize: ${params.attribute}
Current value:
"""
${params.beforeValue}
"""

Additional instructions:
"""
${params.userPrompt}
"""

Provide the optimized ${params.attribute}:`;

    const response = await this.retryWithBackoff(async () => {
      return this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      });
    });
    
    return response.choices[0].message.content?.trim() || '';
  }
  
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```


## Data Models

### Database Schema

**app_instances** - Stores Wix app installation data
```sql
CREATE TABLE app_instances (
  instance_id TEXT PRIMARY KEY,
  site_host TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'free',
  credits_total INT NOT NULL DEFAULT 100,
  credits_used_month INT NOT NULL DEFAULT 0,
  credits_reset_on DATE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month')::date,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_app_instances_site_host ON app_instances(site_host);
CREATE INDEX idx_app_instances_credits_reset ON app_instances(credits_reset_on);
```

**plans** - Subscription tier definitions
```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  monthly_credits INT NOT NULL
);

INSERT INTO plans VALUES
  ('free', 'Free', 0, 100),
  ('starter', 'Starter', 900, 1000),
  ('pro', 'Pro', 1900, 5000),
  ('scale', 'Scale', 4900, 25000);
```

**jobs** - Optimization job records
```sql
CREATE TYPE job_status AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELED');

CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES app_instances(instance_id) ON DELETE CASCADE,
  status job_status NOT NULL DEFAULT 'PENDING',
  source_scope TEXT NOT NULL,
  source_ids JSONB NOT NULL,
  attributes JSONB NOT NULL,
  target_lang TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX idx_jobs_instance_status ON jobs(instance_id, status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
```


**job_items** - Individual product-attribute optimization tasks
```sql
CREATE TYPE item_status AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

CREATE TABLE job_items (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  attribute TEXT NOT NULL,
  before_value TEXT,
  after_value TEXT,
  status item_status NOT NULL DEFAULT 'PENDING',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_items_job_id ON job_items(job_id);
CREATE INDEX idx_job_items_status ON job_items(status) WHERE status IN ('PENDING', 'RUNNING');
CREATE INDEX idx_job_items_product ON job_items(product_id);
```

**publish_logs** - Audit trail for published changes
```sql
CREATE TABLE publish_logs (
  id BIGSERIAL PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES app_instances(instance_id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  attribute TEXT NOT NULL,
  applied_value TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_publish_logs_instance ON publish_logs(instance_id, applied_at DESC);
CREATE INDEX idx_publish_logs_product ON publish_logs(product_id);
```

### Data Flow Diagrams

**Job Creation Flow**:
```
User submits job
  ↓
Calculate required credits (products × attributes)
  ↓
Check credit balance
  ↓
[Insufficient] → Return 402 error
  ↓
[Sufficient] → Create job record (status: PENDING)
  ↓
Create job_items for each product-attribute pair
  ↓
Increment credits_used_month
  ↓
Return job_id to client
```

**Worker Processing Flow**:
```
Worker polls every 1.5s
  ↓
Claim up to 50 PENDING items (FOR UPDATE SKIP LOCKED)
  ↓
Set status to RUNNING
  ↓
For each item:
  ↓
  Fetch product from Wix Stores API
  ↓
  Extract current attribute value
  ↓
  Call OpenAI with prompt
  ↓
  [Success] → Save after_value, set DONE
  ↓
  [Error] → Save error message, set FAILED
  ↓
Update job statuses:
  - DONE if all items complete
  - FAILED if any item failed
```


**Publishing Flow**:
```
User selects items to publish
  ↓
Frontend sends itemIds to /api/publish
  ↓
For each item:
  ↓
  Verify item status is DONE
  ↓
  Build Wix API update payload
  ↓
  Call Wix Stores PATCH endpoint
  ↓
  [Success] → Create publish_log entry
  ↓
  [Error] → Return error to client
  ↓
Return results array to client
```

## Error Handling

### Error Categories and Responses

**Authentication Errors (401)**:
- Missing or invalid instance token
- Expired access token
- Response: `{ error: 'Unauthorized', code: 'AUTH_FAILED' }`

**Insufficient Credits (402)**:
- Not enough credits for requested operation
- Response: `{ error: 'Insufficient credits', required: 20, remaining: 5 }`

**Validation Errors (400)**:
- Invalid request parameters
- Missing required fields
- Response: `{ error: 'Validation failed', details: [...] }`

**Wix API Errors (502)**:
- Wix Stores API failures
- Network timeouts
- Response: `{ error: 'Wix API error', message: '...' }`

**OpenAI Errors (503)**:
- Rate limiting
- API unavailable
- Response: `{ error: 'AI service unavailable', retryAfter: 60 }`

### Retry Strategy

**Wix API Calls**:
- Retry on 5xx errors: 3 attempts with exponential backoff (1s, 2s, 4s)
- Refresh access token on 401 and retry once
- Log all failures with request ID

**OpenAI API Calls**:
- Retry on rate limit (429): 3 attempts with exponential backoff
- Retry on 5xx errors: 3 attempts
- Mark job item as FAILED after max retries

**Database Operations**:
- Use connection pooling with automatic reconnection
- Wrap critical operations in transactions
- Log deadlocks and constraint violations


### Logging Strategy

**Structured Logging Format**:
```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  component: string;
  instanceId?: string;
  message: string;
  metadata?: Record<string, any>;
}
```

**Log Levels**:
- **INFO**: Job creation, completion, publish actions
- **WARN**: Retry attempts, credit threshold warnings
- **ERROR**: API failures, worker crashes, authentication failures

**Key Events to Log**:
- App installation/uninstallation
- Job creation with credit calculation
- Worker item processing start/end
- OpenAI API calls and responses
- Wix API calls and errors
- Publish operations
- Billing webhook events
- Credit resets

## Testing Strategy

### Unit Tests

**Backend Services**:
- `verifyInstance()` - Test signature verification with valid/invalid tokens
- `WixStoresClient` - Mock Wix API responses
- `OpenAIClient` - Mock OpenAI responses and retry logic
- Credit calculation logic
- Product update payload builder

**Database Layer**:
- CRUD operations for all tables
- Transaction rollback scenarios
- FOR UPDATE SKIP LOCKED behavior
- Cascade delete constraints

### Integration Tests

**API Endpoints**:
- POST /api/jobs - Test credit validation, job creation
- GET /api/jobs - Test filtering and pagination
- POST /api/publish - Test Wix API integration
- POST /api/webhooks/billing - Test plan updates

**Worker Process**:
- End-to-end job processing with mocked OpenAI
- Concurrent item processing
- Job status transitions
- Error handling and retry logic

### End-to-End Tests

**Complete Workflows**:
1. Install app → Create job → Process items → Publish results
2. Insufficient credits → Upgrade plan → Retry job
3. Job failure → Review errors → Retry failed items
4. Monthly credit reset

**Test Environment**:
- Use Wix sandbox/dev environment
- Separate test database
- Mock OpenAI in CI/CD pipeline
- Real OpenAI in staging environment


## Security Considerations

### Authentication and Authorization

**Instance Token Verification**:
- Verify HMAC signature using Wix app secret
- Extract instanceId and validate against database
- Reject requests with expired or tampered tokens

**Access Token Management**:
- Store tokens encrypted at rest (consider using pgcrypto)
- Refresh tokens proactively before expiration
- Rotate tokens on security events
- Never expose tokens in client-side code or logs

**API Security**:
- Rate limiting per instance (100 requests/minute)
- CORS restricted to Wix dashboard origins
- HTTPS only (enforced by Render)
- Input validation and sanitization

### Data Privacy

**PII Handling**:
- Store only necessary data (instance_id, site_host)
- No storage of end-user personal information
- Product content treated as business data

**Data Retention**:
- Completed jobs: 90 days
- Publish logs: 1 year
- Failed jobs: 30 days
- Automatic cleanup via scheduled task

**GDPR Compliance**:
- Support instance deletion (CASCADE deletes all related data)
- Export capability for audit logs
- Data processing agreement with Wix

### Secrets Management

**Environment Variables** (Render):
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgres://...
WIX_APP_ID=...
WIX_APP_SECRET=...
WIX_REDIRECT_URI=https://ultimateoptimizerapp.onrender.com/oauth/callback
NODE_ENV=production
```

**Secret Rotation**:
- OpenAI API key: Rotate quarterly
- Wix app secret: Rotate on security events
- Database credentials: Managed by Render


## Deployment Architecture

### Render Configuration

**Web Service**:
- **Name**: ultimate-optimizer-app
- **Environment**: Node 18
- **Region**: Oregon (us-west)
- **Instance Type**: Starter ($7/month) → upgrade to Standard as needed
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `node dist/server.js`
- **Health Check**: GET /health → 200 OK
- **Auto-Deploy**: Enabled on main branch

**PostgreSQL Database**:
- **Name**: ultimate-optimizer-db
- **Plan**: Starter ($7/month) → upgrade based on usage
- **Version**: PostgreSQL 15
- **Backups**: Daily automatic backups (7-day retention)
- **Connection**: Via DATABASE_URL environment variable

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run lint
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: curl ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### Database Migrations

**Migration Strategy**:
- Use `node-pg-migrate` for schema changes
- Run migrations on deployment via `npm run migrate`
- Store migration history in `pgmigrations` table
- Rollback capability for failed migrations

**Initial Migration** (001_initial_schema.sql):
```sql
-- Create all tables, indexes, and seed data
-- See Data Models section for complete schema
```

### Monitoring and Observability

**Render Dashboard**:
- CPU and memory usage
- Request rate and latency
- Error rate
- Database connections

**Application Metrics**:
- Job processing rate (items/minute)
- OpenAI API latency
- Wix API error rate
- Credit consumption trends

**Alerts**:
- Worker process crash
- Database connection pool exhaustion
- OpenAI API rate limit exceeded
- High error rate (>5% of requests)


## Performance Optimization

### Database Optimization

**Indexing Strategy**:
- Composite index on `jobs(instance_id, status)` for dashboard queries
- Partial index on `job_items(status)` for worker queries
- Index on `publish_logs(instance_id, applied_at DESC)` for audit trail

**Query Optimization**:
- Use `LIMIT` and cursor-based pagination
- Avoid N+1 queries with JOIN operations
- Use `EXPLAIN ANALYZE` for slow queries
- Connection pooling (max 20 connections)

**Scheduled Maintenance**:
- Daily VACUUM ANALYZE at 2 AM UTC
- Weekly credit reset job
- Monthly cleanup of old completed jobs

### API Performance

**Caching Strategy**:
- Cache Wix product data for 5 minutes (in-memory)
- Cache plan definitions (static data)
- No caching of job status (real-time data)

**Rate Limiting**:
- Per-instance: 100 requests/minute
- Global: 10,000 requests/minute
- OpenAI: Respect rate limits (tier-based)

**Concurrency**:
- Worker processes up to 50 items concurrently
- Use Promise.all for parallel OpenAI calls
- Limit concurrent Wix API calls to 10

### Frontend Optimization

**Bundle Size**:
- Code splitting by route
- Lazy load heavy components (BeforeAfterDrawer)
- Tree-shaking unused dependencies
- Target bundle size: <200KB gzipped

**Rendering**:
- Virtual scrolling for large job lists
- Debounced search inputs
- Optimistic UI updates for publish actions
- Skeleton loaders for async data


## Scalability Considerations

### Horizontal Scaling

**Current Architecture** (Single Render instance):
- Suitable for up to 1,000 active instances
- Worker can process ~2,000 items/hour
- Database can handle ~100 concurrent connections

**Future Scaling Path**:
1. **Multiple Workers** - Deploy separate worker services
2. **Redis Queue** - Replace PostgreSQL queue with Redis for higher throughput
3. **Load Balancer** - Distribute API requests across multiple web services
4. **Read Replicas** - Offload read queries to PostgreSQL replicas
5. **CDN** - Serve static dashboard assets via CDN

### Cost Projections

**Current Setup** (Render Starter):
- Web Service: $7/month
- PostgreSQL: $7/month
- **Total**: $14/month + OpenAI usage

**At 100 Active Instances**:
- Web Service: $25/month (Standard)
- PostgreSQL: $25/month (Standard)
- OpenAI: ~$50/month (estimated)
- **Total**: ~$100/month

**At 1,000 Active Instances**:
- Web Services: $200/month (2× Pro)
- PostgreSQL: $90/month (Pro)
- Redis: $10/month (if needed)
- OpenAI: ~$500/month
- **Total**: ~$800/month

## Design Decisions and Rationale

### Why PostgreSQL for Job Queue?

**Decision**: Use PostgreSQL with FOR UPDATE SKIP LOCKED instead of Redis/RabbitMQ.

**Rationale**:
- Simplifies infrastructure (one less service)
- ACID guarantees for credit transactions
- Sufficient performance for expected load (<10K jobs/day)
- Easy to query job history and analytics
- Lower operational complexity

**Trade-offs**:
- Lower throughput than dedicated queue systems
- Potential bottleneck at very high scale
- Migration path exists if needed (Redis)

### Why Wix Catalog V3?

**Decision**: Use only Catalog V3 APIs, not V1.

**Rationale**:
- V1 is being deprecated in 2025
- V3 provides better variant and inventory support
- Avoids version detection complexity
- Future-proof implementation

**Trade-offs**:
- Not compatible with sites still on V1
- Requires migration guidance for users

### Why Embedded Dashboard (iframe)?

**Decision**: Self-hosted React SPA in iframe vs Wix Blocks.

**Rationale**:
- Full control over UI/UX
- Can use any frontend framework
- Easier to integrate with backend APIs
- No Wix Blocks learning curve

**Trade-offs**:
- Requires HTTPS hosting
- CORS and iframe security considerations
- Less native Wix UI integration


## Future Enhancements

### Phase 2 Features

**Bulk Operations**:
- Batch publish all items in a job
- Bulk retry failed items
- Schedule jobs for future execution

**Advanced AI Features**:
- A/B testing different prompts
- Brand voice training with examples
- Multi-language optimization in single job
- Image alt text generation

**Analytics Dashboard**:
- Credit usage trends
- Most optimized attributes
- Average improvement metrics
- ROI calculator

### Phase 3 Features

**Collaboration**:
- Team accounts with role-based access
- Approval workflows for publishing
- Comment threads on optimizations

**Integrations**:
- Export to CSV/Excel
- Webhook notifications for job completion
- Slack/email notifications

**Advanced Billing**:
- Pay-as-you-go credits
- Annual plans with discounts
- Enterprise custom pricing

## Appendix

### API Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /health | No | Health check |
| GET | /api/me | Yes | Get instance info and credits |
| GET | /api/products | Yes | List products from Wix |
| GET | /api/collections | Yes | List collections from Wix |
| POST | /api/jobs | Yes | Create optimization job |
| GET | /api/jobs | Yes | List jobs for instance |
| GET | /api/jobs/:id | Yes | Get job details |
| GET | /api/jobs/:id/items | Yes | Get job items |
| POST | /api/publish | Yes | Publish optimized content |
| POST | /api/webhooks/billing | No | Wix billing webhook |

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| OPENAI_API_KEY | Yes | OpenAI API key |
| WIX_APP_ID | Yes | Wix app ID |
| WIX_APP_SECRET | Yes | Wix app secret for signature verification |
| WIX_REDIRECT_URI | Yes | OAuth callback URL |
| NODE_ENV | Yes | production/development |
| PORT | No | Server port (default: 3000) |
| LOG_LEVEL | No | info/warn/error (default: info) |

### Technology Versions

- Node.js: 18.x LTS
- PostgreSQL: 15.x
- Express: 4.18.x
- React: 18.2.x
- TypeScript: 5.x
- OpenAI SDK: 4.x
- Wix SDK: Latest

