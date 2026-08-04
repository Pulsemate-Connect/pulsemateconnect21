@echo off
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     PulseMate Connect - Live Log Monitor              ║
echo ╚════════════════════════════════════════════════════════╝
echo.

set "PATH=C:\Users\shubh\AppData\Local\Android\Sdk\platform-tools;%PATH%"

echo [1] Checking device connection...
adb devices
echo.

echo [2] Starting log capture...
echo.
echo ════════════════════════════════════════════════════════
echo  INSTRUCTIONS:
echo ════════════════════════════════════════════════════════
echo  1. Keep this window open
echo  2. Go to the emulator
echo  3. Enter phone number: 9876543210
echo  4. Tap "Send OTP"
echo  5. Watch the logs appear below
echo.
echo  Press Ctrl+C to stop monitoring
echo ════════════════════════════════════════════════════════
echo.
echo [Starting in 3 seconds...]
timeout /t 3 /nobreak >nul

echo.
echo ══════════════════ LIVE LOGS ══════════════════════════
echo.

REM Clear previous logs
adb logcat -c 2>nul

REM Start monitoring with filters for our debug messages
adb logcat -s ReactNativeJS:V ReactNative:V DEBUG:V

pause
