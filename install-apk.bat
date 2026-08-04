@echo off
echo ========================================
echo PulseMate Connect - APK Installer
echo ========================================
echo.
echo Checking connected devices...
adb devices
echo.

if "%~1"=="" (
    echo ERROR: Please drag and drop the APK file onto this script!
    echo.
    echo Usage: Drag the downloaded APK file onto this .bat file
    echo.
    echo Or run: install-apk.bat "path\to\app.apk"
    echo.
    pause
    exit /b 1
)

echo Installing: %~1
echo.
adb install -r "%~1"
echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Launching app...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
echo.
echo App is now running on your device!
echo.
echo To monitor logs, run: monitor-auth-logs.bat
echo.
pause
