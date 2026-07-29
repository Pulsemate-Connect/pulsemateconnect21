@echo off
echo ================================================
echo   Quick Install on USB Device
echo ================================================
echo.

cd /d "%~dp0"

echo Checking connected devices...
adb devices
echo.

echo Select build type:
echo 1. Debug (faster build)
echo 2. Release (optimized)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo Building debug version...
    npx expo run:android --variant debug --device
) else if "%choice%"=="2" (
    echo Building release version...
    npx expo run:android --variant release --device
) else (
    echo Invalid choice! Building debug version...
    npx expo run:android --variant debug --device
)

echo.
echo Installation complete!
pause
