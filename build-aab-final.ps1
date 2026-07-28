# Build AAB with Keystore - Final Attempt
# This script tries to build with minimum path length

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Building AAB with Downloaded Keystore" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Navigate to android directory
Set-Location android

Write-Host "[1/3] Cleaning previous builds..." -ForegroundColor Yellow
.\gradlew.bat clean

Write-Host "[2/3] Building Release AAB..." -ForegroundColor Yellow
Write-Host "       This may take 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

.\gradlew.bat bundleRelease --no-daemon --warning-mode all

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host " ✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    # Get version info
    $appJson = Get-Content -Raw "..\app.json" | ConvertFrom-Json
    $version = $appJson.expo.version
    $versionCode = $appJson.expo.android.versionCode
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    
    $aabPath = "app\build\outputs\bundle\release\app-release.aab"
    $desktopPath = "$env:USERPROFILE\Desktop\pulsemate-v$version-vc$versionCode-$timestamp.aab"
    
    Write-Host "[3/3] Copying AAB to Desktop..." -ForegroundColor Yellow
    Copy-Item $aabPath $desktopPath
    
    Write-Host ""
    Write-Host "✅ AAB saved to Desktop:" -ForegroundColor Green
    Write-Host "   $desktopPath" -ForegroundColor White
    Write-Host ""
    Write-Host "📦 File Details:" -ForegroundColor Cyan
    $fileInfo = Get-Item $desktopPath
    Write-Host "   Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "   Version: $version (vc$versionCode)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Ready to upload to Google Play Console!" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host " ❌ BUILD FAILED" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "The build failed due to Windows path length limitations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative solutions:" -ForegroundColor Cyan
    Write-Host "1. Use GitHub Actions (already configured)" -ForegroundColor White
    Write-Host "2. Use EAS Build (quota resets Aug 1)" -ForegroundColor White
    Write-Host "3. Set up WSL for local builds" -ForegroundColor White
}

Set-Location ..

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
