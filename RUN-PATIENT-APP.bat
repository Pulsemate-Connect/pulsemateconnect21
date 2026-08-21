@echo off
echo ========================================
echo      PULSEMATE PATIENT APP LAUNCHER
echo ========================================
echo.

REM Set Android SDK paths
set ANDROID_HOME=C:\Users\shubh\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%

echo Checking for connected devices...
echo.
adb devices
echo.

echo ========================================
echo Choose an option:
echo ========================================
echo.
echo [1] Run on PHYSICAL PHONE (Recommended)
echo [2] Run on EMULATOR (if already started in Android Studio)
echo [3] Check device connection status
echo [4] Kill ADB server and restart
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto :run_phone
if "%choice%"=="2" goto :run_emulator
if "%choice%"=="3" goto :check_devices
if "%choice%"=="4" goto :restart_adb
if "%choice%"=="5" goto :end

:run_phone
echo.
echo ========================================
echo Running on Physical Phone...
echo ========================================
echo.
echo Make sure:
echo - Phone is connected via USB
echo - USB Debugging is enabled
echo - You allowed USB debugging popup on phone
echo.
pause
npm run android
goto :end

:run_emulator
echo.
echo ========================================
echo Running on Emulator...
echo ========================================
echo.
echo Make sure you started the emulator from Android Studio:
echo 1. Open Android Studio
echo 2. Tools -^> Device Manager
echo 3. Click play button on PulseMatePixel35c
echo 4. Wait for Android home screen
echo.
pause
echo.
echo Waiting for emulator to be ready...
adb wait-for-device
echo Emulator detected!
echo.
npm run android
goto :end

:check_devices
echo.
echo ========================================
echo Connected Devices:
echo ========================================
adb devices -l
echo.
echo If no devices shown:
echo - For phone: Check USB connection and debugging enabled
echo - For emulator: Start it from Android Studio first
echo.
pause
goto :menu

:restart_adb
echo.
echo ========================================
echo Restarting ADB Server...
echo ========================================
adb kill-server
timeout /t 2 >nul
adb start-server
echo.
echo ADB restarted. Checking devices...
adb devices
echo.
pause
goto :menu

:menu
cls
goto :start

:end
echo.
echo ========================================
echo Done!
echo ========================================
pause
