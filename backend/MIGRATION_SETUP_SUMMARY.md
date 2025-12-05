# Database Migration Setup - Implementation Summary

## Task Completed: Set up database schema and migrations

This document summarizes the implementation of Task 5 from the Ultimate Optimizer App specification.

## What Was Implemented

### 1. Migration System Configuration

**File: `backend/.node-pg-migrate.json`**
- Configured node-pg-migrate to use DATABASE_URL environment variable
- Set migrations directory to `migrations/`
- Configured migration table name as `pgmigrations`
- Enabled migration order checking for safety

### 2. Initial Database Migration

**File: `backend/migrations/1730000000000_initial-schema.js`**

Created comprehensive initial migration including:

#### ENUM Types
- `job_status`: PENDING, RUNNING, DONE, FAILED, CANCELED
- `item_status`: PENDING, RUNNING, DONE, FAILED

#### Tables Created
1. **plans** - Subscription tier definitions
   - Columns: id, name, price_cents, monthly_credits
   - Seeded with 4 plans: Free, Starter, Pro, Scale

2. **app_instances** - Wix app installations
   - Columns: instance_id, site_host, access_token, refresh_token, token_expires_at, plan_id, credits_total, credits_used_month, credits_reset_on, created_at, updated_at
   - Foreign key to plans table
   - Automatic credit reset date calculation

3. **jobs** - Optimization job records
   - Columns: id, instance_id, status, source_scope, source_ids (JSONB), attributes (JSONB), target_lang, user_prompt, created_at, started_at, finished_at, error
   - Foreign key to app_instances with CASCADE delete

4. **job_items** - Individual optimization tasks
   - Columns: id, job_id, product_id, attribute, before_value, after_value, status, error, created_at, updated_at
   - Foreign key to jobs with CASCADE delete

5. **publish_logs** - Audit trail for published changes
   - Columns: id, instance_id, product_id, attribute, applied_value, applied_at
   - Foreign key to app_instances with CASCADE delete

#### Performance Indexes
- `idx_app_instances_site_host` - Site host lookups
- `idx_app_instances_credits_reset` - Credit reset queries
- `idx_jobs_instance_status` - Composite index for dashboard queries
- `idx_jobs_created_at` - Descending index for recent jobs
- `idx_job_items_job_id` - Job item lookups
- `idx_job_items_status` - Partial index for worker queue (PENDING/RUNNING only)
- `idx_job_items_product` - Product-based queries
- `idx_publish_logs_instance` - Composite index for audit queries
- `idx_publish_logs_product` - Product-based audit queries

#### Seed Data
Inserted 4 subscription plans:
- Free: $0/month, 100 credits
- Starter: $9/month, 1,000 credits
- Pro: $19/month, 5,000 credits
- Scale: $49/month, 25,000 credits

### 3. Database Connection Module

**File: `backend/src/db/index.ts`**

Created database utility module with:
- Connection pool configuration (max 20 connections)
- `query()` function for executing SQL queries
- `getClient()` function for transaction support
- `transaction()` helper for atomic operations
- `closePool()` for graceful shutdown
- Error handling and query logging

### 4. Type Definitions

**File: `backend/src/db/types.ts`**

Defined TypeScript interfaces for all database models:
- `JobStatus` and `ItemStatus` enums
- `Plan`, `AppInstance`, `Job`, `JobItem`, `PublishLog` interfaces
- Proper typing for JSONB fields and timestamps

### 5. Database Testing Utility

**File: `backend/src/db/test-connection.ts`**

Created test script that:
- Verifies database connection
- Checks if migrations have been applied
- Lists all applied migrations
- Verifies application tables exist
- Displays seeded plan data
- Provides clear success/error messages

### 6. Documentation

**File: `backend/migrations/README.md`**
- Migration usage instructions
- Schema overview with ASCII diagram
- Notes on indexes and constraints

**File: `backend/DATABASE_SETUP.md`**
- Comprehensive setup guide
- Environment configuration
- Migration management commands
- Common operations and troubleshooting
- Production deployment instructions
- Backup and recovery procedures
- Security notes

### 7. NPM Scripts

Updated `backend/package.json` with:
- `migrate` - Apply pending migrations
- `migrate:down` - Rollback last migration
- `migrate:create` - Create new migration
- `db:test` - Test database connection and verify setup

## Requirements Satisfied

✅ **13.1** - PostgreSQL with tables for app_instances, plans, jobs, job_items, and publish_logs
✅ **13.2** - Foreign key constraints between jobs and app_instances, and between job_items and jobs
✅ **13.3** - CASCADE delete for referential integrity
✅ **13.4** - ENUM types for job_status and item_status
✅ **13.5** - JSONB columns for flexible storage of source_ids and attributes

## How to Use

### Initial Setup
```bash
# Set DATABASE_URL in .env file
cd backend
npm install

# Run migrations
npm run migrate

# Verify setup
npm run db:test
```

### Create New Migration
```bash
npm run migrate:create add-new-feature
```

### Rollback Migration
```bash
npm run migrate:down
```

## Files Created

```
backend/
├── .node-pg-migrate.json          # Migration configuration
├── DATABASE_SETUP.md              # Comprehensive setup guide
├── MIGRATION_SETUP_SUMMARY.md     # This file
├── migrations/
│   ├── README.md                  # Migration documentation
│   └── 1730000000000_initial-schema.js  # Initial migration
└── src/
    └── db/
        ├── index.ts               # Database connection module
        ├── types.ts               # TypeScript type definitions
        └── test-connection.ts     # Connection test utility
```

## Next Steps

The database schema and migration system are now ready. The next tasks in the implementation plan are:

- **Task 6.1**: Create Render PostgreSQL database
- **Task 6.2**: Run database migrations on Render
- **Task 7**: Implement Wix instance authentication

## Notes

- All TypeScript files compile without errors
- Migration uses node-pg-migrate best practices
- Indexes are optimized for the expected query patterns
- Foreign key constraints ensure data integrity
- JSONB columns provide flexibility for dynamic data
- Seed data is included in the migration for immediate use
