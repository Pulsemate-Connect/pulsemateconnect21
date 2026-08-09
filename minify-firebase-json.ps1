# ═══════════════════════════════════════════════════════════════════════════
# Firebase Service Account JSON Minifier for Render
# ═══════════════════════════════════════════════════════════════════════════
# 
# This script converts Firebase service account JSON to single-line format
# required by Render environment variables.
#
# Usage:
#   1. Download Firebase service account JSON from Firebase Console
#   2. Run this script
#   3. Paste file path when prompted
#   4. Script copies minified JSON to clipboard
#   5. Paste into Render environment variable
#
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Firebase JSON Minifier for PulseMate Notifications       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Prompt for file path
Write-Host "📁 Enter the path to your Firebase service account JSON file:" -ForegroundColor Yellow
Write-Host "   (You can drag-and-drop the file here, or paste the path)" -ForegroundColor Gray
Write-Host ""
$filePath = Read-Host "File path"

# Remove quotes if user copy-pasted a path with quotes
$filePath = $filePath.Trim('"')

# Check if file exists
if (-not (Test-Path $filePath)) {
    Write-Host ""
    Write-Host "❌ ERROR: File not found!" -ForegroundColor Red
    Write-Host "   Path: $filePath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Please check the path and try again." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Check if it's a JSON file
if (-not ($filePath -like "*.json")) {
    Write-Host ""
    Write-Host "⚠️  WARNING: File doesn't have .json extension" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "📄 Reading file..." -ForegroundColor Cyan

try {
    # Read the JSON file
    $jsonContent = Get-Content $filePath -Raw -ErrorAction Stop
    
    # Parse to verify it's valid JSON
    $jsonObject = $jsonContent | ConvertFrom-Json -ErrorAction Stop
    
    Write-Host "✅ Valid JSON detected" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 JSON Info:" -ForegroundColor Cyan
    Write-Host "   Project ID: $($jsonObject.project_id)" -ForegroundColor Gray
    Write-Host "   Client Email: $($jsonObject.client_email)" -ForegroundColor Gray
    Write-Host "   Type: $($jsonObject.type)" -ForegroundColor Gray
    Write-Host ""
    
    # Minify: Remove all line breaks
    Write-Host "🔄 Minifying JSON..." -ForegroundColor Cyan
    $minified = $jsonContent -replace "`r`n", "" -replace "`n", ""
    
    # Copy to clipboard
    Write-Host "📋 Copying to clipboard..." -ForegroundColor Cyan
    $minified | Set-Clipboard
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                     ✅ SUCCESS!                               ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Minified JSON has been copied to your clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📏 Stats:" -ForegroundColor Cyan
    Write-Host "   Original size: $($jsonContent.Length) characters" -ForegroundColor Gray
    Write-Host "   Minified size: $($minified.Length) characters" -ForegroundColor Gray
    Write-Host "   Saved: $($jsonContent.Length - $minified.Length) characters" -ForegroundColor Gray
    Write-Host ""
    Write-Host "👉 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to Render Dashboard: https://dashboard.render.com/" -ForegroundColor White
    Write-Host "   2. Open your service: pulsemate-backend" -ForegroundColor White
    Write-Host "   3. Click 'Environment' tab" -ForegroundColor White
    Write-Host "   4. Find 'FIREBASE_SERVICE_ACCOUNT_JSON'" -ForegroundColor White
    Write-Host "   5. Click Edit (pencil icon)" -ForegroundColor White
    Write-Host "   6. Paste (Ctrl+V) the minified JSON" -ForegroundColor White
    Write-Host "   7. Click 'Save Changes'" -ForegroundColor White
    Write-Host "   8. Wait ~2 minutes for deployment" -ForegroundColor White
    Write-Host "   9. Check logs for: 'Firebase Admin SDK initialized'" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Preview (first 150 characters):" -ForegroundColor Cyan
    Write-Host "   $($minified.Substring(0, [Math]::Min(150, $minified.Length)))..." -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to process JSON file" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   • File is not valid JSON" -ForegroundColor Gray
    Write-Host "   • File is corrupted" -ForegroundColor Gray
    Write-Host "   • File is empty" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Please download the file again from Firebase Console." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
