/**
 * Rate Limiter for Replicate API
 * Implements token bucket algorithm to respect 500 RPM limit
 */

interface QueuedTask {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  queuedAt: number;
}

export class ReplicateRateLimiter {
  private queue: QueuedTask[] = [];
  private processing = false;
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerMinute: number;
  private readonly minDelayBetweenRequests: number;

  constructor(maxRequestsPerMinute: number = 450) {
    // 90% of 500 RPM for safety margin
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    // Calculate minimum delay to spread requests evenly
    this.minDelayBetweenRequests = Math.ceil(60000 / maxRequestsPerMinute);
    
    console.log(`[ReplicateRateLimiter] Initialized with ${maxRequestsPerMinute} RPM`);
    console.log(`[ReplicateRateLimiter] Min delay between requests: ${this.minDelayBetweenRequests}ms`);
  }

  /**
   * Execute a function with rate limiting
   * @param fn - Async function to execute
   * @returns Promise that resolves with the function result
   */
  async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        queuedAt: Date.now(),
      });

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued tasks while respecting rate limits
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();

      // Clean up old timestamps (older than 60 seconds)
      this.requestTimestamps = this.requestTimestamps.filter(
        ts => now - ts < 60000
      );

      const task = this.queue[0];

      // Check RPM limit
      if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
        const oldestRequest = this.requestTimestamps[0];
        const waitTime = 60000 - (now - oldestRequest) + 100; // +100ms buffer
        
        if (this.queue.length > 10) {
          console.log(
            `[ReplicateRateLimiter] RPM limit reached (${this.requestTimestamps.length}/${this.maxRequestsPerMinute}), ` +
            `waiting ${Math.round(waitTime)}ms, queue: ${this.queue.length} tasks`
          );
        }
        
        await this.delay(waitTime);
        continue;
      }

      // Execute the task
      this.queue.shift(); // Remove from queue
      this.requestTimestamps.push(now);

      const waitTime = now - task.queuedAt;
      if (waitTime > 5000) {
        console.log(`[ReplicateRateLimiter] Task waited ${Math.round(waitTime / 1000)}s in queue`);
      }

      try {
        const result = await task.fn();
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }

      // Add delay between requests to smooth out the rate
      if (this.queue.length > 0) {
        await this.delay(this.minDelayBetweenRequests);
      }
    }

    this.processing = false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get number of requests made in the last minute
   */
  getRequestsInLastMinute(): number {
    const now = Date.now();
    return this.requestTimestamps.filter(ts => now - ts < 60000).length;
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    queueLength: number;
    requestsInLastMinute: number;
    maxRPM: number;
    rpmUsagePercent: number;
  } {
    const requestsInLastMinute = this.getRequestsInLastMinute();
    const rpmUsagePercent = (requestsInLastMinute / this.maxRequestsPerMinute) * 100;

    return {
      queueLength: this.queue.length,
      requestsInLastMinute,
      maxRPM: this.maxRequestsPerMinute,
      rpmUsagePercent: Math.round(rpmUsagePercent * 10) / 10,
    };
  }
}

// Global singleton instance for Replicate API calls
export const replicateRateLimiter = new ReplicateRateLimiter(450);
