# Deployment Verification Script (PowerShell)
# Usage: .\scripts\verify-deployment.ps1 https://your-app.onrender.com

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl
)

$Failed = 0

Write-Host "🚀 Verifying deployment at: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Endpoint,
        [string]$Description,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing $Description... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl$Endpoint" -UseBasicParsing -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq $ExpectedStatus) {
            Write-Host "✅ PASS (HTTP $status)" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL (HTTP $status, expected $ExpectedStatus)" -ForegroundColor Red
            $script:Failed++
        }
    } catch {
        Write-Host "❌ FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:Failed++
    }
}

function Test-JsonEndpoint {
    param(
        [string]$Endpoint,
        [string]$Description
    )
    
    Write-Host "Testing $Description... " -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -ErrorAction Stop
        
        if ($response) {
            Write-Host "✅ PASS (Valid JSON)" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL (Empty response)" -ForegroundColor Red
            $script:Failed++
        }
    } catch {
        Write-Host "❌ FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host "📋 Testing API Endpoints" -ForegroundColor Yellow
Write-Host "========================"

# Health check
Test-Endpoint -Endpoint "/health" -Description "Health endpoint"
Test-JsonEndpoint -Endpoint "/health" -Description "Health JSON response"

# API endpoints
Test-JsonEndpoint -Endpoint "/api/products" -Description "Products API"
Test-JsonEndpoint -Endpoint "/api/collections" -Description "Collections API"
Test-JsonEndpoint -Endpoint "/api/me" -Description "Instance info API"
Test-JsonEndpoint -Endpoint "/api/jobs" -Description "Jobs list API"

Write-Host ""
Write-Host "🎨 Testing Dashboard Pages" -ForegroundColor Yellow
Write-Host "==========================="

# Dashboard pages
Test-Endpoint -Endpoint "/dashboard" -Description "Dashboard page"
Test-Endpoint -Endpoint "/" -Description "Root redirect"

Write-Host ""
Write-Host "📊 Summary" -ForegroundColor Yellow
Write-Host "=========="

if ($Failed -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Open $BaseUrl/dashboard in your browser"
    Write-Host "2. Verify all pages render correctly"
    Write-Host "3. Test navigation between pages"
    Write-Host "4. Check browser console for errors"
    exit 0
} else {
    Write-Host "❌ $Failed test(s) failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "1. Check Render deployment logs"
    Write-Host "2. Verify build completed successfully"
    Write-Host "3. Check environment variables are set"
    Write-Host "4. Ensure health check is passing"
    exit 1
}
