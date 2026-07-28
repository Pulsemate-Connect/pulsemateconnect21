#!/usr/bin/env pwsh
# ============================================================================
# Build AAB from Short Path - Fixes Windows MAX_PATH Issue
# ============================================================================
# This script copies the project to C:\pm (short path) to avoid Windows
# 260-character path length limit, builds the AAB, then copies it back.
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔧 Build AAB from Short Path (Path Fix)          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "This fixes the Windows 260-character path length limit." -ForegroundColor White
Write-Host ""

# Configuration
$sourcePath = $PSScriptRoot
$buildPath = "C:\pm"
$keepBuildDir = $false

# Step 1: Copy to short path
Write-Host "📦 Step 1/4: Copying project to short path..." -ForegroundColor Yellow
Write-Host "   From: $sourcePath" -ForegroundColor White
Write-Host "   To:   $buildPath" -ForegroundColor White
Write-Host ""

if (Test-Path $buildPath) {
    Write-Host "   ⚠️  $buildPath already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "   Overwrite? (Y/N)"
    
    if ($overwrite -ne 'Y' -and $overwrite -ne 'y') {
        Write-Host ""
        Write-Host "   Cancelled by user." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   Removing old directory..." -ForegroundColor White
    Remove-Item -Recurse -Force $buildPath
}

Write-Host "   Copying files (this may take 2-3 minutes)..." -ForegroundColor White

try {
    # Use robocopy for better performance and progress
    $robocopyArgs = @(
        "$sourcePath",
        "$buildPath",
        "/E",           # Copy subdirectories including empty ones
        "/NFL",         # No file list (less output)
        "/NDL",         # No directory list
        "/NJH",         # No job header
        "/NJS",         # No job summary
        "/NP",          # No progress indicator
        "/XD",          # Exclude directories
        "node_modules", # Exclude node_modules (will reinstall)
        ".expo",
        "android\app\build",
        "android\.gradle",
        "/XF",          # Exclude files
        "*.aab",
        "*.apk"
    )
    
    $result = robocopy @robocopyArgs
    
    # Robocopy exit codes: 0-7 are success, 8+ are errors
    $exitCode = $LASTEXITCODE
    if ($exitCode -ge 8) {
        throw "Robocopy failed with exit code $exitCode"
    }
    
    Write-Host "   ✓ Project copied successfully" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Copy failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Install dependencies
Write-Host "📚 Step 2/4: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

Push-Location $buildPath

try {
    Write-Host "   Running: npm install..." -ForegroundColor White
    npm install --silent 2>&1 | Out-Null
    Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  npm install had warnings (may be ok)" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Build AAB
Write-Host "🔨 Step 3/4: Building release AAB..." -ForegroundColor Yellow
Write-Host "   This will take 10-15 minutes..." -ForegroundColor White
Write-Host ""

Push-Location android

# Clean first
Write-Host "   Cleaning previous builds..." -ForegroundColor White
try {
    .\gradlew.bat clean 2>&1 | Out-Null
    Write-Host "   ✓ Clean completed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Clean had warnings (this is usually ok)" -ForegroundColor Yellow
}

Write-Host ""

# Build AAB
Write-Host "   Building AAB..." -ForegroundColor White
Write-Host "   " -NoNewline

$buildStart = Get-Date

try {
    # Show a progress indicator
    $job = Start-Job -ScriptBlock {
        param($buildPath)
        Set-Location "$buildPath\android"
        .\gradlew.bat bundleRelease --no-daemon 2>&1
    } -ArgumentList $buildPath
    
    # Show progress dots while building
    while ($job.State -eq 'Running') {
        Write-Host "." -NoNewline -ForegroundColor Cyan
        Start-Sleep -Seconds 5
    }
    
    $buildOutput = Receive-Job -Job $job
    Remove-Job -Job $job
    
    # Check for errors in output
    if ($buildOutput -match "BUILD FAILED" -or $buildOutput -match "FAILURE") {
        Write-Host ""
        Write-Host ""
        Write-Host "   ✗ Build failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error output:" -ForegroundColor Yellow
        Write-Host $buildOutput -ForegroundColor Red
        Pop-Location
        Pop-Location
        exit 1
    }
    
    $buildEnd = Get-Date
    $buildDuration = $buildEnd - $buildStart
    
    Write-Host ""
    Write-Host ""
    Write-Host "   ✓ Build completed in $($buildDuration.Minutes)m $($buildDuration.Seconds)s" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host ""
    Write-Host "   ✗ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""

# Step 4: Copy AAB back
Write-Host "📋 Step 4/4: Copying AAB to original location..." -ForegroundColor Yellow
Write-Host ""

$aabSource = "$buildPath\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabSource) {
    # Read version from build.gradle
    $buildGradleContent = Get-Content "$buildPath\android\app\build.gradle" -Raw
    $versionCode = "51"
    $versionName = "1.3.0"
    
    if ($buildGradleContent -match 'versionCode\s+(\d+)') {
        $versionCode = $matches[1]
    }
    if ($buildGradleContent -match 'versionName\s+"([^""]+)"') {
        $versionName = $matches[1]
    }
    
    # Create destination filename
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $aabDestName = "pulsemate-v$versionName-vc$versionCode-$timestamp.aab"
    $aabDest = Join-Path (Split-Path $sourcePath -Parent) $aabDestName
    
    # Copy AAB
    Copy-Item $aabSource -Destination $aabDest
    
    $fileSize = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)
    
    Write-Host "   ✓ AAB file copied successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✅ BUILD SUCCESSFUL!                      ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Filename: $aabDestName" -ForegroundColor Cyan
    Write-Host "📊 Size: $fileSize MB" -ForegroundColor Cyan
    Write-Host "📍 Location: $aabDest" -ForegroundColor Cyan
    Write-Host ""
    
    # Open file location
    Write-Host "Opening file location..." -ForegroundColor White
    Start-Sleep -Seconds 1
    explorer.exe /select,"$aabDest"
    
    # Cleanup
    Write-Host ""
    Write-Host "🧹 Cleanup..." -ForegroundColor Yellow
    
    Pop-Location
    
    $cleanup = Read-Host "Delete temporary build directory C:\pm? (Y/N)"
    
    if ($cleanup -eq 'Y' -or $cleanup -eq 'y') {
        Write-Host "   Removing C:\pm..." -ForegroundColor White
        try {
            Remove-Item -Recurse -Force $buildPath
            Write-Host "   ✓ Build directory removed" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not remove build directory" -ForegroundColor Yellow
            Write-Host "   You can manually delete: $buildPath" -ForegroundColor White
        }
    } else {
        Write-Host "   Keeping C:\pm for future builds" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Go to Google Play Console" -ForegroundColor White
    Write-Host "   2. Production → Create new release" -ForegroundColor White
    Write-Host "   3. Upload: $aabDestName" -ForegroundColor White
    Write-Host "   4. Add release notes" -ForegroundColor White
    Write-Host "   5. Review and publish" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ AAB is ready for upload!" -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host "   ✗ AAB file not found at expected location!" -ForegroundColor Red
    Write-Host "   Expected: $aabSource" -ForegroundColor Red
    Pop-Location
    exit 1
}

