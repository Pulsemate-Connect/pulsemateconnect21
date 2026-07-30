@echo off
echo ================================================
echo   Build AAB from Short Path
echo ================================================
echo.

echo Checking if project was copied to C:\pm\app...
if not exist "C:\pm\app\package.json" (
    echo ERROR: Project not found at C:\pm\app
    echo.
    echo Please run this first:
    echo   xcopy "C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21" "C:\pm\app\" /E /H /I /Y
    echo.
    pause
    exit /b 1
)

echo ✅ Project found at C:\pm\app
echo.

echo Step 1: Ensuring keystore is in place...
copy "C:\pm\app\@shubhamskkk__pulsemate-app.bak.jks" "C:\pm\app\android\app\pulsemate-release-key.keystore" /Y

echo.
echo Step 2: Cleaning previous builds...
cd /d "C:\pm\app\android"
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
echo AAB Location:
echo   Desktop: %USERPROFILE%\Desktop\pulsemateconnect-production.aab
echo   Source:  C:\pm\app\android\app\build\outputs\bundle\release\app-release.aab
echo.
echo File Size:
for %%A in ("%USERPROFILE%\Desktop\pulsemateconnect-production.aab") do echo   %%~zA bytes (should be 40-60 MB)
echo.
echo ================================================
echo   CRITICAL NEXT STEPS - Firebase OTP
echo ================================================
echo.
echo 1. GET SHA-256 FINGERPRINT:
echo.
echo    cd C:\pm\app
echo    keytool -list -v -keystore android\app\pulsemate-release-key.keystore -alias pulsemate-app -storepass pulsemate2024
echo.
echo    Look for the SHA256 line and copy it.
echo.
echo 2. ADD TO FIREBASE CONSOLE:
echo    - Go to: https://console.firebase.google.com/
echo    - Select project: pulsemate-patient-care
echo    - Project Settings ^> Your apps ^> Android
echo    - Add SHA-256 fingerprint
echo    - Save
echo.
echo 3. UPLOAD TO PLAY STORE:
echo    - Go to: https://play.google.com/console/
echo    - Internal Testing ^> Create Release
echo    - Upload: pulsemateconnect-production.aab
echo    - Add yourself as tester
echo    - Test Firebase OTP before production
echo.
echo ================================================
echo.
pause
