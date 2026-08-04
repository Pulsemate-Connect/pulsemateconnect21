@echo off
echo ========================================
echo    Install Development APK via USB
echo ========================================
echo.

REM Check if ADB is available
where adb >nul 2>&1
if errorlevel 1 (
    echo ERROR: ADB not found!
    echo.
    echo Please install Android Platform Tools:
    echo https://developer.android.com/tools/releases/platform-tools
    echo.
    pause
    exit /b 1
)

REM Check if device is connected
echo Checking for connected devices...
adb devices

echo.
echo Make sure your device appears in the list above.
echo If not, enable USB Debugging on your phone.
echo.
pause

REM Find the APK file
echo.
echo Looking for APK file...
for /f "delims=" %%i in ('dir /b /s build-*.apk 2^>nul') do set APK_FILE=%%i

if not defined APK_FILE (
    echo.
    echo ERROR: No APK file found!
    echo.
    echo Please:
    echo   1. Download APK from EAS build
    echo   2. Place it in this folder
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)

echo Found APK: %APK_FILE%
echo.
echo Installing...
echo.

adb install -r "%APK_FILE%"

if errorlevel 1 (
    echo.
    echo ========================================
    echo    Installation Failed!
    echo ========================================
    echo.
    echo Possible causes:
    echo   - USB Debugging not enabled
    echo   - Phone not connected
    echo   - Insufficient storage on phone
    echo   - Previous version signature mismatch
    echo.
    echo Try uninstalling the old version first:
    echo   adb uninstall in.pulsemateconnect.patient
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Installation Successful!
echo ========================================
echo.
echo Next steps:
echo   1. Run: npx expo start --dev-client
echo   2. Open "PulseMate Connect" app on your phone
echo   3. App will connect to Metro bundler
echo   4. Test Firebase OTP!
echo.
echo To view logs while testing:
echo   adb logcat -s ReactNativeJS:V
echo.
pause
