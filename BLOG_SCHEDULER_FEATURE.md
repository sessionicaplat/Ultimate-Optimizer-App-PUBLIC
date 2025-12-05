# Blog Scheduler Feature

## Overview
The Blog Scheduler allows users to create campaigns with up to 30 scheduled blog posts that will be automatically generated and published at specified dates and times.

## Features

### Blog Scheduler Page (`/blog-scheduler`)
- **Campaign Creation**: Name your campaign (e.g., "Holiday launch sequence")
- **Source Selection**: Choose between store products or keyword prompts
- **Idea Generation**: Generate 5 AI-powered blog topic ideas
- **Scheduling**: Set unique date and time for each blog (up to 30 per campaign)
- **Credit Management**: View credits needed vs available
- **Real-time Summary**: Track scheduled blogs count and credit requirements

### Campaigns Page (`/campaigns`)
- **Active Campaigns Tab**: View and manage up to 10 active campaigns
- **Archived Campaigns Tab**: Access archived campaigns
- **Campaign Management**:
  - Expand to view all scheduled blogs
  - See status (Scheduled, Processing, Completed, Failed)
  - Remove individual scheduled blogs
  - Archive campaigns when done
  - Restore archived campaigns
  - Permanently delete archived campaigns

## Technical Implementation

### Database Schema
- **blog_campaigns**: Stores campaign metadata
  - id, instance_id, name, status, created_at, updated_at, archived_at
  
- **scheduled_blogs**: Stores individual scheduled blog posts
  - id, campaign_id, instance_id, source_type, source_id, blog_idea
  - scheduled_date, status, blog_generation_id, error, created_at, executed_at

### Backend Components
1. **Routes** (`backend/src/routes/blogScheduler.ts`):
   - POST `/api/campaigns` - Create campaign
   - GET `/api/campaigns` - List campaigns
   - GET `/api/campaigns/:id` - Get campaign with stats
   - PUT `/api/campaigns/:id` - Update campaign
   - DELETE `/api/campaigns/:id` - Delete campaign
   - POST `/api/campaigns/:id/scheduled-blogs` - Add scheduled blogs
   - GET `/api/campaigns/:id/scheduled-blogs` - Get scheduled blogs
   - GET `/api/scheduled-blogs` - Get all scheduled blogs
   - PUT `/api/scheduled-blogs/:id` - Update scheduled blog
   - DELETE `/api/scheduled-blogs/:id` - Delete scheduled blog

2. **Database Layer** (`backend/src/db/blogScheduler.ts`):
   - Campaign CRUD operations
   - Scheduled blog CRUD operations
   - Query due scheduled blogs
   - Get campaign statistics

3. **Worker** (`backend/src/workers/blogSchedulerWorker.ts`):
   - Runs every minute to check for due scheduled blogs
   - Automatically creates blog generations for due posts
   - Links scheduled blogs to blog generations
   - Handles errors and updates status

### Frontend Components
1. **BlogScheduler** (`frontend/src/pages/BlogScheduler.tsx`):
   - Campaign name input
   - Source selection (product/keyword)
   - Idea generation interface
   - Date/time picker for each blog
   - Schedule management
   - Credit balance display

2. **Campaigns** (`frontend/src/pages/Campaigns.tsx`):
   - Tabbed interface (Active/Archived)
   - Expandable campaign cards
   - Scheduled blog list with status
   - Campaign actions (Archive/Restore/Delete)
   - Remove individual scheduled blogs

### Workflow
1. User creates a campaign with a name
2. User selects source (product or keyword)
3. User generates blog ideas using AI
4. User adds ideas to schedule with specific dates/times
5. User saves campaign (up to 30 blogs)
6. Background worker checks every minute for due blogs
7. When a blog is due, worker creates a blog generation
8. Blog generation worker processes the blog
9. User can view progress in Campaigns page
10. User can archive completed campaigns

## Limits
- **Maximum 10 active campaigns** at a time
- **Maximum 30 scheduled blogs** per campaign
- **25 credits per blog** generation
- Campaigns can be archived to free up slots

## Navigation
- Added "Blog Scheduler" link in sidebar under Content Optimization
- "View Campaigns" button in Blog Scheduler page
- "Create Campaign" button in Campaigns page
- "Blog Scheduler" button in Blog Generator page

## Migration
Run the migration to create the required tables:
```bash
npm run migrate
```

Migration file: `backend/migrations/1730000003000_blog-scheduler-schema.js`

## Status Flow
Scheduled Blog Status:
- **SCHEDULED** → Initial state when added to campaign
- **PROCESSING** → Worker picked up the blog and creating generation
- **COMPLETED** → Blog generation completed successfully
- **FAILED** → Blog generation failed (error message stored)
- **CANCELLED** → User manually cancelled the scheduled blog

Campaign Status:
- **ACTIVE** → Campaign is active and processing scheduled blogs
- **COMPLETED** → All blogs in campaign are done
- **ARCHIVED** → Campaign archived by user (can be restored)
