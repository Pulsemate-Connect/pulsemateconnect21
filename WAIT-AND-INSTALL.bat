@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Waiting for Emulator to Boot
echo ========================================
echo.

set "ANDROID_SDK=C:\Users\shubh\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_SDK%\emulator;%ANDROID_SDK%\platform-tools;%PATH%"

echo Checking emulator status...
adb devices

echo.
echo Waiting for device to be ready...
adb wait-for-device
echo Device detected!

echo.
echo Checking boot status (this may take a minute)...

set /a count=0
:check_boot
set /a count+=1
if %count% GTR 60 (
    echo.
    echo Timeout: Emulator took too long to boot
    echo Please check the emulator window
    pause
    exit /b 1
)

for /f "delims=" %%i in ('adb shell getprop sys.boot_completed 2^>nul') do set boot=%%i
if "%boot%"=="1" (
    echo Boot complete!
    goto install
)

echo Waiting... [%count%/60]
timeout /t 2 /nobreak >nul
goto check_boot

:install
echo.
echo ========================================
echo Emulator is Ready!
echo ========================================
echo.

echo [1/2] Installing APK...
adb uninstall in.pulsemateconnect.patient 2>nul
adb install -r "pulsemateconnect-v1.3.4-71-rnfirebase.apk"

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Launching app...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo The app is now running on your emulator!
echo Check the emulator window.
echo.
echo To view logs, run:
echo   adb logcat -s ReactNativeJS:V
echo.
pause
