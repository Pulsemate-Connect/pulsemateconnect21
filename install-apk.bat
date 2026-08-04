@echo off
echo ============================================================
echo INSTALLING APK TO DEVICE/EMULATOR
echo ============================================================
echo.
echo Checking for connected devices...
adb devices
echo.
echo Installing APK from new location...
adb install "C:\pm\pulsemateconnect21\android\app\build\outputs\apk\release\app-release.apk"
echo.
if %errorlevel% == 0 (
    echo ============================================================
    echo SUCCESS! APK INSTALLED
    echo ============================================================
    echo.
    echo The app is now installed on your device.
    echo.
    echo NOTE: The app will CRASH on startup because Firebase
    echo Phone Authentication is not configured yet.
    echo.
    echo Next steps:
    echo 1. Configure Firebase Console - see FIREBASE-CONSOLE-SETUP.md
    echo 2. Update Render environment variables
    echo 3. Rebuild and test again
    echo.
) else (
    echo ============================================================
    echo INSTALLATION FAILED
    echo ============================================================
    echo.
    echo Common solutions:
    echo 1. Make sure device is connected: adb devices
    echo 2. Uninstall old version: adb uninstall in.pulsemateconnect.patient
    echo 3. Enable USB debugging on device
    echo 4. Accept "Install from this computer" prompt on device
    echo.
)
pause
