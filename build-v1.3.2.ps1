# Build AAB v1.3.2 (Build 53) - With TextInput Fix + Dev OTP
# This copies project to C:\pm (short path), builds, then copies AAB back

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building PulseMate v1.3.2 (Build 53)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes in this version:" -ForegroundColor Yellow
Write-Host "  - Fixed mobile input touch issue" -ForegroundColor White
Write-Host "  - Added development OTP mode" -ForegroundColor White
Write-Host "  - Updated notification routes" -ForegroundColor White
Write-Host ""

$sourcePath = $PSScriptRoot
$buildPath = "C:\pm"

# Step 1: Copy to C:\pm
Write-Host "Step 1: Copying to short path..." -ForegroundColor Yellow

if (Test-Path $buildPath) {
    Write-Host "Removing old C:\pm..." -ForegroundColor White
    Remove-Item -Recurse -Force $buildPath -ErrorAction SilentlyContinue
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

Write-Host "Building release bundle..." -ForegroundColor White
Write-Host "This will take 10-15 minutes. Please wait..." -ForegroundColor Gray
Write-Host ""
$buildStart = Get-Date
.\gradlew.bat bundleRelease --no-daemon
$buildEnd = Get-Date
$duration = $buildEnd - $buildStart

Write-Host ""
Write-Host "Build completed in $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Green
Write-Host ""

# Step 4: Verify and copy AAB
Write-Host "Step 4: Verifying AAB..." -ForegroundColor Yellow

$aabSource = "$buildPath\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabSource) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $aabDest = "$sourcePath\..\pulsemate-v1.3.2-vc53-$timestamp.aab"
    
    Copy-Item $aabSource -Destination $aabDest
    
    $sizeMB = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)
    
    # Get keystore fingerprint info
    Write-Host ""
    Write-Host "Verifying keystore signature..." -ForegroundColor Yellow
    
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
    Write-Host "Keystore: credentials/android/keystore.jks" -ForegroundColor Yellow
    Write-Host "Expected SHA1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the AAB on your phone" -ForegroundColor White
    Write-Host "  2. Verify login works" -ForegroundColor White
    Write-Host "  3. Upload to Google Play Console" -ForegroundColor White
    Write-Host ""
    
    # Open file location
    explorer.exe /select,"$aabDest"
    
    # Cleanup
    Write-Host ""
    $cleanup = Read-Host "Delete C:\pm? (Y/N)"
    if ($cleanup -eq 'Y' -or $cleanup -eq 'y') {
        Set-Location $sourcePath
        Remove-Item -Recurse -Force $buildPath -ErrorAction SilentlyContinue
        Write-Host "Cleaned up!" -ForegroundColor Green
    } else {
        Write-Host "C:\pm kept for debugging" -ForegroundColor Gray
    }
    
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: AAB BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Expected path: $aabSource" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the build output above for errors." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Gradle build errors" -ForegroundColor White
    Write-Host "  - Java/JDK not installed" -ForegroundColor White
    Write-Host "  - Android SDK missing" -ForegroundColor White
    Write-Host "  - Keystore issues" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Build script completed." -ForegroundColor Cyan
Write-Host ""

