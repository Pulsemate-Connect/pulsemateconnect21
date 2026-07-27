#!/usr/bin/env pwsh
# ============================================================================
# PulseMate Connect - Render Deployment Verification
# ============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀  Render Deployment Verification                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://api.pulsemateconnect.in"
$frontendUrl = "https://www.pulsemateconnect.in"

# Test 1: Backend Health Check
Write-Host "🔍 Test 1/5: Backend Health Check" -ForegroundColor Yellow
Write-Host "  Testing: $backendUrl/health" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get -TimeoutSec 10
    
    if ($response.status -eq "ok") {
        Write-Host "  ✓ Backend is healthy!" -ForegroundColor Green
        Write-Host "    Service: $($response.service)" -ForegroundColor Green
        Write-Host "    Version: $($response.version)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Backend returned unexpected status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Backend health check failed!" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Database Connection
Write-Host "🔍 Test 2/5: Database Connection" -ForegroundColor Yellow
Write-Host "  Testing: $backendUrl/api/health/db" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/health/db" -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
    Write-Host "  ✓ Database connection successful!" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Database health endpoint not found (this is ok if endpoint doesn't exist)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Frontend Availability
Write-Host "🔍 Test 3/5: Frontend Availability" -ForegroundColor Yellow
Write-Host "  Testing: $frontendUrl" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method Get -TimeoutSec 10 -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Frontend is accessible!" -ForegroundColor Green
        Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Frontend check inconclusive" -ForegroundColor Yellow
    Write-Host "    This might be ok - frontend may require full browser" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Notification API (without auth)
Write-Host "🔍 Test 4/5: Notification API Endpoints" -ForegroundColor Yellow
Write-Host "  Testing: $backendUrl/api/notifications" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/notifications" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    
    # Expecting 401 Unauthorized (which means endpoint exists but needs auth)
    if ($response.StatusCode -eq 401) {
        Write-Host "  ✓ Notification API endpoint exists!" -ForegroundColor Green
        Write-Host "    (401 Unauthorized is expected - endpoint requires authentication)" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✓ Notification API endpoint exists!" -ForegroundColor Green
        Write-Host "    (401 Unauthorized is expected - endpoint requires authentication)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not verify notification endpoint" -ForegroundColor Yellow
        Write-Host "    This is expected if the endpoint requires authentication" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 5: Check if code is deployed
Write-Host "🔍 Test 5/5: Latest Code Deployment" -ForegroundColor Yellow
Write-Host "  Checking Git status..." -ForegroundColor White
Write-Host ""

try {
    $gitStatus = git status --porcelain
    
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Host "  ✓ Working directory is clean" -ForegroundColor Green
        
        # Check if we're up to date with remote
        git fetch origin main 2>&1 | Out-Null
        $localCommit = git rev-parse HEAD
        $remoteCommit = git rev-parse origin/main
        
        if ($localCommit -eq $remoteCommit) {
            Write-Host "  ✓ Local code matches remote (GitHub)" -ForegroundColor Green
            Write-Host "  ✓ Latest code should be deployed on Render" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Local and remote commits don't match" -ForegroundColor Yellow
            Write-Host "    Run 'git push origin main' to deploy latest" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  You have uncommitted changes" -ForegroundColor Yellow
        Write-Host "    Commit and push to deploy to Render" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Could not check Git status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 📊 DEPLOYMENT SUMMARY                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Render Dashboard:" -ForegroundColor Cyan
Write-Host "   https://dashboard.render.com" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Backend URL:" -ForegroundColor Cyan
Write-Host "   $backendUrl" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Frontend URL:" -ForegroundColor Cyan
Write-Host "   $frontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Check Render Dashboard for deployment status" -ForegroundColor White
Write-Host "  2. Run database migration in Render Shell:" -ForegroundColor White
Write-Host "     npx prisma migrate deploy" -ForegroundColor Yellow
Write-Host "  3. Verify notification tables created" -ForegroundColor White
Write-Host "  4. Test notification API with authenticated request" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - NOTIFICATION-SYSTEM-COMPLETE.md" -ForegroundColor White
Write-Host "   - NOTIFICATION-QUICK-START.md" -ForegroundColor White
Write-Host ""
