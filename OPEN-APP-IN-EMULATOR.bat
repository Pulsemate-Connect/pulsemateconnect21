@echo off
echo ========================================
echo Open PulseMate Connect in Emulator
echo ========================================
echo.
echo Checking if emulator is running...
echo.

adb devices

echo.
echo ========================================
echo INSTRUCTIONS:
echo ========================================
echo.
echo Option 1: App Already Installed
echo   - If the app is already installed, press 1
echo.
echo Option 2: Install Fresh APK
echo   - If you need to install the APK, press 2
echo.
echo Option 3: Exit
echo   - Press 3 to exit
echo.
echo ========================================
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" goto launch
if "%choice%"=="2" goto install
if "%choice%"=="3" goto end

:launch
echo.
echo ========================================
echo Launching PulseMate Connect...
echo ========================================
echo.
adb shell monkey -p in.pulsemateconnect.patient 1
echo.
echo App launched! Check your emulator.
echo.
goto monitor

:install
echo.
echo ========================================
echo Installing Latest APK...
echo ========================================
echo.

:: Check if APK already exists
if exist "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk" (
    echo Found APK file! Installing...
    adb install -r "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk"
    echo.
    echo Installation complete! Launching app...
    adb shell monkey -p in.pulsemateconnect.patient 1
    echo.
    echo App launched! Check your emulator.
    goto monitor
) else (
    echo APK file not found. Downloading from EAS...
    cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
    eas build:download --id 88120141-b9db-4ac9-8af5-7d21e9c1ca5b
    echo.
    echo Download complete! Please run this script again to install.
    goto end
)

:monitor
echo.
echo ========================================
echo Want to Monitor Authentication Logs?
echo ========================================
echo.
set /p monitor="Press Y to start monitoring, or any other key to exit: "
if /i "%monitor%"=="Y" (
    echo.
    echo Starting log monitoring...
    echo Press Ctrl+C to stop monitoring.
    echo.
    call test-otp-flow.bat
)

:end
echo.
pause
