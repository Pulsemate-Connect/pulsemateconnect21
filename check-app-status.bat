@echo off
echo ========================================
echo PulseMate Connect - App Status Check
echo ========================================
echo Time: %date% %time%
echo.

echo Checking connected devices...
adb devices
echo.

echo ========================================
echo Checking if app is installed...
echo ========================================
adb shell pm list packages | findstr "pulsemateconnect"
echo.

echo ========================================
echo Checking app version...
echo ========================================
adb shell dumpsys package in.pulsemateconnect.patient | findstr "versionName"
echo.

echo ========================================
echo Checking if app is running...
echo ========================================
adb shell pidof in.pulsemateconnect.patient
echo.

echo ========================================
echo Recent app logs (last 50 lines)...
echo ========================================
adb logcat -d | findstr /I "pulsemateconnect Firebase Auth" | more
echo.

echo ========================================
echo To monitor live logs, run:
echo   monitor-auth-logs.bat
echo ========================================
pause
