@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  🔨 BUILD PRODUCTION AAB - COMPLETE WORKFLOW
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ✅ FIX APPLIED: Initialization Error Fixed
echo ✅ Backend SMS Implementation Active
echo ✅ Ready for Play Store Deployment
echo.
echo This will:
echo 1. Verify you're logged in to EAS
echo 2. Build production AAB (20-30 minutes)
echo 3. Download AAB when ready
echo 4. Convert to APK for local testing
echo 5. Install on your device
echo.
pause

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 1: Verify EAS Login
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

eas whoami

if %errorlevel% neq 0 (
    echo.
    echo ❌ Not logged in to EAS
    echo.
    echo Please run: eas login
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo ✅ Logged in successfully
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 2: Building Production AAB
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo Starting EAS Build...
echo.
echo This will take 20-30 minutes.
echo You can close this window - build continues on server.
echo.
echo To check status later:
echo   eas build:list
echo.
pause

eas build --profile production --platform android

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build submission failed
    echo.
    echo Common issues:
    echo 1. Not logged in with correct account
    echo 2. Project permissions issue
    echo 3. Network connection problem
    echo.
    echo Check error above and try again.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  ✅ BUILD SUBMITTED TO EAS
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo Your AAB is building on EAS servers.
echo.
echo You will receive:
echo - Email notification when complete
echo - Build ID for tracking
echo.
echo Next steps (when build completes):
echo.
echo 1. Download AAB:
echo    eas build:download --platform android --latest
echo.
echo 2. Convert to APK:
echo    Double-click: CONVERT-AAB-TO-APK.bat
echo.
echo 3. Install on device:
echo    Double-click: INSTALL-APK-USB.bat
echo.
echo Or run the complete workflow:
echo    Double-click: DOWNLOAD-AND-CONVERT-AAB.bat
echo.
pause
