# Image Optimization Flow Diagram

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMAGE OPTIMIZATION PAGE                       │
│                                                                  │
│  1. User searches for product                                   │
│  2. Selects product from list                                   │
│  3. Views all product images                                    │
│  4. Selects up to 10 images                                     │
│  5. Adds prompts (global or individual)                         │
│  6. Clicks "Optimize Images"                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API VALIDATION                      │
│                                                                  │
│  ✓ Validate input (max 10 images)                              │
│  ✓ Check available credits                                      │
│  ✓ Deduct credits (10 per image)                               │
│  ✓ Create job in database                                       │
│  ✓ Create items for each image                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ONGOING OPTIMIZATION PAGE                     │
│                                                                  │
│  • Job appears in list                                          │
│  • Progress bar shows 0%                                        │
│  • Status: PENDING                                              │
│  • Auto-refresh every 5 seconds                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKER (30s cycle)                 │
│                                                                  │
│  1. Query for pending items (max 5)                            │
│  2. For each item:                                              │
│     a. Update status to RUNNING                                 │
│     b. Call Replicate API                                       │
│     c. Wait for result (~30-60s)                               │
│     d. Update with optimized URL                                │
│     e. Update status to DONE                                    │
│     f. Wait 1 second (rate limit)                              │
│  3. Update job progress counters                                │
│  4. Update job status if all complete                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ONGOING PAGE (UPDATING)                       │
│                                                                  │
│  • Progress bar increases                                       │
│  • Status changes: PENDING → RUNNING → DONE                    │
│  • Individual images show status                                │
│  • Completed count increases                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETED OPTIMIZATION PAGE                   │
│                                                                  │
│  • Job appears in completed list                                │
│  • Shows before/after comparison grid                           │
│  • Click image for full-size modal                              │
│  • View prompts used                                            │
│  • See any failed images with errors                            │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Flow

```
┌──────────────┐
│   Frontend   │
│  (React)     │
└──────┬───────┘
       │ POST /api/image-optimization
       │ { productId, images: [{imageId, imageUrl, prompt}] }
       ↓
┌──────────────────────────────────────────────────────────────┐
│                    Express API Server                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  imageOptimization.ts (Route Handler)               │   │
│  │                                                       │   │
│  │  1. Verify instance token                           │   │
│  │  2. Validate input                                   │   │
│  │  3. Check credits                                    │   │
│  │  4. Deduct credits                                   │   │
│  │  5. Create job & items                              │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│                                                               │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │ image_optimization_jobs  │  │ image_optimization_items│ │
│  │                          │  │                         │ │
│  │ • id                     │  │ • id                    │ │
│  │ • instance_id            │  │ • job_id                │ │
│  │ • product_id             │  │ • image_id              │ │
│  │ • status: PENDING        │  │ • image_url             │ │
│  │ • total_images           │  │ • prompt                │ │
│  │ • completed_images: 0    │  │ • status: PENDING       │ │
│  └──────────────────────────┘  │ • optimized_image_url   │ │
│                                 └─────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              Background Worker (Every 30 seconds)             │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  imageOptimizationWorker.ts                         │   │
│  │                                                       │   │
│  │  while (true) {                                      │   │
│  │    items = getPendingItems(limit: 5)                │   │
│  │    for each item {                                   │   │
│  │      updateStatus(item, 'RUNNING')                  │   │
│  │      result = replicateAPI.optimize(url, prompt)    │   │
│  │      updateItem(item, result)                       │   │
│  │      updateJobProgress(item.job_id)                 │   │
│  │      sleep(1000) // rate limit                      │   │
│  │    }                                                 │   │
│  │    sleep(30000) // next cycle                       │   │
│  │  }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    Replicate API                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Model: google/nano-banana                          │   │
│  │                                                       │   │
│  │  Input:                                              │   │
│  │    • image_input: [url]                             │   │
│  │    • prompt: "Make background white..."             │   │
│  │    • aspect_ratio: "match_input_image"              │   │
│  │    • output_format: "jpg"                           │   │
│  │                                                       │   │
│  │  Processing: ~30-60 seconds                         │   │
│  │                                                       │   │
│  │  Output:                                             │   │
│  │    • url: "https://replicate.delivery/.../out.jpg"  │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    Database Updated                           │
│                                                               │
│  image_optimization_items:                                    │
│    • status: DONE                                            │
│    • optimized_image_url: "https://replicate.delivery/..."  │
│                                                               │
│  image_optimization_jobs:                                     │
│    • status: RUNNING → DONE                                  │
│    • completed_images: incremented                           │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────┐
│   Frontend   │
│  (Polling)   │
│              │
│  GET /api/image-optimization/jobs/:id                        │
│  • Receives updated status                                   │
│  • Shows progress                                            │
│  • Displays optimized images                                 │
└──────────────┘
```

## State Transitions

### Job Status
```
PENDING → RUNNING → DONE
                 ↘ FAILED
                 ↘ CANCELED
```

### Item Status
```
PENDING → RUNNING → DONE
                 ↘ FAILED
```

## Timing

```
User Action          : Instant
API Validation       : < 1 second
Database Write       : < 1 second
Worker Pickup        : 0-30 seconds (next cycle)
Replicate Processing : 30-60 seconds per image
Database Update      : < 1 second
Frontend Refresh     : 3-5 seconds
Total Time          : ~1-2 minutes for 1 image
                      ~5-10 minutes for 10 images
```

## Error Handling

```
┌─────────────────┐
│  Error Occurs   │
└────────┬────────┘
         │
         ├─→ Invalid Input → 400 Bad Request → User sees error
         │
         ├─→ Insufficient Credits → 402 Payment Required → User sees error
         │
         ├─→ Replicate API Error → Item marked FAILED → Continue with others
         │
         └─→ Database Error → 500 Internal Error → Job marked FAILED
```

## Concurrent Processing

```
Job 1: [Image1] [Image2] [Image3] [Image4] [Image5]
       ↓        ↓        ↓        ↓        ↓
       Processing in parallel (up to 5 at a time)
       
Job 2: [Image6] [Image7] [Image8]
       ↓        ↓        ↓
       Waits for Job 1 to free up slots
```

## Credit Flow

```
User has 100 credits
       ↓
Selects 5 images (50 credits needed)
       ↓
API validates: 100 >= 50 ✓
       ↓
Deduct 50 credits immediately
       ↓
User now has 50 credits
       ↓
Job processes (success or failure doesn't affect credits)
       ↓
Credits remain at 50 until next job
```

---

This flow ensures:
- ✅ Reliable processing
- ✅ Clear user feedback
- ✅ Efficient resource usage
- ✅ Graceful error handling
- ✅ Scalable architecture
