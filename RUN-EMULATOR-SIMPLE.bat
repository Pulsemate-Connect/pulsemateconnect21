@echo off
echo ========================================
echo PulseMate Connect - Launch on Emulator
echo ========================================
echo.

set "ANDROID_SDK=C:\Users\shubh\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_SDK%\emulator;%ANDROID_SDK%\platform-tools;%PATH%"

echo [1/4] Starting emulator PulseMatePixel35...
start "Android Emulator" /MIN cmd /c "emulator -avd PulseMatePixel35"

echo Waiting for emulator to boot (30 seconds)...
timeout /t 30 /nobreak

echo.
echo [2/4] Waiting for device...
adb wait-for-device
echo Device connected!

echo.
echo [3/4] Installing APK...
if exist "pulsemateconnect-v1.3.4-71-rnfirebase.apk" (
    adb uninstall in.pulsemateconnect.patient 2>nul
    adb install -r "pulsemateconnect-v1.3.4-71-rnfirebase.apk"
) else (
    echo ERROR: APK not found!
    pause
    exit /b 1
)

echo.
echo [4/4] Launching app...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

echo.
echo ========================================
echo SUCCESS! App is now running
echo ========================================
echo.
echo Press any key to view logs...
pause >nul

adb logcat -s ReactNativeJS:V
