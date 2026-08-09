@echo off
title PulseMate Connect - Development Environment
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   PulseMate Connect - Development Environment Startup     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Change to project directory
cd /d "%~dp0"

echo [1/4] Checking Android SDK...
where adb >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Android SDK not found in PATH
    echo.
    echo Please ensure Android SDK is installed and adb is in your PATH
    echo Common location: C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
    echo.
    pause
    exit /b 1
)
echo ✅ Android SDK found
echo.

echo [2/4] Checking for running emulator...
adb devices | findstr "emulator" >nul
if %errorlevel% == 0 (
    echo ✅ Emulator is already running
    echo.
    echo Connected devices:
    adb devices
    echo.
) else (
    echo ⚠️  No emulator running
    echo.
    echo Available Android Virtual Devices:
    echo ────────────────────────────────────
    emulator -list-avds
    echo.
    
    echo Do you want to start an emulator? (Y/N)
    set /p START_EMU=
    
    if /i "%START_EMU%"=="Y" (
        echo.
        echo Enter the AVD name from the list above:
        set /p AVD_NAME=
        
        echo.
        echo 📱 Starting emulator: %AVD_NAME%
        echo This may take 30-60 seconds...
        echo.
        
        REM Start emulator in background
        start "Android Emulator" cmd /c "emulator @%AVD_NAME% -no-snapshot-load"
        
        echo Waiting for emulator to boot...
        timeout /t 10 /nobreak >nul
        adb wait-for-device
        echo ✅ Emulator started successfully!
        echo.
    ) else (
        echo ⚠️  Continuing without starting emulator
        echo Make sure you have a device connected or emulator running
        echo.
    )
)

echo [3/4] Checking Metro Bundler...
netstat -ano | findstr ":8081" >nul
if %errorlevel% == 0 (
    echo ⚠️  Metro bundler already running on port 8081
    echo.
    echo Do you want to restart it? (Y/N)
    set /p RESTART_METRO=
    
    if /i "%RESTART_METRO%"=="Y" (
        echo Stopping existing Metro process...
        FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":8081"') DO (
            taskkill /PID %%P /F >nul 2>nul
        )
        timeout /t 2 /nobreak >nul
        echo ✅ Metro stopped
        echo.
    )
)

echo [4/4] Starting Metro Bundler...
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    Metro Bundler Started                   ║
echo ║                                                            ║
echo ║  The app will reload automatically when you make changes  ║
echo ║                                                            ║
echo ║  To open the app on your emulator/device:                 ║
echo ║  - Press 'a' for Android                                  ║
echo ║  - Or run: npx react-native run-android                   ║
echo ║                                                            ║
echo ║  Press Ctrl+C to stop Metro when done                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Start Metro bundler
npm start

pause
