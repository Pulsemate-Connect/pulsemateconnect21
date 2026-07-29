@echo off
echo ================================================
echo   Run PulseMate App on USB Device
echo ================================================
echo.

cd /d "%~dp0"

echo Step 1: Checking connected devices...
adb devices
echo.

echo Step 2: Setting up port forwarding...
adb reverse tcp:8081 tcp:8081
echo.

echo Step 3: Building and running app on device...
echo This will take a few minutes on first run...
echo.

npx expo run:android --device

echo.
echo ================================================
echo Build and installation complete!
echo ================================================
pause
