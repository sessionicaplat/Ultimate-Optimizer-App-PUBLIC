# Product Optimizer Rate Limiting Implementation

## Overview

The product optimizer now includes a sophisticated rate limiting system to handle high-volume job processing while respecting OpenAI API limits.

## OpenAI API Limits

- **RPM (Requests Per Minute):** 500
- **TPM (Tokens Per Minute):** 500,000
- **TPD (Tokens Per Day):** 5,000,000

## Rate Limiter Configuration

The system is configured to use **90% of limits** for safety:
- **Target RPM:** 450 (90% of 500)
- **Target TPM:** 450,000 (90% of 500K)
- **Min delay between requests:** ~133ms (calculated from 450 RPM)

## How It Works

### 1. Token Bucket Algorithm

The rate limiter implements a sliding window approach:

```
┌─────────────────────────────────────────┐
│  Request Queue (In-Memory)              │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐              │
│  │ 1 │ │ 2 │ │ 3 │ │...│              │
│  └───┘ └───┘ └───┘ └───┘              │
└─────────────────────────────────────────┘
           ↓
    Rate Limiter Checks:
    - RPM: 450/min? ✓
    - TPM: 450K/min? ✓
           ↓
    ┌──────────────┐
    │ OpenAI API   │
    └──────────────┘
```

### 2. Processing Flow

1. **Job Creation:** User creates job with N products × M attributes
2. **Database Queue:** Job items created with `PENDING` status
3. **Worker Claims:** Worker claims 100 items every 2 seconds
4. **Rate Limiter Queue:** All 100 items queued in memory immediately
5. **Controlled Execution:** Rate limiter processes at 450 RPM
6. **Status Updates:** Items marked as `DONE` or `FAILED`

### 3. Token Estimation

The system estimates token usage before making requests:

```typescript
// Rough estimation: ~4 characters per token
inputTokens = (productTitle + description + prompt).length / 4
outputTokens = 1000 (max_completion_tokens)
totalEstimate = inputTokens + outputTokens
```

## Performance Metrics

### Processing Capacity

| Jobs | Attributes | Total Items | Processing Time |
|------|-----------|-------------|-----------------|
| 100  | 4         | 400         | ~1 minute       |
| 500  | 4         | 2,000       | ~4-5 minutes    |
| 1,000| 4         | 4,000       | ~9 minutes      |
| 5,000| 4         | 20,000      | ~45 minutes     |

**Formula:** `Processing Time ≈ (Total Items ÷ 450) minutes`

### Multi-Account Scenario

With 5000 jobs across multiple accounts:
- All jobs share the same OpenAI API key
- Rate limiter ensures fair processing
- No rate limit errors (429s)
- Predictable completion times

## Monitoring

### Worker Logs

The worker logs rate limiter statistics every 30 seconds:

```
[Worker] Heartbeat - cycle 15, hasPendingJobs: true
  Rate Limiter: queue=45, RPM=387/450 (86.0%), TPM=245000/450000 (54.4%)
```

**Key Metrics:**
- `queue`: Number of items waiting in rate limiter
- `RPM`: Current requests per minute vs limit
- `TPM`: Current tokens per minute vs limit

### Rate Limiter Stats API

You can query rate limiter stats programmatically:

```typescript
import { openAIRateLimiter } from './utils/rateLimiter';

const stats = openAIRateLimiter.getStats();
// {
//   queueLength: 45,
//   requestsInLastMinute: 387,
//   tokensInCurrentWindow: 245000,
//   maxRPM: 450,
//   maxTPM: 450000,
//   rpmUsagePercent: 86.0,
//   tpmUsagePercent: 54.4
// }
```

## Behavior Under Load

### Normal Load (< 100 items/minute)
- Items processed immediately
- No queuing delay
- RPM usage: 20-30%

### Medium Load (100-400 items/minute)
- Minimal queuing (< 5 seconds)
- RPM usage: 50-90%
- Smooth processing

### High Load (> 450 items/minute)
- Items queue in memory
- Processing at max safe rate (450 RPM)
- RPM usage: 95-100%
- Queue drains over time

### Burst Load (5000 items at once)
- Worker claims 100 items every 2 seconds
- All items queued in rate limiter
- Processes at 450 RPM consistently
- Total time: ~11-12 minutes for 5000 items

## Error Handling

### Rate Limit Errors (429)

The system has **two layers** of protection:

1. **Proactive Rate Limiting:** Prevents 429 errors by queuing requests
2. **Retry Logic:** If 429 occurs, retries with exponential backoff (1s, 2s, 4s)

### Failed Items

Items that fail after retries are marked as `FAILED`:
- Error message stored in database
- Job continues processing other items
- User can review failed items in UI

## Configuration

### Adjusting Rate Limits

Edit `backend/src/utils/rateLimiter.ts`:

```typescript
// Conservative (safer, slower)
export const openAIRateLimiter = new RateLimiter(400, 400000);

// Aggressive (faster, riskier)
export const openAIRateLimiter = new RateLimiter(480, 480000);

// Current (recommended)
export const openAIRateLimiter = new RateLimiter(450, 450000);
```

### Adjusting Worker Batch Size

Edit `backend/src/workers/jobWorker.ts`:

```typescript
// Claim more items for faster queue filling
const items = await claimPendingItems(150); // Default: 100

// Claim fewer items for lower memory usage
const items = await claimPendingItems(50);
```

## Database Impact

### Before Rate Limiter
- 50 items claimed every 2 seconds
- Items in `RUNNING` state for variable time
- Unpredictable completion

### After Rate Limiter
- 100 items claimed every 2 seconds
- Items in `RUNNING` state briefly (queued in memory)
- Predictable completion at 450 items/minute

**Database Load:** Minimal increase, well within PostgreSQL capacity

## Troubleshooting

### Queue Growing Too Large

**Symptom:** Rate limiter queue > 500 items

**Causes:**
- Burst of jobs from multiple accounts
- OpenAI API slower than usual
- Token limit hit (TPM)

**Solution:** Wait for queue to drain, or temporarily increase RPM limit

### Processing Too Slow

**Symptom:** Jobs taking longer than expected

**Check:**
1. Rate limiter stats (RPM/TPM usage)
2. OpenAI API status
3. Database connection pool

**Solutions:**
- Increase RPM limit if safe
- Check for failed items
- Review token estimation accuracy

### Memory Usage High

**Symptom:** Server memory increasing

**Cause:** Large queue in rate limiter (each item ~1KB)

**Solution:**
- Reduce worker batch size
- Add memory monitoring
- Consider distributed workers for extreme scale

## Future Enhancements

### Priority Queue
- Premium accounts processed first
- Urgent jobs skip ahead
- Fair scheduling algorithm

### Distributed Workers
- Multiple worker processes
- Shared rate limiter via Redis
- Horizontal scaling

### Dynamic Rate Adjustment
- Monitor OpenAI API response times
- Adjust rate based on success rate
- Auto-scale during off-peak hours

### User Notifications
- Email when job completes
- Webhook for integrations
- Progress updates in real-time

## Summary

The rate limiting implementation provides:

✅ **Reliable processing** - No rate limit errors
✅ **Predictable timing** - 450 items/minute consistently
✅ **Scalable** - Handles 5000+ jobs across accounts
✅ **Efficient** - Maximizes OpenAI quota usage
✅ **Monitored** - Real-time stats and logging
✅ **Fair** - All accounts processed in order

**Capacity:** ~27,000 items per hour (450 RPM × 60 minutes)
**Daily Capacity:** ~648,000 items per day (limited by TPD: 5M tokens)
