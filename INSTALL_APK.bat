@echo off
echo ========================================
echo   PulseMate Connect - APK Installer
echo ========================================
echo.
echo APK Location:
echo %~dp0android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Choose installation method:
echo   1. Install on connected device (USB)
echo   2. Open APK location in Explorer
echo   3. Check connected devices
echo   4. Exit
echo.
set /p choice="Select option (1-4): "

if "%choice%"=="1" (
    echo.
    echo Checking for connected devices...
    adb devices
    echo.
    echo Installing APK...
    adb install -r "%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
    echo.
    if errorlevel 1 (
        echo Installation failed!
        echo.
        echo Make sure:
        echo 1. Your phone is connected via USB
        echo 2. USB Debugging is enabled
        echo 3. You accepted the USB debugging prompt on your phone
        echo.
    ) else (
        echo.
        echo SUCCESS! App installed on your device!
        echo.
        echo Make sure Metro bundler is running:
        echo   npm start
        echo.
        echo Then open "PulseMate Connect" on your phone.
        echo.
    )
) else if "%choice%"=="2" (
    echo.
    echo Opening APK folder...
    explorer "%~dp0android\app\build\outputs\apk\debug"
    echo.
    echo You can:
    echo - Copy the APK to your phone manually
    echo - Share it via email/WhatsApp
    echo - Upload to Google Drive and download on phone
    echo.
) else if "%choice%"=="3" (
    echo.
    echo Connected devices:
    adb devices
    echo.
    echo If no devices listed:
    echo 1. Connect phone via USB
    echo 2. Enable USB Debugging: Settings ^> Developer Options ^> USB Debugging
    echo 3. Accept prompt on phone
    echo.
) else if "%choice%"=="4" (
    exit
) else (
    echo Invalid choice!
)

pause
