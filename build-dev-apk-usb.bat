@echo off
echo ========================================
echo    Development Build + USB Install
echo    (with Live Reload)
echo ========================================
echo.
echo This will:
echo   1. Build a DEVELOPMENT APK (not AAB)
echo   2. Install directly to your USB-connected device
echo   3. Enable live reload - code changes update instantly!
echo.
echo Make sure:
echo   - Phone is connected via USB
echo   - USB Debugging is enabled
echo   - ADB drivers are installed
echo.
pause

echo.
echo ========================================
echo    Step 1: Building Development APK
echo ========================================
echo.

npx eas build --platform android --profile development --local

if errorlevel 1 (
    echo.
    echo Build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Step 2: Installing to Device
echo ========================================
echo.

REM Find the APK file
for /f "delims=" %%i in ('dir /b /s build-*.apk 2^>nul') do set APK_FILE=%%i

if not defined APK_FILE (
    echo ERROR: Could not find APK file!
    echo Please check the build output above.
    pause
    exit /b 1
)

echo Found APK: %APK_FILE%
echo.
echo Installing to device...

adb install -r "%APK_FILE%"

if errorlevel 1 (
    echo.
    echo Installation failed! Make sure:
    echo   - Phone is connected via USB
    echo   - USB Debugging is enabled
    echo   - Run 'adb devices' to verify
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Success!
echo ========================================
echo App installed on device!
echo.
echo To enable live reload:
echo   1. Open the app on your phone
echo   2. Shake device or press Ctrl+M
echo   3. Select "Settings"
echo   4. Enable "Fast Refresh"
echo.
echo Now run in another terminal:
echo   npx expo start --dev-client
echo.
echo Code changes will now reload automatically!
echo ========================================

pause
