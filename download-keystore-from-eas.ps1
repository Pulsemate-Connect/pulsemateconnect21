# Download Keystore from EAS
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Keystore from EAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will open the EAS credentials manager." -ForegroundColor Yellow
Write-Host "Follow these steps in the interactive menu:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Select: Android" -ForegroundColor White
Write-Host "2. Select: production" -ForegroundColor White
Write-Host "3. Select: View credentials or Download" -ForegroundColor White
Write-Host "4. Copy the password shown" -ForegroundColor White
Write-Host ""
Write-Host "Target SHA1 fingerprint:" -ForegroundColor Yellow
Write-Host "0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to open EAS credentials..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Opening EAS credentials manager..." -ForegroundColor Yellow
Write-Host ""

# Run EAS credentials
eas credentials

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "After downloading:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check if keystore.jks was created" -ForegroundColor White
Write-Host "2. Check if credentials.json was created" -ForegroundColor White
Write-Host "3. Note the password" -ForegroundColor White
Write-Host ""
Write-Host "Then run: .\rebuild-with-correct-keystore.ps1" -ForegroundColor Green
Write-Host ""
