/**
 * Rate Limiter for OpenAI API calls
 * Implements token bucket algorithm to respect RPM and TPM limits
 */

interface QueuedTask {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  estimatedTokens: number;
  queuedAt: number;
}

export class RateLimiter {
  private queue: QueuedTask[] = [];
  private processing = false;
  private requestTimestamps: number[] = [];
  private tokensUsedInWindow = 0;
  private readonly maxRequestsPerMinute: number;
  private readonly maxTokensPerMinute: number;
  private readonly minDelayBetweenRequests: number;

  constructor(
    maxRequestsPerMinute: number = 450, // 90% of 500 RPM for safety
    maxTokensPerMinute: number = 450000  // 90% of 500K TPM for safety
  ) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.maxTokensPerMinute = maxTokensPerMinute;
    // Calculate minimum delay to spread requests evenly
    this.minDelayBetweenRequests = Math.ceil(60000 / maxRequestsPerMinute);
    
    console.log(`[RateLimiter] Initialized with ${maxRequestsPerMinute} RPM, ${maxTokensPerMinute} TPM`);
    console.log(`[RateLimiter] Min delay between requests: ${this.minDelayBetweenRequests}ms`);
  }

  /**
   * Execute a function with rate limiting
   * @param fn - Async function to execute
   * @param estimatedTokens - Estimated token usage for this request
   * @returns Promise that resolves with the function result
   */
  async executeWithRateLimit<T>(
    fn: () => Promise<T>,
    estimatedTokens: number = 1000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        estimatedTokens,
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

      // Reset token counter if we're in a new window
      if (this.requestTimestamps.length === 0) {
        this.tokensUsedInWindow = 0;
      }

      const task = this.queue[0];

      // Check RPM limit
      if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
        const oldestRequest = this.requestTimestamps[0];
        const waitTime = 60000 - (now - oldestRequest) + 100; // +100ms buffer
        
        if (this.queue.length > 10) {
          console.log(
            `[RateLimiter] RPM limit reached (${this.requestTimestamps.length}/${this.maxRequestsPerMinute}), ` +
            `waiting ${Math.round(waitTime)}ms, queue: ${this.queue.length} tasks`
          );
        }
        
        await this.delay(waitTime);
        continue;
      }

      // Check TPM limit
      if (this.tokensUsedInWindow + task.estimatedTokens > this.maxTokensPerMinute) {
        // Calculate how long to wait based on token usage
        const tokenUsagePercent = (this.tokensUsedInWindow / this.maxTokensPerMinute) * 100;
        
        console.log(
          `[RateLimiter] TPM limit approaching (${this.tokensUsedInWindow}/${this.maxTokensPerMinute} = ${tokenUsagePercent.toFixed(1)}%), ` +
          `waiting 2s, queue: ${this.queue.length} tasks`
        );
        
        await this.delay(2000);
        
        // Reset token counter if enough time has passed
        if (this.requestTimestamps.length > 0) {
          const oldestRequest = this.requestTimestamps[0];
          if (now - oldestRequest > 60000) {
            this.tokensUsedInWindow = 0;
          }
        }
        continue;
      }

      // Execute the task
      this.queue.shift(); // Remove from queue
      this.requestTimestamps.push(now);
      this.tokensUsedInWindow += task.estimatedTokens;

      const waitTime = now - task.queuedAt;
      if (waitTime > 5000) {
        console.log(`[RateLimiter] Task waited ${Math.round(waitTime / 1000)}s in queue`);
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
   * Get estimated tokens used in the current window
   */
  getTokensInCurrentWindow(): number {
    return this.tokensUsedInWindow;
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    queueLength: number;
    requestsInLastMinute: number;
    tokensInCurrentWindow: number;
    maxRPM: number;
    maxTPM: number;
    rpmUsagePercent: number;
    tpmUsagePercent: number;
  } {
    const requestsInLastMinute = this.getRequestsInLastMinute();
    const rpmUsagePercent = (requestsInLastMinute / this.maxRequestsPerMinute) * 100;
    const tpmUsagePercent = (this.tokensUsedInWindow / this.maxTokensPerMinute) * 100;

    return {
      queueLength: this.queue.length,
      requestsInLastMinute,
      tokensInCurrentWindow: this.tokensUsedInWindow,
      maxRPM: this.maxRequestsPerMinute,
      maxTPM: this.maxTokensPerMinute,
      rpmUsagePercent: Math.round(rpmUsagePercent * 10) / 10,
      tpmUsagePercent: Math.round(tpmUsagePercent * 10) / 10,
    };
  }
}

// Global singleton instance for OpenAI API calls
export const openAIRateLimiter = new RateLimiter(450, 450000);
