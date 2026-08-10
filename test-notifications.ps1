# ═══════════════════════════════════════════════════════════════════════════════
# PulseMate Connect - Notification System Test Script (PowerShell)
# ═══════════════════════════════════════════════════════════════════════════════
# 
# This script tests the complete notification system pipeline
# 
# REQUIREMENTS:
# 1. You must be logged in (have a valid JWT token)
# 2. Firebase must be configured in Render
# 3. Mobile app must have registered a device token
#
# USAGE:
#   .\test-notifications.ps1 YOUR_JWT_TOKEN
#
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$JwtToken
)

# API Base URL
$apiUrl = "https://api.pulsemateconnect.in/api"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════════════════════════" "Cyan"
    Write-ColorOutput "  $Message" "Cyan"
    Write-ColorOutput "═══════════════════════════════════════════════════════════════════════════════" "Cyan"
    Write-Host ""
}

function Write-Separator {
    Write-Host ""
    Write-ColorOutput "───────────────────────────────────────────────────────────────────────────────" "Cyan"
    Write-Host ""
}

# Verify jq is available (optional, for pretty JSON)
$jqAvailable = $null -ne (Get-Command "jq" -ErrorAction SilentlyContinue)

Write-Header "PulseMate Connect - Notification System Test"

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 1: Check Firebase Configuration Status
# ═══════════════════════════════════════════════════════════════════════════════
Write-ColorOutput "[TEST 1/3] Checking Firebase Admin SDK configuration..." "Yellow"
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $JwtToken"
    "Content-Type" = "application/json"
}

try {
    $firebaseResponse = Invoke-RestMethod -Uri "$apiUrl/notifications/firebase-status" -Method Get -Headers $headers
    
    Write-Host "Response:"
    $firebaseResponse | ConvertTo-Json -Depth 10
    Write-Host ""
    
    $configured = $firebaseResponse.data.configured
    $initialized = $firebaseResponse.data.initialized
    $mode = $firebaseResponse.data.mode
    
    if ($configured -and $initialized) {
        Write-ColorOutput "✅ Firebase is properly configured and initialized" "Green"
        Write-ColorOutput "✅ Mode: $mode" "Green"
    } else {
        Write-ColorOutput "❌ Firebase is NOT configured" "Red"
        Write-ColorOutput "❌ Mode: $mode" "Red"
        Write-Host ""
        Write-ColorOutput "⚠️  ACTION REQUIRED:" "Yellow"
        Write-Host "   Configure FIREBASE_SERVICE_ACCOUNT_JSON in Render"
        Write-Host "   See: URGENT-FIREBASE-SETUP-REQUIRED.md"
        Write-Host ""
        Write-Host "Push notifications will NOT work until Firebase is configured."
        Write-Host ""
        
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
} catch {
    Write-ColorOutput "❌ Error checking Firebase status: $_" "Red"
    exit 1
}

Write-Separator

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 2: Check Registered FCM Tokens
# ═══════════════════════════════════════════════════════════════════════════════
Write-ColorOutput "[TEST 2/3] Checking registered FCM tokens..." "Yellow"
Write-Host ""

try {
    $tokensResponse = Invoke-RestMethod -Uri "$apiUrl/notifications/tokens" -Method Get -Headers $headers
    
    Write-Host "Response:"
    $tokensResponse | ConvertTo-Json -Depth 10
    Write-Host ""
    
    $tokenCount = $tokensResponse.data.count
    
    if ($tokenCount -eq 0 -or $null -eq $tokenCount) {
        Write-ColorOutput "❌ No FCM tokens registered" "Red"
        Write-Host ""
        Write-ColorOutput "⚠️  POSSIBLE CAUSES:" "Yellow"
        Write-Host "   1. Mobile app not updated (still using wrong API endpoint)"
        Write-Host "   2. User not logged in on mobile device"
        Write-Host "   3. Mobile app not installed"
        Write-Host ""
        Write-ColorOutput "⚠️  ACTION REQUIRED:" "Yellow"
        Write-Host "   1. Update mobile app with API fix"
        Write-Host "   2. Login to mobile app"
        Write-Host "   3. Check app logs for token registration"
        Write-Host ""
        Write-Host "Test notification will likely fail."
        Write-Host ""
        
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    } else {
        Write-ColorOutput "✅ Found $tokenCount registered token(s)" "Green"
        Write-Host ""
        Write-Host "Registered devices:"
        foreach ($token in $tokensResponse.data.tokens) {
            Write-Host "  • $($token.platform) - Registered: $($token.registeredAt)"
        }
    }
} catch {
    Write-ColorOutput "❌ Error checking tokens: $_" "Red"
    exit 1
}

Write-Separator

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 3: Send Test Notification
# ═══════════════════════════════════════════════════════════════════════════════
Write-ColorOutput "[TEST 3/3] Sending test notification..." "Yellow"
Write-Host ""

try {
    $testResponse = Invoke-RestMethod -Uri "$apiUrl/notifications/test" -Method Post -Headers $headers
    
    Write-Host "Response:"
    $testResponse | ConvertTo-Json -Depth 10
    Write-Host ""
    
    $success = $testResponse.success
    
    if ($success) {
        Write-ColorOutput "✅ Test notification sent successfully!" "Green"
        Write-Host ""
        Write-ColorOutput "📱 CHECK YOUR MOBILE DEVICE NOW" "Green"
        Write-Host "   You should see a notification: '🔔 Test Notification'"
        Write-Host ""
        Write-Host "If you received the notification:"
        Write-Host "  ✓ Firebase is working" -ForegroundColor Green
        Write-Host "  ✓ Token registration is working" -ForegroundColor Green
        Write-Host "  ✓ Push notification pipeline is working" -ForegroundColor Green
        Write-Host "  ✓ Mobile app is receiving notifications" -ForegroundColor Green
    } else {
        Write-ColorOutput "❌ Test notification FAILED" "Red"
        Write-Host ""
        $errorMsg = if ($testResponse.message) { $testResponse.message } elseif ($testResponse.error) { $testResponse.error } else { "Unknown error" }
        Write-ColorOutput "Error: $errorMsg" "Red"
        Write-Host ""
        Write-ColorOutput "⚠️  TROUBLESHOOTING:" "Yellow"
        Write-Host "   1. Check backend logs in Render dashboard"
        Write-Host "   2. Verify Firebase configuration"
        Write-Host "   3. Verify token is registered (see Test 2 above)"
        Write-Host "   4. Check Android notification permissions"
    }
} catch {
    Write-ColorOutput "❌ Error sending test notification: $_" "Red"
    Write-Host ""
    Write-ColorOutput "⚠️  TROUBLESHOOTING:" "Yellow"
    Write-Host "   1. Check backend logs in Render dashboard"
    Write-Host "   2. Verify Firebase configuration"
    Write-Host "   3. Verify token is registered (see Test 2 above)"
    Write-Host "   4. Check Android notification permissions"
}

Write-Header "Test Complete"

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════
Write-ColorOutput "SUMMARY:" "Yellow"
Write-Host ""

$configuredStatus = if ($configured) { "✓ Configured" } else { "✗ Not configured" }
$configuredColor = if ($configured) { "Green" } else { "Red" }
Write-Host "Firebase Configuration:  " -NoNewline
Write-ColorOutput $configuredStatus $configuredColor

$initializedStatus = if ($initialized) { "✓ Yes" } else { "✗ No" }
$initializedColor = if ($initialized) { "Green" } else { "Red" }
Write-Host "Firebase Initialized:    " -NoNewline
Write-ColorOutput $initializedStatus $initializedColor

$tokensStatus = if ($tokenCount -gt 0) { "✓ $tokenCount token(s)" } else { "✗ No tokens" }
$tokensColor = if ($tokenCount -gt 0) { "Green" } else { "Red" }
Write-Host "FCM Tokens Registered:   " -NoNewline
Write-ColorOutput $tokensStatus $tokensColor

$testStatus = if ($success) { "✓ Sent" } else { "✗ Failed" }
$testColor = if ($success) { "Green" } else { "Red" }
Write-Host "Test Notification Sent:  " -NoNewline
Write-ColorOutput $testStatus $testColor

Write-Host ""

if ($configured -and $initialized -and ($tokenCount -gt 0) -and $success) {
    Write-ColorOutput "═══════════════════════════════════════════════════════════════════════════════" "Green"
    Write-ColorOutput "  ✅ ALL TESTS PASSED - NOTIFICATION SYSTEM IS WORKING!" "Green"
    Write-ColorOutput "═══════════════════════════════════════════════════════════════════════════════" "Green"
    Write-Host ""
    Write-Host "You can now test real-world scenarios:"
    Write-Host "  • Book an appointment → Check notifications"
    Write-Host "  • Cancel an appointment → Check notifications"
    Write-Host "  • Doctor calls queue → Check notifications"
} else {
    Write-ColorOutput "═══════════════════════════════════════════════════════════════════════════════" "Red"
    Write-ColorOutput "  ⚠️  SOME TESTS FAILED - ACTION REQUIRED" "Red"
    Write-ColorOutput "═══════════════════════════════════════════════════════════════════════════════" "Red"
    Write-Host ""
    Write-Host "See above for specific actions required."
    Write-Host "Refer to: URGENT-FIREBASE-SETUP-REQUIRED.md"
}

Write-Host ""
