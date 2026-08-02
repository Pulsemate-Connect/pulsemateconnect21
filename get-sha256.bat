@echo off
REM ========================================
REM Get SHA-256 Fingerprint for Firebase
REM ========================================
echo.
echo ========================================
echo   GET SHA-256 FOR FIREBASE
echo ========================================
echo.

cd /d "%~dp0"

echo Checking for debug keystore...
echo.

if exist "android\app\debug.keystore" (
    echo Found debug.keystore
    echo.
    echo Extracting SHA-256 fingerprint...
    echo.
    echo ----------------------------------------
    keytool -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android -keypass android | findstr "SHA256"
    echo ----------------------------------------
    echo.
    echo INSTRUCTIONS:
    echo 1. Copy the SHA-256 fingerprint above
    echo 2. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
    echo 3. Find: in.pulsemateconnect.patient
    echo 4. Click: "Add fingerprint"
    echo 5. Paste: The SHA-256 value
    echo 6. Click: "Save"
    echo 7. Download: Fresh google-services.json
    echo 8. Replace: android\app\google-services.json
    echo 9. Run: npx expo prebuild --clean
    echo 10. Build: eas build --platform android --profile production
    echo.
) else (
    echo ❌ Debug keystore not found!
    echo.
    echo Please run: npx expo prebuild --platform android
    echo.
)

echo.
echo ========================================
echo   FOR PRODUCTION BUILD
echo ========================================
echo.
echo For production SHA-256, get it from Play Console:
echo.
echo 1. Go to: https://play.google.com/console
echo 2. Select: PulseMate Connect
echo 3. Navigate to: Release ^> Setup ^> App Integrity
echo 4. Copy: SHA-256 certificate fingerprint
echo 5. Add to Firebase Console
echo.
echo ========================================
echo.
pause
