# Enable Windows Long Paths
# Run this script as Administrator

Write-Host "Enabling Windows Long Paths Support..." -ForegroundColor Yellow
Write-Host ""

try {
    # Enable long paths in Windows Registry
    New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
                     -Name "LongPathsEnabled" `
                     -Value 1 `
                     -PropertyType DWORD `
                     -Force | Out-Null
    
    Write-Host "✅ Windows Long Paths enabled in Registry" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to enable registry setting (needs admin rights)" -ForegroundColor Red
    Write-Host "Please run this script as Administrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "After enabling, restart your computer for changes to take effect."
Write-Host ""
Write-Host "Then run: npx expo run:android"
