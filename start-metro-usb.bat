@echo off
echo ================================================
echo   Start Metro Bundler for USB Device
echo ================================================
echo.

cd /d "%~dp0"

echo Setting up port forwarding...
adb reverse tcp:8081 tcp:8081
echo.

echo Starting Metro bundler...
echo Press 'a' to run on Android device
echo Press 'r' to reload
echo Press 'Ctrl+C' to stop
echo.

npx expo start

pause
