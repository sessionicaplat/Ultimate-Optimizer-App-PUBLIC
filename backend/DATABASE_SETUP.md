# Database Setup Guide

This guide covers setting up and managing the PostgreSQL database for the Ultimate Optimizer App.

## Prerequisites

- PostgreSQL 15+ installed (local development) or Render PostgreSQL service (production)
- Node.js 18+ with npm

## Environment Configuration

Create a `.env` file in the `backend` directory with the following:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/ultimate_optimizer
```

For Render deployment, the `DATABASE_URL` is automatically provided by the PostgreSQL service.

## Initial Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Migrations

Apply all database migrations to create the schema:

```bash
npm run migrate
```

This will:
- Create ENUM types (`job_status`, `item_status`)
- Create all tables (`plans`, `app_instances`, `jobs`, `job_items`, `publish_logs`)
- Add performance indexes
- Seed the `plans` table with subscription tiers

### 3. Verify Setup

Test the database connection and verify migrations:

```bash
npm run db:test
```

Expected output:
```
✓ Connection successful!
✓ Migrations table exists
✓ Applied migrations: 1
✓ Application tables found:
  - app_instances
  - job_items
  - jobs
  - plans
  - publish_logs
✓ Plans seeded:
  - Free (free): 100 credits/month
  - Starter (starter): 1000 credits/month
  - Pro (pro): 5000 credits/month
  - Scale (scale): 25000 credits/month
```

## Database Schema

### Tables

#### plans
Subscription tier definitions with pricing and credit limits.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Plan identifier (PK) |
| name | text | Display name |
| price_cents | integer | Monthly price in cents |
| monthly_credits | integer | Credits allocated per month |

#### app_instances
Wix app installations with OAuth tokens and credit tracking.

| Column | Type | Description |
|--------|------|-------------|
| instance_id | text | Wix instance ID (PK) |
| site_host | text | Wix site hostname |
| access_token | text | OAuth access token |
| refresh_token | text | OAuth refresh token |
| token_expires_at | timestamptz | Token expiration time |
| plan_id | text | Current subscription plan (FK) |
| credits_total | integer | Total monthly credits |
| credits_used_month | integer | Credits used this month |
| credits_reset_on | date | Next credit reset date |
| created_at | timestamptz | Installation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### jobs
Optimization job records.

| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | Job ID (PK) |
| instance_id | text | App instance (FK) |
| status | job_status | Current status |
| source_scope | text | 'products' or 'collections' |
| source_ids | jsonb | Product/collection IDs |
| attributes | jsonb | Selected attributes |
| target_lang | text | Target language code |
| user_prompt | text | Custom optimization prompt |
| created_at | timestamptz | Job creation time |
| started_at | timestamptz | Processing start time |
| finished_at | timestamptz | Completion time |
| error | text | Error message if failed |

#### job_items
Individual product-attribute optimization tasks.

| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | Item ID (PK) |
| job_id | bigint | Parent job (FK) |
| product_id | text | Wix product ID |
| attribute | text | Attribute to optimize |
| before_value | text | Original content |
| after_value | text | Optimized content |
| status | item_status | Current status |
| error | text | Error message if failed |
| created_at | timestamptz | Item creation time |
| updated_at | timestamptz | Last update time |

#### publish_logs
Audit trail for published changes.

| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | Log ID (PK) |
| instance_id | text | App instance (FK) |
| product_id | text | Wix product ID |
| attribute | text | Published attribute |
| applied_value | text | Applied content |
| applied_at | timestamptz | Publish timestamp |

### ENUM Types

- **job_status**: `PENDING`, `RUNNING`, `DONE`, `FAILED`, `CANCELED`
- **item_status**: `PENDING`, `RUNNING`, `DONE`, `FAILED`

### Indexes

Performance indexes are created for:
- Instance lookups and credit reset queries
- Job filtering by instance and status
- Worker queue queries (partial index on PENDING/RUNNING items)
- Product-based queries
- Audit log queries

## Migration Management

### Create a New Migration

```bash
npm run migrate:create <migration-name>
```

Example:
```bash
npm run migrate:create add-user-preferences
```

### Rollback Last Migration

```bash
npm run migrate:down
```

⚠️ **Warning**: This will drop tables and data. Use with caution!

### Check Migration Status

```bash
npm run db:test
```

## Common Operations

### Reset Database (Development Only)

```bash
# Rollback all migrations
npm run migrate:down

# Reapply migrations
npm run migrate
```

### Connect to Database (psql)

```bash
psql $DATABASE_URL
```

### View Tables

```sql
\dt
```

### View Table Schema

```sql
\d app_instances
```

### Query Plans

```sql
SELECT * FROM plans;
```

## Troubleshooting

### Connection Refused

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL is correct
- Ensure PostgreSQL is listening on the correct port

### Migration Fails

- Check PostgreSQL logs for errors
- Verify database user has CREATE privileges
- Ensure no conflicting tables exist

### Permission Denied

- Grant necessary privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE ultimate_optimizer TO your_user;
```

## Production Deployment (Render)

1. Create a Render PostgreSQL database
2. Note the internal DATABASE_URL
3. Add DATABASE_URL to Web Service environment variables
4. Migrations run automatically on deployment via build script

## Backup and Recovery

### Manual Backup

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup

```bash
psql $DATABASE_URL < backup.sql
```

### Render Backups

Render PostgreSQL includes automatic daily backups with 7-day retention. Access backups from the Render dashboard.

## Security Notes

- Never commit `.env` files with real credentials
- Use environment variables for all sensitive data
- Rotate access tokens regularly
- Consider encrypting sensitive fields (access_token, refresh_token) at rest
- Use SSL/TLS for database connections in production (Render enforces this)
