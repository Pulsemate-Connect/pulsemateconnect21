@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  🔄 CONVERT AAB TO APK (for local testing)
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo This converts your production AAB to APKs that can be installed locally.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 1: Check for bundletool
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

:: Check if bundletool exists
if not exist "bundletool.jar" (
    echo ⚠️  bundletool.jar not found. Downloading...
    echo.
    
    :: Download bundletool
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar' -OutFile 'bundletool.jar'"
    
    if %errorlevel% neq 0 (
        echo ❌ Failed to download bundletool
        echo.
        echo Please download manually from:
        echo https://github.com/google/bundletool/releases
        echo.
        echo Save as: bundletool.jar in this directory
        pause
        exit /b 1
    )
    
    echo ✅ bundletool downloaded
)

echo ✅ bundletool found
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 2: Finding AAB file
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

:: Find the most recent AAB file
set "AAB_FILE="
for /f "delims=" %%f in ('dir /b /od *.aab 2^>nul') do set "AAB_FILE=%%f"

if "%AAB_FILE%"=="" (
    echo ❌ No AAB file found!
    echo.
    echo Please download your AAB first:
    echo   eas build:download
    echo.
    pause
    exit /b 1
)

echo Found: %AAB_FILE%
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 3: Converting AAB to APKs
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo This may take 1-2 minutes...
echo.

:: Generate APKs using your EAS Build Credentials
:: Keystore Type: JKS
:: Key Alias: f1a185ee3a5ba7802fd6698297601ca8
:: SHA256: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6

echo NOTE: This requires the keystore file from EAS Build Credentials (yKf5TaJ1Kx)
echo.
echo If you don't have the keystore locally, use bundletool without signing:
echo.

:: Try with unsigned first (no keystore needed)
java -jar bundletool.jar build-apks --bundle="%AAB_FILE%" --output="pulsemate.apks" --mode=universal

if %errorlevel% neq 0 (
    echo ❌ Conversion failed!
    echo.
    echo Make sure:
    echo 1. Java is installed (java -version)
    echo 2. Keystore exists: android\app\pulsemate.keystore
    echo 3. Keystore passwords are correct
    echo.
    pause
    exit /b 1
)

echo ✅ APKs generated: pulsemate.apks
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 4: Extracting Universal APK
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

:: Extract the universal APK
powershell -Command "Expand-Archive -Path 'pulsemate.apks' -DestinationPath 'apks-temp' -Force"

if %errorlevel% neq 0 (
    echo ❌ Extraction failed!
    pause
    exit /b 1
)

:: Copy universal APK to main directory
copy "apks-temp\universal.apk" "pulsemate-production-fixed.apk"

if %errorlevel% neq 0 (
    echo ❌ Failed to copy APK
    pause
    exit /b 1
)

:: Cleanup
rmdir /s /q "apks-temp"
del "pulsemate.apks"

echo ✅ Universal APK created: pulsemate-production-fixed.apk
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  ✅ CONVERSION COMPLETE!
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo APK ready: pulsemate-production-fixed.apk
echo.
echo Next step:
echo   Connect your phone via USB and run: INSTALL-APK-USB.bat
echo.
echo Or install manually:
echo   adb install -r pulsemate-production-fixed.apk
echo.
pause
