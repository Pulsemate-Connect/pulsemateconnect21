# Simple AAB Build Script
Write-Host "Building PulseMate Connect AAB..." -ForegroundColor Cyan
Write-Host ""

# Check Java
Write-Host "Checking Java..." -ForegroundColor Yellow
java -version
Write-Host ""

# Clean
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat clean
Write-Host ""

# Build
Write-Host "Building AAB (this takes 5-10 minutes)..." -ForegroundColor Yellow
.\gradlew.bat bundleRelease --no-daemon

# Copy AAB
Set-Location ..
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$aabName = "pulsemate-v1.3.0-$timestamp.aab"

if (Test-Path "android\app\build\outputs\bundle\release\app-release.aab") {
    Copy-Item "android\app\build\outputs\bundle\release\app-release.aab" -Destination $aabName
    Write-Host ""
    Write-Host "SUCCESS! AAB file created:" -ForegroundColor Green
    Write-Host "  $aabName" -ForegroundColor Cyan
    Get-Item $aabName | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}
} else {
    Write-Host "AAB file not found!" -ForegroundColor Red
}
