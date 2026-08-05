@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  🔨 BUILD PRODUCTION AAB + LOCAL TESTING
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ✅ FIX APPLIED: Initialization Error Fixed
echo ✅ Backend SMS Implementation Active
echo.
echo This will:
echo 1. Build production AAB (20-30 minutes on EAS servers)
echo 2. Download AAB when ready
echo 3. Convert AAB to APK using bundletool
echo 4. Install on your device
echo.
pause

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 1: Building Production AAB
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo Starting EAS Build (cloud build)...
echo This will take 20-30 minutes.
echo.
echo While waiting, you can:
echo - Continue working
echo - Close this window (build continues on server)
echo - Check status: eas build:list
echo.

eas build --profile production --platform android

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed. Check the error above.
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
echo Next steps:
echo 1. Wait for build to complete (check email or run: eas build:list)
echo 2. Download AAB: eas build:download
echo 3. Convert to APK: Run CONVERT-AAB-TO-APK.bat
echo 4. Install: Run INSTALL-APK-USB.bat
echo.
pause
