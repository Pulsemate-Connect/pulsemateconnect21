@echo off
echo ========================================
echo  PulseMate Connect - USB Device Setup
echo ========================================
echo.

echo Step 1: Checking for connected devices...
adb devices
echo.

echo Step 2: Setting up ADB reverse for port 8081...
adb reverse tcp:8081 tcp:8081
if %ERRORLEVEL% EQU 0 (
    echo ✓ Port forwarding successful!
) else (
    echo × Port forwarding failed. Is your device connected?
    echo.
    echo Please:
    echo 1. Connect your Android device via USB
    echo 2. Enable USB Debugging on your device
    echo 3. Accept the USB debugging prompt
    echo 4. Run this script again
    pause
    exit /b 1
)
echo.

echo Step 3: Starting Expo Dev Server...
echo.
echo Once the QR code appears:
echo - Open Expo Go app on your device
echo - The app should auto-detect the server
echo - Or press 'a' to install directly
echo.

npx expo start

pause
