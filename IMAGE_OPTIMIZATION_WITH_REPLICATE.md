# Image Optimization with Replicate AI

## Overview

The Image Optimization feature allows users to enhance product images using Replicate's AI-powered `google/nano-banana` model. Users can select up to 10 images from a product, provide custom prompts, and process them through AI optimization.

## Features

### 1. Image Selection & Prompting
- Browse products and view all their images
- Select up to 10 images for batch optimization
- Provide individual prompts per image OR use a global prompt for all
- Real-time credit calculation (15 credits per image)

### 2. Ongoing Optimization Page
- Real-time monitoring of active optimization jobs
- Progress tracking with visual indicators
- Status updates for each image (PENDING, RUNNING, DONE, FAILED)
- Auto-refresh every 5 seconds for job list
- Auto-refresh every 3 seconds for job details

### 3. Completed Optimization Page
- View all completed optimization jobs
- Before/After image comparison in grid view
- Click to view full-size comparison in modal
- See prompts used for each optimization
- View failed images with error messages

## Technical Implementation

### Backend Components

#### 1. Database Schema
**New Tables:**
- `image_optimization_jobs` - Tracks optimization jobs
  - Stores product info, status, progress counters
  - Links to app instance for multi-tenancy
  
- `image_optimization_items` - Individual image optimizations
  - Stores image URLs, prompts, Replicate prediction IDs
  - Tracks status and optimized image URLs

#### 2. Replicate Integration (`backend/src/replicate/client.ts`)
- `optimizeImage()` - Synchronous image optimization
- `createImageOptimizationPrediction()` - Async prediction creation
- `getPrediction()` - Check prediction status
- `cancelPrediction()` - Cancel running predictions

#### 3. API Routes (`backend/src/routes/imageOptimization.ts`)
- `POST /api/image-optimization` - Create new optimization job
  - Validates input (max 10 images)
  - Checks and deducts credits
  - Creates job and items in database
  
- `GET /api/image-optimization/jobs` - List all jobs
  - Optional status filter
  - Returns paginated results
  
- `GET /api/image-optimization/jobs/:jobId` - Get job details
  - Returns job info and all items
  - Includes optimized image URLs

#### 4. Background Worker (`backend/src/workers/imageOptimizationWorker.ts`)
- Processes pending items every 30 seconds
- Handles up to 5 items per cycle
- Sequential processing to respect rate limits
- Updates job progress and status automatically
- Handles errors gracefully

### Frontend Components

#### 1. Image Selection Page (`ImageOptimization.tsx`)
- Product search and selection
- Image grid with selection checkboxes
- Global prompt or individual prompts
- Credit calculation and validation
- Navigation to ongoing/completed pages

#### 2. Ongoing Page (`OngoingImageOptimization.tsx`)
- Job list with progress bars
- Real-time status updates
- Image grid showing current status
- Color-coded status badges

#### 3. Completed Page (`CompletedImageOptimization.tsx`)
- Completed jobs list
- Before/After comparison cards
- Full-screen modal for detailed comparison
- Failed images section with error details

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install replicate
```

### 2. Set Environment Variable
Add to your `.env` file:
```
REPLICATE_API_TOKEN=r8_your_replicate_token_here
```

Get your token from: https://replicate.com/account/api-tokens

### 3. Run Database Migration
```bash
cd backend
npm run migrate
```

This creates the new tables:
- `image_optimization_jobs`
- `image_optimization_items`

### 4. Restart Backend Server
The worker will start automatically when the server starts.

## API Reference

### Create Optimization Job
```typescript
POST /api/image-optimization
Headers: {
  Authorization: Bearer <instance-token>
}
Body: {
  productId: string;
  productName: string;
  images: Array<{
    imageId: string;
    imageUrl: string;
    prompt: string;
  }>;
}

Response: {
  success: true;
  job: {
    id: number;
    productId: string;
    productName: string;
    status: string;
    totalImages: number;
    completedImages: number;
    failedImages: number;
    createdAt: string;
  };
  creditsUsed: number;
  creditsRemaining: number;
}
```

### List Jobs
```typescript
GET /api/image-optimization/jobs?status=PENDING,RUNNING
Headers: {
  Authorization: Bearer <instance-token>
}

Response: {
  jobs: Array<{
    id: number;
    productId: string;
    productName: string;
    status: string;
    totalImages: number;
    completedImages: number;
    failedImages: number;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
  }>;
}
```

### Get Job Details
```typescript
GET /api/image-optimization/jobs/:jobId
Headers: {
  Authorization: Bearer <instance-token>
}

Response: {
  job: { /* job details */ };
  items: Array<{
    id: number;
    imageId: string;
    imageUrl: string;
    prompt: string;
    status: string;
    optimizedImageUrl?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

## Replicate Model Details

**Model:** `google/nano-banana`

**Input Schema:**
- `prompt` (string, required) - Text description of desired transformation
- `image_input` (array of URLs, required) - Input images to transform
- `aspect_ratio` (string, optional) - Default: "match_input_image"
- `output_format` (string, optional) - "jpg" or "png", default: "jpg"

**Output:** URL to optimized image

**Pricing:** Check Replicate.com for current pricing

## Credits System

- Each image optimization costs **15 credits**
- Credits are deducted when job is created
- Failed optimizations do not refund credits
- Check available credits before creating jobs

## Error Handling

### Common Errors:
1. **Insufficient Credits** (402)
   - User needs to upgrade plan or wait for monthly reset

2. **Invalid Input** (400)
   - Missing required fields
   - More than 10 images selected
   - Empty prompts

3. **Replicate API Errors** (500)
   - Rate limiting
   - Model unavailable
   - Invalid image URLs

### Worker Error Handling:
- Failed items are marked with error message
- Job continues processing remaining items
- Job status becomes DONE when all items complete
- Job status becomes FAILED only if ALL items fail

## Performance Considerations

1. **Rate Limiting**
   - Worker processes 5 items per cycle
   - 1 second delay between items
   - 30 second cycle interval

2. **Database Queries**
   - Indexed on status and created_at
   - Efficient pagination support
   - Optimized joins for instance verification

3. **Frontend Updates**
   - Ongoing page: 5s refresh for jobs, 3s for details
   - Completed page: No auto-refresh (static data)
   - Efficient state management

## Future Enhancements

1. **Webhook Support**
   - Use Replicate webhooks for instant updates
   - Eliminate polling overhead

2. **Batch Processing**
   - Process multiple images in single API call
   - Reduce API costs

3. **Image Upload**
   - Allow users to upload custom images
   - Not just product images

4. **Advanced Options**
   - Aspect ratio selection
   - Output format selection
   - Quality settings

5. **History & Analytics**
   - Track optimization success rates
   - Popular prompts
   - Credit usage analytics

## Testing

### Manual Testing Steps:

1. **Create Job:**
   - Go to Image Optimization page
   - Select a product
   - Select 2-3 images
   - Add prompts
   - Click "Optimize Images"
   - Verify credits are deducted

2. **Monitor Progress:**
   - Navigate to Ongoing page
   - Verify job appears
   - Watch progress bar update
   - Check individual image statuses

3. **View Results:**
   - Wait for job completion
   - Navigate to Completed page
   - Click on completed job
   - Compare before/after images
   - Click image to view full-size modal

4. **Error Scenarios:**
   - Try with insufficient credits
   - Try with invalid image URLs
   - Try with empty prompts

## Deployment Checklist

- [ ] Set `REPLICATE_API_TOKEN` environment variable
- [ ] Run database migrations
- [ ] Verify worker starts with server
- [ ] Test with production Wix products
- [ ] Monitor Replicate API usage and costs
- [ ] Set up error alerting
- [ ] Document for end users

## Support

For issues or questions:
1. Check Replicate API status
2. Review server logs for worker errors
3. Verify database migrations ran successfully
4. Check environment variables are set correctly
