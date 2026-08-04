@echo off
color 0B
echo.
echo  ====================================================
echo    PulseMate Connect - Run Locally on Emulator
echo  ====================================================
echo.
echo  This will start the Expo development server and
echo  automatically open the app on your Android emulator.
echo.
echo  ====================================================
echo.

:: Check if emulator is running
echo  [1/3] Checking for Android emulator...
adb devices | findstr "emulator" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  WARNING: No emulator detected!
    echo.
    echo  Please start your Android emulator first, or
    echo  press any key to continue anyway (will wait for emulator)
    echo.
    pause
)
echo  Emulator check complete.
echo.

:: Navigate to project directory
cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

:: Clear Metro bundler cache
echo  [2/3] Clearing Metro bundler cache...
call npx expo start --clear
if errorlevel 1 (
    echo.
    echo  Starting without cache clear...
    echo.
)

:: Start Expo with Android
echo  [3/3] Starting Expo development server for Android...
echo.
echo  ====================================================
echo    The app will automatically open on your emulator
echo  ====================================================
echo.
echo  Press 'a' to open on Android emulator
echo  Press 'r' to reload the app
echo  Press 'Ctrl+C' to stop the server
echo.
echo  ====================================================
echo.

npx expo start --android

pause
