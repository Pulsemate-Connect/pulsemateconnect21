@echo off
REM ========================================
REM Install React Native Firebase APK via USB
REM ========================================

echo.
echo ============================================
echo  PulseMate Connect - Install APK via USB
echo ============================================
echo.
echo This script will:
echo 1. Download the React Native Firebase APK
echo 2. Connect to your USB device
echo 3. Install the APK
echo.

set APK_URL=https://expo.dev/artifacts/eas/RuD0t6bGy0ZlIL7k-RfvQ9Y6ONH_Sp4wWa6aX6V2zMo.apk
set APK_FILE=pulsemateconnect-v1.3.4-71-rnfirebase.apk

echo Step 1: Downloading APK...
echo.
curl -L -o %APK_FILE% %APK_URL%

if not exist %APK_FILE% (
    echo [ERROR] Failed to download APK
    pause
    exit /b 1
)

echo.
echo [SUCCESS] APK downloaded: %APK_FILE%
echo.

echo Step 2: Checking USB device connection...
echo.
adb devices

echo.
echo Step 3: Installing APK on USB device (9b90e608)...
echo.
adb -s 9b90e608 install -r %APK_FILE%

echo.
echo ============================================
echo  Installation Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Open the app on your device
echo 2. Enter phone number
echo 3. Click "Send OTP"
echo 4. Should work with native SafetyNet! (no modal)
echo.
echo Build Details:
echo - Version: 1.3.4 (Code 71)
echo - Type: React Native Firebase (Native SafetyNet)
echo - APK: %APK_FILE%
echo.
pause
