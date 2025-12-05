# Implementation Plan

## Phase 1: Frontend & Initial Deployment (See UI First)

- [x] 1. Initialize project structure and dependencies






  - Create monorepo structure with backend and frontend directories
  - Initialize Node.js project with TypeScript configuration
  - Install core dependencies: Express, PostgreSQL client, OpenAI SDK, React
  - Set up build scripts and development environment
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 2. Build React dashboard frontend




  - [x] 2.1 Set up React project with Vite


    - Initialize React + TypeScript project
    - Configure Vite build and dev server
    - Set up React Router for navigation
    - Create authentication context for instance token
    - _Requirements: 2.1, 2.4_
  

  - [x] 2.2 Create API client utility

    - Implement fetchWithAuth() function
    - Extract instance token from URL query params
    - Add X-Wix-Instance header to all requests
    - Handle 401 errors with user-friendly message
    - _Requirements: 2.4, 2.5_
  

  - [x] 2.3 Create navigation layout

    - Build sidebar with navigation links
    - Add Product Optimizer, Ongoing Queue, Completed Jobs, Billing sections
    - Highlight active route
    - _Requirements: 2.2_
  

  - [x] 2.4 Build ProductOptimizer page

    - Create product/collection selector with search (mock data initially)
    - Add attribute checkboxes (title, description, SEO, metadata)
    - Add language dropdown
    - Add custom prompt textarea
    - Display credit calculator (products × attributes)
    - Add Generate button with loading state
    - Handle insufficient credits error
    - _Requirements: 3.3, 3.4, 4.1, 4.3_
  

  - [x] 2.5 Build OngoingQueue page

    - Display job list with status badges (mock data initially)
    - Show progress bars for running jobs
    - Implement auto-refresh every 3 seconds
    - Add filter by status
    - _Requirements: 6.1, 6.2_
  

  - [x] 2.6 Build CompletedJobs page

    - Display job history table (mock data initially)
    - Show job details with expandable items
    - Implement BeforeAfterDrawer component
    - Add side-by-side content comparison
    - Add publish button for individual items
    - Add bulk publish button
    - Show success/error messages
    - _Requirements: 6.3, 6.4, 7.5_
  

  - [x] 2.7 Build BillingCredits page

    - Display current plan name and pricing
    - Show credit usage meter (used/total)
    - Display next reset date
    - Add Upgrade Plan button with redirect
    - _Requirements: 8.4, 8.5, 9.2, 9.5_

- [x] 3. Create minimal backend server for dashboard





  - Create Express server with basic routes
  - Add GET /health endpoint
  - Add GET /dashboard endpoint to serve React app
  - Add stub API endpoints that return mock data
  - Configure static file serving for built React app
  - _Requirements: 15.1, 15.4_

- [x] 4. Configure Render deployment





  - [x] 4.1 Create Render Web Service


    - Create new Web Service linked to GitHub repo
    - Set build command: npm ci && npm run build
    - Set start command: node dist/server.js
    - Configure Node.js 18 runtime
    - Set health check endpoint: /health
    - _Requirements: 15.1, 15.4_
  
  - [x] 4.2 Configure initial environment variables


    - Add NODE_ENV=production
    - Add PORT=3000
    - Add placeholder values for WIX_APP_ID, WIX_APP_SECRET (to be updated later)
    - _Requirements: 14.4, 15.3_
  
  - [x] 4.3 Deploy and verify UI


    - Push code to GitHub
    - Verify Render deployment succeeds
    - Access dashboard URL and verify all pages render
    - Test navigation between pages
    - _Requirements: 15.1, 15.4_

## Phase 2: Database & Authentication

- [x] 5. Set up database schema and migrations





  - Create PostgreSQL migration system using node-pg-migrate
  - Write initial migration with all tables (app_instances, plans, jobs, job_items, publish_logs)
  - Create ENUM types for job_status and item_status
  - Add indexes for performance optimization
  - Seed plans table with Free, Starter, Pro, Scale tiers
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 6. Configure Render PostgreSQL





  - [x] 6.1 Create Render PostgreSQL database


    - Set up Render PostgreSQL instance
    - Configure automatic backups
    - Note DATABASE_URL for environment variables
    - _Requirements: 15.2_
  
  - [x] 6.2 Run database migrations

    - Add DATABASE_URL to Render environment variables
    - Add migration script to package.json
    - Run migrations on deployment
    - Verify all tables and indexes created
    - _Requirements: 15.5_

- [x] 7. Implement Wix instance authentication





  - [x] 7.1 Create instance token verification middleware


    - Write HMAC signature verification function using Wix app secret
    - Extract instanceId and siteHost from verified token
    - Attach instance data to request object
    - Return 401 for invalid or missing tokens
    - _Requirements: 1.4, 1.5, 14.1_
  
  - [x] 7.2 Create OAuth callback handler

    - Implement /oauth/callback endpoint
    - Exchange authorization code for access and refresh tokens
    - Store tokens and instance data in app_instances table
    - Set default plan to 'free' with 100 credits
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 8. Register Wix app and configure extensions
  - [ ] 8.1 Create Wix self-hosted app
    - Create new app in Wix App Market
    - Set app name: Ultimate Optimizer App
    - Configure OAuth redirect URI (Render URL + /oauth/callback)
    - Add required scopes (Stores read/write)
    - Note app ID and secret
    - Update Render environment variables with real values
    - _Requirements: 1.1_
  
  - [ ] 8.2 Add Dashboard Page extension
    - Create Dashboard Page extension in Wix app settings
    - Set route to /dashboard
    - Set URL to Render service URL + /dashboard
    - Configure extension name and description
    - _Requirements: 2.1, 2.3_

## Phase 3: Wix Stores Integration

- [-] 9. Build Wix Stores API client


  - [x] 9.1 Create WixStoresClient class



    - Implement getProducts() with cursor pagination and search
    - Implement getCollections() with cursor pagination
    - Implement getProduct() for single product retrieval
    - Implement updateProduct() for PATCH operations
    - Add access token refresh logic on 401 responses
    - _Requirements: 3.1, 3.2, 7.2_
  
  - [x] 9.2 Write unit tests for Wix client






    - Mock Wix API responses
    - Test token refresh flow
    - Test error handling for 4xx and 5xx responses
    - _Requirements: 3.1, 3.2_

- [x] 10. Implement product and collection API endpoints





  - Create GET /api/products endpoint with instance verification
  - Create GET /api/collections endpoint with instance verification
  - Proxy requests to WixStoresClient with proper error handling
  - Support query parameters for search and pagination
  - Return structured JSON responses
  - Replace mock data in frontend with real API calls
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 11. Implement credit management





  - [x] 11.1 Create GET /api/me endpoint


    - Return instance info (site_host, plan_id)
    - Calculate remaining credits (credits_total - credits_used_month)
    - Return credits_reset_on date
    - Update frontend to fetch real credit data
    - _Requirements: 8.4, 8.5_
  
  - [x] 11.2 Create credit reset scheduled task


    - Query instances where current date >= credits_reset_on
    - Reset credits_used_month to 0
    - Update credits_reset_on to first day of next month
    - Run daily via cron or scheduled job
    - _Requirements: 8.2, 8.3_

## Phase 4: Job Processing & AI Integration

- [-] 12. Build job creation and credit validation


  - [x] 12.1 Create job creation endpoint



    - Implement POST /api/jobs with request validation
    - Calculate required credits (products × attributes)
    - Query instance credit balance from database
    - Return 402 if insufficient credits with balance info
    - Create job record with PENDING status
    - Create job_items for each product-attribute combination
    - Increment credits_used_month atomically in transaction
    - Return job_id to client
    - Update frontend to call real endpoint
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 12.2 Write tests for credit validation






    - Test sufficient credits scenario
    - Test insufficient credits error
    - Test concurrent job creation
    - _Requirements: 4.2, 4.3_

- [x] 13. Implement job monitoring endpoints





  - Create GET /api/jobs endpoint with status filtering
  - Create GET /api/jobs/:id endpoint for job details
  - Create GET /api/jobs/:id/items endpoint for job items
  - Calculate progress percentage based on completed items
  - Ensure instance isolation in all queries
  - Update frontend to fetch real job data
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 14. Build OpenAI integration





  - [x] 14.1 Create OpenAIClient class


    - Implement optimize() method with prompt construction
    - Use GPT-4 Turbo model with temperature 0.6
    - Build system prompt with target language and instructions
    - Build user prompt with product info and custom prompt
    - Extract and trim generated content from response
    - Add OPENAI_API_KEY to Render environment variables
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  
  - [x] 14.2 Add retry logic with exponential backoff


    - Implement retryWithBackoff() helper function
    - Retry up to 3 times on rate limit (429) or 5xx errors
    - Use exponential backoff (1s, 2s, 4s)
    - _Requirements: 11.4_

- [x] 15. Implement background worker process





  - [x] 15.1 Create job item claiming logic


    - Write SQL query with FOR UPDATE SKIP LOCKED
    - Claim up to 50 PENDING items per cycle
    - Update status to RUNNING atomically
    - Return claimed items for processing
    - _Requirements: 5.1, 5.2_
  
  - [x] 15.2 Build item processing function


    - Retrieve instance and access token for job item
    - Fetch current product data from Wix Stores
    - Extract attribute value (title, description, SEO, metadata)
    - Get job details for target language and user prompt
    - Call OpenAI to generate optimized content
    - Save before_value and after_value to database
    - Set status to DONE on success
    - Set status to FAILED and store error on failure
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 15.3 Implement job status update logic


    - Query for jobs with all items complete
    - Update job status to DONE and set finished_at
    - Query for jobs with any failed items
    - Update job status to FAILED and set finished_at
    - _Requirements: 5.8_
  
  - [x] 15.4 Create worker loop


    - Set up interval timer (1.5 seconds)
    - Call claim, process, and update functions
    - Add error handling and logging
    - Process items concurrently with Promise.all
    - _Requirements: 5.1_

## Phase 5: Publishing & Billing

- [x] 16. Build content publishing endpoint





  - [x] 16.1 Create publish endpoint


    - Implement POST /api/publish with itemIds array
    - Verify each item status is DONE
    - Build Wix API update payload based on attribute type
    - Call WixStoresClient.updateProduct() for each item
    - Create publish_log entry on success
    - Return results array with success/error per item
    - Update frontend to call real endpoint
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_
  
  - [x] 16.2 Implement attribute-to-payload mapping


    - Map 'title' to product name field
    - Map 'description' to product description field
    - Map 'seo' to seoData tags
    - Map 'metadata' to additionalInfoSections
    - _Requirements: 7.2_

- [x] 17. Build Wix App Billing integration





  - [x] 17.1 Configure Wix App Billing

    - Enable App Billing in Wix app settings
    - Create Free plan (100 credits, $0)
    - Create Starter plan (1000 credits, $9)
    - Create Pro plan (5000 credits, $19)
    - Create Scale plan (25000 credits, $49)
    - Set webhook URL to Render service + /api/webhooks/billing
    - _Requirements: 9.1, 10.1_
  
  - [x] 17.2 Create billing webhook endpoint


    - Implement POST /api/webhooks/billing
    - Parse webhook event payload
    - Handle subscription.created event
    - Handle subscription.updated event
    - Handle subscription.canceled event (downgrade to free)
    - Update instance plan_id and credits_total
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 17.3 Add webhook signature verification
    - Verify Wix webhook signature if provided
    - Reject requests with invalid signatures
    - _Requirements: 10.2_
  
  - [x] 17.4 Create plan upgrade redirect

    - Implement endpoint to generate Wix Billing checkout URL
    - Return URL to frontend for redirect
    - Update frontend billing page to use real endpoint
    - _Requirements: 9.2_

## Phase 6: Security & Production Readiness

- [ ] 18. Implement error handling and logging
  - [ ] 18.1 Create structured logging system
    - Set up logger with timestamp, level, component fields
    - Log all API requests with instance_id
    - Log job creation, completion, and failures
    - Log OpenAI and Wix API calls
    - Log billing webhook events
    - _Requirements: 12.1, 12.5_
  
  - [ ] 18.2 Add error response handlers
    - Create standardized error response format
    - Map error types to HTTP status codes
    - Return user-friendly error messages
    - Log errors with stack traces
    - _Requirements: 12.2, 12.3_

- [ ] 19. Implement security measures
  - [ ] 19.1 Add rate limiting
    - Install and configure express-rate-limit
    - Set per-instance limit: 100 requests/minute
    - Set global limit: 10,000 requests/minute
    - Return 429 with retry-after header
    - _Requirements: 14.2_
  
  - [ ] 19.2 Configure CORS
    - Restrict origins to Wix dashboard domains
    - Allow credentials for instance token
    - Set appropriate headers
    - _Requirements: 14.2_
  
  - [ ] 19.3 Add input validation
    - Validate all request bodies with schema validation
    - Sanitize user inputs (prompts, search queries)
    - Reject malformed requests with 400
    - _Requirements: 14.2_
  
  - [ ]* 19.4 Implement token encryption
    - Use pgcrypto for access token encryption at rest
    - Decrypt tokens only when needed for API calls
    - _Requirements: 14.1_

- [ ]* 20. Write integration tests
  - Create test database and seed data
  - Test complete job creation and processing flow
  - Test credit validation and deduction
  - Test publishing workflow
  - Test billing webhook handling
  - Test worker concurrent processing
  - _Requirements: 4.1, 5.1, 7.1, 10.1_

- [ ] 21. End-to-end testing and production deployment
  - [ ] 21.1 Test on Wix development site
    - Install app on test Wix site
    - Verify OAuth flow and token storage
    - Test product/collection retrieval
    - Create test optimization job
    - Verify worker processes items
    - Test publishing to Wix store
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1, 7.1_
  
  - [ ] 21.2 Test billing integration
    - Test plan upgrade flow
    - Verify webhook updates plan and credits
    - Test credit reset logic
    - Test insufficient credits error
    - _Requirements: 9.2, 10.3, 8.2, 4.3_
  
  - [ ] 21.3 Performance and load testing
    - Test with 100+ products in single job
    - Verify worker handles concurrent jobs
    - Monitor database query performance
    - Check OpenAI rate limit handling
    - _Requirements: 5.1, 11.4_
  
  - [ ] 21.4 Deploy to production
    - Merge to main branch
    - Verify Render deployment succeeds
    - Run smoke tests on production
    - Monitor logs for errors
    - _Requirements: 15.1, 15.4_
