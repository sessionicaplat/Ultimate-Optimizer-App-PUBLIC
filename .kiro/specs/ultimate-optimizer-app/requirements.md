# Requirements Document

## Introduction

Ultimate Optimizer App is an AI-powered product optimization tool for Wix Stores, delivered as a self-hosted Wix app. The system enables Wix store owners to optimize product content (titles, descriptions, SEO, metadata) using AI, with a credit-based billing model and tiered subscription plans. The application is hosted on Render.com with PostgreSQL for data persistence and uses OpenAI for content generation.

## Glossary

- **System**: The Ultimate Optimizer App backend service and dashboard
- **Dashboard**: The web-based user interface embedded as an iframe in Wix
- **Job**: A batch optimization request containing one or more products and attributes
- **Job Item**: A single product-attribute combination within a Job
- **Credit**: A consumable unit representing one attribute optimization operation
- **Instance**: A unique installation of the app on a Wix site
- **Wix Stores API**: The Wix Catalog V3 API for product management
- **OpenAI API**: The external AI service used for content optimization
- **Plan**: A subscription tier (Free, Starter, Pro, Scale) with associated credit limits
- **Worker**: The background process that executes pending Job Items

## Requirements

### Requirement 1: App Installation and Authentication

**User Story:** As a Wix store owner, I want to install the Ultimate Optimizer App from the Wix App Market, so that I can access AI-powered product optimization tools within my Wix dashboard.

#### Acceptance Criteria

1. WHEN a user installs the app from Wix App Market, THE System SHALL create a new app instance record with a unique instance_id
2. WHEN the OAuth callback is triggered, THE System SHALL exchange the authorization code for access and refresh tokens
3. THE System SHALL store the instance_id, site_host, access tokens, and default plan (free) in the PostgreSQL database
4. WHEN a dashboard page request includes an instance token, THE System SHALL verify the token signature using the app secret
5. IF token verification fails, THEN THE System SHALL return a 401 Unauthorized response

### Requirement 2: Dashboard Page Extension

**User Story:** As a Wix store owner, I want to access the optimizer dashboard from my Wix admin panel, so that I can manage product optimizations without leaving Wix.

#### Acceptance Criteria

1. THE System SHALL serve a dashboard page at the configured iframe URL (https://ultimateoptimizerapp.onrender.com/dashboard)
2. THE Dashboard SHALL display navigation for Product Optimizer, Ongoing Queue, Completed Jobs, and Billing & Credits sections
3. WHEN the dashboard loads, THE System SHALL extract and verify the instance parameter from the URL
4. THE Dashboard SHALL use the verified instance token for all API requests to the backend
5. IF the instance token is invalid or expired, THEN THE Dashboard SHALL display an authentication error message

### Requirement 3: Product and Collection Retrieval

**User Story:** As a user, I want to select products or entire collections for optimization, so that I can efficiently optimize multiple products at once.

#### Acceptance Criteria

1. THE System SHALL retrieve products from Wix Stores using the Catalog V3 API
2. THE System SHALL retrieve collections from Wix Stores using the Catalog V3 API
3. WHEN a user searches for products, THE Dashboard SHALL display matching products with title, image, and ID
4. WHEN a user selects a collection, THE System SHALL retrieve all product IDs within that collection
5. THE System SHALL support pagination with cursor-based navigation for product and collection lists

### Requirement 4: Job Creation and Credit Validation

**User Story:** As a user, I want to create an optimization job by selecting products, attributes, language, and a custom prompt, so that I can generate AI-optimized content tailored to my needs.

#### Acceptance Criteria

1. WHEN a user submits a job request, THE System SHALL calculate the required credits as (number of products × number of selected attributes)
2. THE System SHALL verify that the instance has sufficient remaining credits (credits_total - credits_used_month >= required_credits)
3. IF insufficient credits exist, THEN THE System SHALL return a 402 Payment Required response with credit balance information
4. WHEN credits are sufficient, THE System SHALL create a Job record with status PENDING
5. THE System SHALL create Job Item records for each product-attribute combination with status PENDING
6. THE System SHALL increment credits_used_month by the required credit amount
7. THE System SHALL return the created job_id to the Dashboard

### Requirement 5: Background Job Processing

**User Story:** As a user, I want my optimization jobs to be processed automatically in the background, so that I can continue working while the AI generates optimized content.

#### Acceptance Criteria

1. THE Worker SHALL poll for pending Job Items every 1.5 seconds using FOR UPDATE SKIP LOCKED
2. WHEN the Worker claims Job Items, THE Worker SHALL update their status to RUNNING
3. THE Worker SHALL retrieve the current product attribute value from Wix Stores API
4. THE Worker SHALL send the original value, attribute type, target language, and user prompt to OpenAI API
5. WHEN OpenAI returns optimized content, THE Worker SHALL store the result in the after_value field and set status to DONE
6. IF OpenAI API fails or returns an error, THEN THE Worker SHALL set status to FAILED and store the error message
7. WHEN all Job Items for a Job are complete, THE Worker SHALL update the Job status to DONE
8. IF any Job Item fails, THE Worker SHALL update the Job status to FAILED

### Requirement 6: Job Monitoring and Results

**User Story:** As a user, I want to view the status of my ongoing and completed jobs, so that I can track progress and review optimized content.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of jobs with status, creation time, and progress percentage
2. WHEN a user views an ongoing job, THE Dashboard SHALL show real-time progress updates by polling the API every 3 seconds
3. WHEN a user views a completed job, THE Dashboard SHALL display all Job Items with before and after values
4. THE Dashboard SHALL provide a side-by-side comparison view for each product-attribute pair
5. THE Dashboard SHALL allow filtering jobs by status (PENDING, RUNNING, DONE, FAILED, CANCELED)

### Requirement 7: Publishing Optimized Content

**User Story:** As a user, I want to review AI-generated content and selectively publish changes to my live store, so that I maintain control over what content goes live.

#### Acceptance Criteria

1. WHEN a user selects a Job Item to publish, THE System SHALL retrieve the after_value from the database
2. THE System SHALL call the Wix Stores Catalog V3 update endpoint with the new attribute value
3. WHEN the update succeeds, THE System SHALL create a publish_log record with the product_id, attribute, and applied_value
4. IF the Wix API returns an error, THEN THE System SHALL return the error message to the Dashboard
5. THE Dashboard SHALL display a success confirmation when content is published
6. THE System SHALL support bulk publishing of multiple Job Items in a single request

### Requirement 8: Credit Management and Monthly Reset

**User Story:** As a user, I want my monthly credit allocation to reset automatically, so that I can continue using the service each billing period.

#### Acceptance Criteria

1. THE System SHALL store credits_total, credits_used_month, and credits_reset_on for each instance
2. WHEN the current date is greater than or equal to credits_reset_on, THE System SHALL reset credits_used_month to 0
3. THE System SHALL update credits_reset_on to the first day of the next month
4. THE Dashboard SHALL display remaining credits as (credits_total - credits_used_month)
5. THE Dashboard SHALL display the next reset date from credits_reset_on

### Requirement 9: Subscription Plan Management

**User Story:** As a user, I want to upgrade or downgrade my subscription plan, so that I can access more credits or reduce costs based on my needs.

#### Acceptance Criteria

1. THE System SHALL support four plan tiers: Free (100 credits, $0), Starter (1000 credits, $9), Pro (5000 credits, $19), Scale (25000 credits, $49)
2. WHEN a user clicks "Upgrade Plan" in the Dashboard, THE System SHALL redirect to the Wix App Billing checkout page
3. WHEN Wix sends a billing webhook for plan change, THE System SHALL update the instance plan_id and credits_total
4. THE System SHALL preserve credits_used_month during plan changes
5. THE Dashboard SHALL display the current plan name, monthly credit limit, and pricing

### Requirement 10: Wix App Billing Integration

**User Story:** As the app provider, I want to integrate with Wix App Billing, so that subscription payments are handled securely through Wix's payment infrastructure.

#### Acceptance Criteria

1. THE System SHALL expose a webhook endpoint at /api/webhooks/billing for Wix billing events
2. WHEN a billing webhook is received, THE System SHALL verify the webhook signature if provided by Wix
3. WHEN a subscription is created or updated, THE System SHALL update the instance plan_id and credits_total
4. WHEN a subscription is canceled, THE System SHALL downgrade the instance to the Free plan
5. THE System SHALL log all billing webhook events for audit purposes

### Requirement 11: OpenAI Content Generation

**User Story:** As a user, I want the AI to generate optimized content that respects my custom prompt and target language, so that the output matches my brand voice and market.

#### Acceptance Criteria

1. THE System SHALL construct an OpenAI prompt with system context, product information, attribute type, original value, target language, and user prompt
2. THE System SHALL use the gpt-4-turbo model with temperature 0.6 for content generation
3. THE System SHALL extract the generated content from the OpenAI response message
4. IF OpenAI API returns an error or rate limit, THEN THE System SHALL retry up to 3 times with exponential backoff
5. THE System SHALL trim whitespace from the generated content before storing

### Requirement 12: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error logging and handling, so that I can diagnose issues and maintain system reliability.

#### Acceptance Criteria

1. WHEN any API request fails, THE System SHALL log the error with timestamp, instance_id, endpoint, and error message
2. WHEN a Job Item fails, THE System SHALL store the error message in the error field
3. THE System SHALL return structured error responses with HTTP status codes and error messages
4. THE Dashboard SHALL display user-friendly error messages for common failure scenarios
5. THE System SHALL log all publish operations to the publish_logs table

### Requirement 13: Database Schema and Data Integrity

**User Story:** As a developer, I want a well-structured database schema with referential integrity, so that data remains consistent and reliable.

#### Acceptance Criteria

1. THE System SHALL use PostgreSQL with tables for app_instances, plans, jobs, job_items, and publish_logs
2. THE System SHALL enforce foreign key constraints between jobs and app_instances, and between job_items and jobs
3. WHEN an app_instance is deleted, THE System SHALL cascade delete all related jobs, job_items, and publish_logs
4. THE System SHALL use ENUM types for job_status (PENDING, RUNNING, DONE, FAILED, CANCELED) and item_status (PENDING, RUNNING, DONE, FAILED)
5. THE System SHALL use JSONB columns for flexible storage of source_ids and attributes

### Requirement 14: Security and Instance Isolation

**User Story:** As a Wix store owner, I want my data to be isolated from other users, so that my products and optimization history remain private.

#### Acceptance Criteria

1. THE System SHALL verify the Wix instance token on every API request using HMAC signature validation
2. THE System SHALL filter all database queries by instance_id to ensure data isolation
3. THE System SHALL store Wix access tokens securely in the database
4. THE System SHALL use environment variables for sensitive configuration (OpenAI API key, database URL, Wix app secret)
5. THE Dashboard SHALL not expose instance tokens or API keys in client-side code

### Requirement 15: Deployment and Environment Configuration

**User Story:** As a developer, I want to deploy the application to Render with PostgreSQL, so that the app is hosted reliably with minimal operational overhead.

#### Acceptance Criteria

1. THE System SHALL run as a Render Web Service with Node.js runtime
2. THE System SHALL connect to a Render PostgreSQL database using the DATABASE_URL environment variable
3. THE System SHALL read configuration from environment variables (OPENAI_API_KEY, WIX_APP_ID, WIX_APP_SECRET)
4. THE System SHALL serve the dashboard iframe over HTTPS at the configured Render URL
5. THE System SHALL initialize the database schema on first deployment using migration scripts
