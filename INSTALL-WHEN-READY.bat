@echo off
echo ========================================
echo Quick Install - PulseMate Connect
echo ========================================
echo.

set "PATH=C:\Users\shubh\AppData\Local\Android\Sdk\platform-tools;%PATH%"

echo Checking if emulator is ready...
adb devices

echo.
adb uninstall in.pulsemateconnect.patient 2>nul

echo Installing APK...
adb install -r "pulsemateconnect-v1.3.4-71-rnfirebase.apk"

echo.
echo Launching app...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

echo.
echo ========================================
echo Done! Check the emulator window
echo ========================================
pause
