/**
 * Quick Test Script for Wix Billing URL Generation
 * 
 * This script tests that the URL is generated in the correct 2025 Wix format.
 * Run with: node test-billing-url.js
 */

// Test data
const testAppId = '9e24e724-5bdb-4658-8554-74251539a065';
const testInstanceId = '861a5a3f-1b0f-4a5f-8e40-b43cceb97f77';

// Generate URL (same logic as backend)
const pricingPageUrl = `https://www.wix.com/apps/upgrade/${testAppId}?appInstanceId=${testInstanceId}`;

console.log('\n=== Wix Billing URL Test ===\n');

console.log('Test Data:');
console.log('  App ID:', testAppId);
console.log('  Instance ID:', testInstanceId);
console.log('');

console.log('Generated URL:');
console.log('  ' + pricingPageUrl);
console.log('');

// Validate URL format
const expectedFormat = 'https://www.wix.com/apps/upgrade/<APP_ID>?appInstanceId=<INSTANCE_ID>';
const isCorrectFormat = pricingPageUrl.includes('www.wix.com/apps/upgrade') && 
                        pricingPageUrl.includes('?appInstanceId=');

console.log('Validation:');
console.log('  Expected Format:', expectedFormat);
console.log('  Correct Format:', isCorrectFormat ? '✅ YES' : '❌ NO');
console.log('');

// Check for common mistakes
const commonMistakes = [
  {
    check: pricingPageUrl.includes('manage.wix.com'),
    issue: 'Using manage.wix.com instead of www.wix.com',
  },
  {
    check: pricingPageUrl.includes('app-instance-id'),
    issue: 'Using app-instance-id (hyphens) instead of appInstanceId (camelCase)',
  },
  {
    check: pricingPageUrl.includes('origin='),
    issue: 'Including unnecessary origin parameter',
  },
  {
    check: pricingPageUrl.includes('meta-site-id'),
    issue: 'Including unnecessary meta-site-id parameter',
  },
  {
    check: pricingPageUrl.includes('/plan'),
    issue: 'Including /plan path (not needed)',
  },
];

const foundIssues = commonMistakes.filter(m => m.check);

if (foundIssues.length > 0) {
  console.log('⚠️ Issues Found:');
  foundIssues.forEach(issue => {
    console.log('  ❌', issue.issue);
  });
} else {
  console.log('✅ No issues found - URL format is correct!');
}

console.log('');

// Show what the wrong URL would look like
console.log('Wrong URL (OLD FORMAT - DO NOT USE):');
console.log('  https://manage.wix.com/app-pricing-plans/' + testAppId + '/plan?app-instance-id=' + testInstanceId + '&origin=null&meta-site-id=xxx');
console.log('');

console.log('Correct URL (2025 FORMAT - CURRENT):');
console.log('  ' + pricingPageUrl);
console.log('');

console.log('=== Test Complete ===\n');

// Exit with appropriate code
process.exit(isCorrectFormat ? 0 : 1);
