@echo off
echo ========================================
echo PulseMate Connect - Android Build Script
echo ========================================
echo.

REM Navigate to android directory
cd android

echo [1/4] Cleaning previous builds...
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)
echo ✓ Clean complete
echo.

echo [2/4] Building AAB (Android App Bundle)...
call gradlew bundleRelease
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AAB build failed!
    pause
    exit /b 1
)
echo ✓ AAB build complete
echo.

echo [3/4] Building APK (Universal)...
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: APK build failed!
    pause
    exit /b 1
)
echo ✓ APK build complete
echo.

echo [4/4] Copying builds to root directory...
if not exist "..\builds" mkdir "..\builds"
if exist "app\build\outputs\bundle\release\app-release.aab" (
    copy "app\build\outputs\bundle\release\app-release.aab" "..\builds\pulsemate-v1.3.7.aab"
    echo ✓ AAB copied to builds\pulsemate-v1.3.7.aab
)
if exist "app\build\outputs\apk\release\app-release.apk" (
    copy "app\build\outputs\apk\release\app-release.apk" "..\builds\pulsemate-v1.3.7.apk"
    echo ✓ APK copied to builds\pulsemate-v1.3.7.apk
)
echo.

echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo AAB Location: builds\pulsemate-v1.3.7.aab
echo APK Location: builds\pulsemate-v1.3.7.apk
echo.
echo AAB: For Google Play Store upload
echo APK: For direct installation on devices
echo.
pause
