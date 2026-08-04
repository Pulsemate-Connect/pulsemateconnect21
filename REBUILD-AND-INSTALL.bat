@echo off
echo ============================================================
echo REBUILDING APK WITH FIREBASE CONFIGURATION
echo ============================================================
echo.
echo This will:
echo 1. Clean build
echo 2. Build release APK (5-10 minutes)
echo 3. Install on device
echo.
pause
echo.
echo Navigating to project...
cd /d C:\pm\pulsemateconnect21\android
if errorlevel 1 (
    echo ERROR: Could not find C:\pm\pulsemateconnect21\android
    echo Make sure the project was copied correctly.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo STEP 1: Building APK...
echo ============================================================
echo Please wait 5-10 minutes...
echo.
call gradlew assembleRelease
if errorlevel 1 (
    echo.
    echo ============================================================
    echo BUILD FAILED!
    echo ============================================================
    echo Check the error messages above.
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo BUILD SUCCESSFUL!
echo ============================================================
echo.
echo ============================================================
echo STEP 2: Installing APK on device...
echo ============================================================
echo.
cd /d C:\pm\pulsemateconnect21
adb install -r android\app\build\outputs\apk\release\app-release.apk
if errorlevel 1 (
    echo.
    echo ============================================================
    echo INSTALLATION FAILED!
    echo ============================================================
    echo Common fixes:
    echo - Make sure device is connected: adb devices
    echo - Enable USB debugging on device
    echo - Try: adb uninstall in.pulsemateconnect.patient
    echo   Then run this script again
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo SUCCESS! APK INSTALLED
echo ============================================================
echo.
echo Now test the app:
echo 1. Open PulseMate Connect on your device
echo 2. App should open WITHOUT crashing
echo 3. Enter phone number: +91XXXXXXXXXX
echo 4. Click "Send OTP"
echo 5. Wait for SMS (10-30 seconds)
echo 6. Enter OTP code
echo 7. Login successful!
echo.
echo ============================================================
pause
