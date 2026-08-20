@echo off
echo ========================================
echo   PulseMate Connect - Android Launcher
echo ========================================
echo.
echo Available Emulators:
echo   1. PulseMatePixel35
echo   2. PulseMatePixel35c
echo   3. Use physical device (connect via USB)
echo   4. Open Android Studio manually
echo   5. Exit
echo.
set /p choice="Select option (1-5): "

cd /d "%~dp0"

if "%choice%"=="1" (
    echo.
    echo Starting emulator: PulseMatePixel35
    start /B C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe -avd PulseMatePixel35 -gpu host
    echo.
    echo Waiting 30 seconds for emulator to boot...
    timeout /t 30 /nobreak
    echo.
    echo Building and installing app...
    call npm run android
) else if "%choice%"=="2" (
    echo.
    echo Starting emulator: PulseMatePixel35c
    start /B C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe -avd PulseMatePixel35c -gpu host
    echo.
    echo Waiting 30 seconds for emulator to boot...
    timeout /t 30 /nobreak
    echo.
    echo Building and installing app...
    call npm run android
) else if "%choice%"=="3" (
    echo.
    echo Make sure your phone is connected via USB with USB Debugging enabled!
    echo.
    echo Checking connected devices...
    adb devices
    echo.
    pause
    echo.
    echo Building and installing app...
    call npm run android
) else if "%choice%"=="4" (
    echo.
    echo Opening Android project in default file explorer...
    echo Please open this folder in Android Studio:
    echo %~dp0android
    echo.
    explorer "%~dp0android"
    echo.
    echo After opening in Android Studio:
    echo 1. Wait for Gradle sync to complete
    echo 2. Start an emulator or connect your phone
    echo 3. Click the green Run button
    echo.
) else if "%choice%"=="5" (
    exit
) else (
    echo Invalid choice. Please run again.
)

echo.
pause
