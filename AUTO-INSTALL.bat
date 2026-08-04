@echo off
setlocal enabledelayedexpansion
cls

echo ╔═══════════════════════════════════════════════════╗
echo ║   PulseMate Connect - Auto Install on Emulator   ║
echo ╚═══════════════════════════════════════════════════╝
echo.

set "PATH=C:\Users\shubh\AppData\Local\Android\Sdk\platform-tools;%PATH%"

echo Waiting for emulator to be ready...
echo This script will automatically install when ready.
echo.
echo Press Ctrl+C to cancel anytime.
echo.

set /a attempt=0
set /a maxAttempts=60

:check_device
set /a attempt+=1

if %attempt% GTR %maxAttempts% (
    echo.
    echo Timeout: Emulator not ready after 2 minutes
    echo.
    echo Please check:
    echo   1. Is the emulator window open?
    echo   2. Do you see the Android home screen?
    echo.
    echo If yes, run: .\INSTALL-WHEN-READY.bat
    pause
    exit /b 1
)

echo [%attempt%/%maxAttempts%] Checking...

adb devices 2>nul | findstr "device" | findstr /v "attached" >nul
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto check_device
)

echo.
echo ✓ Device detected!
echo.
echo Waiting 3 seconds to ensure device is ready...
timeout /t 3 /nobreak >nul

echo.
echo ═══════════════════════════════════════
echo Installing APK...
echo ═══════════════════════════════════════
echo.

adb uninstall in.pulsemateconnect.patient 2>nul
adb install -r "pulsemateconnect-v1.3.4-71-rnfirebase.apk"

if errorlevel 1 (
    echo.
    echo Installation failed!
    echo Check the error above.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════
echo Launching App...
echo ═══════════════════════════════════════
echo.

adb shell am start -n in.pulsemateconnect.patient/.MainActivity

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║              ✓ SUCCESS!                          ║
echo ║                                                   ║
echo ║   PulseMate Connect is now running!              ║
echo ╚═══════════════════════════════════════════════════╝
echo.
echo Check the emulator window to see your app!
echo.
echo To view logs:
echo   adb logcat -s ReactNativeJS:V
echo.
pause
