/**
 * Test script for rate limiter
 * Run with: npx tsx backend/test-rate-limiter.ts
 */

import { RateLimiter } from './src/utils/rateLimiter';

async function testRateLimiter() {
  console.log('=== Rate Limiter Test ===\n');

  // Create a test rate limiter with lower limits for faster testing
  const limiter = new RateLimiter(10, 10000); // 10 RPM, 10K TPM

  console.log('Test 1: Processing 5 requests (should complete quickly)');
  const start1 = Date.now();
  
  const promises1 = Array.from({ length: 5 }, (_, i) => 
    limiter.executeWithRateLimit(
      async () => {
        console.log(`  Request ${i + 1} executing at ${Date.now() - start1}ms`);
        await new Promise(resolve => setTimeout(resolve, 100));
        return `Result ${i + 1}`;
      },
      500 // 500 tokens per request
    )
  );

  await Promise.all(promises1);
  const duration1 = Date.now() - start1;
  console.log(`✓ Test 1 completed in ${duration1}ms\n`);

  console.log('Test 2: Processing 20 requests (should be rate limited)');
  const start2 = Date.now();
  
  const promises2 = Array.from({ length: 20 }, (_, i) => 
    limiter.executeWithRateLimit(
      async () => {
        const elapsed = Date.now() - start2;
        console.log(`  Request ${i + 1} executing at ${elapsed}ms`);
        return `Result ${i + 1}`;
      },
      500 // 500 tokens per request
    )
  );

  // Check stats while processing
  setTimeout(() => {
    const stats = limiter.getStats();
    console.log(`\n  [Stats during processing]`);
    console.log(`    Queue: ${stats.queueLength} items`);
    console.log(`    RPM: ${stats.requestsInLastMinute}/${stats.maxRPM} (${stats.rpmUsagePercent}%)`);
    console.log(`    TPM: ${stats.tokensInCurrentWindow}/${stats.maxTPM} (${stats.tpmUsagePercent}%)\n`);
  }, 2000);

  await Promise.all(promises2);
  const duration2 = Date.now() - start2;
  console.log(`✓ Test 2 completed in ${duration2}ms`);
  console.log(`  Expected: ~60 seconds (20 requests at 10 RPM)`);
  console.log(`  Actual: ${(duration2 / 1000).toFixed(1)} seconds\n`);

  const finalStats = limiter.getStats();
  console.log('Final Stats:');
  console.log(`  Queue: ${finalStats.queueLength} items`);
  console.log(`  RPM: ${finalStats.requestsInLastMinute}/${finalStats.maxRPM}`);
  console.log(`  TPM: ${finalStats.tokensInCurrentWindow}/${finalStats.maxTPM}`);

  console.log('\n✅ All tests completed!');
}

// Run tests
testRateLimiter().catch(console.error);
