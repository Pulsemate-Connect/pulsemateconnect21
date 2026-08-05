@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  📥 DOWNLOAD AAB + CONVERT TO APK
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo This will:
echo 1. Show your recent builds
echo 2. Download the latest AAB
echo 3. Convert to APK
echo 4. Ready to install
echo.
pause

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 1: Checking Recent Builds
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

eas build:list --platform android --limit 5

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 2: Downloading Latest Build
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo Downloading the most recent build...
echo.

eas build:download --platform android --latest

if %errorlevel% neq 0 (
    echo ❌ Download failed!
    echo.
    echo Check if build is complete: eas build:list
    pause
    exit /b 1
)

echo ✅ Download complete
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 3: Converting AAB to APK
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

call CONVERT-AAB-TO-APK.bat

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  ✅ ALL DONE!
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo APK ready: pulsemate-production-fixed.apk
echo.
echo Next: Run INSTALL-APK-USB.bat to install on your phone
echo.
pause
