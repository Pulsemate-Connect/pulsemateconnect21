# Final AAB Build Script - Copies everything including node_modules
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Building AAB from Short Path" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$sourcePath = $PSScriptRoot
$buildPath = "C:\pm"

# Clean old build
if (Test-Path $buildPath) {
    Write-Host "Removing old C:\pm..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $buildPath -ErrorAction SilentlyContinue
}

# Copy entire project
Write-Host "Copying project (this takes 3-5 minutes)..." -ForegroundColor Yellow
Write-Host "From: $sourcePath" -ForegroundColor White
Write-Host "To:   $buildPath" -ForegroundColor White
Write-Host ""

xcopy "$sourcePath" "$buildPath" /E /I /H /Y /Q
Write-Host "Copy complete!" -ForegroundColor Green
Write-Host ""

# Build
Write-Host "Building AAB (10-15 minutes)..." -ForegroundColor Yellow
Set-Location "$buildPath\android"

Write-Host "Cleaning previous builds..." -ForegroundColor White
.\gradlew.bat clean 2>&1 | Out-Null

Write-Host "Building release AAB..." -ForegroundColor White
Write-Host "(This will take 10-15 minutes, please wait)" -ForegroundColor Cyan
Write-Host ""

$buildStart = Get-Date
.\gradlew.bat bundleRelease --no-daemon

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Set-Location $sourcePath
    exit 1
}

$buildEnd = Get-Date
$duration = $buildEnd - $buildStart

Write-Host ""
Write-Host "Build completed in $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Green
Write-Host ""

# Copy AAB back
$aabSource = "$buildPath\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabSource) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $aabName = "pulsemate-v1.3.0-vc51-$timestamp.aab"
    $aabDest = Join-Path (Split-Path $sourcePath -Parent) $aabName
    
    Copy-Item $aabSource -Destination $aabDest
    
    $sizeMB = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "SUCCESS! AAB Created" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Filename: $aabName" -ForegroundColor Cyan
    Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
    Write-Host "Location: $aabDest" -ForegroundColor Cyan
    Write-Host ""
    
    # Open file location
    explorer.exe /select,"$aabDest"
    
    # Return to source
    Set-Location $sourcePath
    
    Write-Host "Cleanup: You can manually delete C:\pm if you want" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ready to upload to Google Play Console!" -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "ERROR: AAB file not found!" -ForegroundColor Red
    Write-Host "Expected at: $aabSource" -ForegroundColor Red
    Set-Location $sourcePath
    exit 1
}
