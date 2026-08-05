@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  🔨 BUILD LOCAL APK - Development Build
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ✅ FIX APPLIED: Initialization Error Fixed
echo ✅ Backend SMS Implementation Active
echo.
echo This will build a development APK that you can install on your phone.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  REQUIREMENTS:
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 1. ✅ Android Studio installed
echo 2. ✅ Android SDK configured
echo 3. ✅ Expo Development Client
echo.
pause

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 1: Checking Environment
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js not found
    pause
    exit /b 1
)

echo Checking EAS CLI...
eas --version
if %errorlevel% neq 0 (
    echo ⚠️  EAS CLI not installed. Installing...
    npm install -g eas-cli
)

echo ✅ Environment OK
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 2: Building Development APK
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo This will take 10-15 minutes...
echo.
echo Building with:
echo - Development profile
echo - Backend SMS authentication
echo - All debugging enabled
echo.

eas build --profile development --platform android --local

if %errorlevel% equ 0 (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════════
    echo  ✅ BUILD SUCCESS!
    echo ═══════════════════════════════════════════════════════════════════════════════
    echo.
    echo APK file created!
    echo Location: Current directory
    echo.
    echo Next steps:
    echo 1. Connect your phone via USB
    echo 2. Enable USB debugging on phone
    echo 3. Run: INSTALL-APK-USB.bat
    echo.
) else (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════════
    echo  ❌ BUILD FAILED
    echo ═══════════════════════════════════════════════════════════════════════════════
    echo.
    echo Check the error messages above.
    echo Common issues:
    echo 1. Android SDK not configured
    echo 2. Java JDK not installed
    echo 3. Not enough disk space
    echo.
)

pause
