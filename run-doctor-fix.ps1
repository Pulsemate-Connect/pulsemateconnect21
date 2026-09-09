# ============================================================================
# Run Doctor-Clinic Linking Fix
# ============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Doctor-Clinic Linking Fix" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location backend

Write-Host "Step 1: Checking current database state..." -ForegroundColor Yellow
Write-Host ""

# Run the fix
Write-Host "Step 2: Applying fixes..." -ForegroundColor Yellow
Get-Content ../FIX_DOCTOR_CLINIC_LINKING.sql | npx prisma db execute --stdin

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Fix applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Refresh your clinic dashboard" -ForegroundColor White
    Write-Host "2. Check the doctors section - they should appear now" -ForegroundColor White
    Write-Host "3. Test in mobile app - doctors should show in clinic details" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Fix failed. Check error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "cd backend" -ForegroundColor White
    Write-Host "Get-Content ../FIX_DOCTOR_CLINIC_LINKING.sql | npx prisma db execute --stdin" -ForegroundColor White
    Write-Host ""
}

# Return to root directory
Set-Location ..
