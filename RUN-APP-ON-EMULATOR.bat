@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM PulseMate Connect - Run App on Android Emulator
REM ═══════════════════════════════════════════════════════════════════════════

title PulseMate - Run on Emulator

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║        PulseMate Connect - Android Emulator Launcher         ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Check if emulator is already running
echo [1/4] Checking emulator status...
adb devices | findstr "emulator" >nul
if %errorlevel% == 0 (
    echo ✅ Emulator already running
) else (
    echo ⏳ Starting emulator...
    start "Android Emulator" emulator -avd PulseMatePixel35c
    echo Waiting for emulator to boot...
    timeout /t 30 /nobreak >nul
)

echo.
echo [2/4] Waiting for device to be ready...
adb wait-for-device
echo ✅ Device ready

echo.
echo [3/4] Checking if Metro bundler is running...
netstat -ano | findstr ":8081" >nul
if %errorlevel% == 0 (
    echo ✅ Metro already running on port 8081
) else (
    echo ⏳ Starting Metro bundler...
    start "Metro Bundler" cmd /k "npx expo start"
    echo Waiting for Metro to start...
    timeout /t 10 /nobreak >nul
)

echo.
echo [4/4] Installing and launching app...
echo This may take a few minutes on first run (building app)...
echo.

REM Build and install the app
npx expo run:android

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
if %errorlevel% == 0 (
    echo ✅ App launched successfully!
    echo.
    echo The app should now be running on the emulator.
    echo Check the emulator window to see the app.
) else (
    echo ❌ Failed to launch app
    echo Check the error messages above.
)
echo.
echo Press any key to exit...
pause >nul
