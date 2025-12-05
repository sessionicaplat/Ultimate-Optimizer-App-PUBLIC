#!/bin/bash

# Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh https://your-app.onrender.com

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <base-url>"
  echo "Example: $0 https://ultimate-optimizer-app.onrender.com"
  exit 1
fi

BASE_URL=$1
FAILED=0

echo "🚀 Verifying deployment at: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local description=$2
  local expected_status=${3:-200}
  
  echo -n "Testing $description... "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
  
  if [ "$status" -eq "$expected_status" ]; then
    echo "✅ PASS (HTTP $status)"
  else
    echo "❌ FAIL (HTTP $status, expected $expected_status)"
    FAILED=$((FAILED + 1))
  fi
}

# Function to test JSON endpoint
test_json_endpoint() {
  local endpoint=$1
  local description=$2
  
  echo -n "Testing $description... "
  
  response=$(curl -s "$BASE_URL$endpoint")
  status=$?
  
  if [ $status -eq 0 ] && echo "$response" | jq . > /dev/null 2>&1; then
    echo "✅ PASS (Valid JSON)"
  else
    echo "❌ FAIL (Invalid response)"
    FAILED=$((FAILED + 1))
  fi
}

echo "📋 Testing API Endpoints"
echo "========================"

# Health check
test_endpoint "/health" "Health endpoint"
test_json_endpoint "/health" "Health JSON response"

# API endpoints
test_json_endpoint "/api/products" "Products API"
test_json_endpoint "/api/collections" "Collections API"
test_json_endpoint "/api/me" "Instance info API"
test_json_endpoint "/api/jobs" "Jobs list API"

echo ""
echo "🎨 Testing Dashboard Pages"
echo "==========================="

# Dashboard pages
test_endpoint "/dashboard" "Dashboard page"
test_endpoint "/" "Root redirect"

echo ""
echo "📊 Summary"
echo "=========="

if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  echo ""
  echo "Next steps:"
  echo "1. Open $BASE_URL/dashboard in your browser"
  echo "2. Verify all pages render correctly"
  echo "3. Test navigation between pages"
  echo "4. Check browser console for errors"
  exit 0
else
  echo "❌ $FAILED test(s) failed"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check Render deployment logs"
  echo "2. Verify build completed successfully"
  echo "3. Check environment variables are set"
  echo "4. Ensure health check is passing"
  exit 1
fi
