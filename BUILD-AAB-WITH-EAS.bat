@echo off
echo ========================================
echo  PulseMate Connect - EAS Production Build
echo ========================================
echo.

echo Current Status:
echo   Version: 1.3.4 (Code: 55)
echo   Package: in.pulsemateconnect.patient
echo   Firebase: Configured with SHA-256
echo   Keystore: EAS managed (remote)
echo.

echo Checking EAS login status...
call npx eas whoami
echo.

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Not logged in to EAS
    echo Please run: npx eas login
    pause
    exit /b 1
)

echo ========================================
echo  Starting Production AAB Build
echo ========================================
echo.
echo This will:
echo   1. Upload your project to EAS
echo   2. Build production AAB (~10-15 min)
echo   3. Sign with production keystore
echo   4. Generate download link
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Building AAB...
call npx eas build --platform android --profile production

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Download AAB from the link above
    echo 2. Go to: https://play.google.com/console
    echo 3. Upload AAB to Production track
    echo 4. Submit for review
    echo.
) else (
    echo.
    echo [ERROR] Build failed!
    echo Check the error messages above.
    echo.
)

pause
