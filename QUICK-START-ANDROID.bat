@echo off
title PulseMate Connect - Quick Start
color 0B

cd /d "%~dp0"

echo.
echo ═══════════════════════════════════════════════════════
echo  PulseMate Connect - Quick Start for Android
echo ═══════════════════════════════════════════════════════
echo.

REM Check if adb is available
where adb >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Android SDK not found
    echo.
    echo Add Android SDK to PATH or run Android Studio first
    pause
    exit /b 1
)

echo Step 1: Checking devices...
adb devices
echo.

echo Step 2: Starting Metro Bundler...
echo (Opens in new window - keep it running)
echo.
start "Metro Bundler" cmd /k "npm start"

echo Waiting for Metro to start (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo Step 3: Building and installing app on Android...
echo.
call npx react-native run-android

echo.
echo ═══════════════════════════════════════════════════════
echo  ✅ Done! App should be running on your device/emulator
echo ═══════════════════════════════════════════════════════
echo.
echo To reload the app: Press 'R' twice in Metro Bundler
echo To open Dev Menu: Press 'D' in Metro Bundler
echo.
pause
