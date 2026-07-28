# Quick AAB Build - Fixes Windows Path Length Issue
# This copies project to C:\pm (short path), builds, then copies AAB back

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick AAB Build (Path Fix)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sourcePath = $PSScriptRoot
$buildPath = "C:\pm"

# Step 1: Copy to C:\pm
Write-Host "Step 1: Copying to short path..." -ForegroundColor Yellow

if (Test-Path $buildPath) {
    Write-Host "Removing old C:\pm..." -ForegroundColor White
    Remove-Item -Recurse -Force $buildPath
}

Write-Host "Copying files (2-3 minutes)..." -ForegroundColor White
robocopy "$sourcePath" "$buildPath" /E /NFL /NDL /NJH /NJS /NP /XD node_modules .expo android\app\build android\.gradle /XF *.aab *.apk | Out-Null
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
Set-Location $buildPath
npm install --silent 2>&1 | Out-Null
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

# Step 3: Build AAB
Write-Host "Step 3: Building AAB (10-15 minutes)..." -ForegroundColor Yellow
Set-Location "$buildPath\android"

Write-Host "Cleaning..." -ForegroundColor White
.\gradlew.bat clean 2>&1 | Out-Null

Write-Host "Building (please wait)..." -ForegroundColor White
$buildStart = Get-Date
.\gradlew.bat bundleRelease --no-daemon
$buildEnd = Get-Date
$duration = $buildEnd - $buildStart

Write-Host ""
Write-Host "Build completed in $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Green
Write-Host ""

# Step 4: Copy AAB back
Write-Host "Step 4: Copying AAB back..." -ForegroundColor Yellow

$aabSource = "$buildPath\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabSource) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $aabDest = "$sourcePath\..\pulsemate-v1.3.0-vc51-$timestamp.aab"
    
    Copy-Item $aabSource -Destination $aabDest
    
    $sizeMB = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "File: $(Split-Path $aabDest -Leaf)" -ForegroundColor Cyan
    Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
    Write-Host "Path: $aabDest" -ForegroundColor Cyan
    Write-Host ""
    
    # Open file location
    explorer.exe /select,"$aabDest"
    
    # Cleanup
    Write-Host ""
    $cleanup = Read-Host "Delete C:\pm? (Y/N)"
    if ($cleanup -eq 'Y' -or $cleanup -eq 'y') {
        Set-Location $sourcePath
        Remove-Item -Recurse -Force $buildPath
        Write-Host "Cleaned up!" -ForegroundColor Green
    }
    
} else {
    Write-Host "ERROR: AAB not found!" -ForegroundColor Red
    Write-Host "Path: $aabSource" -ForegroundColor Red
}

Write-Host ""
