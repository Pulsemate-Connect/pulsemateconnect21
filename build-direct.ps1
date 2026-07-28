# Build AAB Directly (Without Copying)
# Build v1.3.2 (Build 53)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building PulseMate v1.3.2 (Build 53)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot

# Build AAB
Write-Host "Building AAB..." -ForegroundColor Yellow
Write-Host "This will take 10-15 minutes. Please wait..." -ForegroundColor Gray
Write-Host ""

Set-Location "$projectRoot\android"

Write-Host "Cleaning..." -ForegroundColor White
.\gradlew.bat clean

Write-Host ""
Write-Host "Building release bundle..." -ForegroundColor White
$buildStart = Get-Date
.\gradlew.bat bundleRelease
$buildEnd = Get-Date
$duration = $buildEnd - $buildStart

Write-Host ""
Write-Host "Build completed in $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Green
Write-Host ""

# Verify AAB
$aabPath = "$projectRoot\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $aabDest = "$projectRoot\..\pulsemate-v1.3.2-vc53-$timestamp.aab"
    
    Copy-Item $aabPath -Destination $aabDest
    
    $sizeMB = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Version: 1.3.2 (Build 53)" -ForegroundColor Cyan
    Write-Host "File: $(Split-Path $aabDest -Leaf)" -ForegroundColor Cyan
    Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
    Write-Host "Path: $aabDest" -ForegroundColor Cyan
    Write-Host ""
    
    # Open location
    explorer.exe /select,"$aabDest"
    
} else {
    Write-Host "ERROR: AAB not found at $aabPath" -ForegroundColor Red
}

Write-Host ""

