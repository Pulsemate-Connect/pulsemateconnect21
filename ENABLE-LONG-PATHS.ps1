# Enable Windows Long Paths
# Run this script as Administrator

Write-Host "Enabling Windows Long Paths Support..." -ForegroundColor Yellow

try {
    # Enable long paths in Windows registry
    New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
                     -Name "LongPathsEnabled" `
                     -Value 1 `
                     -PropertyType DWORD `
                     -Force | Out-Null
    
    Write-Host "✓ Windows Long Paths enabled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You MUST restart your computer for this to take effect!" -ForegroundColor Red
    Write-Host ""
    Write-Host "After restarting, you can build the AAB with:" -ForegroundColor Cyan
    Write-Host "  cd android" -ForegroundColor White
    Write-Host "  .\gradlew bundleRelease" -ForegroundColor White
    
} catch {
    Write-Host "✗ Failed to enable long paths." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
}

# Also enable for Git
try {
    git config --global core.longpaths true
    Write-Host "✓ Git long paths enabled" -ForegroundColor Green
} catch {
    Write-Host "Note: Could not configure Git (this is optional)" -ForegroundColor Yellow
}
