@echo off
cls
echo.
echo ========================================
echo  Starting PulseMate Connect...
echo ========================================
echo.
echo Checking emulator status...
adb devices
echo.
echo Starting Expo development server...
echo.
echo After server starts, press 'a' to open on Android
echo.
echo ========================================
echo.

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
npx expo start
