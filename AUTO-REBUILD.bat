@echo off
echo ============================================================
echo AUTO-REBUILDING APK WITH FIREBASE CONFIGURATION
echo ============================================================
echo.
cd /d C:\pm\pulsemateconnect21\android
if errorlevel 1 (
    echo ERROR: Could not find C:\pm\pulsemateconnect21\android
    exit /b 1
)
echo Building APK... Please wait 5-10 minutes...
call gradlew assembleRelease
if errorlevel 1 (
    echo BUILD FAILED!
    exit /b 1
)
echo.
echo BUILD SUCCESSFUL!
echo.
echo Installing APK...
cd /d C:\pm\pulsemateconnect21
adb install -r android\app\build\outputs\apk\release\app-release.apk
if errorlevel 1 (
    echo INSTALLATION FAILED!
    exit /b 1
)
echo.
echo SUCCESS! APK INSTALLED
echo Test the app now!
