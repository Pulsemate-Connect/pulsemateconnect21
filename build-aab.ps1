#!/usr/bin/env pwsh
# ============================================================================
# PulseMate Connect - AAB Build Script
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🏗️  PulseMate Connect - AAB Builder             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "📋 Step 1/5: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "  ✓ Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Java not found! Please install JDK 17" -ForegroundColor Red
    exit 1
}

# Check if android directory exists
if (-not (Test-Path "android")) {
    Write-Host "  ✗ Android directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Android directory found" -ForegroundColor Green

# Check keystore
if (Test-Path "android\app\keystore.jks") {
    Write-Host "  ✓ Keystore found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Keystore not found at android\app\keystore.jks" -ForegroundColor Yellow
    Write-Host "     Make sure keystore is configured in gradle.properties" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Update version
Write-Host "📝 Step 2/5: Version information..." -ForegroundColor Yellow
Write-Host ""

$buildGradle = Get-Content "android\app\build.gradle" -Raw
if ($buildGradle -match 'versionCode\s+(\d+)') {
    $currentVersionCode = $matches[1]
    Write-Host "  Current version code: $currentVersionCode" -ForegroundColor White
}
if ($buildGradle -match 'versionName\s+"([^"]+)"') {
    $currentVersionName = $matches[1]
    Write-Host "  Current version name: $currentVersionName" -ForegroundColor White
}

Write-Host ""
Write-Host "  💡 To update version, edit android/app/build.gradle" -ForegroundColor Cyan
Write-Host ""

# Step 3: Clean previous builds
Write-Host "🧹 Step 3/5: Cleaning previous builds..." -ForegroundColor Yellow
Write-Host ""

Push-Location android

try {
    Write-Host "  Running: gradlew clean" -ForegroundColor White
    .\gradlew.bat clean 2>&1 | Out-Null
    Write-Host "  ✓ Clean completed" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Clean had warnings (this is usually ok)" -ForegroundColor Yellow
}

Pop-Location
Write-Host ""

# Step 4: Build AAB
Write-Host "🔨 Step 4/5: Building release AAB..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor White
Write-Host ""

Push-Location android

$buildStartTime = Get-Date

try {
    Write-Host "  Running: gradlew bundleRelease --no-daemon" -ForegroundColor White
    Write-Host ""
    
    # Run build and show output
    .\gradlew.bat bundleRelease --no-daemon
    
    $buildEndTime = Get-Date
    $buildDuration = $buildEndTime - $buildStartTime
    
    Write-Host ""
    Write-Host "  ✓ Build completed in $($buildDuration.Minutes)m $($buildDuration.Seconds)s" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
    Write-Host "  Check the error messages above" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""

# Step 5: Copy and rename AAB
Write-Host "📦 Step 5/5: Packaging AAB file..." -ForegroundColor Yellow
Write-Host ""

$aabSourcePath = "android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabSourcePath) {
    # Get version from build.gradle
    $versionCode = $currentVersionCode
    $versionName = $currentVersionName
    
    # Create filename with timestamp
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $aabFileName = "pulsemate-v$versionName-vc$versionCode-$timestamp.aab"
    
    # Copy file
    Copy-Item $aabSourcePath -Destination $aabFileName
    
    # Get file info
    $fileInfo = Get-Item $aabFileName
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    
    Write-Host "  ✓ AAB file created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📄 Filename: $aabFileName" -ForegroundColor Cyan
    Write-Host "  📊 Size: $fileSizeMB MB" -ForegroundColor Cyan
    Write-Host "  📍 Location: $(Get-Location)\$aabFileName" -ForegroundColor Cyan
    Write-Host ""
    
    # Show file in explorer option
    Write-Host "  💡 To open file location, run:" -ForegroundColor Yellow
    Write-Host "     explorer.exe /select,`"$(Get-Location)\$aabFileName`"" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "  ✗ AAB file not found at expected location!" -ForegroundColor Red
    Write-Host "  Expected: $aabSourcePath" -ForegroundColor Red
    exit 1
}

# Success summary
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ BUILD SUCCESSFUL!                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Upload to Google Play Console" -ForegroundColor White
Write-Host "  2. Create new release (Production track)" -ForegroundColor White
Write-Host "  3. Upload AAB file: $aabFileName" -ForegroundColor White
Write-Host "  4. Add release notes" -ForegroundColor White
Write-Host "  5. Review and publish" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: BUILD-AAB-LOCAL-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
