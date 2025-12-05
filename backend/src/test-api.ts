/**
 * Test script to check if API endpoints are working
 * Run with: npx ts-node src/test-api.ts
 */

import { getAppInstance } from './db/appInstances';

async function testAPI() {
  console.log('Testing API setup...\n');

  // Test 1: Check if we can connect to database
  try {
    console.log('1. Testing database connection...');
    const instance = await getAppInstance('test-instance-id');
    console.log('   ✓ Database connection works');
    console.log('   Instance found:', instance ? 'Yes' : 'No');
  } catch (error) {
    console.error('   ✗ Database connection failed:', error);
  }

  console.log('\n2. To test the API endpoints:');
  console.log('   - Make sure the server is running (npm start)');
  console.log('   - Open browser console');
  console.log('   - Check if you have an instance token in the URL');
  console.log('   - Look for errors in the Network tab');
  
  console.log('\n3. Common issues:');
  console.log('   - No instance token in URL → Add ?instance=<token>');
  console.log('   - No app instance in database → Complete OAuth flow');
  console.log('   - Invalid Wix credentials → Check WIX_APP_ID and WIX_APP_SECRET');
  
  process.exit(0);
}

testAPI();
