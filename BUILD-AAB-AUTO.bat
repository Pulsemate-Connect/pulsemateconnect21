@echo off
echo ============================================================
echo BUILD AAB v1.3.7 - AUTOMATIC (New Keystore)
echo ============================================================
echo.
echo Project: @pulsemateconnect/pulsemate-app
echo Version: 1.3.7 (Build 77)
echo Account: pulsemateconnect@gmail.com
echo.
echo This will:
echo 1. Stop any running build
echo 2. Start fresh AAB build
echo 3. Automatically generate new keystore (EAS managed)
echo 4. Submit build to EAS cloud
echo.
echo Expected time: 20-30 minutes
echo.
pause
echo.
echo Starting automatic AAB build...
echo.
call eas build --platform android --profile production --non-interactive
if errorlevel 1 (
    echo.
    echo ============================================================
    echo BUILD FAILED!
    echo ============================================================
    echo.
    echo Check the error above.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo BUILD SUBMITTED SUCCESSFULLY!
echo ============================================================
echo.
echo Your AAB is now building on EAS cloud servers.
echo.
echo To check status:
echo   eas build:list
echo.
echo To download when complete:
echo   eas build:download --platform android --latest
echo.
echo View in browser:
echo   https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
echo.
echo ============================================================
echo.
echo IMPORTANT: New Keystore Generated!
echo ============================================================
echo.
echo EAS generated a new keystore for this build.
echo After build completes:
echo 1. Get new SHA-256 fingerprint from EAS dashboard
echo 2. Add it to Firebase Console:
echo    https://console.firebase.google.com/project/pulsemateconnect/settings/general
echo.
pause
