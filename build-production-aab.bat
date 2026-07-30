@echo off
echo ================================================
echo   Build Production AAB - FREE Local Build
echo   PulseMate Connect
echo ================================================
echo.

cd /d "%~dp0"

echo [1/5] Checking environment...
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Java not found!
    echo Please install Android Studio from:
    echo https://developer.android.com/studio
    echo.
    pause
    exit /b 1
)

echo   - Java: OK
echo   - Working directory: %CD%
echo.

echo [2/5] Checking keystore configuration...
if not exist "android\gradle.properties" (
    echo WARNING: gradle.properties not found!
    echo Make sure signing is configured.
)

echo.
echo [3/5] Cleaning previous builds...
cd android
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Clean failed!
    cd ..
    pause
    exit /b 1
)

echo.
echo [4/5] Building production AAB...
echo This may take 5-10 minutes...
echo.

call gradlew bundleRelease

if %errorlevel% neq 0 (
    echo.
    echo ================================================
    echo   BUILD FAILED!
    echo ================================================
    echo.
    echo Common Issues:
    echo 1. Keystore not configured correctly
    echo 2. Java/Android SDK not installed
    echo 3. Gradle dependency issues
    echo.
    echo Check errors above for details.
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo [5/5] Copying AAB to desktop...

set AAB_SOURCE=android\app\build\outputs\bundle\release\app-release.aab
set AAB_DEST=%USERPROFILE%\Desktop\pulsemateconnect-production.aab

if not exist "%AAB_SOURCE%" (
    echo ERROR: AAB file not found at expected location!
    echo Expected: %AAB_SOURCE%
    pause
    exit /b 1
)

copy "%AAB_SOURCE%" "%AAB_DEST%"

if %errorlevel% neq 0 (
    echo ERROR: Failed to copy AAB to desktop!
    pause
    exit /b 1
)

echo.
echo ================================================
echo   SUCCESS! AAB Built Successfully
echo ================================================
echo.
echo File Location:
echo   %AAB_DEST%
echo.
echo File Size:
for %%A in ("%AAB_DEST%") do echo   %%~zA bytes
echo.
echo ================================================
echo   NEXT STEPS - CRITICAL FOR FIREBASE OTP
echo ================================================
echo.
echo 1. GET SHA-256 FINGERPRINT:
echo    Run: get-sha256.bat
echo    Or manually:
echo    keytool -list -v -keystore upload-keystore.jks -alias upload
echo.
echo 2. ADD TO FIREBASE:
echo    - Go to: https://console.firebase.google.com/
echo    - Select: pulsemate-patient-care
echo    - Project Settings ^> Android app
echo    - Add SHA-256 fingerprint
echo.
echo 3. UPLOAD TO PLAY STORE:
echo    - Go to: https://play.google.com/console/
echo    - Internal Testing ^> Create Release
echo    - Upload: pulsemateconnect-production.aab
echo.
echo 4. TEST:
echo    - Add yourself as internal tester
echo    - Download and test Firebase OTP
echo.
echo ================================================
echo.
pause
