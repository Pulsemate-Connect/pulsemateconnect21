@echo off
echo ================================================
echo   Fix Dependencies and Build AAB
echo ================================================
echo.

echo This will:
echo 1. Remove problematic expo-firebase-core package
echo 2. Clean build
echo 3. Build production AAB
echo.

cd /d "C:\pm\app"

echo Step 1: Removing expo-firebase-core from node_modules...
if exist "node_modules\expo-firebase-core" (
    rmdir /s /q "node_modules\expo-firebase-core"
    echo   - Removed expo-firebase-core
) else (
    echo   - Already removed
)

echo.
echo Step 2: Cleaning previous builds...
cd android
call gradlew clean

if %errorlevel% neq 0 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Building production AAB...
echo This will take 5-10 minutes...
echo.

call gradlew bundleRelease

if %errorlevel% neq 0 (
    echo.
    echo ================================================
    echo   BUILD FAILED!
    echo ================================================
    echo.
    echo Check errors above for details.
    pause
    exit /b 1
)

echo.
echo Step 4: Copying AAB to desktop...

copy "app\build\outputs\bundle\release\app-release.aab" "%USERPROFILE%\Desktop\pulsemateconnect-production.aab" /Y

if %errorlevel% neq 0 (
    echo WARNING: Could not copy to desktop
    echo AAB is at: C:\pm\app\android\app\build\outputs\bundle\release\app-release.aab
) else (
    echo ✅ AAB copied to desktop!
)

echo.
echo ================================================
echo   SUCCESS! AAB BUILT
echo ================================================
echo.
echo AAB Location: %USERPROFILE%\Desktop\pulsemateconnect-production.aab
echo.
echo File Size:
for %%A in ("%USERPROFILE%\Desktop\pulsemateconnect-production.aab") do echo   %%~zA bytes
echo.
echo ================================================
echo   NEXT STEPS - Firebase OTP Setup
echo ================================================
echo.
echo 1. GET SHA-256 FINGERPRINT:
echo.
echo    cd C:\pm\app
echo    keytool -list -v -keystore android\app\pulsemate-release-key.keystore -alias pulsemate-app -storepass pulsemate2024
echo.
echo 2. ADD TO FIREBASE CONSOLE:
echo    https://console.firebase.google.com/
echo    Project: pulsemate-patient-care
echo    Add SHA-256 fingerprint
echo.
echo 3. UPLOAD TO PLAY STORE:
echo    https://play.google.com/console/
echo    Internal Testing -^> Upload AAB
echo.
pause
