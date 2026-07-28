# Rebuild AAB with Correct Keystore
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rebuild AAB with Correct Keystore" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if keystore was downloaded
$keystoreFiles = Get-ChildItem -Filter "*.jks" | Where-Object { $_.Name -notlike "*-new.jks" -and $_.Name -notlike "*.bak.jks" }

if ($keystoreFiles.Count -eq 0) {
    Write-Host "ERROR: No keystore.jks found!" -ForegroundColor Red
    Write-Host "Please run: .\download-keystore-from-eas.ps1 first" -ForegroundColor Yellow
    exit 1
}

$keystoreFile = $keystoreFiles[0].Name
Write-Host "Found keystore: $keystoreFile" -ForegroundColor Green
Write-Host ""

# Get password
Write-Host "Enter the keystore password from EAS:" -ForegroundColor Yellow
$password = Read-Host -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "Enter the key alias (or press Enter for default):" -ForegroundColor Yellow
$alias = Read-Host
if ([string]::IsNullOrWhiteSpace($alias)) {
    $alias = "QGtob3Vzc2VpbV9zaHViaGFtc2tra2tfX3B1bHNlbWF0ZS1hcHA"  # Common EAS alias
}

# Verify keystore
Write-Host ""
Write-Host "Verifying keystore..." -ForegroundColor Yellow

$output = keytool -list -v -keystore $keystoreFile -storepass $passwordPlain 2>&1 | Out-String

if ($output -match "SHA1:\s*([A-F0-9:]+)") {
    $sha1 = $matches[1].Trim()
    Write-Host "SHA1: $sha1" -ForegroundColor Cyan
    
    if ($sha1 -match "0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F") {
        Write-Host "✅ CORRECT KEYSTORE!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: SHA1 doesn't match expected" -ForegroundColor Yellow
        Write-Host "Expected: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (Y/N)"
        if ($continue -ne 'Y' -and $continue -ne 'y') {
            exit 1
        }
    }
} else {
    Write-Host "ERROR: Could not verify keystore" -ForegroundColor Red
    Write-Host "Check the password and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Copy keystore to correct locations
Write-Host "Copying keystore to project locations..." -ForegroundColor Yellow

Copy-Item $keystoreFile -Destination "credentials\android\keystore-original.jks" -Force
Copy-Item $keystoreFile -Destination "C:\pm\credentials\android\keystore-original.jks" -Force

Write-Host "✅ Keystore copied" -ForegroundColor Green
Write-Host ""

# Update gradle.properties
Write-Host "Updating gradle.properties..." -ForegroundColor Yellow

$gradlePropsContent = Get-Content "C:\pm\android\gradle.properties" -Raw
$gradlePropsContent = $gradlePropsContent -replace 'MYAPP_UPLOAD_STORE_FILE=.*', 'MYAPP_UPLOAD_STORE_FILE=../../credentials/android/keystore-original.jks'
$gradlePropsContent = $gradlePropsContent -replace 'MYAPP_UPLOAD_STORE_PASSWORD=.*', "MYAPP_UPLOAD_STORE_PASSWORD=$passwordPlain"
$gradlePropsContent = $gradlePropsContent -replace 'MYAPP_UPLOAD_KEY_ALIAS=.*', "MYAPP_UPLOAD_KEY_ALIAS=$alias"
$gradlePropsContent = $gradlePropsContent -replace 'MYAPP_UPLOAD_KEY_PASSWORD=.*', "MYAPP_UPLOAD_KEY_PASSWORD=$passwordPlain"

Set-Content -Path "C:\pm\android\gradle.properties" -Value $gradlePropsContent

Write-Host "✅ gradle.properties updated" -ForegroundColor Green
Write-Host ""

# Build AAB
Write-Host "Building AAB (this takes 10-15 minutes)..." -ForegroundColor Yellow
Write-Host ""

Set-Location "C:\pm\android"

Write-Host "Cleaning..." -ForegroundColor White
.\gradlew.bat clean 2>&1 | Out-Null

Write-Host "Building release AAB..." -ForegroundColor White
$buildStart = Get-Date
.\gradlew.bat bundleRelease --no-daemon

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Set-Location $PSScriptRoot
    exit 1
}

$buildEnd = Get-Date
$duration = $buildEnd - $buildStart

Write-Host ""
Write-Host "✅ Build completed in $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Green
Write-Host ""

# Copy AAB
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$aabSource = "C:\pm\android\app\build\outputs\bundle\release\app-release.aab"
$aabDest = "C:\Users\shubh\Desktop\pulsemateconnect123\pulsemate-v1.3.0-vc51-CORRECT-$timestamp.aab"

Copy-Item $aabSource -Destination $aabDest

$sizeMB = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)

Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "File: pulsemate-v1.3.0-vc51-CORRECT-$timestamp.aab" -ForegroundColor Cyan
Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
Write-Host "Location: $aabDest" -ForegroundColor Cyan
Write-Host ""

# Verify signature
Write-Host "Verifying signature..." -ForegroundColor Yellow
$certOutput = keytool -printcert -jarfile $aabDest 2>&1 | Out-String

if ($certOutput -match "SHA1:\s*([A-F0-9:]+)") {
    $finalSHA1 = $matches[1].Trim()
    Write-Host "AAB SHA1: $finalSHA1" -ForegroundColor Cyan
    
    if ($finalSHA1 -match "0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F") {
        Write-Host "✅ SIGNATURE MATCHES! Ready for Google Play!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Signature doesn't match expected" -ForegroundColor Yellow
    }
}

Write-Host ""

# Open file location
explorer.exe /select,"$aabDest"

# Return to original directory
Set-Location $PSScriptRoot

Write-Host "Next: Upload to Google Play Console!" -ForegroundColor Green
Write-Host ""
