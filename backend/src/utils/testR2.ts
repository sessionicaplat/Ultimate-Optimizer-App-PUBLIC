/**
 * Test script for Cloudflare R2 configuration
 * Run with: npx tsx src/utils/testR2.ts
 */

import { r2Client } from './r2Client';
import { logger } from './logger';

async function testR2Configuration() {
  console.log('\n=== Cloudflare R2 Configuration Test ===\n');

  // Check if R2 is enabled
  if (!r2Client.isEnabled()) {
    console.log('❌ R2 is NOT configured');
    console.log('\nTo enable R2, set these environment variables:');
    console.log('  - CLOUDFLARE_ACCOUNT_ID');
    console.log('  - CLOUDFLARE_R2_ACCESS_KEY_ID');
    console.log('  - CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    console.log('  - CLOUDFLARE_R2_BUCKET_NAME (optional, default: optimized-images)');
    console.log('  - CLOUDFLARE_R2_PUBLIC_URL (optional)');
    console.log('\n✅ System will work without R2, but images will use temporary Replicate URLs\n');
    return;
  }

  console.log('✅ R2 is configured and enabled\n');

  // Test upload with a sample image
  console.log('Testing R2 upload...');
  
  try {
    // Use a small test image URL (1x1 transparent PNG)
    const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Generate test key
    const testKey = r2Client.generateKey('test-instance', 999999, 999999, 'png');
    console.log(`Storage key: ${testKey}`);

    // For data URLs, we need to convert to buffer
    const base64Data = testImageUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const publicUrl = await r2Client.uploadBuffer(buffer, testKey, 'image/png');
    
    console.log(`✅ Upload successful!`);
    console.log(`Public URL: ${publicUrl}`);
    
    // Clean up test file
    console.log('\nCleaning up test file...');
    await r2Client.deleteImage(testKey);
    console.log('✅ Test file deleted');
    
    console.log('\n✅ R2 configuration is working correctly!\n');
  } catch (error: any) {
    console.error('\n❌ R2 test failed:', error.message);
    console.log('\nPlease check:');
    console.log('  1. Credentials are correct');
    console.log('  2. Bucket exists and is accessible');
    console.log('  3. API token has Read & Write permissions');
    console.log('  4. Network connectivity to Cloudflare\n');
  }
}

// Run test
testR2Configuration().catch(console.error);

