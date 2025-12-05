/**
 * Simple test script to verify instance token verification
 * 
 * Run with: tsx src/auth/test-verify.ts
 */

import crypto from 'crypto';
import { verifyWixSignature } from './verifyInstance';

// Test secret (use a real one in production)
const TEST_APP_SECRET = 'test-secret-key-12345';

/**
 * Create a test instance token
 */
function createTestToken(payload: any, secret: string): string {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');
  
  return `${payloadBase64}.${signature}`;
}

// Test 1: Valid token
console.log('Test 1: Valid token');
try {
  const payload = {
    instanceId: 'test-instance-123',
    siteHost: 'example.wixsite.com',
    appDefId: 'test-app-id',
  };
  
  const token = createTestToken(payload, TEST_APP_SECRET);
  console.log('Generated token:', token);
  
  const decoded = verifyWixSignature(token, TEST_APP_SECRET);
  console.log('✓ Token verified successfully');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.error('✗ Test failed:', error);
}

console.log('\n---\n');

// Test 2: Invalid signature
console.log('Test 2: Invalid signature');
try {
  const payload = {
    instanceId: 'test-instance-123',
    siteHost: 'example.wixsite.com',
    appDefId: 'test-app-id',
  };
  
  const token = createTestToken(payload, TEST_APP_SECRET);
  const tamperedToken = token.replace(/.$/, 'X'); // Change last character
  
  verifyWixSignature(tamperedToken, TEST_APP_SECRET);
  console.error('✗ Test failed: Should have thrown error');
} catch (error) {
  console.log('✓ Correctly rejected invalid signature');
  console.log('Error:', (error as Error).message);
}

console.log('\n---\n');

// Test 3: Missing instanceId
console.log('Test 3: Missing instanceId');
try {
  const payload = {
    siteHost: 'example.wixsite.com',
    appDefId: 'test-app-id',
  };
  
  const token = createTestToken(payload, TEST_APP_SECRET);
  verifyWixSignature(token, TEST_APP_SECRET);
  console.error('✗ Test failed: Should have thrown error');
} catch (error) {
  console.log('✓ Correctly rejected token without instanceId');
  console.log('Error:', (error as Error).message);
}

console.log('\n---\n');

// Test 4: Invalid format
console.log('Test 4: Invalid token format');
try {
  verifyWixSignature('invalid-token-format', TEST_APP_SECRET);
  console.error('✗ Test failed: Should have thrown error');
} catch (error) {
  console.log('✓ Correctly rejected invalid format');
  console.log('Error:', (error as Error).message);
}

console.log('\n---\n');
console.log('All tests completed!');
