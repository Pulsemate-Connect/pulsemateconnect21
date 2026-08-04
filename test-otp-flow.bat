@echo off
echo ========================================
echo PulseMate Connect - OTP Flow Test
echo ========================================
echo.
echo This script will help you test the OTP authentication flow
echo.
echo INSTRUCTIONS:
echo 1. Make sure the app is open on your emulator/device
echo 2. Enter phone number: +917022818878
echo 3. Tap "Send OTP" button
echo 4. Watch the logs below for any errors
echo.
echo ========================================
echo Starting log monitoring...
echo ========================================
echo.

adb logcat -c
adb logcat | findstr /C:"Auth" /C:"Firebase" /C:"OTP" /C:"Login2Factor" /C:"ERROR" /C:"Backend SMS"
