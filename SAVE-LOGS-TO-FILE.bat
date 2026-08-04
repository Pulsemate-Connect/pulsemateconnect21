@echo off
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     Save OTP Debug Logs to File                       ║
echo ╚════════════════════════════════════════════════════════╝
echo.

set "PATH=C:\Users\shubh\AppData\Local\Android\Sdk\platform-tools;%PATH%"
set "LOGFILE=otp-debug-logs-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.txt"
set "LOGFILE=%LOGFILE: =0%"

echo [1] Checking device...
adb devices
echo.

echo [2] Log file: %LOGFILE%
echo.

echo ════════════════════════════════════════════════════════
echo  INSTRUCTIONS:
echo ════════════════════════════════════════════════════════
echo  1. This will save logs to: %LOGFILE%
echo  2. Go to emulator NOW
echo  3. Enter phone: 9876543210
echo  4. Tap "Send OTP"
echo  5. Wait 10 seconds
echo  6. Press Ctrl+C here when done
echo ════════════════════════════════════════════════════════
echo.

echo Clearing old logs...
adb logcat -c 2>nul

echo.
echo Recording logs...
echo (Activity will be shown in the emulator)
echo.

REM Record logs for 30 seconds or until Ctrl+C
adb logcat -s ReactNativeJS:V ReactNative:V DEBUG:V > "%LOGFILE%" 2>&1

echo.
echo ════════════════════════════════════════════════════════
echo  Logs saved to: %LOGFILE%
echo ════════════════════════════════════════════════════════
echo.

pause
