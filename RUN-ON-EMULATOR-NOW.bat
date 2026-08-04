@echo off
echo ========================================
echo PulseMate Connect - Run on Emulator
echo ========================================
echo.

REM Check if ADB is available
where adb >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: ADB not found in PATH
    echo Please install Android SDK Platform Tools
    echo.
    pause
    exit /b 1
)

echo [1/5] Checking for running emulators...
adb devices
echo.

echo [2/5] Looking for APK file...
if exist "pulsemateconnect-v1.3.4-71-rnfirebase.apk" (
    set APK_FILE=pulsemateconnect-v1.3.4-71-rnfirebase.apk
    echo Found: %APK_FILE%
) else (
    echo ERROR: APK file not found!
    echo Please build the APK first
    pause
    exit /b 1
)

echo.
echo [3/5] Starting Android emulator (if not running)...
echo Checking for available emulators...
call emulator -list-avds

echo.
echo If no emulator is running, please start one manually:
echo   1. Open Android Studio
echo   2. Go to Device Manager
echo   3. Start an emulator
echo.
echo Press any key when emulator is ready...
pause >nul

echo.
echo [4/5] Installing APK on emulator...
adb install -r "%APK_FILE%"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install APK
    echo Trying to uninstall old version first...
    adb uninstall in.pulsemateconnect.patient
    echo Retrying installation...
    adb install "%APK_FILE%"
)

echo.
echo [5/5] Launching PulseMate Connect...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

echo.
echo ========================================
echo SUCCESS! App should now be running
echo ========================================
echo.
echo Useful commands:
echo   - View logs: adb logcat -s ReactNativeJS:V
echo   - Uninstall: adb uninstall in.pulsemateconnect.patient
echo   - Restart app: adb shell am start -n in.pulsemateconnect.patient/.MainActivity
echo.
pause
